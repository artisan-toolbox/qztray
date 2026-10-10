import type { PromiseFactory, PromiseHandler } from 'qz-tray';
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';

const qz = vi.hoisted(() => ({
    security: {
        setSignatureAlgorithm: vi.fn(),
        setCertificatePromise: vi.fn(),
        setSignaturePromise: vi.fn(),
    },
    printers: {
        find: vi.fn<() => Promise<string[] | string>>(),
    },
    websocket: {
        connect: vi.fn<() => Promise<void>>(),
        disconnect: vi.fn<() => Promise<void>>(),
        isActive: vi.fn<() => boolean>(),
    },
}));
vi.mock('qz-tray', () => ({ default: qz }));

let connector: typeof import('../../resources/js/index');

beforeEach(async () => {
    vi.resetModules();
    vi.resetAllMocks();
    qz.websocket.isActive.mockReturnValue(false);
    qz.printers.find.mockResolvedValue([]);
    qz.websocket.connect.mockResolvedValue();
    qz.websocket.disconnect.mockResolvedValue();
    vi.stubGlobal('Ziggy', {
        url: 'https://application.test',
        port: null,
        defaults: {},
        routes: {
            'qztray_connector.get_public_key': { uri: 'certificate', methods: ['GET'] },
            'qztray_connector.sign_payload': { uri: 'signature', methods: ['POST'] },
        },
    });
    vi.stubGlobal('document', { cookie: 'XSRF-TOKEN=csrf-token' });
    connector = await import('../../resources/js/index');
});

afterEach(() => vi.unstubAllGlobals());

function certificateRequest(): Promise<string | undefined> {
    const handler = qz.security.setCertificatePromise.mock.calls[0][0] as PromiseHandler;
    return new Promise(handler);
}

function signatureRequest(payload: string): Promise<string | undefined> {
    const factory = qz.security.setSignaturePromise.mock.calls[0][0] as PromiseFactory;
    return new Promise(factory(payload));
}

test('configures security in order before connecting and resolves when connected', async () => {
    let complete!: () => void;
    qz.websocket.connect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = resolve;
        }),
    );
    let resolved = false;
    const pending = connector.qztray.connect().then(() => {
        resolved = true;
    });

    expect(qz.security.setSignatureAlgorithm).toHaveBeenCalledWith('SHA512');
    expect(qz.security.setCertificatePromise).toHaveBeenCalledWith(expect.any(Function), {
        rejectOnFailure: true,
    });
    expect(qz.security.setSignatureAlgorithm.mock.invocationCallOrder[0]).toBeLessThan(
        qz.security.setCertificatePromise.mock.invocationCallOrder[0],
    );
    expect(qz.security.setCertificatePromise.mock.invocationCallOrder[0]).toBeLessThan(
        qz.security.setSignaturePromise.mock.invocationCallOrder[0],
    );
    expect(qz.security.setSignaturePromise.mock.invocationCallOrder[0]).toBeLessThan(
        qz.websocket.connect.mock.invocationCallOrder[0],
    );
    expect(resolved).toBe(false);
    complete();
    await pending;
    expect(resolved).toBe(true);
});

test('shares concurrent attempts and avoids connecting an already active socket', async () => {
    let complete!: () => void;
    qz.websocket.connect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = resolve;
        }),
    );
    const first = connector.qztray.connect();
    const second = connector.qztray.connect();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
    complete();
    await Promise.all([first, second]);
    qz.websocket.isActive.mockReturnValue(true);
    await connector.qztray.connect();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
});

test('reports live connection state and reconnects after the socket closes', async () => {
    await connector.qztray.connect();
    qz.websocket.isActive.mockReturnValue(true);
    expect(connector.qztray.isConnected()).toBe(true);
    qz.websocket.isActive.mockReturnValue(false);
    expect(connector.qztray.isConnected()).toBe(false);
    await connector.qztray.connect();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(2);
});

test('propagates connection failure to concurrent callers and allows a retry', async () => {
    const error = new Error('QZ Tray is unavailable');
    qz.websocket.connect.mockRejectedValueOnce(error);
    const first = connector.qztray.connect();
    const second = connector.qztray.connect();
    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
    await connector.qztray.connect();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(2);
});

