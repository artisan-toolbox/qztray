import { QzTrayPrintDocument } from './QzTrayPrintRequest';
export type QzTrayPreparePrintDocumentOptions = {
    /** Fetch options for file payloads and images. Defaults to same-origin credentials. */
    requestInit?: RequestInit;
};
/** Snapshot browser-accessible files as Base64 for the same document to preview and print. */
export declare function preparePrintDocument(document: QzTrayPrintDocument, options?: QzTrayPreparePrintDocumentOptions): Promise<QzTrayPrintDocument>;
//# sourceMappingURL=preparePrintDocument.d.ts.map