import { QzTray } from './QzTray';

export { QzTray };
export { QzTrayConnector } from './QzTrayConnector';
export { QzTrayCertificateError } from './QzTrayCertificateError';
export { QzTraySigningError } from './QzTraySigningError';
export { renderZpl } from './renderZpl';
export type { QzTrayRenderZplOptions } from './renderZpl';
export { renderEscpos } from './renderEscpos';
export type {
    QzTrayRenderEscposOptions,
    QzTrayEscposEncoding,
    QzTrayEscposPayload,
} from './renderEscpos';
export type { QzTrayEscposImage } from './escposImage';
export { renderPdf } from './renderPdf';
export type { QzTrayPdfContent, QzTrayPdfSource, QzTrayRenderPdfOptions } from './renderPdf';
export type {
    QzTrayEscposPrintImage,
    QzTrayEscposPrintPayload,
    QzTrayPrintRequest,
    QzTrayPrintDocument,
    QzTrayPrintType,
    QzTrayPrintOptions,
    QzTrayPdfDataOptions,
} from './QzTrayPrintRequest';

export const qztray = QzTray.getInstance();

export default qztray;

export { renderPrintRequest } from './renderPrintRequest';
export type { QzTrayRenderPrintRequestOptions } from './renderPrintRequest';

export { preparePrintDocument } from './preparePrintDocument';
export type { QzTrayPreparePrintDocumentOptions } from './preparePrintDocument';
