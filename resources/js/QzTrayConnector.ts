import { route } from 'ziggy-js';
import { QzTrayCertificateError } from './QzTrayCertificateError';

export class QzTrayConnector {
    static readonly #instance = new QzTrayConnector();

    private publicKey: string | null = null;
    private publicKeyRequest: Promise<string> | null = null;

    private constructor() {}

    static getInstance(): QzTrayConnector {
        return QzTrayConnector.#instance;
    }

    private async getPublicKey(): Promise<string> {
        if (this.publicKey !== null) {
            return this.publicKey;
        }

        if (this.publicKeyRequest !== null) {
            return this.publicKeyRequest;
        }

        this.publicKeyRequest = this.fetchPublicKey();

        try {
            this.publicKey = await this.publicKeyRequest;

            return this.publicKey;
        } finally {
            this.publicKeyRequest = null;
        }
    }

    private async fetchPublicKey(): Promise<string> {
        const response = await fetch(route('qztray_connector.get_public_key'), {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'text/plain' },
        });

        if (!response.ok) {
            let code = 'qztray.certificate_request_failed';
            let message = `Unable to retrieve the QZ Tray public certificate (HTTP ${response.status}).`;

            if (response.headers.get('Content-Type')?.includes('application/json')) {
                const body: unknown = await response.json().catch(() => null);

                if (typeof body === 'object' && body !== null && 'error' in body) {
                    const error = body.error;

                    if (
                        typeof error === 'object' &&
                        error !== null &&
                        'code' in error &&
                        typeof error.code === 'string' &&
                        'message' in error &&
                        typeof error.message === 'string'
                    ) {
                        code = error.code;
                        message = error.message;
                    }
                }
            }

            throw new QzTrayCertificateError(message, code, response.status);
        }

        return response.text();
    }
}
