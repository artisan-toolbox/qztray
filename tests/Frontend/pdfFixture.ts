/** Two vector-only pages with different dimensions and solid colors. */
export function createPdfFixture(): Uint8Array<ArrayBuffer> {
    const streams = ['1 0 0 rg 0 0 100 200 re f\n', '0 0 1 rg 0 0 80 60 re f\n'];
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 200] /Resources << >> /Contents 4 0 R >>',
        `<< /Length ${streams[0].length} >>\nstream\n${streams[0]}endstream`,
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 80 60] /Resources << >> /Contents 6 0 R >>',
        `<< /Length ${streams[1].length} >>\nstream\n${streams[1]}endstream`,
    ];
    let pdf = '%PDF-1.7\n';
    const offsets = [0];
    for (const [index, object] of objects.entries()) {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    }
    const xref = pdf.length;
    pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return new TextEncoder().encode(pdf);
}
