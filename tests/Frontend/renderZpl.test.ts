import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vite-plus/test';

type RenderLabel = (...args: unknown[]) => Promise<string>;
type RenderLabels = (...args: unknown[]) => Promise<string[]>;
type RendererApi = { zplToBase64Async: RenderLabel; zplToBase64MultipleAsync: RenderLabels };
const wasmUrl = '/assets/zebrash.wasm';

const renderer = vi.hoisted(() => ({
    render: vi.fn<(...args: unknown[]) => Promise<string>>(),
    renderAll: vi.fn<RenderLabels>(),
    initialize: vi.fn<() => Promise<RendererApi>>(),
}));

vi.mock('zpl-renderer-js/external', () => {
    return { init: renderer.initialize };
});

let renderZpl: typeof import('../../resources/js/index').renderZpl;

beforeEach(async () => {
    vi.resetModules();
    vi.resetAllMocks();
    renderer.render.mockResolvedValue('cG5n');
    renderer.renderAll.mockResolvedValue(['b25l', 'dHdv']);
    renderer.initialize.mockImplementation(async () => ({
        zplToBase64Async: renderer.render,
        zplToBase64MultipleAsync: renderer.renderAll,
    }));
    ({ renderZpl } = await import('../../resources/js/index'));
});

afterEach(() => vi.unstubAllGlobals());

test('loads the external renderer only when a preview is requested', async () => {
    expect(renderer.initialize).not.toHaveBeenCalled();
    const zpl = ' \n^XA^FO20,20^FDHello^FS^XZ\n ';
    expect(await renderZpl(zpl, { wasmUrl })).toBe('data:image/png;base64,cG5n');
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
    expect(renderer.initialize).toHaveBeenCalledWith({ wasmUrl });
    expect(renderer.render).toHaveBeenCalledExactlyOnceWith(zpl, 101.6, 203.2, 8, {
        grayscaleOutput: false,
        enableInvertedLabels: false,
    });
});

test('forwards per-call dimensions and rendering options without modifying them', async () => {
    const options = Object.freeze({
        wasmUrl,
        widthMm: 50,
        heightMm: 30,
        dpmm: 12,
        grayscaleOutput: true,
        enableInvertedLabels: true,
    });
    await renderZpl('^XA^XZ', options);
    expect(renderer.render).toHaveBeenLastCalledWith('^XA^XZ', 50, 30, 12, {
        grayscaleOutput: true,
        enableInvertedLabels: true,
    });
    await renderZpl('^XA^XZ', { wasmUrl });
    expect(renderer.render).toHaveBeenLastCalledWith('^XA^XZ', 101.6, 203.2, 8, {
        grayscaleOutput: false,
        enableInvertedLabels: false,
    });
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
});

test('shares pending initialization but renders every requested preview', async () => {
    let resolve!: (value: RendererApi) => void;
    renderer.initialize.mockReturnValue(
        new Promise((done) => {
            resolve = done;
        }),
    );
    const first = renderZpl('^XA^FDOne^FS^XZ', { wasmUrl });
    const second = renderZpl('^XA^FDTwo^FS^XZ', { wasmUrl, renderAll: true });
    await vi.waitFor(() => expect(renderer.initialize).toHaveBeenCalledTimes(1));
    expect(renderer.render).not.toHaveBeenCalled();
    resolve({ zplToBase64Async: renderer.render, zplToBase64MultipleAsync: renderer.renderAll });
    expect(await Promise.all([first, second])).toEqual([
        'data:image/png;base64,cG5n',
        ['data:image/png;base64,b25l', 'data:image/png;base64,dHdv'],
    ]);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    expect(renderer.renderAll).toHaveBeenCalledTimes(1);
});

test.each(['', ' \n\t ', null, 123])(
    'rejects invalid ZPL before loading the renderer: %s',
    async (zpl) => {
        await expect(renderZpl(zpl as string, { wasmUrl })).rejects.toBeInstanceOf(TypeError);
        expect(renderer.initialize).not.toHaveBeenCalled();
    },
);

test.each(['widthMm', 'heightMm', 'dpmm'] as const)(
    'validates %s before loading the renderer',
    async (name) => {
        for (const value of [0, -1, NaN, Infinity, '8', null]) {
            await expect(
                renderZpl('^XA^XZ', { wasmUrl, [name]: value } as never),
            ).rejects.toBeInstanceOf(RangeError);
        }
        expect(renderer.initialize).not.toHaveBeenCalled();
    },
);

test.each(['renderAll', 'grayscaleOutput', 'enableInvertedLabels'] as const)(
    'requires a boolean %s',
    async (name) => {
        await expect(
            renderZpl('^XA^XZ', { wasmUrl, [name]: 'true' } as never),
        ).rejects.toBeInstanceOf(TypeError);
        expect(renderer.initialize).not.toHaveBeenCalled();
    },
);

