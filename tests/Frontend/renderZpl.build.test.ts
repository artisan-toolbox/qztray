import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { build, isFileServingAllowed, resolveConfig, searchForWorkspaceRoot } from 'vite-plus';
import { expect, test } from 'vite-plus/test';

const packageRoot = resolve(import.meta.dirname, '../..');

test('keeps WASM external and lets a consuming Vite application emit it without configuration', async () => {
    const directory = mkdtempSync(resolve(tmpdir(), 'qztray-render-build-'));

    try {
        await build({
            root: packageRoot,
            configFile: resolve(packageRoot, 'vite.config.ts'),
            logLevel: 'silent',
            build: {
                outDir: resolve(directory, 'library'),
                lib: { formats: ['es'] },
            },
        });

        const libraryWasm = readFileSync(resolve(directory, 'library/zebrash.wasm'));
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
            "import { renderZpl, renderEscpos } from './library/index.js'; globalThis.renderLabel = renderZpl; globalThis.renderReceipt = renderEscpos;\n",
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
        const wasmFile = files.find((name) => name.endsWith('.wasm'));
        expect(wasmFile).toBeDefined();
        expect(readFileSync(resolve(assetsDirectory, wasmFile!))).toEqual(libraryWasm);
        const javascript = files
            .filter((name) => name.endsWith('.js'))
            .map((name) => readFileSync(resolve(assetsDirectory, name), 'utf8'))
            .join('\n');
        expect(javascript).toContain(`/nested/application/assets/${wasmFile}`);
        expect(javascript).not.toContain('data:application/wasm;base64,');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
}, 30000);
