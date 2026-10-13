import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vite-plus/test';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import type { QzTrayPdfSource, QzTrayRenderPdfOptions } from '../../resources/js/renderPdf';

const engine = vi.hoisted(() => ({ getDocument: vi.fn(), GlobalWorkerOptions: { workerSrc: '' } }));
vi.mock('pdfjs-dist', () => engine);
vi.mock('../../resources/js/pdfAssets', () => ({
    PdfCMapReader: class {},
    PdfFontReader: class {},
    PdfWasmReader: class {},
}));
let renderPdf: typeof import('../../resources/js/renderPdf').renderPdf;
let task: { promise: Promise<unknown>; destroy: ReturnType<typeof vi.fn> };
let getPage: ReturnType<typeof vi.fn>;
let cleanup: ReturnType<typeof vi.fn>;
let render: ReturnType<typeof vi.fn>;
let viewport: ReturnType<typeof vi.fn>;
let canvas: {
    width: number;
    height: number;
    getContext: ReturnType<typeof vi.fn>;
    toDataURL: ReturnType<typeof vi.fn>;
};
const bytes = new TextEncoder().encode('%PDF-1.7\nTest');

beforeEach(async () => {
    vi.resetModules();
    vi.resetAllMocks();
    cleanup = vi.fn();
    viewport = vi.fn(({ scale }: { scale: number }) => ({
        width: 100 * scale,
        height: 200 * scale,
    }));
    render = vi.fn(() => ({ promise: Promise.resolve() }));
    getPage = vi.fn(async () => ({ getViewport: viewport, render, cleanup }));
    task = {
        promise: Promise.resolve({ numPages: 3, getPage }),
        destroy: vi.fn().mockResolvedValue(undefined),
    };
    engine.getDocument.mockReturnValue(task);
    canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({})),
        toDataURL: vi.fn(() => 'data:image/png;base64,preview'),
    };
    vi.stubGlobal('document', {
        baseURI: 'https://application.test/printing/',
        createElement: vi.fn(() => canvas),
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(bytes)));
    ({ renderPdf } = await import('../../resources/js/renderPdf'));
});
afterEach(() => vi.unstubAllGlobals());

test('loads URL sources with same-origin cookies and exports the first page as PNG', async () => {
    expect(await renderPdf('/invoice.pdf')).toBe('data:image/png;base64,preview');
    expect(fetch).toHaveBeenCalledWith(new URL('https://application.test/invoice.pdf'), {
        credentials: 'same-origin',
    });
    expect(getPage).toHaveBeenCalledExactlyOnceWith(1);
    expect(viewport).toHaveBeenCalledWith({ scale: 1.5 });
    expect(render).toHaveBeenCalledWith(expect.objectContaining({ canvas }));
    expect(canvas.toDataURL).toHaveBeenCalledWith('image/png');
    expect(engine.GlobalWorkerOptions.workerSrc).toContain('pdf.worker');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(task.destroy).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(0);
    expect(canvas.height).toBe(0);
});

test.each([
    () => bytes,
    () => bytes.buffer,
    () => new Blob([bytes]),
    () => ({ data: Buffer.from(bytes).toString('base64') }),
    () => Buffer.from(bytes).toString('base64'),
    () => `data:application/pdf;base64,${Buffer.from(bytes).toString('base64')}`,
    () => ({ data: '%PDF-1.7\nTest' }),
])('accepts PDF content without fetching and copies caller-owned bytes', async (source) => {
    await renderPdf(source());
    const parameters = engine.getDocument.mock.calls[0][0] as DocumentInitParameters;
    expect(parameters.data).toEqual(bytes);
    expect(parameters.data).not.toBe(bytes);
    expect(parameters).toMatchObject({ useWorkerFetch: false, isEvalSupported: false });
    expect(fetch).not.toHaveBeenCalled();
    expect(bytes).toEqual(new TextEncoder().encode('%PDF-1.7\nTest'));
});

test('accepts explicit URLs and forwards download, password, scale, and rotation options', async () => {
    const requestInit = {
        headers: { Authorization: 'Bearer test' },
        credentials: 'include' as const,
    };
    await renderPdf(
        { url: new URL('https://files.test/document.pdf') },
        { requestInit, password: 'secret', scale: 2, rotation: 90, pageNumber: 2 },
    );
    expect(fetch).toHaveBeenCalledWith(new URL('https://files.test/document.pdf'), requestInit);
    expect(engine.getDocument.mock.calls[0][0].password).toBe('secret');
    expect(getPage).toHaveBeenCalledWith(2);
    expect(viewport).toHaveBeenCalledWith({ scale: 2, rotation: 90 });
});

