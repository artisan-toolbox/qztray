import type { PrinterOptions, PrintData } from 'qz-tray';
import { afterEach, beforeEach, expect, expectTypeOf, test, vi } from 'vite-plus/test';

const qz = vi.hoisted(() => ({
    security: {
        setSignatureAlgorithm: vi.fn(),
        setCertificatePromise: vi.fn(),
        setSignaturePromise: vi.fn(),
    },
    websocket: {
        connect: vi.fn<() => Promise<void>>(),
        disconnect: vi.fn<() => Promise<void>>(),
        isActive: vi.fn<() => boolean>(),
    },
    configs: {
        create: vi.fn<(printer: string, options: PrinterOptions) => PrinterOptions>(),
    },
    print: vi.fn<(config: PrinterOptions, data: PrintData[]) => Promise<void>>(),
}));
vi.mock('qz-tray', () => ({ default: qz }));

let connector: typeof import('../../resources/js/index');

beforeEach(async () => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.stubGlobal('navigator', { platform: 'Win32' });
    qz.websocket.isActive.mockReturnValue(true);
    qz.websocket.connect.mockResolvedValue();
    qz.configs.create.mockReturnValue({ jobName: 'Created configuration' });
    qz.print.mockResolvedValue();
    connector = await import('../../resources/js/index');
});

afterEach(() => vi.unstubAllGlobals());

test('prepares ESC/POS command chunks in order with CP850 encoding', async () => {
    const payload = ['\x1B\x40', ' Café\n ', '\x1D\x56\x00', '\x80\xFF'];
    await connector.qztray.print({ printer: 'Receipt Printer', type: 'escpos', payload });

    expect(qz.configs.create).toHaveBeenCalledWith('Receipt Printer', {
        copies: 1,
        forceRaw: false,
        encoding: 'CP850',
    });
    expect(qz.print).toHaveBeenCalledWith(
        { jobName: 'Created configuration' },
        payload.map((data) => ({
            type: 'raw',
            format: 'command',
            flavor: 'plain',
            data,
        })),
    );
    expect(payload).toEqual(['\x1B\x40', ' Café\n ', '\x1D\x56\x00', '\x80\xFF']);
});

test('prints ZPL text with UTF-8 encoding', async () => {
    const payload = '^XA^CI28^FO20,20^FDLabel café^FS^XZ';
    await connector.qztray.print({ printer: 'Zebra', type: 'zpl', payload });
    expect(qz.configs.create).toHaveBeenCalledWith('Zebra', {
        copies: 1,
        forceRaw: false,
        encoding: 'UTF-8',
    });
    expect(qz.print.mock.calls[0][1]).toEqual([
        { type: 'raw', format: 'command', flavor: 'plain', data: payload },
    ]);
});

test.each([
    [0, 'CP850'],
    [12, 'CP850'],
    [13, 'CP850'],
    [27, 'windows-1252'],
    [28, 'UTF-8'],
    [31, 'windows-1250'],
    [33, 'windows-1251'],
    [34, 'windows-1253'],
    [35, 'windows-1254'],
    [36, 'windows-1255'],
] as const)('detects ZPL CI%s as %s without changing the payload', async (code, encoding) => {
    const payload = `^XA^CI${code}^FDLabel café^FS^XZ`;
    await connector.qztray.printZpl('Zebra', payload);
    expect(qz.configs.create.mock.calls[0][1].encoding).toBe(encoding);
    expect(qz.print.mock.calls[0][1][0].data).toBe(payload);
});

test('detects commands split across chunks and accepts repeated compatible character tables', async () => {
    const payload = ['^XA^C', 'I13,65,66^FDLabel^FS^XZ', '^XA^CI0^FDSecond^FS^XZ'];
    const options = { encoding: undefined, copies: 2 };
    await connector.qztray.print({ printer: 'Zebra', type: 'zpl', payload, options });
    expect(qz.configs.create.mock.calls[0][1]).toMatchObject({ encoding: 'CP850', copies: 2 });
    expect(qz.print.mock.calls[0][1].map((item) => item.data)).toEqual(payload);
    expect(options).toEqual({ encoding: undefined, copies: 2 });
});

