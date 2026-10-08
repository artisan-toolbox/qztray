import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import type { Config } from 'ziggy-js';
import qztray from './index';

const certificate = '-----BEGIN CERTIFICATE-----\nexample\n-----END CERTIFICATE-----\n';
const ziggy: Config = {
    url: 'https://application.test',
    port: null,
    defaults: {},
    routes: {
        'qztray_connector.get_public_key': {
            uri: 'qztray-connector/get-public-key',
            methods: ['GET', 'HEAD'],
        },
    },
};

beforeEach(() => {
    vi.stubGlobal('Ziggy', ziggy);
});

afterEach(() => {
    vi.unstubAllGlobals();
});

test('retrieves the certificate as text from the Ziggy route with session credentials', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(certificate));
    vi.stubGlobal('fetch', fetchMock);

    expect(await qztray['getPublicKey']()).toBe(certificate);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://application.test/qztray-connector/get-public-key',
        {
            method: 'GET',
            credentials: 'same-origin',
            headers: { Accept: 'text/plain' },
        },
    );
});

test.each([401, 403, 500])(
    'rejects an unsuccessful certificate response with status %i',
    async (status) => {
        vi.stubGlobal(
            'fetch',
            vi.fn<typeof fetch>().mockResolvedValue(new Response('Error', { status })),
        );

        await expect(qztray['getPublicKey']()).rejects.toThrow(
            `Unable to retrieve the QZ Tray public certificate (HTTP ${status}).`,
        );
    },
);

test('propagates network failures', async () => {
    const error = new TypeError('Network request failed');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(error));

    await expect(qztray['getPublicKey']()).rejects.toBe(error);
});

test('uses the URL and path supplied by the application through Ziggy', async () => {
    vi.stubGlobal('Ziggy', {
        ...ziggy,
        url: 'https://other-application.test/subdirectory',
        routes: {
            'qztray_connector.get_public_key': {
                uri: 'custom/certificate',
                methods: ['GET', 'HEAD'],
            },
        },
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(certificate));
    vi.stubGlobal('fetch', fetchMock);

    await qztray['getPublicKey']();

    expect(fetchMock).toHaveBeenCalledWith(
        'https://other-application.test/subdirectory/custom/certificate',
        expect.any(Object),
    );
});

test('rejects missing Ziggy configuration without sending a request', async () => {
    vi.stubGlobal('Ziggy', undefined);
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(qztray['getPublicKey']()).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
});

test('rejects a missing Ziggy route without sending a request', async () => {
    vi.stubGlobal('Ziggy', { ...ziggy, routes: {} });
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);

    await expect(qztray['getPublicKey']()).rejects.toThrow(
        "Ziggy error: route 'qztray_connector.get_public_key' is not in the route list.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
});
