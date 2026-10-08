export class QzTraySigningError extends Error {
    readonly code: string;
    readonly status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.name = 'QzTraySigningError';
        this.code = code;
        this.status = status;
    }
}
