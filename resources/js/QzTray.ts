import { QzTrayConnection } from './QzTrayConnection';
import { QzTrayPrinters } from './QzTrayPrinters';
import type { QzTrayPrintOptions, QzTrayPrintRequest } from './QzTrayPrintRequest';

export class QzTray {
    static readonly #instance = new QzTray();

    private readonly connection = new QzTrayConnection();
    private readonly printers = new QzTrayPrinters(this.connection);

    private constructor() {}

    public static getInstance(): QzTray {
        return QzTray.#instance;
    }

    public isConnected(): boolean {
        return this.connection.isConnected();
    }

    public connect(): Promise<void> {
        return this.connection.connect();
    }

    public disconnect(): Promise<void> {
        return this.connection.disconnect();
    }

    public getPrinters(): Promise<string[]> {
        return this.printers.getPrinters();
    }

    public print(request: QzTrayPrintRequest): Promise<void> {
        return this.printers.print(request);
    }

    public printEscpos(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.printers.printEscpos(printer, payload, options);
    }

    public printZpl(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.printers.printZpl(printer, payload, options);
    }

    public printRaw(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.printers.printRaw(printer, payload, options);
    }

    public printPdf(
        printer: string,
        payload: QzTrayPrintRequest['payload'],
        options?: QzTrayPrintOptions,
    ): Promise<void> {
        return this.printers.printPdf(printer, payload, options);
    }
}
