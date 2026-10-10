import type { PrinterOptions, PrintOptions } from 'qz-tray';

export type QzTrayPrintOptions = PrinterOptions;

export type QzTrayPdfDataOptions = Pick<
    PrintOptions,
    'pageWidth' | 'pageHeight' | 'pageRanges' | 'ignoreTransparency' | 'altFontRendering'
>;

type PrintRequestBase = {
    printer: string;
    payload: string | readonly string[];
    options?: QzTrayPrintOptions;
};

export type QzTrayPrintRequest = PrintRequestBase &
    (
        | {
              type: 'escpos' | 'zpl' | 'raw';
              flavor?: 'plain' | 'hex' | 'base64' | 'file';
          }
        | {
              type: 'pdf';
              flavor?: 'file' | 'base64';
              dataOptions?: QzTrayPdfDataOptions;
          }
    );

export type QzTrayPrintType = QzTrayPrintRequest['type'];
