import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vite-plus/test';
import { renderPrintRequest } from '../../resources/js/renderPrintRequest';
import { renderEscpos } from '../../resources/js/renderEscpos';
import { renderPdf } from '../../resources/js/renderPdf';
import { renderZpl } from '../../resources/js/renderZpl';
import type { QzTrayPrintDocument } from '../../resources/js/QzTrayPrintRequest';

vi.mock('../../resources/js/renderEscpos', () => ({
    renderEscpos: vi.fn(async () => ['receipt']),
}));
vi.mock('../../resources/js/renderPdf', () => ({ renderPdf: vi.fn(async () => ['page']) }));
vi.mock('../../resources/js/renderZpl', () => ({ renderZpl: vi.fn(async () => ['label']) }));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('document', { baseURI: 'https://application.test/printing/' });
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(new Uint8Array([0, 255, 27]))),
    );
});
afterEach(() => vi.unstubAllGlobals());

test('preserves discriminated document types without requiring a selected printer', () => {
    const pdf = {
        type: 'pdf',
        payload: 'file.pdf',
        dataOptions: { pageRanges: '2' },
    } satisfies QzTrayPrintDocument;
    const receipt = {
        type: 'escpos',
        payload: [{ type: 'raw', format: 'image', flavor: 'file', data: 'logo.png' }],
    } satisfies QzTrayPrintDocument;
    expectTypeOf(pdf).toExtend<QzTrayPrintDocument>();
    expectTypeOf(receipt).toExtend<QzTrayPrintDocument>();
});

test('renders PDF sources in document order and forwards selected pages', async () => {
    expect(
        await renderPrintRequest(
            {
                type: 'pdf',
                payload: ['first', 'second'],
                flavor: 'base64',
                dataOptions: { pageRanges: '2,4-5' },
            },
            { pdf: { scale: 2 } },
        ),
    ).toEqual(['page', 'page']);
    expect(renderPdf).toHaveBeenNthCalledWith(
        1,
        { data: 'first' },
        { renderAll: true, pageRanges: '2,4-5', scale: 2 },
    );
    expect(renderPdf).toHaveBeenNthCalledWith(2, { data: 'second' }, expect.anything());
    await renderPrintRequest({ type: 'pdf', payload: '/report.pdf' });
    expect(renderPdf).toHaveBeenLastCalledWith(
        { url: '/report.pdf' },
        expect.objectContaining({ renderAll: true }),
    );
    expect(fetch).not.toHaveBeenCalled();
});

test.each(['pageWidth', 'pageHeight', 'ignoreTransparency', 'altFontRendering'] as const)(
    'explains unsupported QZ PDF transformation %s',
    async (key) => {
        await expect(
            renderPrintRequest({
                type: 'pdf',
                payload: '/report.pdf',
                dataOptions: { [key]: key.startsWith('page') ? 100 : true },
            }),
        ).rejects.toThrow(`QZ data option ${key}`);
        expect(renderPdf).not.toHaveBeenCalled();
    },
);

test('preserves binary ESC/POS bytes for base64 hex and file payloads', async () => {
    for (const [flavor, payload] of [
        ['base64', 'AP8b'],
        ['hex', '00 ff 1b'],
        ['file', '/receipt.bin'],
    ] as const) {
        expect(
            await renderPrintRequest(
                { type: 'escpos', flavor, payload },
                { escpos: { widthDots: 576 } },
            ),
        ).toEqual(['receipt']);
        expect(renderEscpos).toHaveBeenLastCalledWith([new Uint8Array([0, 255, 27])], {
            widthDots: 576,
            renderAll: true,
        });
    }
    expect(fetch).toHaveBeenCalledWith(new URL('https://application.test/receipt.bin'), {
        credentials: 'same-origin',
    });
});

test('retains plain ESC/POS text encoding and rejects unknown text encodings', async () => {
    await renderPrintRequest({ type: 'escpos', payload: 'Olá', options: { encoding: 'cp437' } });
    expect(renderEscpos).toHaveBeenCalledWith(['Olá'], { encoding: 'CP437', renderAll: true });
    await expect(
        renderPrintRequest({ type: 'escpos', payload: 'Olá', options: { encoding: 'UTF-16' } }),
    ).rejects.toThrow('supported ESC/POS');
});

test('normalizes mixed raw image parts without changing surrounding byte order', async () => {
    await renderPrintRequest({
        type: 'escpos',
        flavor: 'hex',
        payload: [
            '1b40',
            {
                type: 'raw',
                format: 'image',
                flavor: 'file',
                data: '/logo.png',
                options: { dotDensity: 'double', threshold: 100 },
            },
            '0a',
        ],
    });
    expect(renderEscpos).toHaveBeenCalledWith(
        [
            new Uint8Array([27, 64]),
            {
                type: 'raw',
                format: 'image',
                flavor: 'base64',
                data: 'AP8b',
                options: { dotDensity: 'double', threshold: 100 },
            },
            new Uint8Array([10]),
        ],
        { renderAll: true },
    );
});

