import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';

import { createSecurityCallbacks } from './securityCallbacks';

let security: Awaited<ReturnType<typeof createSecurityCallbacks>>;
let connector: typeof import('../../resources/js/index');

beforeEach(async () => {
    vi.resetModules();
    connector = await import('../../resources/js/index');
    security = await createSecurityCallbacks();
    vi.stubGlobal('Ziggy', {
        url: 'https://application.test',
        port: null,
        defaults: {},
        routes: {
            'qztray_connector.sign_payload': {
                uri: 'qztray-connector/sign-payload',
                methods: ['POST'],
            },
        },
    });
    vi.stubGlobal('document', { cookie: 'session=abc; XSRF-TOKEN=token%2Bvalue%3D' });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

test('posts the exact payload to the Ziggy route and returns a plain-text signature', async () => {
    const payload = ' \n{"message":"Print café"}\n ';
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('c2lnbmF0dXJl'));
    vi.stubGlobal('fetch', fetchMock);

    expect(await security.signPayload(payload)).toBe('c2lnbmF0dXJl');
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'https://application.test/qztray-connector/sign-payload',
        {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': 'token+value=',
            },
            body: JSON.stringify({ payload }),
        },
    );
});

test('signs each payload without caching and rereads the CSRF cookie', async () => {
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockImplementation(async () => new Response('signature'));
    vi.stubGlobal('fetch', fetchMock);
    await security.signPayload('first');
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=new-token' });
    await security.signPayload('second');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
            body: JSON.stringify({ payload: 'second' }),
            headers: expect.objectContaining({ 'X-XSRF-TOKEN': 'new-token' }),
        }),
    );
});

test.each([
    'qztray.payload_invalid',
    'qztray.private_key_missing',
    'qztray.private_key_invalid',
    'qztray.signing_failed',
])('exposes the backend signing error %s', async (code) => {
    vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockResolvedValue(
            Response.json(
                {
                    error: {
                        code,
                        message: 'Could not sign the payload.',
                    },
                },
                { status: 503 },
            ),
        ),
    );
    const request = security.signPayload('Print');
    await expect(request).rejects.toBeInstanceOf(connector.QzTraySigningError);
    await expect(request).rejects.toMatchObject({
        code,
        status: 503,
        message: 'Could not sign the payload.',
    });
});

test.each([
    [
        401,
        'qztray.authentication_required',
        'Sign in to the application before signing a QZ Tray payload.',
    ],
    [
        419,
        'qztray.csrf_token_mismatch',
        'The Laravel session or CSRF token has expired. Reload the page before signing a QZ Tray payload.',
    ],
    [500, 'qztray.signing_request_failed', 'Unable to sign the QZ Tray payload (HTTP 500).'],
] as const)('provides a fallback signing error for HTTP %i', async (status, code, message) => {
    vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockResolvedValue(new Response('Error', { status })),
    );
    await expect(security.signPayload('Print')).rejects.toMatchObject({
        code,
        status,
        message,
    });
});

test('sends no request when the CSRF cookie is missing', async () => {
    vi.stubGlobal('document', { cookie: '' });
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    await expect(security.signPayload('Print')).rejects.toMatchObject({
        code: 'qztray.csrf_token_missing',
        status: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
});

test('propagates network errors', async () => {
    const error = new TypeError('Network request failed');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(error));
    await expect(security.signPayload('Print')).rejects.toBe(error);
});

test('sends no request when the CSRF cookie cannot be decoded', async () => {
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=%invalid' });
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    await expect(security.signPayload('Print')).rejects.toMatchObject({
        code: 'qztray.csrf_token_invalid',
        status: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
});
