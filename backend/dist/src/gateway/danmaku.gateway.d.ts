export declare class DanmakuGateway {
    private readonly logger;
    constructor();
    connect(videoId: string, userId: string): Promise<boolean>;
    sendDanmaku(message: any): Promise<boolean>;
    getRoomInfo(videoId: string): Promise<any>;
    getRoomStats(): any;
    disconnect(): Promise<void>;
}
