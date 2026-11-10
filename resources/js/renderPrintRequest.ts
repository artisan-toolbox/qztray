import type { QzTrayPrintDocument } from './QzTrayPrintRequest';
import { downloadPrintFile, printBytesToBase64 } from './printDocumentFiles';
import { detectZplEncoding } from './detectZplEncoding';
import { prepareEscposImage } from './escposImage';
import type { QzTrayEscposImage } from './escposImage';
import { renderEscpos } from './renderEscpos';
import type { QzTrayEscposEncoding, QzTrayRenderEscposOptions } from './renderEscpos';
import { renderPdf } from './renderPdf';
import type { QzTrayRenderPdfOptions } from './renderPdf';
import { renderZpl } from './renderZpl';
import type { QzTrayRenderZplOptions } from './renderZpl';

export type QzTrayRenderPrintRequestOptions = {
    pdf?: Omit<QzTrayRenderPdfOptions, 'renderAll' | 'pageNumber' | 'pageRanges' | 'password'>;
    escpos?: Omit<QzTrayRenderEscposOptions, 'renderAll' | 'encoding'>;
    zpl?: Omit<QzTrayRenderZplOptions, 'renderAll'>;
    /** Fetch options for file payloads and images. Defaults to same-origin credentials. */
    requestInit?: RequestInit;
};

async function readRaw(
    payload: string,
    flavor: 'plain' | 'base64' | 'hex' | 'file',
    requestInit?: RequestInit,
): Promise<string | Uint8Array> {
    if (flavor === 'file') return downloadPrintFile(payload, requestInit);
    if (flavor === 'base64') {
        try {
            return Uint8Array.from(atob(payload.replace(/\s/g, '')), (byte) => byte.charCodeAt(0));
        } catch {
            throw new TypeError('Provide valid Base64 preview data.');
        }
    }
    if (flavor === 'hex') {
        const hex = payload.replace(/\s/g, '');
        if (!/^(?:[\da-f]{2})*$/i.test(hex)) {
            throw new TypeError('Provide hexadecimal preview data as complete byte pairs.');
        }
        return Uint8Array.from({ length: hex.length / 2 }, (_, index) =>
            Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16),
        );
    }
    return payload;
}

function escposEncoding(value: unknown): QzTrayEscposEncoding | undefined {
    if (value === undefined) return undefined;
    const encodings: QzTrayEscposEncoding[] = ['CP850', 'CP437', 'ISO-8859-1', 'Windows-1252'];
    const encoding = encodings.find(
        (candidate) => typeof value === 'string' && candidate.toLowerCase() === value.toLowerCase(),
    );
    if (encoding === undefined) {
        throw new TypeError('Provide a supported ESC/POS preview text encoding.');
    }
    return encoding;
}

async function decodeZpl(bytes: Uint8Array, encoding: string): Promise<string> {
    const { default: CodepageEncoder } = await import('@point-of-sale/codepage-encoder');
    const normalized = encoding.toLowerCase().replace(/[-_]/g, '');
    const codepage = CodepageEncoder.getEncodings().find((name) => name === normalized);
    if (codepage === undefined) return new TextDecoder(encoding, { fatal: true }).decode(bytes);
    const codepoints = CodepageEncoder.getCodepoints(codepage, true);
    let text = '';
    for (const byte of bytes) {
        text += String.fromCodePoint(byte < 128 ? byte : codepoints[byte]);
    }
    return text;
}