test.each([
    '^XA^FDLabel^FS^XZ',
    '^XA^CI29^FDLabel^FS^XZ',
    '^XA^CI99^FDLabel^FS^XZ',
    '^XA^CI13^FDOne^FS^CI28^FDTwo^FS^XZ',
    '^XA^FDLiteral ^CI13^FS^XZ',
    '^XA^FVLiteral ^CI27^FS^XZ',
    '^XA^FXComment ^CI13^FS^FDLabel^FS^XZ',
    '^XA^CI13invalid^FDLabel^FS^XZ',
    '^XA^CC! !CI13!FDLabel!FS!XZ',
])('preserves UTF-8 for undetectable or ambiguous ZPL %s', async (payload) => {
    await connector.qztray.printZpl('Zebra', payload);
    expect(qz.configs.create.mock.calls[0][1].encoding).toBe('UTF-8');
});

test('gives an explicit ZPL encoding priority and keeps later jobs independent', async () => {
    await connector.qztray.printZpl('Zebra', '^XA^CI13^FDLabel^FS^XZ', { encoding: 'ISO-8859-1' });
    expect(qz.configs.create.mock.calls[0][1].encoding).toBe('ISO-8859-1');
    await connector.qztray.printZpl('Zebra', '^XA^CI27^FDLabel^FS^XZ');
    expect(qz.configs.create.mock.calls[1][1].encoding).toBe('windows-1252');
});

test('ignores command-like text after a detected encoding', async () => {
    await connector.qztray.printZpl(
        'Zebra',
        '^XA^CI13^FXComment ^CI27^FS^FDLiteral ^CI28 ^CC! ~CC!^FS^XZ',
    );
    expect(qz.configs.create.mock.calls[0][1].encoding).toBe('CP850');
});

test('preserves explicitly supplied QZ encoding objects', async () => {
    const encoding = { from: 'UTF-8', to: 'windows-1252' };
    await connector.qztray.printZpl('Zebra', '^XA^CI13^FDLabel^FS^XZ', { encoding });
    expect(qz.configs.create.mock.calls[0][1].encoding).toBe(encoding);
});

test.each(['hex', 'base64', 'file'] as const)(
    'does not inspect non-plain ZPL %s payloads',
    async (flavor) => {
        await connector.qztray.print({ printer: 'Zebra', type: 'zpl', flavor, payload: '^CI13' });
        expect(qz.configs.create.mock.calls[0][1].encoding).toBe('UTF-8');
    },
);

test.each(['escpos', 'raw'] as const)(
    'does not infer ZPL encodings for the %s preset',
    async (type) => {
        await connector.qztray.print({ printer: 'Printer', type, payload: '^CI27' });
        expect(qz.configs.create.mock.calls[0][1].encoding).toBe(
            type === 'escpos' ? 'CP850' : 'ISO-8859-1',
        );
    },
);

test('prints generic raw commands without appending or translating instructions', async () => {
    await connector.qztray.print({ printer: 'Label Printer', type: 'raw', payload: '\nN\nP1\n' });
    expect(qz.configs.create.mock.calls[0][1].encoding).toBe('ISO-8859-1');
    expect(qz.print.mock.calls[0][1][0]).toEqual({
        type: 'raw',
        format: 'command',
        flavor: 'plain',
        data: '\nN\nP1\n',
    });
});

test.each(['hex', 'base64', 'file'] as const)(
    'passes raw %s data using its explicit flavor',
    async (flavor) => {
        await connector.qztray.print({
            printer: 'Receipt Printer',
            type: 'escpos',
            flavor,
            payload: 'Encoded data',
        });
        expect(qz.print.mock.calls[0][1][0].flavor).toBe(flavor);
    },
);

test('prints PDF URLs as pixel files with configurable document and printer options', async () => {
    const options = {
        copies: 2,
        duplex: true,
        margins: 0,
        orientation: 'landscape' as const,
        size: { width: 210, height: 297 },
        units: 'mm' as const,
        scaleContent: false,
    };
    const dataOptions = { pageRanges: '1-3', ignoreTransparency: true };
    const payload = ['https://application.test/invoice.pdf?signature=abc', '/documents/terms.pdf'];
    await connector.qztray.print({
        printer: 'Office Printer',
        type: 'pdf',
        payload,
        options,
        dataOptions,
    });
    expect(qz.configs.create).toHaveBeenCalledWith('Office Printer', {
        forceRaw: false,
        ...options,
    });
    expect(qz.print.mock.calls[0][1]).toEqual(
        payload.map((data) => ({
            type: 'pixel',
            format: 'pdf',
            flavor: 'file',
            data,
            options: dataOptions,
        })),
    );
    expect(options).toEqual({
        copies: 2,
        duplex: true,
        margins: 0,
        orientation: 'landscape',
        size: { width: 210, height: 297 },
        units: 'mm',
        scaleContent: false,
    });
    expect(dataOptions).toEqual({ pageRanges: '1-3', ignoreTransparency: true });
});

