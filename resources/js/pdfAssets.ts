const assets = import.meta.glob<string>(
    [
        '../../node_modules/pdfjs-dist/cmaps/*.bcmap',
        '../../node_modules/pdfjs-dist/standard_fonts/*.{pfb,ttf}',
        '../../node_modules/pdfjs-dist/wasm/*.wasm',
        '../../node_modules/pdfjs-dist/LICENSE',
        '../../node_modules/pdfjs-dist/cmaps/LICENSE',
        '../../node_modules/pdfjs-dist/standard_fonts/LICENSE_*',
        '../../node_modules/pdfjs-dist/wasm/LICENSE_*',
    ],
    { eager: true, query: '?url&no-inline', import: 'default' },
);
const urls = new Map(Object.entries(assets).map(([path, url]) => [path.split('/').at(-1)!, url]));

async function readAsset(filename: string): Promise<Uint8Array> {
    const url = urls.get(filename);
    if (url === undefined) {
        throw new Error(`Missing PDF renderer asset: ${filename}.`);
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load PDF renderer asset ${filename}: HTTP ${response.status}.`);
    }
    return new Uint8Array(await response.arrayBuffer());
}

/** @internal Resolve auxiliary PDF.js assets through the consuming bundler. */
export class PdfCMapReader {
    public async fetch({ name }: { name: string }) {
        return { cMapData: await readAsset(`${name}.bcmap`), compressionType: 1 };
    }
}

export class PdfFontReader {
    public fetch({ filename }: { filename: string }) {
        return readAsset(filename);
    }
}

export class PdfWasmReader {
    public fetch({ filename }: { filename: string }) {
        return readAsset(filename);
    }
}
