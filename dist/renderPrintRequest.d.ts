import { QzTrayPrintDocument } from './QzTrayPrintRequest';
import { QzTrayRenderEscposOptions } from './renderEscpos';
import { QzTrayRenderPdfOptions } from './renderPdf';
import { QzTrayRenderZplOptions } from './renderZpl';
export type QzTrayRenderPrintRequestOptions = {
    pdf?: Omit<QzTrayRenderPdfOptions, 'renderAll' | 'pageNumber' | 'pageRanges' | 'password'>;
    escpos?: Omit<QzTrayRenderEscposOptions, 'renderAll' | 'encoding'>;
    zpl?: Omit<QzTrayRenderZplOptions, 'renderAll'>;
    /** Fetch options for file payloads and images. Defaults to same-origin credentials. */
    requestInit?: RequestInit;
};
/** Render the document sent to print as local PNG pages, without connecting to QZ Tray. */
export declare function renderPrintRequest(request: QzTrayPrintDocument, options?: QzTrayRenderPrintRequestOptions): Promise<string[]>;
//# sourceMappingURL=renderPrintRequest.d.ts.map