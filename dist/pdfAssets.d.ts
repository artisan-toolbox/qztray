/** @internal Resolve auxiliary PDF.js assets through the consuming bundler. */
export declare class PdfCMapReader {
    fetch({ name }: {
        name: string;
    }): Promise<{
        cMapData: Uint8Array<ArrayBufferLike>;
        compressionType: number;
    }>;
}
export declare class PdfFontReader {
    fetch({ filename }: {
        filename: string;
    }): Promise<Uint8Array<ArrayBufferLike>>;
}
export declare class PdfWasmReader {
    fetch({ filename }: {
        filename: string;
    }): Promise<Uint8Array<ArrayBufferLike>>;
}
//# sourceMappingURL=pdfAssets.d.ts.map