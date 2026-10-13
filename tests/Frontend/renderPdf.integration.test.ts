import { createCanvas, DOMMatrix, ImageData, loadImage, Path2D } from '@napi-rs/canvas';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { createPdfFixture } from './pdfFixture';

// PDF.js recommends its real legacy build for Node, including supported Node 20 polyfills.
vi.mock('pdfjs-dist', () => import('pdfjs-dist/legacy/build/pdf.mjs'));

afterEach(() => vi.unstubAllGlobals());

test('renders real PDF pages from bytes and URL content with preserved input and page order', async () => {
    vi.stubGlobal('DOMMatrix', DOMMatrix);
    vi.stubGlobal('ImageData', ImageData);
    vi.stubGlobal('Path2D', Path2D);
    // Use the actual PDF.js worker handler in-process for this Node canvas integration test.
    vi.stubGlobal('pdfjsWorker', await import('pdfjs-dist/legacy/build/pdf.worker.mjs'));
    vi.stubGlobal('document', {
        baseURI: 'https://application.test/',
        createElement: (tag: string) => {
            expect(tag).toBe('canvas');
            return createCanvas(1, 1);
        },
    });
    const { renderPdf } = await import('../../resources/js/renderPdf');
    const bytes = createPdfFixture();
    const original = bytes.slice();
    const images = await renderPdf(bytes, { renderAll: true });
    expect(bytes).toEqual(original);
    expect(images).toHaveLength(2);
    const first = await loadImage(images[0]);
    const second = await loadImage(images[1]);
    expect([first.width, first.height]).toEqual([150, 300]);
    expect([second.width, second.height]).toEqual([120, 90]);
    const canvas = createCanvas(150, 300);
    const context = canvas.getContext('2d');
    context.drawImage(first, 0, 0);
    expect([...context.getImageData(10, 10, 1, 1).data]).toEqual([255, 0, 0, 255]);
    context.drawImage(second, 0, 0);
    expect([...context.getImageData(10, 10, 1, 1).data]).toEqual([0, 0, 255, 255]);
    expect(
        await renderPdf({ data: Buffer.from(bytes).toString('base64') }, { pageNumber: 2 }),
    ).toBe(images[1]);
    const fetchMock = vi.fn().mockResolvedValue(new Response(bytes));
    vi.stubGlobal('fetch', fetchMock);
    expect(await renderPdf('/preview.pdf')).toBe(images[0]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        new URL('https://application.test/preview.pdf'),
        { credentials: 'same-origin' },
    );
    const rotated = await loadImage(await renderPdf(bytes, { rotation: 90, scale: 1 }));
    expect([rotated.width, rotated.height]).toEqual([200, 100]);
    await expect(renderPdf(new TextEncoder().encode('not a PDF'))).rejects.toThrow();
    expect(await renderPdf(bytes)).toBe(images[0]);
}, 20000);