test('copies Buffer inputs to plain owned bytes before yielding to PDF.js', async () => {
    const source = Buffer.from(bytes);
    const preview = renderPdf(source);
    source.fill(0);
    await preview;
    const parameters = engine.getDocument.mock.calls[0][0] as DocumentInitParameters;
    expect(parameters.data).toEqual(bytes);
    expect(Buffer.isBuffer(parameters.data)).toBe(false);
});

test('exports all pages sequentially in their original order', async () => {
    canvas.toDataURL
        .mockReturnValueOnce('data:image/png;base64,first')
        .mockReturnValueOnce('data:image/png;base64,second')
        .mockReturnValueOnce('data:image/png;base64,third');
    expect(await renderPdf(bytes, { renderAll: true })).toEqual([
        'data:image/png;base64,first',
        'data:image/png;base64,second',
        'data:image/png;base64,third',
    ]);
    expect(getPage.mock.calls).toEqual([[1], [2], [3]]);
    expect(cleanup).toHaveBeenCalledTimes(3);
    expect(task.destroy).toHaveBeenCalledOnce();
});

test.each([
    { pageNumber: 0 },
    { pageNumber: 1.5 },
    { scale: 0 },
    { scale: Infinity },
    { rotation: 45 },
    { renderAll: 'true' },
    { password: 42 },
    { renderAll: true, pageNumber: 1 },
])('rejects invalid rendering options %j before loading a document', async (options) => {
    await expect(renderPdf(bytes, options as QzTrayRenderPdfOptions)).rejects.toThrow();
    expect(engine.getDocument).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
});

test.each([
    '',
    { data: '' },
    { data: 'bad Base64!' },
    new Uint8Array(),
    { data: '%PDF-👋' },
    42,
    null,
    { url: 'file:///private.pdf' },
])('rejects invalid source %j', async (source) => {
    await expect(renderPdf(source as QzTrayPdfSource)).rejects.toThrow();
    expect(engine.getDocument).not.toHaveBeenCalled();
});

test('reports HTTP and download failures without loading the PDF engine', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 403 }));
    await expect(renderPdf('/forbidden.pdf')).rejects.toThrow('HTTP 403');
    const failure = new Error('Download failed');
    vi.mocked(fetch).mockRejectedValueOnce(failure);
    await expect(renderPdf('/broken.pdf')).rejects.toBe(failure);
    expect(engine.getDocument).not.toHaveBeenCalled();
});

test('cleans up invalid, protected, and out-of-range documents', async () => {
    const failure = new Error('Password required');
    task.promise = Promise.reject(failure);
    await expect(renderPdf(bytes)).rejects.toBe(failure);
    expect(task.destroy).toHaveBeenCalledOnce();
    task.promise = Promise.resolve({ numPages: 3, getPage });
    await expect(renderPdf(bytes, { pageNumber: 4 })).rejects.toThrow(RangeError);
    expect(task.destroy).toHaveBeenCalledTimes(2);
    expect(getPage).not.toHaveBeenCalled();
});

test('cleans up canvas failures and allows a later valid preview', async () => {
    canvas.getContext.mockReturnValueOnce(null);
    await expect(renderPdf(bytes)).rejects.toThrow('Could not create');
    expect(cleanup).toHaveBeenCalledOnce();
    expect(task.destroy).toHaveBeenCalledOnce();
    render.mockReturnValueOnce({ promise: Promise.reject(new Error('Render failed')) });
    await expect(renderPdf(bytes)).rejects.toThrow('Render failed');
    canvas.toDataURL.mockReturnValueOnce('data:,');
    await expect(renderPdf(bytes)).rejects.toThrow('did not produce');
    expect(await renderPdf(bytes)).toBe('data:image/png;base64,preview');
    expect(task.destroy).toHaveBeenCalledTimes(4);
});

test('requires browser canvas APIs and infers renderAll return types', async () => {
    const contracts = (renderAll: boolean) => {
        expectTypeOf(renderPdf(bytes)).toEqualTypeOf<Promise<string>>();
        expectTypeOf(renderPdf(bytes, { renderAll: true })).toEqualTypeOf<Promise<string[]>>();
        expectTypeOf(renderPdf(bytes, { renderAll })).toEqualTypeOf<Promise<string | string[]>>();
    };
    expectTypeOf(contracts).toBeFunction();
    vi.stubGlobal('document', undefined);
    await expect(renderPdf(bytes)).rejects.toThrow('require browser document and canvas APIs');
});
