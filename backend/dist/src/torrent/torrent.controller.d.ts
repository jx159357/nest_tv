export declare class TorrentController {
    getTorrentInfo(hash: string): {
        infoHash: string;
        name: string;
        size: string;
        files: never[];
        announce: never[];
    };
    checkTorrentHealth(hash: string): {
        infoHash: string;
        isHealthy: boolean;
        seeders: number;
        leechers: number;
        lastChecked: string;
    };
    parseMagnetUri(body: {
        magnetUri: string;
    }): {
        infoHash: string;
        name: string;
        announce: string[];
    };
    searchTorrents(keyword: string, page?: number, pageSize?: number): {
        data: {
            infoHash: string;
            name: string;
            size: string;
            seeders: number;
            leechers: number;
            added: string;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
    getPopularTorrents(limit?: number, category?: string): {
        infoHash: string;
        name: string;
        size: string;
        seeders: number;
        leechers: number;
        category: string;
        added: string;
    }[];
    getLatestTorrents(limit?: number, category?: string): {
        infoHash: string;
        name: string;
        size: string;
        seeders: number;
        leechers: number;
        category: string;
        added: string;
    }[];
}
