import { QzTrayConnector } from './QzTrayConnector';

export { QzTrayConnector };
export { QzTrayCertificateError } from './QzTrayCertificateError';
export { QzTraySigningError } from './QzTraySigningError';

export const qztray = QzTrayConnector.getInstance();

export default qztray;
