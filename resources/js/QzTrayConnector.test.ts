import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import type { Config } from 'ziggy-js';

let qztray: typeof import('./index').default;
let QzTrayCertificateError: typeof import('./index').QzTrayCertificateError;

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

beforeEach(async () => {
    vi.resetModules();
    const connector = await import('./index');
    qztray = connector.default;
    QzTrayCertificateError = connector.QzTrayCertificateError;
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

test('reuses the cached certificate without resolving routes or fetching again', async () => {
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockImplementation(async () => new Response(certificate));
    vi.stubGlobal('fetch', fetchMock);

    expect(await qztray['getPublicKey']()).toBe(certificate);
    vi.stubGlobal('Ziggy', undefined);
    expect(await qztray['getPublicKey']()).toBe(certificate);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('shares one certificate request across concurrent calls', async () => {
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockImplementation(async () => new Response(certificate));
    vi.stubGlobal('fetch', fetchMock);

    expect(await Promise.all([qztray['getPublicKey'](), qztray['getPublicKey']()])).toEqual([
        certificate,
        certificate,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('retries after an HTTP failure and caches only the successful result', async () => {
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
            Response.json(
                {
                    error: {
                        code: 'qztray.certificate_missing',
                        message: 'Certificate is missing.',
                    },
                },
                { status: 503 },
            ),
        )
        .mockResolvedValueOnce(new Response(certificate));
    vi.stubGlobal('fetch', fetchMock);

    await expect(qztray['getPublicKey']()).rejects.toMatchObject({
        code: 'qztray.certificate_missing',
    });
    expect(await qztray['getPublicKey']()).toBe(certificate);
    expect(await qztray['getPublicKey']()).toBe(certificate);
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('retries after a network failure', async () => {
    const error = new TypeError('Network request failed');
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(new Response(certificate));
    vi.stubGlobal('fetch', fetchMock);

    await expect(qztray['getPublicKey']()).rejects.toBe(error);
    expect(await qztray['getPublicKey']()).toBe(certificate);
    expect(fetchMock).toHaveBeenCalledTimes(2);
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

test.each([
    'qztray.certificate_missing',
    'qztray.certificate_invalid',
    'qztray.certificate_not_yet_valid',
    'qztray.certificate_expired',
])('exposes the backend certificate error %s for application feedback', async (code) => {
    const message = 'Configure the QZ Tray public certificate.';
    vi.stubGlobal(
        'fetch',
        vi
            .fn<typeof fetch>()
            .mockResolvedValue(Response.json({ error: { code, message } }, { status: 503 })),
    );

    const request = qztray['getPublicKey']();
    await expect(request).rejects.toBeInstanceOf(QzTrayCertificateError);
    await expect(request).rejects.toMatchObject({
        name: 'QzTrayCertificateError',
        code,
        message,
        status: 503,
    });
});

test.each([
    'not JSON',
    JSON.stringify(null),
    JSON.stringify({ error: { code: 123, message: [] } }),
])('uses a fallback error for an unexpected JSON error response', async (body) => {
    vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockResolvedValue(
            new Response(body, {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }),
        ),
    );

    await expect(qztray['getPublicKey']()).rejects.toMatchObject({
        code: 'qztray.certificate_request_failed',
        status: 500,
        message: 'Unable to retrieve the QZ Tray public certificate (HTTP 500).',
    });
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
