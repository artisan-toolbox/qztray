export type QzTrayEscposEncoding = 'CP850' | 'CP437' | 'ISO-8859-1' | 'Windows-1252';

export type QzTrayRenderEscposOptions = {
    /** Printable width in dots, a positive multiple of eight. Defaults to 384. */
    widthDots?: number;
    /** Encoding applied to string payloads only. Defaults to CP850. */
    encoding?: QzTrayEscposEncoding;
    /** Printer-specific mapping for ESC t commands. Defaults to epson. */
    codepageMapping?: string;
    /** Return every nonempty receipt separated by full or partial cuts. Defaults to false. */
    renderAll?: boolean;
};

export type QzTrayEscposPayload =
    | string
    | Uint8Array
    | readonly (string | Uint8Array | QzTrayEscposImage)[];
const encodings = {
    CP850: 'cp850',
    CP437: 'cp437',
    'ISO-8859-1': 'iso8859-1',
    'Windows-1252': 'windows1252',
} as const;

function loadRenderer() {
    return Promise.all([
        import('@point-of-sale/receipt-printer-renderer'),
        import('@point-of-sale/codepage-encoder'),
    ]);
}

let rendererRequest: ReturnType<typeof loadRenderer> | null = null;

/** Render the first ESC/POS receipt locally as a PNG data URL without connecting to QZ Tray. */
export function renderEscpos(
    payload: QzTrayEscposPayload,
    options?: Omit<QzTrayRenderEscposOptions, 'renderAll'> & { renderAll?: false },
): Promise<string>;
export function renderEscpos(
    payload: QzTrayEscposPayload,
    options: QzTrayRenderEscposOptions & { renderAll: true },
): Promise<string[]>;
export function renderEscpos(
    payload: QzTrayEscposPayload,
    options: QzTrayRenderEscposOptions,
): Promise<string | string[]>;
export async function renderEscpos(
    payload: QzTrayEscposPayload,
    options: QzTrayRenderEscposOptions = {},
): Promise<string | string[]> {
    const {
        widthDots = 384,
        encoding = 'CP850',
        codepageMapping = 'epson',
        renderAll = false,
    } = options;

    if (!Number.isSafeInteger(widthDots) || widthDots <= 0 || widthDots % 8 !== 0) {
        throw new RangeError('widthDots must be a positive integer multiple of eight.');
    }
    if (typeof renderAll !== 'boolean') {
        throw new TypeError('renderAll must be a boolean value.');
    }
    if (typeof encoding !== 'string' || !Object.hasOwn(encodings, encoding)) {
        throw new TypeError('Provide a supported ESC/POS text encoding.');
    }
    if (typeof codepageMapping !== 'string' || codepageMapping.trim() === '') {
        throw new TypeError('Provide a nonempty ESC/POS codepage mapping.');
    }

    if (
        typeof payload !== 'string' &&
        !(payload instanceof Uint8Array) &&
        !Array.isArray(payload)
    ) {
        throw new TypeError(
            'Provide ESC/POS text, bytes, or an array of text, bytes, and raw images.',
        );
    }
    const parts: (string | Uint8Array | QzTrayEscposImage)[] = [];
    for (const part of Array.isArray(payload) ? payload : [payload]) {
        if (typeof part === 'string') {
            const previous = parts.at(-1);
            if (typeof previous === 'string') {
                parts[parts.length - 1] = previous + part;
            } else {
                parts.push(part);
            }
        } else if (part instanceof Uint8Array) {
            parts.push(part.slice());
        } else {
            parts.push(prepareEscposImage(part));
        }
    }
    if (
        parts.every((part) =>
            typeof part === 'string' || part instanceof Uint8Array ? part.length === 0 : false,
        )
    ) {
        throw new TypeError('Provide a nonempty ESC/POS payload to render.');
    }

    rendererRequest ??= loadRenderer().catch((error: unknown) => {
        rendererRequest = null;
        throw error;
    });
    const [{ EscPosRenderer, stitch, toPng }, { default: CodepageEncoder }] = await rendererRequest;
    const chunks: Uint8Array[] = [];
    for (const part of parts) {
        if (typeof part === 'string') {
            const bytes = CodepageEncoder.encode(part, encodings[encoding]);
            // Text encoders replace control characters; ESC/POS needs their original byte values.
            for (let index = 0; index < part.length; index++) {
                const code = part.charCodeAt(index);
                if (code < 128) {
                    bytes[index] = code;
                }
            }
            chunks.push(bytes);
        } else {
            chunks.push(part instanceof Uint8Array ? part : await encodeEscposImage(part));
        }
    }
    const bytes = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    const renderer = new EscPosRenderer({ width: widthDots, codepageMapping, commands: ['cut'] });
    const items = renderer.render(bytes);
    type Item = (typeof items)[number];
    const receipts: Item[][] = [];
    let receipt: Item[] = [];
    for (const item of items) {
        if (item.type === 'cut') {
            if (receipt.length > 0) {
                receipts.push(receipt);
                receipt = [];
            }
        } else if (item.type === 'image' && item.height > 0) {
            receipt.push(item);
        }
    }
    if (receipt.length > 0) {
        receipts.push(receipt);
    }
    if (receipts.length === 0) {
        throw new Error('The ESC/POS renderer did not produce a PNG image.');
    }

    const images: string[] = [];
    for (const part of renderAll ? receipts : receipts.slice(0, 1)) {
        const png = await toPng(stitch(part, { width: widthDots }));
        let binary = '';
        for (const byte of png) {
            binary += String.fromCharCode(byte);
        }
        images.push(`data:image/png;base64,${btoa(binary)}`);
    }
    return renderAll ? images : images[0];
}
import { encodeEscposImage, prepareEscposImage } from './escposImage';
import type { QzTrayEscposImage } from './escposImage';