test('propagates initialization failures consistently without starting another runtime', async () => {
    const error = new Error('WebAssembly initialization failed');
    renderer.initialize.mockRejectedValue(error);
    await expect(renderZpl('^XA^XZ', { wasmUrl })).rejects.toBe(error);
    await expect(renderZpl('^XA^XZ', { wasmUrl })).rejects.toBe(error);
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
});

test('propagates rendering failures and permits another preview with the initialized engine', async () => {
    const error = new Error('Unsupported ZPL');
    renderer.render.mockRejectedValueOnce(error);
    await expect(renderZpl('^XA^XZ', { wasmUrl })).rejects.toBe(error);
    expect(await renderZpl('^XA^XZ', { wasmUrl })).toBe('data:image/png;base64,cG5n');
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
});

test('rejects an empty image result', async () => {
    renderer.render.mockResolvedValue('');
    await expect(renderZpl('^XA^XZ', { wasmUrl })).rejects.toThrow('did not produce a PNG image');
});

test.each(['', '   ', 123])('rejects an invalid WASM URL override: %j', async (wasmUrl) => {
    await expect(renderZpl('^XA^XZ', { wasmUrl } as never)).rejects.toBeInstanceOf(TypeError);
    expect(renderer.initialize).not.toHaveBeenCalled();
});

test('uses the internally imported WASM asset URL without configuration', async () => {
    expect(await renderZpl('^XA^XZ')).toBe('data:image/png;base64,cG5n');
    expect(renderer.initialize).toHaveBeenCalledWith({
        wasmUrl: expect.stringContaining('zebrash.wasm'),
    });
});

test('rejects switching WASM assets after initialization', async () => {
    await renderZpl('^XA^XZ', { wasmUrl });
    await expect(renderZpl('^XA^XZ', { wasmUrl: '/other.wasm' })).rejects.toThrow(
        'different WASM asset URL',
    );
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(1);
});

test('rejects fractional resolution before initialization', async () => {
    await expect(renderZpl('^XA^XZ', { wasmUrl, dpmm: 0.5 })).rejects.toBeInstanceOf(RangeError);
    expect(renderer.initialize).not.toHaveBeenCalled();
});

test('renders all labels in order with the supplied dimensions and flags', async () => {
    const images = await renderZpl('^XA^FDOne^FS^XZ^XA^FDTwo^FS^XZ', {
        renderAll: true,
        widthMm: 50,
        heightMm: 30,
        dpmm: 12,
        grayscaleOutput: true,
        enableInvertedLabels: true,
    });
    expectTypeOf(images).toEqualTypeOf<string[]>();
    expect(images).toEqual(['data:image/png;base64,b25l', 'data:image/png;base64,dHdv']);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(renderer.renderAll).toHaveBeenCalledExactlyOnceWith(
        '^XA^FDOne^FS^XZ^XA^FDTwo^FS^XZ',
        50,
        30,
        12,
        {
            grayscaleOutput: true,
            enableInvertedLabels: true,
        },
    );
});

test('keeps the default and explicit false result as a single string after rendering all', async () => {
    await renderZpl('^XA^XZ', { renderAll: true });
    const first = await renderZpl('^XA^XZ');
    const explicit = await renderZpl('^XA^XZ', { renderAll: false });
    expectTypeOf(first).toEqualTypeOf<string>();
    expectTypeOf(explicit).toEqualTypeOf<string>();
    expect(first).toBe('data:image/png;base64,cG5n');
    expect(explicit).toBe(first);
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
    expect(renderer.render).toHaveBeenCalledTimes(2);
    expect(renderer.renderAll).toHaveBeenCalledTimes(1);
});

test('types a dynamic renderAll flag as a string or string array', async () => {
    const result = await renderZpl('^XA^XZ', { renderAll: Boolean('all') });
    expectTypeOf(result).toEqualTypeOf<string | string[]>();
    expect(Array.isArray(result)).toBe(true);
});

test('renders a one-label document as a one-item array when renderAll is true', async () => {
    renderer.renderAll.mockResolvedValue(['b25l']);
    expect(await renderZpl('^XA^XZ', { renderAll: true })).toEqual(['data:image/png;base64,b25l']);
});

test.each([{ images: [] }, { images: [''] }, { images: ['cG5n', ''] }])(
    'rejects missing images when rendering all labels: %j',
    async ({ images }) => {
        renderer.renderAll.mockResolvedValue(images);
        await expect(renderZpl('^XA^XZ', { renderAll: true })).rejects.toThrow(
            'did not produce a PNG image',
        );
    },
);

test('propagates multi-label rendering failures and reuses the engine for the next request', async () => {
    const error = new Error('Invalid label template');
    renderer.renderAll.mockRejectedValueOnce(error);
    await expect(renderZpl('^XA^XZ', { renderAll: true })).rejects.toBe(error);
    expect(await renderZpl('^XA^XZ', { renderAll: true })).toHaveLength(2);
    expect(renderer.initialize).toHaveBeenCalledTimes(1);
});
