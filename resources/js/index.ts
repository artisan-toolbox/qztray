import { QzTray } from './QzTray';

export { QzTray };
export { QzTrayConnector } from './QzTrayConnector';
export { QzTrayCertificateError } from './QzTrayCertificateError';
export { QzTraySigningError } from './QzTraySigningError';
export { renderZpl } from './renderZpl';
export type { QzTrayRenderZplOptions } from './renderZpl';
export type {
    QzTrayPrintRequest,
    QzTrayPrintType,
    QzTrayPrintOptions,
    QzTrayPdfDataOptions,
} from './QzTrayPrintRequest';

export const qztray = QzTray.getInstance();

export default qztray;