test('prints PDF Base64 without treating it as a URL', async () => {
    await connector.qztray.print({
        printer: 'Office Printer',
        type: 'pdf',
        flavor: 'base64',
        payload: 'JVBERi0xLjQ=',
    });
    expect(qz.configs.create.mock.calls[0][1]).toEqual({
        copies: 1,
        forceRaw: false,
        scaleContent: true,
    });
    expect(qz.print.mock.calls[0][1]).toEqual([
        { type: 'pixel', format: 'pdf', flavor: 'base64', data: 'JVBERi0xLjQ=' },
    ]);
});

test('allows raw configuration overrides without changing defaults for later jobs', async () => {
    const options = { forceRaw: true, encoding: 'ISO-8859-1', copies: 3, jobName: 'Receipt' };
    await connector.qztray.print({
        printer: 'Receipt Printer',
        type: 'escpos',
        payload: 'First',
        options,
    });
    await connector.qztray.print({ printer: 'Receipt Printer', type: 'escpos', payload: 'Second' });
    expect(qz.configs.create.mock.calls[0][1]).toEqual(options);
    expect(qz.configs.create.mock.calls[1][1]).toEqual({
        copies: 1,
        forceRaw: false,
        encoding: 'CP850',
    });
});

test('waits for a connection before submitting each print job', async () => {
    let complete!: () => void;
    qz.websocket.isActive.mockReturnValue(false);
    qz.websocket.connect.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = resolve;
        }),
    );
    const first = connector.qztray.print({
        printer: 'Receipt Printer',
        type: 'escpos',
        payload: 'First',
    });
    const second = connector.qztray.print({
        printer: 'Receipt Printer',
        type: 'escpos',
        payload: 'Second',
    });
    expect(qz.print).not.toHaveBeenCalled();
    expect(qz.websocket.connect).toHaveBeenCalledTimes(1);
    complete();
    await Promise.all([first, second]);
    expect(qz.print).toHaveBeenCalledTimes(2);
});

test('resolves only after QZ accepts the job and does not disconnect', async () => {
    let complete!: () => void;
    qz.print.mockReturnValue(
        new Promise<void>((resolve) => {
            complete = resolve;
        }),
    );
    let resolved = false;
    const pending = connector.qztray
        .print({ printer: 'Receipt Printer', type: 'escpos', payload: 'Print' })
        .then(() => {
            resolved = true;
        });
    await vi.waitFor(() => expect(qz.print).toHaveBeenCalledTimes(1));
    expect(resolved).toBe(false);
    complete();
    await pending;
    expect(resolved).toBe(true);
    expect(qz.websocket.disconnect).not.toHaveBeenCalled();
});

test.each(['connection', 'configuration', 'printing'] as const)(
    'propagates %s failure without retrying a job',
    async (stage) => {
        const error = new Error('Print failed');
        if (stage === 'connection') {
            qz.websocket.isActive.mockReturnValue(false);
            qz.websocket.connect.mockRejectedValueOnce(error);
        } else if (stage === 'configuration') {
            qz.configs.create.mockImplementationOnce(() => {
                throw error;
            });
        } else {
            qz.print.mockRejectedValueOnce(error);
        }
        await expect(
            connector.qztray.print({
                printer: 'Receipt Printer',
                type: 'escpos',
                payload: 'Print',
            }),
        ).rejects.toBe(error);
        expect(qz.print).toHaveBeenCalledTimes(stage === 'printing' ? 1 : 0);
    },
);

test.each([
    { printer: '', type: 'escpos', payload: 'Print' },
    { printer: '  ', type: 'escpos', payload: 'Print' },
    { printer: 'Printer', type: 'unknown', payload: 'Print' },
    { printer: 'Printer', type: 'escpos', payload: '' },
    { printer: 'Printer', type: 'escpos', payload: [] },
    { printer: 'Printer', type: 'escpos', payload: [123] },
    { printer: 'Printer', type: 'pdf', payload: 'URL', flavor: 'plain' },
    { printer: 'Printer', type: 'raw', payload: 'Print', flavor: 'xml' },
])('rejects invalid JavaScript print input before accessing QZ', async (request) => {
    await expect(
        connector.qztray.print(request as Parameters<typeof connector.qztray.print>[0]),
    ).rejects.toBeInstanceOf(TypeError);
    expect(qz.security.setSignatureAlgorithm).not.toHaveBeenCalled();
    expect(qz.configs.create).not.toHaveBeenCalled();
    expect(qz.print).not.toHaveBeenCalled();
});

