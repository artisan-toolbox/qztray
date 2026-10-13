import qz from 'qz-tray';
import type { PrinterOptions, PrintData } from 'qz-tray';
import type { QzTrayConnection } from './QzTrayConnection';
import type {
    QzTrayEscposPrintImage,
    QzTrayEscposPrintPayload,
    QzTrayPrintOptions,
    QzTrayPrintRequest,
} from './QzTrayPrintRequest';
import { detectZplEncoding } from './detectZplEncoding';

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
        payload: QzTrayEscposPrintPayload,
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'escpos', payload, options });
    }

    public printZpl(
        printer: string,
        payload: string | readonly string[],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'zpl', payload, options });
    }

    public printRaw(
        printer: string,
        payload: string | readonly string[],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.print({ printer, type: 'raw', payload, options });
    }

    public printPdf(
        printer: string,
        payload: string | readonly string[],
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

        const parts: unknown[] =
            typeof request.payload === 'string'
                ? [request.payload]
                : Array.isArray(request.payload)
                  ? [...request.payload]
                  : [];

        if (parts.every((value) => value === '')) {
            throw new TypeError(
                'Provide a nonempty print payload as a string or an array of supported print parts.',
            );
        }

        const payload = parts.map((value): string | QzTrayEscposPrintImage => {
            if (typeof value === 'string') {
                return value;
            }
            if (
                request.type !== 'escpos' ||
                typeof value !== 'object' ||
                value === null ||
                Array.isArray(value)
            ) {
                throw new TypeError(
                    'Print payload parts must be strings or ESC/POS raw image objects.',
                );
            }
            const image = value as QzTrayEscposPrintImage;
            if (
                image.type !== 'raw' ||
                image.format !== 'image' ||
                !['file', 'base64'].includes(image.flavor) ||
                typeof image.data !== 'string' ||
                image.data.trim() === ''
            ) {
                throw new TypeError(
                    'Provide an ESC/POS raw image with file or base64 flavor and nonempty data.',
                );
            }
            if (
                image.options !== undefined &&
                (typeof image.options !== 'object' ||
                    image.options === null ||
                    Array.isArray(image.options))
            ) {
                throw new TypeError('ESC/POS print image options must be an object.');
            }
            if (image.options?.language !== undefined && image.options.language !== 'ESCPOS') {
                throw new TypeError('ESC/POS print images must use language ESCPOS.');
            }
            return {
                ...image,
                options: { ...image.options, language: image.options?.language ?? 'ESCPOS' },
            };
        });
        const textPayload = payload.filter((value): value is string => typeof value === 'string');

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
                data: textPayload.map((data) => ({
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

        const encoding =
            request.options?.encoding !== undefined
                ? request.options.encoding
                : request.type === 'zpl' && flavor === 'plain'
                  ? detectZplEncoding(textPayload)
                  : { escpos: 'CP850', zpl: 'UTF-8', raw: 'ISO-8859-1' }[request.type];

        return {
            printer: request.printer,
            options: {
                copies: 1,
                forceRaw: typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac'),
                ...request.options,
                encoding,
            },
            data: payload.map((data) =>
                typeof data === 'string' ? { type: 'raw', format: 'command', flavor, data } : data,
            ),
        };
    }
}
