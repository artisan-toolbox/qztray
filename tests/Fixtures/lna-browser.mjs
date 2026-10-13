import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const warnings = [];
console.warn = (...args) => warnings.push(args);
console.log = () => {};
let blocked = false;
let attempts = 0;

class Socket extends EventTarget {
    static OPEN = 1;
    static CLOSED = 3;
    readyState = 1;

    constructor() {
        super();
        attempts++;
        queueMicrotask(() => this.dispatchEvent(new Event(blocked ? 'error' : 'open')));
    }

    send(data) {
        const request = JSON.parse(data);
        if (request.uid !== undefined) {
            queueMicrotask(() => this.onmessage?.({
                data: JSON.stringify({
                    uid: request.uid,
                    result: request.call === 'getVersion' ? '2.3.0' : null,
                }),
            }));
        }
    }

    close() {
        clearInterval(this.interval);
        this.readyState = Socket.CLOSED;
        queueMicrotask(() => this.onclose?.({ code: 1000, reason: '' }));
    }
}

globalThis.self = globalThis;
globalThis.window = { location: new URL('https://application.test') };
globalThis.WebSocket = Socket;
Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
        userAgent: 'Mozilla/5.0 Chrome/147.0.0.0 Safari/537.36',
        permissions: { query: async () => ({ state: 'denied' }) },
    },
});
globalThis.window.navigator = globalThis.navigator;
globalThis.document = { cookie: 'XSRF-TOKEN=token', baseURI: 'https://application.test/' };
globalThis.Ziggy = {
    url: 'https://application.test',
    port: null,
    defaults: {},
    routes: {
        'qztray_connector.get_public_key': { uri: 'certificate', methods: ['GET'] },
    },
};
globalThis.fetch = async () => new Response(
    '-----BEGIN CERTIFICATE-----\nexample\n-----END CERTIFICATE-----',
);

const { qztray } = await import(pathToFileURL(process.argv[2]).href);
assert.equal(globalThis.lna, undefined, 'Importing must not register browser globals');
await qztray.connect();
assert.equal(qztray.isConnected(), true);
assert.equal(typeof globalThis.lna.detectLna, 'function');
await qztray.disconnect();
blocked = true;
await assert.rejects(qztray.connect(), {
    message: 'Connection attempt denied by Local Network Access restrictions',
    denied: true,
});
assert.equal(attempts, 2, 'Denied permission must stop connection retries');
assert.equal(warnings.some(args => String(args[0]).includes('Unable to load LNA library')), false);
