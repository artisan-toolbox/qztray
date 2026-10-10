import defaultWasmUrl from 'zpl-renderer-js/wasm?url&no-inline';
import type { ZplApi } from 'zpl-renderer-js/external';

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

let rendererRequest: Promise<ZplApi> | null = null;
let rendererWasmUrl: string | null = null;

/** Render every ZPL label locally as PNG data URLs without connecting to QZ Tray. */
export function renderZpl(
    zpl: string,
    options: QzTrayRenderZplOptions & { renderAll: true },
): Promise<string[]>;
/** Render the first ZPL label as a PNG data URL. */
export function renderZpl(
    zpl: string,
    options?: Omit<QzTrayRenderZplOptions, 'renderAll'> & { renderAll?: false },
): Promise<string>;
export function renderZpl(zpl: string, options: QzTrayRenderZplOptions): Promise<string | string[]>;
export async function renderZpl(
    zpl: string,
    options: QzTrayRenderZplOptions = {},
): Promise<string | string[]> {
    if (typeof zpl !== 'string' || zpl.trim() === '') {
        throw new TypeError('Provide a nonempty ZPL string to render.');
    }

    const wasmUrl = options.wasmUrl ?? defaultWasmUrl;

    if (typeof wasmUrl !== 'string' || wasmUrl.trim() === '') {
        throw new TypeError('Provide the ZPL renderer WASM asset URL.');
    }

    if (rendererWasmUrl !== null && rendererWasmUrl !== wasmUrl) {
        throw new Error('The ZPL renderer is already initialized with a different WASM asset URL.');
    }

    const { widthMm = 101.6, heightMm = 203.2, dpmm = 8 } = options;

    for (const [name, value] of Object.entries({ widthMm, heightMm, dpmm })) {
        if (!Number.isFinite(value) || value <= 0) {
            throw new RangeError(`${name} must be a finite positive number.`);
        }
    }

    if (!Number.isInteger(dpmm)) {
        throw new RangeError('dpmm must be a positive integer.');
    }

    const { renderAll = false, grayscaleOutput = false, enableInvertedLabels = false } = options;

    if (
        typeof renderAll !== 'boolean' ||
        typeof grayscaleOutput !== 'boolean' ||
        typeof enableInvertedLabels !== 'boolean'
    ) {
        throw new TypeError('ZPL rendering flags must be boolean values.');
    }

    if (rendererRequest === null) {
        rendererWasmUrl = wasmUrl;
        rendererRequest = import('zpl-renderer-js/external').then(({ init }) => init({ wasmUrl }));
    }
    const renderer = await rendererRequest;
    const renderOptions = { grayscaleOutput, enableInvertedLabels };

    if (renderAll) {
        const images = await renderer.zplToBase64MultipleAsync(
            zpl,
            widthMm,
            heightMm,
            dpmm,
            renderOptions,
        );

        if (images.length === 0 || images.some((image) => image === '')) {
            throw new Error('The ZPL renderer did not produce a PNG image.');
        }

        return images.map((image) => `data:image/png;base64,${image}`);
    }

    const base64 = await renderer.zplToBase64Async(zpl, widthMm, heightMm, dpmm, renderOptions);

    if (base64 === '') {
        throw new Error('The ZPL renderer did not produce a PNG image.');
    }

    return `data:image/png;base64,${base64}`;
}
