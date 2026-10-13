import qz from 'qz-tray';
import { route } from 'ziggy-js';
import { QzTrayCertificateError } from './QzTrayCertificateError';
import { QzTraySigningError } from './QzTraySigningError';

/** @internal Security callbacks owned by the shared connection. */
export class QzTraySecurity {
    private publicKey: string | null = null;
    private publicKeyRequest: Promise<string> | null = null;

    public configure(): void {
        qz.security.setSignatureAlgorithm('SHA512');
        qz.security.setCertificatePromise(
            (resolve, reject) => {
                void this.getPublicKey().then(resolve, reject);
            },
            { rejectOnFailure: true },
        );
        qz.security.setSignaturePromise((payload) => (resolve, reject) => {
            void this.signPayload(payload).then(resolve, reject);
        });
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
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
            const { code, message } = await this.readResponseError(
                response,
                'qztray.certificate_request_failed',
                `Unable to retrieve the QZ Tray public certificate (HTTP ${response.status}).`,
            );

            throw new QzTrayCertificateError(message, code, response.status);
        }

        const certificate = await response.text();
        const pem = certificate.trim();
        if (
            !pem.startsWith('-----BEGIN CERTIFICATE-----') ||
            !pem.endsWith('-----END CERTIFICATE-----') ||
            pem
                .slice('-----BEGIN CERTIFICATE-----'.length, -'-----END CERTIFICATE-----'.length)
                .trim() === ''
        ) {
            throw new QzTrayCertificateError(
                'The certificate endpoint did not return a PEM certificate. Check the route and session response.',
                'qztray.certificate_response_invalid',
                response.status,
            );
        }
        return certificate;
    }

    private async signPayload(payload: string): Promise<string> {
        const cookie =
            typeof document === 'undefined'
                ? undefined
                : document.cookie
                      .split(';')
                      .map((value) => value.trim())
                      .find((value) => value.startsWith('XSRF-TOKEN='));
        const encodedToken = cookie?.slice('XSRF-TOKEN='.length);

        if (!encodedToken) {
            throw new QzTraySigningError(
                'The Laravel CSRF cookie is missing. Reload the page before signing a QZ Tray payload.',
                'qztray.csrf_token_missing',
                0,
            );
        }

        let csrfToken: string;

        try {
            csrfToken = decodeURIComponent(encodedToken);
        } catch {
            throw new QzTraySigningError(
                'The Laravel CSRF cookie is invalid. Reload the page before signing a QZ Tray payload.',
                'qztray.csrf_token_invalid',
                0,
            );
        }

        const response = await fetch(route('qztray_connector.sign_payload'), {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ payload }),
        });

        if (!response.ok) {
            let fallbackCode = 'qztray.signing_request_failed';
            let fallbackMessage = `Unable to sign the QZ Tray payload (HTTP ${response.status}).`;

            if (response.status === 401) {
                fallbackCode = 'qztray.authentication_required';
                fallbackMessage = 'Sign in to the application before signing a QZ Tray payload.';
            } else if (response.status === 419) {
                fallbackCode = 'qztray.csrf_token_mismatch';
                fallbackMessage =
                    'The Laravel session or CSRF token has expired. Reload the page before signing a QZ Tray payload.';
            }

            const { code, message } = await this.readResponseError(
                response,
                fallbackCode,
                fallbackMessage,
            );

            throw new QzTraySigningError(message, code, response.status);
        }

        const signature = await response.text();
        if (
            signature === '' ||
            !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(signature)
        ) {
            throw new QzTraySigningError(
                'The signing endpoint did not return a Base64 signature. Check the route and session response.',
                'qztray.signature_response_invalid',
                response.status,
            );
        }
        return signature;
    }

    private async readResponseError(
        response: Response,
        code: string,
        message: string,
    ): Promise<{ code: string; message: string }> {
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
                    return { code: error.code, message: error.message };
                }
            }
        }

        return { code, message };
    }
}
