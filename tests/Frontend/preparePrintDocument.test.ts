import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { preparePrintDocument } from '../../resources/js/preparePrintDocument';
import type { QzTrayPrintDocument } from '../../resources/js/QzTrayPrintRequest';

beforeEach(() => {
    vi.stubGlobal('document', { baseURI: 'https://application.test/printing/' });
});
afterEach(() => vi.unstubAllGlobals());

test('snapshots fetched bytes once while preserving ordered documents and PDF data options', async () => {
    let contents = new Uint8Array([0, 255, 27, 128]);
    const requests: string[] = [];
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: URL) => {
            requests.push(url.pathname);
            return new Response(contents);
        }),
    );
    const base = 'https://application.test';
    const source = {
        type: 'pdf',
        payload: [`${base}/first.pdf`, `${base}/second.pdf`],
        options: { copies: 2, margins: { top: 4, bottom: 5 } },
        dataOptions: { pageRanges: '1,3', ignoreTransparency: false },
    } satisfies QzTrayPrintDocument;
    const prepared = await preparePrintDocument(source);
    expect(prepared).toEqual({ ...source, flavor: 'base64', payload: ['AP8bgA==', 'AP8bgA=='] });
    expect(requests).toEqual(['/first.pdf', '/second.pdf']);
    contents = new Uint8Array([1, 2, 3]);
    source.payload[0] = 'changed';
    source.options.margins.top = 90;
    source.dataOptions.pageRanges = '2';
    expect(prepared).toEqual({
        type: 'pdf',
        flavor: 'base64',
        payload: ['AP8bgA==', 'AP8bgA=='],
        options: { copies: 2, margins: { top: 4, bottom: 5 } },
        dataOptions: { pageRanges: '1,3', ignoreTransparency: false },
    });
    expect(await preparePrintDocument(prepared)).toEqual(prepared);
    expect(requests).toHaveLength(2);
});

test.each(['escpos', 'zpl', 'raw'] as const)(
    'materializes %s file bytes without text conversion',
    async (type) => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(new Uint8Array([27, 0, 255]))),
        );
        const source = {
            type,
            flavor: 'file',
            payload: '/commands.bin',
        } satisfies QzTrayPrintDocument;
        expect(
            await preparePrintDocument(source, { requestInit: { credentials: 'include' } }),
        ).toEqual({
            type,
            flavor: 'base64',
            payload: 'GwD/',
        });
        expect(source).toEqual({ type, flavor: 'file', payload: '/commands.bin' });
        expect(fetch).toHaveBeenCalledExactlyOnceWith(
            new URL('https://application.test/commands.bin'),
            { credentials: 'include' },
        );
    },
);

test.each(['plain', 'hex', 'base64', 'file'] as const)(
    'snapshots mixed ESC/POS image files with %s commands and preserves part order',
    async (flavor) => {
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async (input: URL) =>
                    new Response(
                        input.pathname.endsWith('.png')
                            ? new Uint8Array([137, 80, 78, 71])
                            : new Uint8Array([27, 64]),
                    ),
            ),
        );
        const source = {
            type: 'escpos',
            flavor,
            payload: [
                '/first.bin',
                {
                    type: 'raw',
                    format: 'image',
                    flavor: 'file',
                    data: '/logo.png',
                    options: { dotDensity: 'double', threshold: 90, language: 'ESCPOS' },
                },
                '/second.bin',
            ],
        } satisfies QzTrayPrintDocument;
        const original = structuredClone(source);
        const result = await preparePrintDocument(source);
        expect(result).toEqual({
            type: 'escpos',
            flavor: flavor === 'file' ? 'base64' : flavor,
            payload: [
                flavor === 'file' ? 'G0A=' : '/first.bin',
                {
                    type: 'raw',
                    format: 'image',
                    flavor: 'base64',
                    data: 'iVBORw==',
                    options: { dotDensity: 'double', threshold: 90, language: 'ESCPOS' },
                },
                flavor === 'file' ? 'G0A=' : '/second.bin',
            ],
        });
        expect(source).toEqual(original);
        expect(fetch).toHaveBeenCalledTimes(flavor === 'file' ? 3 : 1);
    },
);

test('detaches all caller values before waiting for downloads', async () => {
    const source = {
        type: 'escpos',
        payload: [
            {
                type: 'raw',
                format: 'image',
                flavor: 'file',
                data: '/logo.png',
                options: { threshold: 90 },
            },
        ],
        options: { margins: { top: 2 } },
    } satisfies QzTrayPrintDocument;
    let finish = () => {};
    vi.stubGlobal(
        'fetch',
        vi.fn(
            () =>
                new Promise<Response>((resolve) => {
                    finish = () => resolve(new Response('image'));
                }),
        ),
    );
    const pending = preparePrintDocument(source);
    source.payload[0].options.threshold = 200;
    source.options.margins.top = 99;
    finish();
    const prepared = await pending;
    expect(prepared.options).toEqual({ margins: { top: 2 } });
    expect(prepared.payload).toEqual([
        {
            type: 'raw',
            format: 'image',
            flavor: 'base64',
            data: 'aW1hZ2U=',
            options: { threshold: 90 },
        },
    ]);
});

test('preserves nonfile payloads and options without requiring QZ or browser globals', async () => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('document', undefined);
    const source = Object.freeze({
        type: 'zpl',
        payload: Object.freeze(['^XA', '^XZ']),
        options: Object.freeze({ copies: 2 }),
    }) satisfies QzTrayPrintDocument;
    const result = await preparePrintDocument(source);
    expect(result).toEqual(source);
    expect(result).not.toBe(source);
    expect(result.payload).not.toBe(source.payload);
    expect(result.options).not.toBe(source.options);
    expect(fetch).not.toHaveBeenCalled();
});

test('materializes browser blob URLs before their source is revoked', async () => {
    const url = URL.createObjectURL(new Blob([new Uint8Array([0, 128, 255])]));
    try {
        const prepared = await preparePrintDocument({ type: 'raw', flavor: 'file', payload: url });
        URL.revokeObjectURL(url);
        expect(prepared).toEqual({ type: 'raw', flavor: 'base64', payload: 'AID/' });
    } finally {
        URL.revokeObjectURL(url);
    }
});

test('reports invalid protocols and HTTP failures without creating a prepared document', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 403 })),
    );
    await expect(
        preparePrintDocument({ type: 'pdf', payload: 'file:///private/report.pdf' }),
    ).rejects.toThrow('HTTP, HTTPS, or blob');
    expect(fetch).not.toHaveBeenCalled();
    await expect(
        preparePrintDocument({ type: 'pdf', payload: '/private/report.pdf' }),
    ).rejects.toThrow('HTTP 403');
});