test('wires certificate retrieval with caching and signs the exact payload', async () => {
    const fetchMock = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(new Response('Certificate'))
        .mockResolvedValueOnce(new Response('Signature'));
    vi.stubGlobal('fetch', fetchMock);
    await connector.qztray.connect();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await certificateRequest()).toBe('Certificate');
    expect(await certificateRequest()).toBe('Certificate');
    const payload = ' \nPrint café\n ';
    expect(await signatureRequest(payload)).toBe('Signature');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify({ payload }));
});

test('propagates certificate and signing errors through the QZ promise callbacks', async () => {
    vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>().mockResolvedValue(
            Response.json(
                {
                    error: {
                        code: 'qztray.certificate_missing',
                        message: 'Missing certificate',
                    },
                },
                { status: 503 },
            ),
        ),
    );
    await connector.qztray.connect();
    await expect(certificateRequest()).rejects.toBeInstanceOf(connector.QzTrayCertificateError);
    vi.stubGlobal('document', { cookie: '' });
    await expect(signatureRequest('Print')).rejects.toBeInstanceOf(connector.QzTraySigningError);
});

test('rejects the connection when QZ requests a certificate that Laravel rejects', async () => {
    vi.stubGlobal(
        'fetch',
        vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(
                Response.json(
                    {
                        error: {
                            code: 'qztray.certificate_missing',
                            message: 'Missing certificate',
                        },
                    },
                    { status: 503 },
                ),
            )
            .mockResolvedValueOnce(new Response('Certificate')),
    );
    qz.websocket.connect.mockImplementation(async () => {
        await certificateRequest();
    });

    await expect(connector.qztray.connect()).rejects.toMatchObject({
        name: 'QzTrayCertificateError',
        code: 'qztray.certificate_missing',
        status: 503,
    });
    await connector.qztray.connect();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(2);
});

test('does not disconnect an inactive socket', async () => {
    await connector.qztray.disconnect();
    expect(qz.websocket.disconnect).not.toHaveBeenCalled();
});

test('shares disconnection attempts and resolves only after the socket closes', async () => {
    let complete!: () => void;
    qz.websocket.isActive.mockReturnValue(true);
    qz.websocket.disconnect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = () => {
                qz.websocket.isActive.mockReturnValue(false);
                resolve();
            };
        }),
    );
    let resolved = false;
    const first = connector.qztray.disconnect().then(() => {
        resolved = true;
    });
    const second = connector.qztray.disconnect();
    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1);
    expect(resolved).toBe(false);
    complete();
    await Promise.all([first, second]);
    expect(resolved).toBe(true);
    expect(connector.qztray.isConnected()).toBe(false);
    await connector.qztray.disconnect();
    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1);
});

test('waits for a pending connection before disconnecting it', async () => {
    let complete!: () => void;
    qz.websocket.connect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = () => {
                qz.websocket.isActive.mockReturnValue(true);
                resolve();
            };
        }),
    );
    const connecting = connector.qztray.connect();
    const disconnecting = connector.qztray.disconnect();
    expect(qz.websocket.disconnect).not.toHaveBeenCalled();
    complete();
    await Promise.all([connecting, disconnecting]);
    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(1);
});

test('resolves disconnection if a pending connection fails without opening a socket', async () => {
    const error = new Error('Connection failed');
    qz.websocket.connect.mockRejectedValueOnce(error);
    const connecting = connector.qztray.connect();
    const disconnecting = connector.qztray.disconnect();
    await expect(connecting).rejects.toBe(error);
    await disconnecting;
    expect(qz.websocket.disconnect).not.toHaveBeenCalled();
});

test('waits for disconnection before opening a new connection', async () => {
    let complete!: () => void;
    qz.websocket.isActive.mockReturnValue(true);
    qz.websocket.disconnect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = () => {
                qz.websocket.isActive.mockReturnValue(false);
                resolve();
            };
        }),
    );
    const disconnecting = connector.qztray.disconnect();
    const first = connector.qztray.connect();
    const second = connector.qztray.connect();
    expect(qz.websocket.connect).not.toHaveBeenCalled();
    complete();
    await Promise.all([disconnecting, first, second]);
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
});