/** Render the document sent to print as local PNG pages, without connecting to QZ Tray. */
export async function renderPrintRequest(
    request: QzTrayPrintDocument,
    options: QzTrayRenderPrintRequestOptions = {},
): Promise<string[]> {
    if (!['raw', 'pdf', 'escpos', 'zpl'].includes(request.type)) {
        throw new TypeError('Unsupported preview document type.');
    }
    if (request.type === 'raw') {
        throw new TypeError(
            'Raw print data has no known page format. Use PDF, ESC/POS, or ZPL for a preview.',
        );
    }
    if (request.type === 'escpos' && options.escpos && 'encoding' in options.escpos) {
        throw new TypeError(
            'ESC/POS document previews use document.options.encoding. Set encoding on the print document.',
        );
    }
    const payload = typeof request.payload === 'string' ? [request.payload] : [...request.payload];
    if (payload.every((part) => part === '')) {
        throw new TypeError('Provide a nonempty print document to preview.');
    }
    if (request.type === 'pdf') {
        if (
            request.options?.bounds !== undefined ||
            (request.options?.rotation !== undefined && request.options.rotation !== 0)
        ) {
            throw new TypeError(
                'PDF document previews do not support QZ print bounds or rotation.',
            );
        }
        if (options.pdf && 'password' in options.pdf) {
            throw new TypeError(
                'PDF document previews do not support passwords because QZ printing cannot receive them.',
            );
        }
        if (
            request.dataOptions?.pageRanges !== undefined &&
            !/^\s*\d+(?:-\d+)?(?:\s*,\s*\d+(?:-\d+)?)*\s*$/.test(request.dataOptions.pageRanges)
        ) {
            throw new TypeError(
                'PDF document pageRanges must use QZ-compatible pages and ranges without internal spaces, such as 1,3-5.',
            );
        }
        const payload =
            typeof request.payload === 'string' ? [request.payload] : [...request.payload];
        for (const [key, value] of Object.entries(request.dataOptions ?? {})) {
            if (key !== 'pageRanges' && value !== undefined && value !== false) {
                throw new TypeError(`PDF preview does not support the QZ data option ${key}.`);
            }
        }
        const images: string[] = [];
        for (const part of payload) {
            const source = request.flavor === 'base64' ? { data: part } : { url: part };
            images.push(
                ...(await renderPdf(source, {
                    ...options.pdf,
                    requestInit: options.requestInit ?? options.pdf?.requestInit,
                    pageRanges: request.dataOptions?.pageRanges,
                    renderAll: true,
                })),
            );
        }
        return images;
    }
    const flavor = request.flavor ?? 'plain';
    if (request.type === 'zpl') {
        const payload =
            typeof request.payload === 'string' ? [request.payload] : [...request.payload];
        const chunks: Uint8Array[] = [];
        const encoding = request.options?.encoding;
        if (encoding !== undefined && typeof encoding !== 'string') {
            throw new TypeError('ZPL previews require a string text encoding.');
        }
        let text = '';
        for (const part of payload) {
            const data = await readRaw(part, flavor, options.requestInit);
            if (typeof data === 'string') text += data;
            else chunks.push(data);
        }
        if (chunks.length > 0) {
            const bytes = new Uint8Array(
                chunks.reduce((length, chunk) => length + chunk.length, 0),
            );
            let offset = 0;
            for (const chunk of chunks) {
                bytes.set(chunk, offset);
                offset += chunk.length;
            }
            let binary = '';
            for (const byte of bytes) binary += String.fromCharCode(byte);
            text = await decodeZpl(bytes, encoding ?? detectZplEncoding([binary]));
        }
        return renderZpl(text, { ...options.zpl, renderAll: true });
    }
    const parts: (string | Uint8Array | QzTrayEscposImage)[] = [];
    for (const part of payload) {
        if (typeof part === 'string') {
            parts.push(await readRaw(part, flavor, options.requestInit));
        } else {
            const image = prepareEscposImage({
                ...part,
                flavor: 'base64',
                data:
                    part.flavor === 'file'
                        ? printBytesToBase64(
                              await downloadPrintFile(part.data, options.requestInit),
                          )
                        : part.data,
                options: { ...part.options },
            });
            parts.push(image);
        }
    }
    const encoding = parts.some((part) => typeof part === 'string')
        ? escposEncoding(request.options?.encoding)
        : undefined;
    return renderEscpos(parts, { ...options.escpos, encoding, renderAll: true });
}
