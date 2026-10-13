/** @internal Infer one transport encoding from standard ZPL character-table commands. */
export function detectZplEncoding(payload: readonly string[]): string {
    const zpl = payload.join('');
    const encodings: Record<number, string> = {
        27: 'windows-1252',
        28: 'UTF-8',
        31: 'windows-1250',
        33: 'windows-1251',
        34: 'windows-1253',
        35: 'windows-1254',
        36: 'windows-1255',
    };
    const detected = new Set<string>();

    // Skip field values and comments so printed text is never treated as configuration.
    const commands = /\^(?:FD|FV|FX)[\s\S]*?(?:\^FS|$)|\^CI\s*(\d+)(?=[,\s^~]|$)|[\^~]CC/g;
    for (const match of zpl.matchAll(commands)) {
        // Changed command prefixes require a complete ZPL parser rather than this detector.
        if (match[0] === '^CC' || match[0] === '~CC') {
            return 'UTF-8';
        }
        if (match[1] === undefined) {
            continue;
        }
        const code = Number(match[1]);
        const encoding = code <= 13 ? 'CP850' : encodings[code];
        if (encoding === undefined) {
            return 'UTF-8';
        }
        detected.add(encoding);
    }
    return detected.size === 1 ? [...detected][0] : 'UTF-8';
}