test('refuses image preview options whose output cannot match printing', async () => {
    await expect(
        renderPrintRequest({
            type: 'escpos',
            payload: [
                {
                    type: 'raw',
                    format: 'image',
                    flavor: 'base64',
                    data: 'image',
                    options: { dotDensity: 8 },
                },
            ],
        }),
    ).rejects.toThrow('dot density');
    expect(renderEscpos).not.toHaveBeenCalled();
});

test.each(['plain', 'hex', 'base64', 'file'] as const)(
    'decodes %s ZPL and forwards local renderer dimensions',
    async (flavor) => {
        const zpl = '^XA^FO20,20^FDHello^FS^XZ';
        vi.mocked(fetch).mockResolvedValue(new Response(zpl));
        const payload = {
            plain: zpl,
            hex: Buffer.from(zpl).toString('hex'),
            base64: btoa(zpl),
            file: '/label.zpl',
        }[flavor];
        expect(
            await renderPrintRequest(
                { type: 'zpl', flavor, payload },
                { zpl: { widthMm: 105, heightMm: 155 } },
            ),
        ).toEqual(['label']);
        expect(renderZpl).toHaveBeenCalledWith(zpl, {
            renderAll: true,
            widthMm: 105,
            heightMm: 155,
        });
    },
);

test('rejects malformed binary data and failed downloads before rendering', async () => {
    await expect(
        renderPrintRequest({ type: 'escpos', flavor: 'hex', payload: 'abc' }),
    ).rejects.toThrow('byte pairs');
    await expect(
        renderPrintRequest({ type: 'escpos', flavor: 'base64', payload: '!invalid!' }),
    ).rejects.toThrow('Base64');
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 404 }));
    await expect(
        renderPrintRequest({ type: 'zpl', flavor: 'file', payload: '/missing' }),
    ).rejects.toThrow('HTTP 404');
    expect(renderEscpos).not.toHaveBeenCalled();
    expect(renderZpl).not.toHaveBeenCalled();
});

test('explains raw preview limitations and rejects empty documents', async () => {
    await expect(renderPrintRequest({ type: 'raw', payload: 'bytes' })).rejects.toThrow(
        'no known page format',
    );
    await expect(renderPrintRequest({ type: 'pdf', payload: [] })).rejects.toThrow(
        'nonempty print document',
    );
});

test('decodes split UTF-8 ZPL after joining transport bytes', async () => {
    const zpl = '^XA^CI28^FDcafé^FS^XZ';
    const bytes = Buffer.from(zpl);
    const split = bytes.indexOf(0xc3) + 1;
    await renderPrintRequest({
        type: 'zpl',
        flavor: 'base64',
        payload: [
            bytes.subarray(0, split).toString('base64'),
            bytes.subarray(split).toString('base64'),
        ],
    });
    expect(renderZpl).toHaveBeenCalledWith(zpl, { renderAll: true });
});

test('decodes declared Windows-1252 ZPL from binary transport', async () => {
    const zpl = '^XA^CI27^FDcafé^FS^XZ';
    await renderPrintRequest({
        type: 'zpl',
        flavor: 'base64',
        payload: Buffer.from(zpl, 'latin1').toString('base64'),
    });
    expect(renderZpl).toHaveBeenCalledWith(zpl, { renderAll: true });
});

test('decodes CP850 labels without relying on browser TextDecoder support', async () => {
    const zpl = '^XA^CI0^FDcafé^FS^XZ';
    await renderPrintRequest({
        type: 'zpl',
        flavor: 'base64',
        payload: btoa('^XA^CI0^FDcaf\x82^FS^XZ'),
    });
    expect(renderZpl).toHaveBeenCalledWith(zpl, { renderAll: true });
});

test('rejects ESC/POS preview encoding overrides that diverge from print transport', async () => {
    const escpos = { encoding: 'CP437', widthDots: 576 };
    await expect(
        renderPrintRequest(
            { type: 'escpos', payload: 'ø', options: { encoding: 'CP850' } },
            { escpos },
        ),
    ).rejects.toThrow('document.options.encoding');
    expect(renderEscpos).not.toHaveBeenCalled();
});

test.each(['2 - 2', '2- 2', '2 -2'])(
    'rejects PDF page ranges QZ cannot interpret identically: %s',
    async (pageRanges) => {
        await expect(
            renderPrintRequest({
                type: 'pdf',
                payload: '/report.pdf',
                dataOptions: { pageRanges },
            }),
        ).rejects.toThrow('QZ-compatible');
        expect(renderPdf).not.toHaveBeenCalled();
    },
);

test.each([{ bounds: { x: 0, y: 0, width: 40, height: 40 } }, { rotation: 90 }])(
    'rejects unsupported PDF printer geometry %j',
    async (options) => {
        await expect(
            renderPrintRequest({ type: 'pdf', payload: '/report.pdf', options }),
        ).rejects.toThrow('bounds or rotation');
        expect(renderPdf).not.toHaveBeenCalled();
    },
);

test('rejects a preview-only PDF password that printing cannot use', async () => {
    const pdf = { password: 'secret', scale: 2 };
    await expect(
        renderPrintRequest({ type: 'pdf', payload: '/report.pdf' }, { pdf }),
    ).rejects.toThrow('passwords');
    expect(renderPdf).not.toHaveBeenCalled();
});
