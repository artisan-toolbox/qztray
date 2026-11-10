import type { QzTrayPrintDocument } from './QzTrayPrintRequest';
import { downloadPrintFile, printBytesToBase64 } from './printDocumentFiles';

export type QzTrayPreparePrintDocumentOptions = {
    /** Fetch options for file payloads and images. Defaults to same-origin credentials. */
    requestInit?: RequestInit;
};

/** Snapshot browser-accessible files as Base64 for the same document to preview and print. */
export async function preparePrintDocument(
    document: QzTrayPrintDocument,
    options: QzTrayPreparePrintDocumentOptions = {},
): Promise<QzTrayPrintDocument> {
    const snapshot = structuredClone(document);
    const filePayload =
        snapshot.flavor === 'file' || (snapshot.type === 'pdf' && snapshot.flavor === undefined);
    const materialize = async (source: string): Promise<string> =>
        printBytesToBase64(await downloadPrintFile(source, options.requestInit));
    if (typeof snapshot.payload === 'string') {
        return filePayload
            ? { ...snapshot, flavor: 'base64', payload: await materialize(snapshot.payload) }
            : snapshot;
    }
    if (snapshot.type === 'escpos') {
        const payload = [];
        for (const part of snapshot.payload) {
            if (typeof part === 'string') {
                payload.push(filePayload ? await materialize(part) : part);
            } else {
                payload.push(
                    part.flavor === 'file'
                        ? { ...part, flavor: 'base64' as const, data: await materialize(part.data) }
                        : part,
                );
            }
        }
        return { ...snapshot, ...(filePayload ? { flavor: 'base64' as const } : {}), payload };
    }
    const payload: string[] = [];
    for (const part of snapshot.payload) payload.push(filePayload ? await materialize(part) : part);
    return { ...snapshot, ...(filePayload ? { flavor: 'base64' as const } : {}), payload };
}
