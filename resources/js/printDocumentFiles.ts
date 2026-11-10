/** Download a browser-accessible print source without delegating credentials to QZ Tray. */
export async function downloadPrintFile(
    source: string,
    requestInit?: RequestInit,
): Promise<Uint8Array<ArrayBuffer>> {
    const url = new URL(source, typeof document === 'undefined' ? undefined : document.baseURI);
    if (!['http:', 'https:', 'blob:'].includes(url.protocol)) {
        throw new TypeError('Print document files must use HTTP, HTTPS, or blob URLs.');
    }
    const response = await fetch(url, { credentials: 'same-origin', ...requestInit });
    if (!response.ok) {
        throw new Error(`Could not download the print document payload: HTTP ${response.status}.`);
    }
    return new Uint8Array(await response.arrayBuffer());
}

export function printBytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}
