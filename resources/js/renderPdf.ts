import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url&no-inline';

export type QzTrayPdfContent = string | Uint8Array | ArrayBuffer | Blob;
export type QzTrayPdfSource =
    | string
    | URL
    | Uint8Array
    | ArrayBuffer
    | Blob
    | { data: QzTrayPdfContent }
    | { url: string | URL };
export type QzTrayRenderPdfOptions = {
    /** Render every page instead of only the selected page. Defaults to false. */
    renderAll?: boolean;
    /** One-based page number. Defaults to 1; cannot be combined with renderAll. */
    pageNumber?: number;
    /** Scale relative to PDF points at 72 DPI. Defaults to 1.5. */
    scale?: number;
    /** Override the document's page rotation with 0, 90, 180, or 270 degrees. */
    rotation?: 0 | 90 | 180 | 270;
    /** Password for encrypted documents. */
    password?: string;
    /** Fetch options for URL sources; defaults to same-origin credentials. */
    requestInit?: RequestInit;
};

function loadRenderer() {
    return Promise.all([import('pdfjs-dist'), import('./pdfAssets')]).then(([pdfjs, assets]) => {
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        return { pdfjs, assets };
    });
}
let rendererRequest: ReturnType<typeof loadRenderer> | null = null;

function decodeContent(content: string): Uint8Array {
    if (content.startsWith('%PDF-')) {
        for (let index = 0; index < content.length; index++) {
            if (content.charCodeAt(index) > 255) {
                throw new TypeError('PDF binary strings must contain only byte-valued characters.');
            }
        }
        return Uint8Array.from(content, (character) => character.charCodeAt(0));
    }
    try {
        const binary = atob(
            content.replace(/^data:application\/pdf;base64,/i, '').replace(/\s/g, ''),
        );
        return Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
        throw new TypeError('Provide valid PDF Base64 content or a PDF binary string.');
    }
}

async function readSource(source: QzTrayPdfSource, requestInit?: RequestInit): Promise<Uint8Array> {
    let content: QzTrayPdfContent | URL;
    let url: string | URL | undefined;
    if (typeof source === 'object' && source !== null && 'url' in source) {
        url = source.url;
        content = '';
    } else if (typeof source === 'object' && source !== null && 'data' in source) {
        content = source.data;
    } else {
        content = source;
        if (
            source instanceof URL ||
            (typeof source === 'string' &&
                !/^(%PDF-|JVBER|data:application\/pdf;base64,)/i.test(source))
        ) {
            url = source;
        }
    }
    if (url !== undefined) {
        if (!(url instanceof URL) && (typeof url !== 'string' || url.trim() === '')) {
            throw new TypeError('Provide a nonempty PDF URL.');
        }
        const resolved = new URL(
            String(url),
            typeof document !== 'undefined' ? document.baseURI : undefined,
        );
        if (!['http:', 'https:', 'blob:'].includes(resolved.protocol)) {
            throw new TypeError('PDF URLs must use HTTP, HTTPS, or blob protocols.');
        }
        const response = await fetch(resolved, { credentials: 'same-origin', ...requestInit });
        if (!response.ok) {
            throw new Error(`Could not download the PDF: HTTP ${response.status}.`);
        }
        content = await response.arrayBuffer();
    }
    const bytes =
        typeof content === 'string'
            ? decodeContent(content)
            : content instanceof Uint8Array
              ? new Uint8Array(content)
              : content instanceof ArrayBuffer
                ? new Uint8Array(content.slice(0))
                : content instanceof Blob
                  ? new Uint8Array(await content.arrayBuffer())
                  : null;
    if (bytes === null || bytes.length === 0) {
        throw new TypeError(
            'Provide nonempty PDF content as Base64, bytes, an ArrayBuffer, or a Blob.',
        );
    }
    return bytes;
}

export function renderPdf(
    source: QzTrayPdfSource,
    options: QzTrayRenderPdfOptions & { renderAll: true },
): Promise<string[]>;
export function renderPdf(
    source: QzTrayPdfSource,
    options?: Omit<QzTrayRenderPdfOptions, 'renderAll'> & { renderAll?: false },
): Promise<string>;
export function renderPdf(
    source: QzTrayPdfSource,
    options: QzTrayRenderPdfOptions,
): Promise<string | string[]>;
/** Render a PDF locally to PNG data URLs, without connecting to QZ Tray. */
export async function renderPdf(
    source: QzTrayPdfSource,
    options: QzTrayRenderPdfOptions = {},
): Promise<string | string[]> {
    const { renderAll = false, pageNumber = 1, scale = 1.5, rotation, password } = options;
    if (
        typeof renderAll !== 'boolean' ||
        (password !== undefined && typeof password !== 'string')
    ) {
        throw new TypeError('Provide a boolean renderAll flag and a string PDF password.');
    }
    if (!Number.isSafeInteger(pageNumber) || pageNumber < 1) {
        throw new RangeError('PDF pageNumber must be a positive integer.');
    }
    if (!Number.isFinite(scale) || scale <= 0) {
        throw new RangeError('PDF scale must be a finite positive number.');
    }
    if (rotation !== undefined && ![0, 90, 180, 270].includes(rotation)) {
        throw new RangeError('PDF rotation must be 0, 90, 180, or 270 degrees.');
    }
    if (renderAll && options.pageNumber !== undefined) {
        throw new TypeError('Choose pageNumber or renderAll, rather than both.');
    }
    if (typeof document === 'undefined') {
        throw new Error('PDF previews require browser document and canvas APIs.');
    }
    const bytes = await readSource(source, options.requestInit);
    rendererRequest ??= loadRenderer().catch((error: unknown) => {
        rendererRequest = null;
        throw error;
    });
    const { pdfjs, assets } = await rendererRequest;
    const task = pdfjs.getDocument({
        data: bytes,
        password,
        CMapReaderFactory: assets.PdfCMapReader,
        StandardFontDataFactory: assets.PdfFontReader,
        WasmFactory: assets.PdfWasmReader,
        useWorkerFetch: false,
        isEvalSupported: false,
    });
    try {
        const pdf = await task.promise;
        if (pageNumber > pdf.numPages) {
            throw new RangeError(`PDF pageNumber exceeds the document's ${pdf.numPages} pages.`);
        }
        const pages = renderAll
            ? Array.from({ length: pdf.numPages }, (_, index) => index + 1)
            : [pageNumber];
        const images: string[] = [];
        for (const number of pages) {
            const page = await pdf.getPage(number);
            const canvas = document.createElement('canvas');
            try {
                const viewport = page.getViewport({
                    scale,
                    ...(rotation === undefined ? {} : { rotation }),
                });
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const context = canvas.getContext('2d');
                if (context === null) {
                    throw new Error('Could not create the PDF preview canvas.');
                }
                await page.render({ canvas, canvasContext: context, viewport }).promise;
                const image = canvas.toDataURL('image/png');
                if (!image.startsWith('data:image/png;base64,')) {
                    throw new Error('The PDF renderer did not produce a PNG image.');
                }
                images.push(image);
            } finally {
                page.cleanup();
                canvas.width = 0;
                canvas.height = 0;
            }
        }
        return renderAll ? images : images[0];
    } finally {
        await task.destroy();
    }
}
