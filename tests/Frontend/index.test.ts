import { expect, test } from 'vite-plus/test';
import qztray, { QzTray, QzTrayConnector, qztray as namedInstance } from '../../resources/js/index';

test('exports a connector instance', () => {
    expect(qztray).toBeInstanceOf(QzTray);
});

test('shares the same class and instance through current and legacy names', () => {
    expect(QzTrayConnector).toBe(QzTray);
    expect(QzTray.getInstance()).toBe(qztray);
    expect(namedInstance).toBe(qztray);
    expect(QzTrayConnector.getInstance()).toBe(qztray);
    expect(QzTrayConnector.getInstance()).toBe(QzTrayConnector.getInstance());
});

test('shares the same instance across repeated module imports', async () => {
    const first = await import('../../resources/js/index');
    const second = await import('../../resources/js/index');

    expect(first.default).toBe(second.default);
    expect(first.qztray).toBe(second.qztray);
    expect(first.default).toBe(qztray);
});
