import type { PromiseFactory } from 'qz-tray';
import { vi } from 'vite-plus/test';

export async function createSecurityCallbacks() {
    const qz = (await import('qz-tray')).default;
    const { QzTraySecurity } = await import('../../resources/js/QzTraySecurity');
    const certificate = vi.spyOn(qz.security, 'setCertificatePromise').mockImplementation(() => {});
    const signature = vi.spyOn(qz.security, 'setSignaturePromise').mockImplementation(() => {});
    vi.spyOn(qz.security, 'setSignatureAlgorithm').mockImplementation(() => {});

    new QzTraySecurity().configure();

    const certificateHandler = certificate.mock.calls[0][0];
    const signatureFactory = signature.mock.calls[0][0] as PromiseFactory;

    return {
        getPublicKey: () => new Promise<string | undefined>(certificateHandler),
        signPayload: (payload: string) =>
            new Promise<string | undefined>(signatureFactory(payload)),
    };
}
