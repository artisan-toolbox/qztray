import { expect, test } from 'vite-plus/test';
import { renderPrintRequest } from '../../resources/js/renderPrintRequest';

test('renders backend-compatible ESC/POS bytes as every real local PNG receipt', async () => {
    const bytes = Buffer.from('\x1b@Hello\n\x1dV\x00Second\n\x1dV\x00', 'binary');
    const images = await renderPrintRequest(
        { type: 'escpos', flavor: 'base64', payload: bytes.toString('base64') },
        { escpos: { widthDots: 576 } },
    );
    expect(images).toHaveLength(2);
    for (const image of images) {
        expect(image).toMatch(/^data:image\/png;base64,/);
        const png = Buffer.from(image.split(',')[1], 'base64');
        expect(png.readUInt32BE(16)).toBe(576);
        expect(png.readUInt32BE(20)).toBeGreaterThan(0);
    }
});
