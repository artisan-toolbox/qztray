export type QzTrayPdfContent = string | Uint8Array | ArrayBuffer | Blob;
export type QzTrayPdfSource = string | URL | Uint8Array | ArrayBuffer | Blob | {
    data: QzTrayPdfContent;
} | {
    url: string | URL;
};
export type QzTrayRenderPdfOptions = {
    /** Render every page instead of only the selected page. Defaults to false. */
    renderAll?: boolean;
    /** One-based page number. Defaults to 1; cannot be combined with renderAll. */
    pageNumber?: number;
    /** Scale relative to PDF points at 72 DPI. Defaults to 1.5. */
    scale?: number;
    /** Override the document's page rotation with 0, 90, 180, or 270 degrees. */
    rotation?: 0 | 90 | 180 | 270;
    /** Password for encrypted documents. */
    password?: string;
    /** Fetch options for URL sources; defaults to same-origin credentials. */
    requestInit?: RequestInit;
};
export declare function renderPdf(source: QzTrayPdfSource, options: QzTrayRenderPdfOptions & {
    renderAll: true;
}): Promise<string[]>;
export declare function renderPdf(source: QzTrayPdfSource, options?: Omit<QzTrayRenderPdfOptions, 'renderAll'> & {
    renderAll?: false;
}): Promise<string>;
export declare function renderPdf(source: QzTrayPdfSource, options: QzTrayRenderPdfOptions): Promise<string | string[]>;
//# sourceMappingURL=renderPdf.d.ts.map