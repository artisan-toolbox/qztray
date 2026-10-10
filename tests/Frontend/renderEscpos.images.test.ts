import { inflateSync } from 'node:zlib';
import { toPng } from '@point-of-sale/receipt-printer-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { renderEscpos } from '../../resources/js/renderEscpos';
import type { QzTrayEscposImage } from '../../resources/js/escposImage';

let image: QzTrayEscposImage;
let failDecode = false;
let noContext = false;
let imageWidth = 8;
let imageHeight = 2;
let rgba: Uint8ClampedArray;
const drawImage = vi.fn();

beforeEach(async () => {
    failDecode = false;
    noContext = false;
    imageWidth = 8;
    imageHeight = 2;
    rgba = new Uint8ClampedArray(8 * 2 * 4).fill(255);
    rgba.set([0, 0, 0, 255], 0);
    rgba.set([0, 0, 0, 255], 8 * 4 + 7 * 4);
    drawImage.mockClear();
    const png = await toPng({ width: 8, height: 2, data: new Uint8Array([128, 1]) });
    image = {
        type: 'raw',
        format: 'image',
        flavor: 'base64',
        data: Buffer.from(png).toString('base64'),
        options: { language: 'ESCPOS', dotDensity: 'double' },
    };
    // Only the browser decoding boundary is stubbed; ESC/POS parsing and PNG export are real.
    vi.stubGlobal(
        'Image',
        class {
            naturalWidth = imageWidth;
            naturalHeight = imageHeight;
            onload = () => {};
            onerror = () => {};
            set src(value: string) {
                expect(value).toMatch(/^data:image\/(png|jpeg);base64,/);
                queueMicrotask(() => (failDecode ? this.onerror() : this.onload()));
            }
        },
    );
    vi.stubGlobal('document', {
        createElement: (tag: string) => {
            expect(tag).toBe('canvas');
            return {
                width: 0,
                height: 0,
                getContext: () =>
                    noContext
                        ? null
                        : {
                              drawImage,
                              getImageData: () => ({ data: rgba }),
                          },
            };
        },
    });
});
afterEach(() => vi.unstubAllGlobals());

function bitmap(image: string) {
    const png = Buffer.from(image.split(',')[1], 'base64');
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    const compressed: Buffer[] = [];
    for (let offset = 8; offset < png.length;) {
        const size = png.readUInt32BE(offset);
        if (png.toString('ascii', offset + 4, offset + 8) === 'IDAT') {
            compressed.push(png.subarray(offset + 8, offset + 8 + size));
        }
        offset += size + 12;
    }
    const rows = inflateSync(Buffer.concat(compressed));
    const stride = Math.ceil(width / 8) + 1;
    return {
        width,
        height,
        black: (x: number, y: number) => (rows[y * stride + 1 + (x >> 3)] & (128 >> (x % 8))) === 0,
    };
}

test('renders a Base64 image inline with text and honors the preceding center alignment', async () => {
    const centered = bitmap(await renderEscpos(['\x1b@\x1ba\x01', image, '\nAfter image\n\x1bi']));
    const left = bitmap(await renderEscpos(['\x1b@', image, '\nAfter image\n\x1bi']));
    expect(centered.width).toBe(384);
    expect(centered.black(188, 0)).toBe(true);
    expect(centered.black(195, 1)).toBe(true);
    expect(centered.black(0, 0)).toBe(false);
    expect(left.black(0, 0)).toBe(true);
    expect(left.black(7, 1)).toBe(true);
    expect(centered.height).toBeGreaterThan(24);
    expect(drawImage).toHaveBeenCalledTimes(2);
});

test('keeps image bytes out of CP850 conversion and separates legacy cuts in order', async () => {
    const parts = ['\x1b@\x1bt\x02', image, '\nCafé ╔══╗\n\x1bi', 'Second\n\x1bm'] as const;
    const before = JSON.stringify(parts);
    const all = await renderEscpos(parts, { renderAll: true });
    expect(all).toHaveLength(2);
    expect(all[0]).toBe(await renderEscpos(parts));
    expect(all[1]).toBe(await renderEscpos('Second\n\x1bm'));
    expect(JSON.stringify(parts)).toBe(before);
    expect(bitmap(all[0]).black(0, 0)).toBe(true);
});

