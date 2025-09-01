export declare class TorrentService {
    private readonly logger;
    private client;
    constructor();
    private setupEventHandlers;
    parseMagnetUri(magnetUri: string): any;
    addMagnet(magnetUri: string): Promise<{
        infoHash: string;
        name: string;
        length: number;
        files: any[];
        magnet: string;
    }>;
    getFileStream(infoHash: string, fileIndex: number): NodeJS.ReadableStream | null;
    getTorrentInfo(infoHash: string): any | null;
    findLargestVideoFile(infoHash: string): any | null;
    removeTorrent(infoHash: string): boolean;
    getAllTorrents(): any[];
    checkMagnetHealth(magnetUri: string): Promise<{
        isHealthy: boolean;
        seeders: number;
        leechers: number;
        infoHash?: string;
    }>;
    generatePlayUrl(infoHash: string, fileIndex: number): string;
    destroyAll(): void;
}
