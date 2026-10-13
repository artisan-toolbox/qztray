/** @internal Coordinates one shared socket and its security callbacks. */
export declare class QzTrayConnection {
    private readonly security;
    private connectionRequest;
    private disconnectionRequest;
    isConnected(): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private closeConnection;
}
//# sourceMappingURL=QzTrayConnection.d.ts.map