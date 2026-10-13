import { PrinterOptions, PrintOptions } from 'qz-tray';
export type QzTrayPrintOptions = PrinterOptions;
export type QzTrayPdfDataOptions = Pick<PrintOptions, 'pageWidth' | 'pageHeight' | 'pageRanges' | 'ignoreTransparency' | 'altFontRendering'>;
type PrintRequestBase = {
    printer: string;
    options?: QzTrayPrintOptions;
};
export type QzTrayEscposPrintImage = {
    type: 'raw';
    format: 'image';
    flavor: 'file' | 'base64';
    data: string;
    options?: Omit<PrintOptions, 'language'> & {
        language?: 'ESCPOS';
        imageEncoding?: 'esc_asterisk' | 'gs_v_0';
        quantization?: 'luma' | 'alpha' | 'black';
        threshold?: number;
    };
};
export type QzTrayEscposPrintPayload = string | readonly (string | QzTrayEscposPrintImage)[];
export type QzTrayPrintRequest = PrintRequestBase & ({
    type: 'escpos';
    payload: QzTrayEscposPrintPayload;
    flavor?: 'plain' | 'hex' | 'base64' | 'file';
} | {
    type: 'zpl' | 'raw';
    payload: string | readonly string[];
    flavor?: 'plain' | 'hex' | 'base64' | 'file';
} | {
    type: 'pdf';
    payload: string | readonly string[];
    flavor?: 'file' | 'base64';
    dataOptions?: QzTrayPdfDataOptions;
});
export type QzTrayPrintType = QzTrayPrintRequest['type'];
export {};
//# sourceMappingURL=QzTrayPrintRequest.d.ts.map