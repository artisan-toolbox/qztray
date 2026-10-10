import qz from 'qz-tray';
import { QzTraySecurity } from './QzTraySecurity';

/** @internal Coordinates one shared socket and its security callbacks. */
export class QzTrayConnection {
    private readonly security = new QzTraySecurity();
    private connectionRequest: Promise<void> | null = null;
    private disconnectionRequest: Promise<void> | null = null;

    public isConnected(): boolean {
        return qz.websocket.isActive();
    }

    public async connect(): Promise<void> {
        if (this.disconnectionRequest !== null) {
            await this.disconnectionRequest;

            return this.connect();
        }

        if (this.connectionRequest !== null) {
            return this.connectionRequest;
        }

        this.security.configure();

        if (this.isConnected()) {
            return;
        }

        this.connectionRequest = qz.websocket.connect();

        try {
            await this.connectionRequest;
        } finally {
            this.connectionRequest = null;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.disconnectionRequest !== null) {
            return this.disconnectionRequest;
        }

        this.disconnectionRequest = this.closeConnection();

        try {
            await this.disconnectionRequest;
        } finally {
            this.disconnectionRequest = null;
        }
    }

    private async closeConnection(): Promise<void> {
        if (this.connectionRequest !== null) {
            // A failed connection does not prevent closing a remaining active socket.
            await this.connectionRequest.catch(() => undefined);
        }

        if (this.isConnected()) {
            await qz.websocket.disconnect();
        }
    }
}
