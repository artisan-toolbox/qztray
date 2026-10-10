import { expect, expectTypeOf, test } from 'vite-plus/test';
import { renderEscpos } from '../../resources/js/renderEscpos';
import type { QzTrayRenderEscposOptions } from '../../resources/js/renderEscpos';

const prefix = '\x1b@\x1bt\x02';
const cut = '\x1dV\x00';

function decodePng(image: string) {
    expect(image).toMatch(/^data:image\/png;base64,/);
    const bytes = Buffer.from(image.split(',')[1], 'base64');
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    return bytes;
}

test('renders real ESC/POS commands to a PNG with the default printable width', async () => {
    const image = await renderEscpos(`${prefix}\x1bE\x01Hello\x1bE\x00\n${cut}`);
    const png = decodePng(image);
    expect(png.readUInt32BE(16)).toBe(384);
    expect(png.readUInt32BE(20)).toBeGreaterThan(0);
    expect(image).not.toBe(await renderEscpos(`${prefix}Hello\n${cut}`));
});

test('encodes Unicode text as CP850 and preserves preencoded binary input', async () => {
    const bytes = new Uint8Array([27, 64, 27, 116, 2, 67, 97, 102, 130, 32, 198, 10]);
    const original = bytes.slice();
    const fromText = await renderEscpos(`${prefix}Café ã\n`);
    expect(await renderEscpos(bytes)).toBe(fromText);
    expect(await renderEscpos(bytes, { encoding: 'CP437' })).toBe(fromText);
    expect(bytes).toEqual(original);
    expect(await renderEscpos(`${prefix}Café ã\n`, { encoding: 'CP437' })).not.toBe(fromText);
});

test('accepts string parts without inserting separators or changing control bytes', async () => {
    const parts = [prefix, 'Café\n', cut];
    expect(await renderEscpos(parts)).toBe(await renderEscpos(parts.join('')));
    expect(parts).toEqual([prefix, 'Café\n', cut]);
});

test('returns the first receipt by default and all receipts in cut order when requested', async () => {
    const first = `${prefix}First\n${cut}`;
    const second = `${prefix}Second\n\x1dV\x01`;
    const third = `${prefix}Third\n`;
    const all = await renderEscpos(first + second + third, { renderAll: true });
    expect(all).toEqual([
        await renderEscpos(first),
        await renderEscpos(second),
        await renderEscpos(third),
    ]);
    expect(await renderEscpos(first + second + third)).toBe(all[0]);
    expect(await renderEscpos(first, { renderAll: true })).toEqual([all[0]]);
    expect(await renderEscpos(cut + cut + first + cut, { renderAll: true })).toEqual([all[0]]);
});

test('isolates printer state and dimensions between concurrent calls', async () => {
    const [wide, narrow] = await Promise.all([
        renderEscpos('\x1bE\x01Hello\n', { widthDots: 576 }),
        renderEscpos('Hello\n'),
    ]);
    expect(decodePng(wide).readUInt32BE(16)).toBe(576);
    expect(decodePng(narrow).readUInt32BE(16)).toBe(384);
    expect(await renderEscpos('Hello\n')).toBe(narrow);
});

test('supports encoding overrides and printer-specific character table mappings', async () => {
    expect(
        await renderEscpos('\x1bt\x06Café\n', {
            encoding: 'ISO-8859-1',
            codepageMapping: 'xprinter',
        }),
    ).toBe(
        await renderEscpos(new Uint8Array([27, 116, 6, 67, 97, 102, 233, 10]), {
            codepageMapping: 'xprinter',
        }),
    );
    decodePng(await renderEscpos('Hello\n', { encoding: 'Windows-1252' }));
});

test.each([0, -8, 7, 385, 384.5, NaN, Infinity])('rejects invalid width %s', async (widthDots) => {
    await expect(renderEscpos('Hello\n', { widthDots })).rejects.toThrow(RangeError);
});

const sparseParts: string[] = [];
sparseParts.length = 1;
test.each(['', [], new Uint8Array(), 42, [undefined], sparseParts])(
    'rejects invalid payload %s',
    async (payload) => {
        await expect(renderEscpos(payload as string)).rejects.toThrow(TypeError);
    },
);

test('rejects invalid options and propagates renderer failures without poisoning later calls', async () => {
    await expect(
        renderEscpos('Hello\n', { renderAll: 1 } as unknown as QzTrayRenderEscposOptions),
    ).rejects.toThrow(TypeError);
    await expect(
        renderEscpos('Hello\n', { encoding: 'UTF-8' } as unknown as QzTrayRenderEscposOptions),
    ).rejects.toThrow(TypeError);
    await expect(renderEscpos('Hello\n', { codepageMapping: '' })).rejects.toThrow(TypeError);
    await expect(renderEscpos('Hello\n', { codepageMapping: 'invalid' })).rejects.toThrow(
        'Unknown codepage mapping',
    );
    await expect(renderEscpos('\x1b@')).rejects.toThrow('did not produce');
    await expect(renderEscpos('Unflushed text')).rejects.toThrow('did not produce');
    decodePng(await renderEscpos('Hello\n'));
});

test('infers single, multiple, and dynamic renderAll result types', () => {
    expectTypeOf(renderEscpos).toBeFunction();
    // Type assertions are kept in an uncalled function to avoid initiating rendering.
    const contracts = (renderAll: boolean) => {
        expectTypeOf(renderEscpos('Hello\n')).toEqualTypeOf<Promise<string>>();
        expectTypeOf(renderEscpos('Hello\n', { renderAll: false })).toEqualTypeOf<
            Promise<string>
        >();
        expectTypeOf(renderEscpos('Hello\n', { renderAll: true })).toEqualTypeOf<
            Promise<string[]>
        >();
        expectTypeOf(renderEscpos('Hello\n', { renderAll })).toEqualTypeOf<
            Promise<string | string[]>
        >();
    };
    expectTypeOf(contracts).toBeFunction();
});
