import { createHash } from 'node:crypto';
import { afterEach, expect, test, vi } from 'vite-plus/test';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

test('documents how the actual QZ SDK wraps structured signing errors in public operations', async () => {
    class Socket extends EventTarget {
        public static OPEN = 1;
        public static CLOSED = 3;
        public readyState = 1;
        public onmessage: ((event: { data: string }) => void) | null = null;
        public onclose: ((event: { code: number; reason: string }) => void) | null = null;
        public constructor(public readonly url: string) {
            super();
            queueMicrotask(() => this.dispatchEvent(new Event('open')));
        }
        public send(data: string) {
            const request = JSON.parse(data) as { uid?: string; call?: string };
            if (request.uid !== undefined) {
                queueMicrotask(() =>
                    this.onmessage?.({
                        data: JSON.stringify({
                            uid: request.uid,
                            result: request.call === 'getVersion' ? '2.3.0' : null,
                        }),
                    }),
                );
            }
        }
        public close() {
            this.readyState = 3;
            queueMicrotask(() => this.onclose?.({ code: 1000, reason: '' }));
        }
    }
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=token' });
    vi.stubGlobal('Ziggy', {
        url: 'https://application.test',
        port: null,
        defaults: {},
        routes: {
            'qztray_connector.get_public_key': { uri: 'certificate', methods: ['GET'] },
            'qztray_connector.sign_payload': { uri: 'signature', methods: ['POST'] },
        },
    });
    vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockImplementation(async (input) =>
            (typeof input === 'string'
                ? input
                : input instanceof URL
                  ? input.href
                  : input.url
            ).endsWith('/certificate')
                ? new Response('-----BEGIN CERTIFICATE-----\nexample\n-----END CERTIFICATE-----')
                : Response.json(
                      {
                          error: {
                              code: 'qztray.private_key_missing',
                              message: 'Configure the private key.',
                          },
                      },
                      { status: 503 },
                  ),
        ),
    );
    const qz = (await import('qz-tray')).default;
    // The SDK's declarations still describe callback factories rather than these runtime inputs.
    qz.api.setWebSocketType(Socket as unknown as Parameters<typeof qz.api.setWebSocketType>[0]);
    const hash = (data: string) => createHash('sha256').update(data).digest('hex');
    qz.api.setSha256Type(hash as unknown as Parameters<typeof qz.api.setSha256Type>[0]);
    const { default: qztray, QzTraySigningError } = await import('../../resources/js/index');
    try {
        await qztray.connect();
        await expect(qztray.getPrinters()).rejects.toMatchObject({
            message: 'Failed to sign request',
        });
        const original = errorLog.mock.calls
            .flat()
            .find((value) => value instanceof QzTraySigningError);
        expect(original).toMatchObject({ code: 'qztray.private_key_missing', status: 503 });
    } finally {
        await qztray.disconnect();
    }
}, 10000);
