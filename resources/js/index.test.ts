import { expect, test } from 'vite-plus/test';
import qztray, { QzTrayConnector, qztray as namedInstance } from './index';

test('exports a connector instance', () => {
    expect(qztray).toBeInstanceOf(QzTrayConnector);
});

test('shares the same instance through default, named, and class access', () => {
    expect(namedInstance).toBe(qztray);
    expect(QzTrayConnector.getInstance()).toBe(qztray);
    expect(QzTrayConnector.getInstance()).toBe(QzTrayConnector.getInstance());
});

test('shares the same instance across repeated module imports', async () => {
    const first = await import('./index');
    const second = await import('./index');

    expect(first.default).toBe(second.default);
    expect(first.qztray).toBe(second.qztray);
    expect(first.default).toBe(qztray);
});
