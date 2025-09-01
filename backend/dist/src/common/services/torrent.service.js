"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TorrentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorrentService = void 0;
const common_1 = require("@nestjs/common");
const WebTorrent = __importStar(require("webtorrent"));
const magnet_uri_1 = require("magnet-uri");
let TorrentService = TorrentService_1 = class TorrentService {
    logger = new common_1.Logger(TorrentService_1.name);
    client;
    constructor() {
        this.client = new WebTorrent({
            tracker: true,
            dht: true,
            maxConns: 100,
            trackerAnnounce: [
                'wss://tracker.openwebtorrent.com',
                'wss://tracker.btorrent.xyz',
                'wss://tracker.fastcast.nz',
                'wss://tracker.files.fm:7073/announce',
            ],
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.on('error', (err) => {
            this.logger.error('WebTorrent client error:', err);
        });
        this.client.on('warning', (warn) => {
            this.logger.warn('WebTorrent client warning:', warn);
        });
        this.client.on('torrent', (torrent) => {
            this.logger.log(`New torrent added: ${torrent.name}`);
        });
    }
    parseMagnetUri(magnetUri) {
        try {
            const parsed = (0, magnet_uri_1.parse)(magnetUri);
            this.logger.log(`Parsed magnet URI: ${parsed.infoHash}`);
            return parsed;
        }
        catch (error) {
            this.logger.error('Failed to parse magnet URI:', error);
            throw new common_1.HttpException('无效的磁力链接', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async addMagnet(magnetUri) {
        try {
            this.logger.log(`Adding magnet: ${magnetUri}`);
            return new Promise((resolve, reject) => {
                const torrent = this.client.add(magnetUri, {
                    store: WebTorrent.MemoryStorage,
                });
                torrent.on('metadata', () => {
                    this.logger.log(`Torrent metadata loaded: ${torrent.name}`);
                    resolve({
                        infoHash: torrent.infoHash,
                        name: torrent.name,
                        length: torrent.length,
                        files: torrent.files.map(file => ({
                            name: file.name,
                            length: file.length,
                            type: file.type,
                            path: file.path,
                        })),
                        magnet: torrent.magnetURI,
                    });
                });
                torrent.on('error', (err) => {
                    this.logger.error('Torrent error:', err);
                    reject(new common_1.HttpException('磁力链接加载失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR));
                });
                setTimeout(() => {
                    if (!torrent.metadata) {
                        this.logger.warn('Torrent metadata timeout');
                        reject(new common_1.HttpException('磁力链接加载超时', common_1.HttpStatus.REQUEST_TIMEOUT));
                    }
                }, 30000);
            });
        }
        catch (error) {
            this.logger.error('Failed to add magnet:', error);
            throw new common_1.HttpException('添加磁力链接失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getFileStream(infoHash, fileIndex) {
        try {
            const torrent = this.client.get(infoHash);
            if (!torrent || !torrent.files[fileIndex]) {
                return null;
            }
            const file = torrent.files[fileIndex];
            const stream = file.createReadStream({
                start: 0,
                end: file.length,
            });
            this.logger.log(`Created stream for file: ${file.name}`);
            return stream;
        }
        catch (error) {
            this.logger.error('Failed to create file stream:', error);
            return null;
        }
    }
    getTorrentInfo(infoHash) {
        try {
            const torrent = this.client.get(infoHash);
            if (!torrent) {
                return null;
            }
            return {
                infoHash: torrent.infoHash,
                name: torrent.name,
                length: torrent.length,
                downloaded: torrent.downloaded,
                uploaded: torrent.uploaded,
                downloadSpeed: torrent.downloadSpeed,
                uploadSpeed: torrent.uploadSpeed,
                progress: torrent.progress,
                ratio: torrent.ratio,
                numPeers: torrent.numPeers,
                timeRemaining: torrent.timeRemaining,
                files: torrent.files.map(file => ({
                    name: file.name,
                    length: file.length,
                    type: file.type,
                    path: file.path,
                    selected: file.selected,
                })),
                magnet: torrent.magnetURI,
            };
        }
        catch (error) {
            this.logger.error('Failed to get torrent info:', error);
            return null;
        }
    }
    findLargestVideoFile(infoHash) {
        try {
            const torrent = this.client.get(infoHash);
            if (!torrent || !torrent.files.length) {
                return null;
            }
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
            let largestFile = null;
            let maxSize = 0;
            for (let i = 0; i < torrent.files.length; i++) {
                const file = torrent.files[i];
                const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                if (videoExtensions.includes(ext) && file.length > maxSize) {
                    largestFile = {
                        index: i,
                        name: file.name,
                        length: file.length,
                        type: file.type,
                        path: file.path,
                    };
                    maxSize = file.length;
                }
            }
            return largestFile;
        }
        catch (error) {
            this.logger.error('Failed to find largest video file:', error);
            return null;
        }
    }
    removeTorrent(infoHash) {
        try {
            const torrent = this.client.get(infoHash);
            if (torrent) {
                torrent.destroy();
                this.logger.log(`Removed torrent: ${infoHash}`);
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.error('Failed to remove torrent:', error);
            return false;
        }
    }
    getAllTorrents() {
        try {
            return this.client.torrents.map(torrent => ({
                infoHash: torrent.infoHash,
                name: torrent.name,
                length: torrent.length,
                downloaded: torrent.downloaded,
                uploaded: torrent.uploaded,
                downloadSpeed: torrent.downloadSpeed,
                uploadSpeed: torrent.uploadSpeed,
                progress: torrent.progress,
                ratio: torrent.ratio,
                numPeers: torrent.numPeers,
                timeRemaining: torrent.timeRemaining,
                magnet: torrent.magnetURI,
            }));
        }
        catch (error) {
            this.logger.error('Failed to get all torrents:', error);
            return [];
        }
    }
    async checkMagnetHealth(magnetUri) {
        try {
            const parsed = this.parseMagnetUri(magnetUri);
            return new Promise((resolve) => {
                const torrent = this.client.add(magnetUri, {
                    store: WebTorrent.MemoryStorage,
                });
                const timeout = setTimeout(() => {
                    torrent.destroy();
                    resolve({
                        isHealthy: false,
                        seeders: 0,
                        leechers: 0,
                    });
                }, 10000);
                torrent.on('metadata', () => {
                    clearTimeout(timeout);
                    const isHealthy = torrent.numPeers > 0;
                    torrent.destroy();
                    resolve({
                        isHealthy,
                        seeders: torrent.numPeers,
                        leechers: 0,
                        infoHash: torrent.infoHash,
                    });
                });
                torrent.on('error', () => {
                    clearTimeout(timeout);
                    resolve({
                        isHealthy: false,
                        seeders: 0,
                        leechers: 0,
                    });
                });
            });
        }
        catch (error) {
            this.logger.error('Failed to check magnet health:', error);
            return {
                isHealthy: false,
                seeders: 0,
                leechers: 0,
            };
        }
    }
    generatePlayUrl(infoHash, fileIndex) {
        return `/api/play-sources/torrent/stream/${infoHash}/${fileIndex}`;
    }
    destroyAll() {
        this.client.destroy();
        this.logger.log('All torrents destroyed');
    }
};
exports.TorrentService = TorrentService;
exports.TorrentService = TorrentService = TorrentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TorrentService);
//# sourceMappingURL=torrent.service.js.map