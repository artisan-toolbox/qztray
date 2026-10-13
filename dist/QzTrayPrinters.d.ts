import { QzTrayConnection } from './QzTrayConnection';
import { QzTrayEscposPrintPayload, QzTrayPrintOptions, QzTrayPrintRequest } from './QzTrayPrintRequest';
/** @internal Printer discovery, print preparation, and submission. */
export declare class QzTrayPrinters {
    private readonly connection;
    constructor(connection: QzTrayConnection);
    getPrinters(): Promise<string[]>;
    print(request: QzTrayPrintRequest): Promise<void>;
    printEscpos(printer: string, payload: QzTrayEscposPrintPayload, options?: QzTrayPrintOptions): Promise<void>;
    printZpl(printer: string, payload: string | readonly string[], options?: QzTrayPrintOptions): Promise<void>;
    printRaw(printer: string, payload: string | readonly string[], options?: QzTrayPrintOptions): Promise<void>;
    printPdf(printer: string, payload: string | readonly string[], options?: QzTrayPrintOptions): Promise<void>;
    private preparePrint;
}
//# sourceMappingURL=QzTrayPrinters.d.ts.map