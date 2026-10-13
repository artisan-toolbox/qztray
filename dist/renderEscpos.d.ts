import { QzTrayEscposImage } from './escposImage';
export type QzTrayEscposEncoding = 'CP850' | 'CP437' | 'ISO-8859-1' | 'Windows-1252';
export type QzTrayRenderEscposOptions = {
    /** Printable width in dots, a positive multiple of eight. Defaults to 384. */
    widthDots?: number;
    /** Encoding applied to string payloads only. Defaults to CP850. */
    encoding?: QzTrayEscposEncoding;
    /** Printer-specific mapping for ESC t commands. Defaults to epson. */
    codepageMapping?: string;
    /** Return every nonempty receipt separated by full or partial cuts. Defaults to false. */
    renderAll?: boolean;
};
export type QzTrayEscposPayload = string | Uint8Array | readonly (string | Uint8Array | QzTrayEscposImage)[];
/** Render the first ESC/POS receipt locally as a PNG data URL without connecting to QZ Tray. */
export declare function renderEscpos(payload: QzTrayEscposPayload, options?: Omit<QzTrayRenderEscposOptions, 'renderAll'> & {
    renderAll?: false;
}): Promise<string>;
export declare function renderEscpos(payload: QzTrayEscposPayload, options: QzTrayRenderEscposOptions & {
    renderAll: true;
}): Promise<string[]>;
export declare function renderEscpos(payload: QzTrayEscposPayload, options: QzTrayRenderEscposOptions): Promise<string | string[]>;
//# sourceMappingURL=renderEscpos.d.ts.map