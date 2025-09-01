import { TorrentService } from '../common/services/torrent.service';
import { AppLoggerService } from '../common/services/app-logger.service';
import { Response, Request } from 'express';
export declare class TorrentController {
    private readonly torrentService;
    private readonly logger;
    constructor(torrentService: TorrentService, appLoggerService: AppLoggerService);
    addMagnet(magnetUri: string, userId?: number): Promise<any>;
    getTorrentInfo(infoHash: string, userId?: number): Promise<any>;
    findLargestVideoFile(infoHash: string, userId?: number): Promise<any>;
    getFileStream(infoHash: string, fileIndex: number, userId?: number, res: Response, req: Request): Promise<void>;
    checkMagnetHealth(magnetUri: string, userId?: number): Promise<any>;
    removeTorrent(infoHash: string, userId?: number): Promise<any>;
    getAllTorrents(userId?: number): Promise<any>;
    parseMagnet(magnetUri: string, userId?: number): Promise<any>;
    destroyAll(userId?: number): Promise<any>;
}
