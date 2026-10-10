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
export function prepareEscposImage(value: unknown): QzTrayEscposImage {
    if (typeof value !== 'object' || value === null) {
        throw new TypeError('ESC/POS payload parts must be strings, bytes, or Base64 raw images.');
    }
    const image = value as QzTrayEscposImage;
    if (image.type !== 'raw' || image.format !== 'image' || image.flavor !== 'base64') {
        throw new TypeError('ESC/POS previews support only raw Base64 image objects.');
    }
    if (typeof image.data !== 'string' || image.data.trim() === '') {
        throw new TypeError('Provide complete PNG or JPEG Base64 image data.');
    }
    const options = image.options ?? {};
    if (typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('ESC/POS image options must be an object.');
    }
    for (const key of Object.keys(options)) {
        if (
            !['language', 'dotDensity', 'imageEncoding', 'quantization', 'threshold'].includes(key)
        ) {
            throw new TypeError(`Unsupported ESC/POS preview image option: ${key}.`);
        }
    }
    if (options.language !== undefined && options.language !== 'ESCPOS') {
        throw new TypeError('ESC/POS preview images must use language ESCPOS.');
    }
    if (
        options.dotDensity !== undefined &&
        !['single', 'double', 'single-legacy', 'double-legacy', 32, 33].includes(options.dotDensity)
    ) {
        throw new TypeError('Unsupported ESC/POS preview image dot density.');
    }
    if (
        options.imageEncoding !== undefined &&
        !['esc_asterisk', 'gs_v_0'].includes(options.imageEncoding)
    ) {
        throw new TypeError('Unsupported ESC/POS preview image encoding.');
    }
    if (
        options.quantization !== undefined &&
        !['luma', 'alpha', 'black'].includes(options.quantization)
    ) {
        throw new TypeError('Unsupported ESC/POS preview image quantization.');
    }
    const threshold = options.threshold ?? 127;
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 255) {
        throw new RangeError('ESC/POS image threshold must be an integer between zero and 255.');
    }
    return {
        type: 'raw',
        format: 'image',
        flavor: 'base64',
        data: image.data,
        options: { ...options },
    };
}

/** Convert a QZ image to ESC/POS bytes, preserving the surrounding printer state. */
export async function encodeEscposImage(image: QzTrayEscposImage): Promise<Uint8Array> {
    const base64 = image.data.replace(/^data:image\/(?:png|jpeg);base64,/i, '').replace(/\s/g, '');
    let binary: string;
    try {
        binary = atob(base64);
    } catch {
        throw new TypeError('Provide valid PNG or JPEG Base64 image data.');
    }
    const isPng = binary.startsWith('\x89PNG\r\n\x1a\n');
    const isJpeg = binary.startsWith('\xff\xd8\xff');
    if (!isPng && !isJpeg) {
        throw new TypeError('ESC/POS preview images must contain a PNG or JPEG file.');
    }
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
        throw new Error('Base64 ESC/POS image previews require browser image and canvas APIs.');
    }
    const source = new Image();
    await new Promise<void>((resolve, reject) => {
        source.onload = () => resolve();
        source.onerror = () => reject(new Error('Could not decode the ESC/POS preview image.'));
        source.src = `data:image/${isPng ? 'png' : 'jpeg'};base64,${base64}`;
    });
    // QZ pads ESC/POS images with transparent columns to a whole byte width.
    const width = Math.ceil(source.naturalWidth / 8) * 8;
    const height = source.naturalHeight;
    if (width <= 0 || width > 65535 || height <= 0 || height > 65535) {
        throw new RangeError(
            'ESC/POS preview image dimensions must be between one and 65535 pixels.',
        );
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context === null) {
        throw new Error('Could not create the ESC/POS preview image canvas.');
    }
    context.drawImage(source, 0, 0);
    const rgba = context.getImageData(0, 0, width, height).data;
    const pixels = new Uint8Array(width * height);
    const {
        threshold = 127,
        quantization = 'luma',
        dotDensity = 'single',
        imageEncoding = 'esc_asterisk',
    } = image.options ?? {};
    for (let index = 0; index < pixels.length; index++) {
        const offset = index * 4;
        const [r, g, b, a] = rgba.subarray(offset, offset + 4);
        const luma = Math.floor((r * 299 + g * 587 + b * 114) / 1000);
        const black =
            quantization === 'alpha'
                ? a > threshold
                : quantization === 'black'
                  ? a === 255 && r === 0 && g === 0 && b === 0
                  : a >= threshold && luma < threshold;
        pixels[index] = black ? 1 : 0;
    }
    if (imageEncoding === 'gs_v_0') {
        const stride = Math.ceil(width / 8);
        const bytes = new Uint8Array(8 + stride * height);
        bytes.set([29, 118, 48, 0, stride & 255, stride >> 8, height & 255, height >> 8]);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                bytes[8 + y * stride + (x >> 3)] |= pixels[y * width + x] << (7 - (x % 8));
            }
        }
        return bytes;
    }
    const mode =
        dotDensity === 'double' || dotDensity === 'double-legacy' || dotDensity === 33 ? 33 : 32;
    const legacy = dotDensity === 'single-legacy' || dotDensity === 'double-legacy';
    const stripSize = 5 + width * 3 + (legacy ? 1 : 3);
    const bytes = new Uint8Array(Math.ceil(height / 24) * stripSize + (legacy ? 6 : 0));
    let cursor = 0;
    if (legacy) {
        bytes.set([27, 51, 24], cursor);
        cursor += 3;
    }
    for (let top = 0; top < height; top += 24) {
        bytes.set([27, 42, mode, width & 255, width >> 8], cursor);
        cursor += 5;
        for (let x = 0; x < width; x++) {
            for (let part = 0; part < 3; part++) {
                let column = 0;
                for (let bit = 0; bit < 8; bit++) {
                    const y = top + part * 8 + bit;
                    if (y < height) {
                        column |= pixels[y * width + x] << (7 - bit);
                    }
                }
                bytes[cursor++] = column;
            }
        }
        bytes.set(legacy ? [10] : [27, 74, 24], cursor);
        cursor += legacy ? 1 : 3;
    }
    if (legacy) {
        bytes.set([27, 51, 30], cursor);
    }
    return bytes;
}