test('propagates disconnection failure to callers and allows a retry', async () => {
    const error = new Error('Disconnection failed');
    qz.websocket.isActive.mockReturnValue(true);
    qz.websocket.disconnect.mockRejectedValueOnce(error);
    const first = connector.qztray.disconnect();
    const second = connector.qztray.disconnect();
    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
    await connector.qztray.disconnect();
    expect(qz.websocket.disconnect).toHaveBeenCalledTimes(2);
});

test('preserves the cached certificate across disconnection and reconnection', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('Certificate'));
    vi.stubGlobal('fetch', fetchMock);
    await connector.qztray.connect();
    expect(await certificateRequest()).toBe('Certificate');
    qz.websocket.isActive.mockReturnValue(true);
    qz.websocket.disconnect.mockImplementation(async () => {
        qz.websocket.isActive.mockReturnValue(false);
    });
    await connector.qztray.disconnect();
    await connector.qztray.connect();
    expect(await certificateRequest()).toBe('Certificate');
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('rejects a waiting connection if disconnection fails and allows a later connection', async () => {
    const error = new Error('Disconnection failed');
    qz.websocket.isActive.mockReturnValue(true);
    qz.websocket.disconnect.mockRejectedValueOnce(error);
    const disconnecting = connector.qztray.disconnect();
    const connecting = connector.qztray.connect();
    await expect(disconnecting).rejects.toBe(error);
    await expect(connecting).rejects.toBe(error);
    expect(qz.websocket.connect).not.toHaveBeenCalled();
    qz.websocket.isActive.mockReturnValue(false);
    await connector.qztray.connect();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
});

test('connects before finding all printer names without a query', async () => {
    let complete!: () => void;
    qz.websocket.connect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = resolve;
        }),
    );
    qz.printers.find.mockResolvedValue(['Receipt Printer', 'Office Printer']);
    const request = connector.qztray.getPrinters();
    expect(qz.printers.find).not.toHaveBeenCalled();
    complete();
    expect(await request).toEqual(['Receipt Printer', 'Office Printer']);
    expect(qz.printers.find).toHaveBeenCalledExactlyOnceWith();
});

test('reuses an active connection when listing printers', async () => {
    qz.websocket.isActive.mockReturnValue(true);
    qz.printers.find.mockResolvedValue(['Printer']);
    expect(await connector.qztray.getPrinters()).toEqual(['Printer']);
    expect(qz.websocket.connect).not.toHaveBeenCalled();
    expect(qz.security.setSignatureAlgorithm).toHaveBeenCalledWith('SHA512');
});

test('returns an empty array when no printers are available', async () => {
    expect(await connector.qztray.getPrinters()).toEqual([]);
});

test('normalizes a single printer name to an array', async () => {
    qz.printers.find.mockResolvedValue('Receipt Printer');
    expect(await connector.qztray.getPrinters()).toEqual(['Receipt Printer']);
});

test('shares a pending connection while fetching a fresh list for each caller', async () => {
    qz.printers.find
        .mockResolvedValueOnce(['First Printer'])
        .mockResolvedValueOnce(['Second Printer']);
    const first = connector.qztray.getPrinters();
    const second = connector.qztray.getPrinters();
    expect(await first).toEqual(['First Printer']);
    expect(await second).toEqual(['Second Printer']);
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
    expect(qz.printers.find).toHaveBeenCalledTimes(2);
});

test('does not query printers when connecting fails', async () => {
    const error = new Error('QZ Tray is unavailable');
    qz.websocket.connect.mockRejectedValueOnce(error);
    await expect(connector.qztray.getPrinters()).rejects.toBe(error);
    expect(qz.printers.find).not.toHaveBeenCalled();
});

test('propagates printer lookup errors and allows another lookup', async () => {
    qz.websocket.isActive.mockReturnValue(true);
    const error = new Error('Unable to list printers');
    qz.printers.find.mockRejectedValueOnce(error).mockResolvedValueOnce(['Printer']);
    await expect(connector.qztray.getPrinters()).rejects.toBe(error);
    expect(await connector.qztray.getPrinters()).toEqual(['Printer']);
});
