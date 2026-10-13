/// <reference types="vite/client" />

// qz-lna 0.1 exposes declarations outside its package exports; reuse its upstream contracts.
declare module 'qz-lna' {
    export const detectLna: typeof import('../../node_modules/qz-lna/dist/index').detectLna;
    export const LnaError: typeof import('../../node_modules/qz-lna/dist/index').LnaError;
}

declare module 'zpl-renderer-js/wasm?url&no-inline' {
    const wasmUrl: string;
    export default wasmUrl;
}
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url&no-inline' {
    const workerUrl: string;
    export default workerUrl;
}
declare module 'pdfjs-dist/build/pdf.worker.mjs' {
    export const WorkerMessageHandler: unknown;
}
declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
    export * from 'pdfjs-dist';
}
declare module 'pdfjs-dist/legacy/build/pdf.worker.mjs' {
    export const WorkerMessageHandler: unknown;
}
