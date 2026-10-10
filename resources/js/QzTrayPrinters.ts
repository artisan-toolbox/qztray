import qz from 'qz-tray';
import type { PrinterOptions, PrintData } from 'qz-tray';
import type { QzTrayConnection } from './QzTrayConnection';
import type { QzTrayPrintOptions, QzTrayPrintRequest } from './QzTrayPrintRequest';

/** @internal Printer discovery, print preparation, and submission. */
export class QzTrayPrinters {
    public constructor(private readonly connection: QzTrayConnection) {}

    public async getPrinters(): Promise<string[]> {
        await this.connection.connect();

        const printers = await qz.printers.find();

        return Array.isArray(printers) ? printers : [printers];
    }

    public async print(request: QzTrayPrintRequest): Promise<void> {
        const { printer, options, data } = this.preparePrint(request);

        await this.connection.connect();

        const config = qz.configs.create(printer, options);

        await qz.print(config, data);
    }

    public printEscpos(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'escpos', payload, options });
    }

    public printZpl(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'zpl', payload, options });
    }

    public printRaw(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'raw', payload, options });
    }

    public printPdf(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'pdf', payload, options });
    }

    private preparePrint(request: QzTrayPrintRequest): {
        printer: string;
        options: PrinterOptions;
        data: PrintData[];
    } {
        if (!request || typeof request.printer !== 'string' || request.printer.trim() === '') {
            throw new TypeError('Provide a nonempty printer name.');
        }

        if (!['escpos', 'zpl', 'raw', 'pdf'].includes(request.type)) {
            throw new TypeError('Unsupported print type. Use escpos, zpl, raw, or pdf.');
        }

        const payload =
            typeof request.payload === 'string'
                ? [request.payload]
                : Array.isArray(request.payload)
                  ? [...request.payload]
                  : [];

        if (
            payload.length === 0 ||
            payload.some((value) => typeof value !== 'string') ||
            payload.every((value) => value === '')
        ) {
            throw new TypeError(
                'Provide a nonempty print payload as a string or an array of strings.',
            );
        }

        const copies = request.options?.copies;

        if (copies !== undefined && (!Number.isInteger(copies) || copies < 1)) {
            throw new RangeError('Print copies must be a positive integer.');
        }

        if (request.type === 'pdf') {
            const flavor = request.flavor ?? 'file';

            if (!['file', 'base64'].includes(flavor)) {
                throw new TypeError('PDF printing supports file or base64 data.');
            }

            return {
                printer: request.printer,
                options: { copies: 1, forceRaw: false, scaleContent: true, ...request.options },
                data: payload.map((data) => ({
                    type: 'pixel',
                    format: 'pdf',
                    flavor,
                    data,
                    ...(request.dataOptions ? { options: { ...request.dataOptions } } : {}),
                })),
            };
        }

        const flavor = request.flavor ?? 'plain';

        if (!['plain', 'hex', 'base64', 'file'].includes(flavor)) {
            throw new TypeError('Raw printing supports plain, hex, base64, or file data.');
        }

        return {
            printer: request.printer,
            options: {
                copies: 1,
                forceRaw: typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac'),
                encoding: { escpos: 'CP850', zpl: 'UTF-8', raw: 'ISO-8859-1' }[request.type],
                ...request.options,
            },
            data: payload.map((data) => ({ type: 'raw', format: 'command', flavor, data })),
        };
    }
}