test.each([0, -1, 1.5])('rejects invalid copies (%s) before accessing QZ', async (copies) => {
    await expect(
        connector.qztray.print({
            printer: 'Printer',
            type: 'pdf',
            payload: 'URL',
            options: { copies },
        }),
    ).rejects.toBeInstanceOf(RangeError);
    expect(qz.print).not.toHaveBeenCalled();
});

test('exports a typed print request with format-specific flavors', () => {
    expectTypeOf<import('../../resources/js/index').QzTrayPrintRequest>().toExtend<{
        printer: string;
        payload: string | readonly string[];
    }>();
    expectTypeOf<
        Extract<import('../../resources/js/index').QzTrayPrintRequest, { type: 'pdf' }>['flavor']
    >().toEqualTypeOf<'file' | 'base64' | undefined>();
    expectTypeOf<typeof connector.qztray.print>().returns.toEqualTypeOf<Promise<void>>();
});

test.each(['escpos', 'zpl', 'raw'] as const)(
    'bypasses the driver for %s on macOS unless explicitly disabled',
    async (type) => {
        vi.stubGlobal('navigator', { platform: 'MacIntel' });
        await connector.qztray.print({ printer: 'Printer', type, payload: 'Print' });
        expect(qz.configs.create.mock.calls[0][1].forceRaw).toBe(true);
        await connector.qztray.print({
            printer: 'Printer',
            type,
            payload: 'Print',
            options: { forceRaw: false },
        });
        expect(qz.configs.create.mock.calls[1][1].forceRaw).toBe(false);
    },
);

test('keeps PDF on the pixel driver path on macOS', async () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' });
    await connector.qztray.print({
        printer: 'Printer',
        type: 'pdf',
        payload: 'https://application.test/file.pdf',
    });
    expect(qz.configs.create.mock.calls[0][1].forceRaw).toBe(false);
    expect(qz.print.mock.calls[0][1][0].type).toBe('pixel');
});

test.each(['Linux x86_64', 'Win32'])('keeps driver bypass opt-in on %s', async (platform) => {
    vi.stubGlobal('navigator', { platform });
    await connector.qztray.print({ printer: 'Printer', type: 'escpos', payload: 'Print' });
    expect(qz.configs.create.mock.calls[0][1].forceRaw).toBe(false);
});

const shortcuts = [
    ['printEscpos', 'raw', 'command', { encoding: 'CP850' }],
    ['printZpl', 'raw', 'command', { encoding: 'UTF-8' }],
    ['printRaw', 'raw', 'command', { encoding: 'ISO-8859-1' }],
    ['printPdf', 'pixel', 'pdf', { scaleContent: true }],
] as const;

test.each(shortcuts)(
    '%s prepares the preset using printer, payload, and optional configuration',
    async (method, type, format, defaults) => {
        const payload = ['First item', 'Second item'] as const;
        const options = { copies: 2, jobName: 'Shortcut job' };
        await connector.qztray[method]('Printer', payload, options);
        expect(qz.configs.create).toHaveBeenCalledWith('Printer', {
            forceRaw: false,
            ...defaults,
            ...options,
        });
        expect(qz.print).toHaveBeenCalledWith(
            { jobName: 'Created configuration' },
            payload.map((data) => ({
                type,
                format,
                flavor: type === 'pixel' ? 'file' : 'plain',
                data,
            })),
        );
        expect(options).toEqual({ copies: 2, jobName: 'Shortcut job' });
    },
);

test.each(shortcuts)('%s works without options and preserves shared validation', async (method) => {
    await connector.qztray[method]('Printer', 'Print');
    expect(qz.configs.create.mock.calls[0][1].copies).toBe(1);
    await expect(connector.qztray[method]('', 'Print')).rejects.toBeInstanceOf(TypeError);
    expect(qz.print).toHaveBeenCalledTimes(1);
});

test.each(shortcuts)('%s propagates native printing errors without retrying', async (method) => {
    const error = new Error('Printer unavailable');
    qz.print.mockRejectedValueOnce(error);
    await expect(connector.qztray[method]('Printer', 'Print')).rejects.toBe(error);
    expect(qz.print).toHaveBeenCalledTimes(1);
});
