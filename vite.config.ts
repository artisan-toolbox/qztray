import { resolve } from 'node:path';
import { defineConfig } from 'vite-plus';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        rolldownOptions: {
            output: {
                exports: 'named',
            },
        },
        lib: {
            entry: resolve(import.meta.dirname, 'resources/js/index.ts'),
            formats: ['es', 'cjs', 'iife'],
            name: 'QzTrayConnector',
            fileName: (format) => {
                if (format === 'cjs') {
                    return 'index.cjs';
                }

                return format === 'es' ? 'index.js' : 'qztray.iife.js';
            },
        },
    },
    plugins: [dts({ include: ['resources/js/**/*.ts'] })],
    fmt: {
        ignorePatterns: [
            '.agents/**',
            '.github/**',
            'CHANGELOG.md',
            'README.md',
            'TODO.md',
            'composer.json',
            'config/**',
            'database/**',
            'dist/**',
            'lang/**',
            'pint.json',
            'public/**',
            'resources/boost/**',
            'routes/**',
            'src/**',
            'tests/**/*.php',
            'tests/Fixtures/**',
            'workbench/**',
        ],
        semi: true,
        singleQuote: true,
    },
    lint: {
        ignorePatterns: ['dist/**'],
        options: {
            denyWarnings: true,
            typeAware: true,
        },
    },
    test: {
        include: ['tests/Frontend/**/*.test.ts'],
    },
});
