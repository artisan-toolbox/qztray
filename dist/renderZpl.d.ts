export type QzTrayRenderZplOptions = {
    /** Render every label instead of only the first. Defaults to false. */
    renderAll?: boolean;
    /** WASM asset URL resolved by the consuming application's bundler. */
    wasmUrl?: string;
    /** Label width in millimeters. Defaults to 101.6. */
    widthMm?: number;
    /** Label height in millimeters. Defaults to 203.2. */
    heightMm?: number;
    /** Dots per millimeter. Defaults to 8 (approximately 203 DPI). */
    dpmm?: number;
    /** Preserve anti-aliasing in an 8-bit grayscale PNG. Defaults to false. */
    grayscaleOutput?: boolean;
    /** Honor inverted orientation requested by ^POI. Defaults to false. */
    enableInvertedLabels?: boolean;
};
/** Render every ZPL label locally as PNG data URLs without connecting to QZ Tray. */
export declare function renderZpl(zpl: string, options: QzTrayRenderZplOptions & {
    renderAll: true;
}): Promise<string[]>;
/** Render the first ZPL label as a PNG data URL. */
export declare function renderZpl(zpl: string, options?: Omit<QzTrayRenderZplOptions, 'renderAll'> & {
    renderAll?: false;
}): Promise<string>;
export declare function renderZpl(zpl: string, options: QzTrayRenderZplOptions): Promise<string | string[]>;
//# sourceMappingURL=renderZpl.d.ts.map