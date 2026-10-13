import { execFileSync } from 'node:child_process';
import {
    cpSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    readdirSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { build, isFileServingAllowed, resolveConfig, searchForWorkspaceRoot } from 'vite-plus';
import { expect, test } from 'vite-plus/test';

const packageRoot = resolve(import.meta.dirname, '../..');

// Real library and consumer builds include PDF assets and declaration generation on shared CI runners.
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
        const delivery = resolve(directory, 'composer-package');
        mkdirSync(delivery);
        for (const file of ['.gitignore', '.gitattributes', 'composer.json', 'package.json']) {
            cpSync(resolve(packageRoot, file), resolve(delivery, file));
        }
        cpSync(resolve(directory, 'library'), resolve(delivery, 'dist'), { recursive: true });
        mkdirSync(resolve(delivery, 'tests'));
        writeFileSync(resolve(delivery, 'tests/excluded.txt'), 'Not distributed');
        execFileSync('git', ['init', '--quiet'], { cwd: delivery });
        execFileSync('git', ['add', '.'], { cwd: delivery });
        const tree = execFileSync('git', ['write-tree'], {
            cwd: delivery,
            encoding: 'utf8',
        }).trim();
        const archive = execFileSync('git', ['archive', '--format=tar', tree], {
            cwd: delivery,
            maxBuffer: 32 * 1024 * 1024,
        });
        const entries = new Map<string, Buffer>();
        for (let offset = 0; offset < archive.length && archive[offset] !== 0;) {
            const name = archive.toString('utf8', offset, offset + 100).split('\0')[0];
            const size =
                Number.parseInt(archive.toString('ascii', offset + 124, offset + 136), 8) || 0;
            entries.set(name, archive.subarray(offset + 512, offset + 512 + size));
            offset += 512 + Math.ceil(size / 512) * 512;
        }
        for (const name of libraryFiles) {
            expect(entries.has(`dist/${name}`)).toBe(true);
        }
        expect(entries.get('dist/zebrash.wasm')).toEqual(libraryWasm);
        expect(entries.has('composer.json')).toBe(true);
        expect(entries.has('package.json')).toBe(true);
        expect(entries.has('tests/excluded.txt')).toBe(false);
        expect(
            JSON.parse(entries.get('package.json')!.toString()) as { private: boolean },
        ).toMatchObject({ private: true });
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
        const vendorPackage = resolve(directory, 'vendor/artisan-toolbox/qztray');
        for (const [name, content] of entries) {
            if (name.endsWith('/')) continue;
            const target = resolve(vendorPackage, name);
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, content);
        }
        const scope = resolve(directory, 'node_modules/@artisan-toolbox');
        mkdirSync(scope, { recursive: true });
        symlinkSync(vendorPackage, resolve(scope, 'qztray'), 'junction');
        writeFileSync(
            resolve(directory, 'package.json'),
            JSON.stringify({
                private: true,
                type: 'module',
                dependencies: { '@artisan-toolbox/qztray': 'file:vendor/artisan-toolbox/qztray' },
            }),
        );
        const vendorServer = await resolveConfig(
            { root: directory, configFile: false, logLevel: 'silent' },
            'serve',
        );
        expect(
            isFileServingAllowed(vendorServer, resolve(vendorPackage, 'dist/zebrash.wasm')),
        ).toBe(true);
        writeFileSync(
            resolve(directory, 'main.js'),
            "import { renderZpl, renderEscpos, renderPdf } from '@artisan-toolbox/qztray'; globalThis.renderLabel = renderZpl; globalThis.renderReceipt = renderEscpos; globalThis.renderDocument = renderPdf;\n",
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
}, 120000);
