import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const required = [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/qztray.iife.js',
    'dist/zebrash.wasm',
    'dist/pdf.worker.min.mjs',
];
execFileSync('git', ['ls-files', '--error-unmatch', ...required], { cwd, stdio: 'pipe' });
const changed = execFileSync('git', ['diff', '--name-only', '--', 'dist'], {
    cwd,
    encoding: 'utf8',
});
const untracked = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '--', 'dist'],
    { cwd, encoding: 'utf8' },
);
if (changed.trim() || untracked.trim()) {
    throw new Error(
        'The tracked frontend distribution is outdated. Run npm run release:build and include all dist files in the release commit.',
    );
}
console.log('The tracked frontend distribution matches the build.');
