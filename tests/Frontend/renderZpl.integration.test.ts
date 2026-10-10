import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { renderZpl } from '../../resources/js/renderZpl';

const require = createRequire(import.meta.url);
const wasmUrl = 'https://application.test/assets/zebrash.wasm';

afterEach(() => vi.unstubAllGlobals());

test('renders a real PNG with the shipped WASM engine and reuses it for another preview', async () => {
    const bytes = new Uint8Array(readFileSync(require.resolve('zpl-renderer-js/wasm')));
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(
        async () =>
            new Response(bytes, {
                headers: { 'Content-Type': 'application/wasm' },
            }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const image = await renderZpl('^XA^FO10,10^A0N,24,24^FDHello^FS^XZ', {
        wasmUrl,
        widthMm: 50,
        heightMm: 30,
        dpmm: 8,
    });
    const png = Buffer.from(image.slice('data:image/png;base64,'.length), 'base64');
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(400);
    expect(png.readUInt32BE(20)).toBe(240);

    const second = await renderZpl('^XA^FO10,10^A0N,24,24^FDAnother label^FS^XZ', {
        wasmUrl,
        widthMm: 40,
        heightMm: 20,
        dpmm: 12,
        grayscaleOutput: true,
    });
    const secondPng = Buffer.from(second.slice('data:image/png;base64,'.length), 'base64');
    expect(secondPng.readUInt32BE(16)).toBe(480);
    expect(secondPng.readUInt32BE(20)).toBe(240);
    expect(second).not.toBe(image);
    const zpl = '^XA^FO10,10^A0N,24,24^FDHello^FS^XZ^XA^FO10,10^A0N,24,24^FDSecond^FS^XZ';
    const labels = await renderZpl(zpl, {
        wasmUrl,
        widthMm: 50,
        heightMm: 30,
        dpmm: 8,
        renderAll: true,
    });
    expect(labels).toHaveLength(2);
    expect(labels[0]).toBe(image);
    expect(labels[1]).not.toBe(image);
    for (const label of labels) {
        const bytes = Buffer.from(label.slice('data:image/png;base64,'.length), 'base64');
        expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
        expect(bytes.readUInt32BE(16)).toBe(400);
        expect(bytes.readUInt32BE(20)).toBe(240);
    }
    expect(await renderZpl(zpl, { wasmUrl, widthMm: 50, heightMm: 30, dpmm: 8 })).toBe(image);
    await expect(renderZpl('not ZPL', { wasmUrl, renderAll: true })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(wasmUrl);
}, 20000);
