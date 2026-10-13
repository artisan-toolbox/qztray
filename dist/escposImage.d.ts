export type QzTrayEscposImage = {
    type: 'raw';
    format: 'image';
    flavor: 'base64';
    /** Complete PNG or JPEG Base64, optionally prefixed with a data URL. */
    data: string;
    options?: {
        language?: 'ESCPOS';
        dotDensity?: 'single' | 'double' | 'single-legacy' | 'double-legacy' | 32 | 33;
        imageEncoding?: 'esc_asterisk' | 'gs_v_0';
        quantization?: 'luma' | 'alpha' | 'black';
        threshold?: number;
    };
};
/** Validate and snapshot a QZ image before asynchronous decoding begins. */
export declare function prepareEscposImage(value: unknown): QzTrayEscposImage;
/** Convert a QZ image to ESC/POS bytes, preserving the surrounding printer state. */
export declare function encodeEscposImage(image: QzTrayEscposImage): Promise<Uint8Array>;
//# sourceMappingURL=escposImage.d.ts.map