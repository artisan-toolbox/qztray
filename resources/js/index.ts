import { QzTrayConnector } from './QzTrayConnector';

export { QzTrayConnector };
export { QzTrayCertificateError } from './QzTrayCertificateError';

export const qztray = QzTrayConnector.getInstance();

export default qztray;
