import { route } from 'ziggy-js';

export class QzTrayConnector {
    static readonly #instance = new QzTrayConnector();

    private constructor() {}

    static getInstance(): QzTrayConnector {
        return QzTrayConnector.#instance;
    }

    private async getPublicKey(): Promise<string> {
        const response = await fetch(route('qztray_connector.get_public_key'), {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'text/plain' },
        });

        if (!response.ok) {
            throw new Error(
                `Unable to retrieve the QZ Tray public certificate (HTTP ${response.status}).`,
            );
        }

        return response.text();
    }
}
