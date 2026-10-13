import { QzTrayEscposPrintPayload, QzTrayPrintOptions, QzTrayPrintRequest } from './QzTrayPrintRequest';
export declare class QzTray {
    #private;
    private readonly connection;
    private readonly printers;
    private constructor();
    static getInstance(): QzTray;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getPrinters(): Promise<string[]>;
    print(request: QzTrayPrintRequest): Promise<void>;
    printEscpos(printer: string, payload: QzTrayEscposPrintPayload, options?: QzTrayPrintOptions): Promise<void>;
    printZpl(printer: string, payload: string | readonly string[], options?: QzTrayPrintOptions): Promise<void>;
    printRaw(printer: string, payload: string | readonly string[], options?: QzTrayPrintOptions): Promise<void>;
    printPdf(printer: string, payload: string | readonly string[], options?: QzTrayPrintOptions): Promise<void>;
}
//# sourceMappingURL=QzTray.d.ts.map