test('accepts data URLs, raw byte parts, and raster image encoding', async () => {
    image.data = `data:image/png;base64,${image.data}`;
    image.options = { language: 'ESCPOS', imageEncoding: 'gs_v_0' };
    const result = bitmap(await renderEscpos([new Uint8Array([27, 64]), image, '\n']));
    expect(result.black(0, 0)).toBe(true);
    expect(result.black(7, 1)).toBe(true);
});

test.each(['single', 'single-legacy', 'double-legacy', 32, 33] as const)(
    'supports QZ image density %s',
    async (dotDensity) => {
        image.options = { dotDensity };
        const result = bitmap(await renderEscpos([image, '\n']));
        expect(result.black(0, 0)).toBe(true);
    },
);

test.each([
    { flavor: 'file' },
    { format: 'pdf' },
    { type: 'pixel' },
    { data: '' },
    { data: 'not Base64!' },
    { data: btoa('not an image') },
    { options: { language: 'ZPL' } },
    { options: { dotDensity: 'triple' } },
    { options: { quantization: 'dither' } },
    { options: { imageEncoding: 'gs_l' } },
    { options: { x: 10 } },
    { options: { threshold: 256 } },
    { options: [] },
])('rejects unsupported or invalid image input %j', async (override) => {
    await expect(renderEscpos([{ ...image, ...override } as QzTrayEscposImage])).rejects.toThrow();
});

test('reports image decoding and canvas failures and permits the next valid render', async () => {
    failDecode = true;
    await expect(renderEscpos([image])).rejects.toThrow('Could not decode');
    failDecode = false;
    noContext = true;
    await expect(renderEscpos([image])).rejects.toThrow('Could not create');
    noContext = false;
    imageWidth = 0;
    await expect(renderEscpos([image])).rejects.toThrow(RangeError);
    imageWidth = 8;
    expect(bitmap(await renderEscpos([image, '\n'])).black(0, 0)).toBe(true);
});

test('reports the required browser APIs for embedded image conversion', async () => {
    vi.stubGlobal('Image', undefined);
    await expect(renderEscpos([image])).rejects.toThrow('require browser image and canvas APIs');
});

test('preserves pixels in a second 24-dot strip and pads odd image widths like QZ', async () => {
    imageWidth = 7;
    imageHeight = 25;
    rgba = new Uint8ClampedArray(8 * 25 * 4).fill(255);
    rgba.set([0, 0, 0, 255], (24 * 8 + 6) * 4);
    const result = bitmap(await renderEscpos(['\x1ba\x01', image, '\n']));
    expect(result.height).toBeGreaterThanOrEqual(48);
    expect(result.black(194, 24)).toBe(true);
    expect(result.black(188, 24)).toBe(false);
});

test('uses QZ luma, alpha, black, and threshold rules for transparent and gray pixels', async () => {
    rgba.set([0, 0, 0, 0], 0);
    rgba.set([100, 100, 100, 255], 4);
    const luma = bitmap(await renderEscpos([image, '\n']));
    expect(luma.black(0, 0)).toBe(false);
    expect(luma.black(1, 0)).toBe(true);
    image.options = { dotDensity: 'double', threshold: 50 };
    expect(bitmap(await renderEscpos([image, '\n'])).black(1, 0)).toBe(false);
    image.options = { dotDensity: 'double', quantization: 'black' };
    expect(bitmap(await renderEscpos([image, '\n'])).black(1, 0)).toBe(false);
    image.options = { dotDensity: 'double', quantization: 'alpha' };
    const alpha = bitmap(await renderEscpos([image, '\n']));
    expect(alpha.black(0, 0)).toBe(false);
    expect(alpha.black(1, 0)).toBe(true);
    expect(alpha.black(2, 0)).toBe(true);
});

test('snapshots mixed input before image decoding yields', async () => {
    const bytes = new Uint8Array([27, 97, 1]);
    const preview = renderEscpos([bytes, image, '\n']);
    bytes[2] = 0;
    image.data = 'invalid';
    image.options!.dotDensity = 'single';
    const result = bitmap(await preview);
    expect(result.black(188, 0)).toBe(true);
    expect(result.black(0, 0)).toBe(false);
});
