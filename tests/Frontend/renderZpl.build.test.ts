import { execFileSync } from 'node:child_process';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build, isFileServingAllowed, resolveConfig, searchForWorkspaceRoot } from 'vite-plus';
import { expect, test } from 'vite-plus/test';

const packageRoot = resolve(import.meta.dirname, '../..');

test('keeps WASM external and lets a consuming Vite application emit it without configuration', async () => {
    // Vite rejects Windows 8.3 aliases, even when their directory is explicitly allowed.
    const directory = realpathSync.native(mkdtempSync(resolve(tmpdir(), 'qztray-render-build-')));

    try {
        expect(directory).toBe(realpathSync.native(directory));
        if (process.platform === 'win32') {
            expect(
                directory
                    .split(/[\\/]/)
                    .some((part) => /^[^~.]{1,6}~\d+(?:\.[^~.]{0,3})?$/.test(part)),
            ).toBe(false);
        }
        await build({
            root: packageRoot,
            configFile: resolve(packageRoot, 'vite.config.ts'),
            logLevel: 'silent',
            build: {
                outDir: resolve(directory, 'library'),
                lib: { formats: ['es', 'cjs'] },
            },
        });

        const libraryWasm = readFileSync(resolve(directory, 'library/zebrash.wasm'));
        writeFileSync(resolve(directory, 'library/package.json'), '{"type":"module"}');
        for (const entry of ['index.js', 'index.cjs']) {
            execFileSync(
                process.execPath,
                [
                    resolve(packageRoot, 'tests/Fixtures/lna-browser.mjs'),
                    resolve(directory, 'library', entry),
                ],
                { timeout: 10000 },
            );
        }
        const libraryFiles = readdirSync(resolve(directory, 'library'));
        expect(libraryFiles.some((name) => name.endsWith('.'))).toBe(false);
        expect(
            libraryFiles.some((name) => name.startsWith('LICENSE') && name.endsWith('.txt')),
        ).toBe(true);
        expect(libraryWasm.subarray(0, 4).toString('hex')).toBe('0061736d');
        const developmentRoot = resolve(directory, 'development-application');
        mkdirSync(developmentRoot);
        writeFileSync(
            resolve(developmentRoot, 'package.json'),
            '{"name":"qztray-dev-test","private":true}',
        );
        const wasmPath = resolve(directory, 'library/zebrash.wasm');
        const restricted = await resolveConfig(
            {
                configFile: false,
                root: developmentRoot,
                logLevel: 'silent',
                server: { fs: { allow: [developmentRoot] } },
            },
            'serve',
        );
        expect(isFileServingAllowed(restricted, wasmPath)).toBe(false);
        const permitted = await resolveConfig(
            {
                configFile: false,
                root: developmentRoot,
                logLevel: 'silent',
                server: {
                    fs: {
                        allow: [
                            searchForWorkspaceRoot(developmentRoot),
                            resolve(directory, 'library'),
                        ],
                    },
                },
            },
            'serve',
        );
        expect(isFileServingAllowed(permitted, wasmPath)).toBe(true);
        expect(isFileServingAllowed(permitted, resolve(directory, 'unrelated/private.txt'))).toBe(
            false,
        );

        expect(readFileSync(resolve(directory, 'library/index.js'), 'utf8')).toContain(
            'new URL("zebrash.wasm", import.meta.url)',
        );
        writeFileSync(
            resolve(directory, 'main.js'),
            "import { renderZpl, renderEscpos, renderPdf } from './library/index.js'; globalThis.renderLabel = renderZpl; globalThis.renderReceipt = renderEscpos; globalThis.renderDocument = renderPdf;\n",
        );
        writeFileSync(
            resolve(directory, 'index.html'),
            '<script type="module" src="/main.js"></script>',
        );

        await build({
            root: directory,
            configFile: false,
            base: '/nested/application/',
            logLevel: 'silent',
            build: { outDir: 'application' },
        });

        const assetsDirectory = resolve(directory, 'application/assets');
        const files = readdirSync(assetsDirectory);
        const wasmFile = files.find(
            (name) => name.startsWith('zebrash-') && name.endsWith('.wasm'),
        );
        const workerFile = files.find(
            (name) => name.startsWith('pdf.worker.min-') && name.endsWith('.mjs'),
        );
        expect(workerFile).toBeDefined();
        expect(readFileSync(resolve(assetsDirectory, workerFile!))).toEqual(
            readFileSync(resolve(directory, 'library/pdf.worker.min.mjs')),
        );
        expect(files.some((name) => name.endsWith('.bcmap'))).toBe(true);
        expect(files.some((name) => name.endsWith('.pfb'))).toBe(true);
        expect(files.some((name) => name.endsWith('.ttf'))).toBe(true);
        expect(wasmFile).toBeDefined();
        expect(readFileSync(resolve(assetsDirectory, wasmFile!))).toEqual(libraryWasm);
        const javascript = files
            .filter((name) => name.endsWith('.js'))
            .map((name) => readFileSync(resolve(assetsDirectory, name), 'utf8'))
            .join('\n');
        expect(javascript).toContain(`/nested/application/assets/${wasmFile}`);
        expect(javascript).toContain(`/nested/application/assets/${workerFile}`);
        expect(javascript).not.toContain('data:application/wasm;base64,');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}, 30000);
