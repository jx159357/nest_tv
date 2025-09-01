"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaCacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_service_1 = require("./cache.service");
let MediaCacheService = class MediaCacheService {
    cacheService;
    CACHE_PREFIX = 'media';
    TTL_SHORT = 300;
    TTL_MEDIUM = 1800;
    TTL_LONG = 3600;
    constructor(cacheService) {
        this.cacheService = cacheService;
    }
    generateMediaKey(...parts) {
        return this.cacheService.generateKey(this.CACHE_PREFIX, ...parts);
    }
    async cacheMediaDetail(mediaId, media) {
        const key = this.generateMediaKey('detail', mediaId.toString());
        await this.cacheService.set(key, media, this.TTL_MEDIUM);
    }
    async getCachedMediaDetail(mediaId) {
        const key = this.generateMediaKey('detail', mediaId.toString());
        return await this.cacheService.get(key);
    }
    async cacheMediaList(query, result) {
        const key = this.generateMediaKey('list', this.createQueryHash(query));
        await this.cacheService.set(key, result, this.TTL_SHORT);
    }
    async getCachedMediaList(query) {
        const key = this.generateMediaKey('list', this.createQueryHash(query));
        return await this.cacheService.get(key);
    }
    async cachePopularMedia(media, limit) {
        const key = this.generateMediaKey('popular', limit.toString());
        await this.cacheService.set(key, media, this.TTL_MEDIUM);
    }
    async getCachedPopularMedia(limit) {
        const key = this.generateMediaKey('popular', limit.toString());
        return await this.cacheService.get(key);
    }
    async cacheLatestMedia(media, limit) {
        const key = this.generateMediaKey('latest', limit.toString());
        await this.cacheService.set(key, media, this.TTL_MEDIUM);
    }
    async getCachedLatestMedia(limit) {
        const key = this.generateMediaKey('latest', limit.toString());
        return await this.cacheService.get(key);
    }
    async cacheTopRatedMedia(media, limit, minRating) {
        const key = this.generateMediaKey('toprated', limit.toString(), minRating.toString());
        await this.cacheService.set(key, media, this.TTL_MEDIUM);
    }
    async getCachedTopRatedMedia(limit, minRating) {
        const key = this.generateMediaKey('toprated', limit.toString(), minRating.toString());
        return await this.cacheService.get(key);
    }
    async cacheUserFavorites(userId, result, page, limit) {
        const key = this.generateMediaKey('favorites', userId.toString(), page.toString(), limit.toString());
        await this.cacheService.set(key, result, this.TTL_SHORT);
    }
    async getCachedUserFavorites(userId, page, limit) {
        const key = this.generateMediaKey('favorites', userId.toString(), page.toString(), limit.toString());
        return await this.cacheService.get(key);
    }
    async cacheMediaByType(type, media, limit) {
        const key = this.generateMediaKey('type', type, limit.toString());
        await this.cacheService.set(key, media, this.TTL_MEDIUM);
    }
    async getCachedMediaByType(type, limit) {
        const key = this.generateMediaKey('type', type, limit.toString());
        return await this.cacheService.get(key);
    }
    async clearMediaCache(mediaId) {
        const patterns = [
            this.generateMediaKey('detail', mediaId.toString()),
            this.generateMediaKey('list', '*'),
            this.generateMediaKey('popular', '*'),
            this.generateMediaKey('latest', '*'),
            this.generateMediaKey('toprated', '*'),
            this.generateMediaKey('type', '*'),
        ];
        for (const pattern of patterns) {
            await this.cacheService.delPattern(pattern);
        }
    }
    async clearUserCache(userId) {
        const patterns = [
            this.generateMediaKey('favorites', userId.toString(), '*'),
        ];
        for (const pattern of patterns) {
            await this.cacheService.delPattern(pattern);
        }
    }
    async clearAllMediaCache() {
        await this.cacheService.delPattern(this.generateMediaKey('*'));
    }
    createQueryHash(query) {
        const normalized = {
            page: query.page || 1,
            limit: query.limit || 10,
            search: query.search || '',
            type: query.type || '',
            genre: query.genre || '',
            minRating: query.minRating || 0,
            maxRating: query.maxRating || 10,
            sortBy: query.sortBy || 'createdAt',
            sortOrder: query.sortOrder || 'DESC',
        };
        return Buffer.from(JSON.stringify(normalized)).toString('base64');
    }
    async getMediaCacheStats() {
        const patterns = [
            { name: 'detailCache', pattern: this.generateMediaKey('detail', '*') },
            { name: 'listCache', pattern: this.generateMediaKey('list', '*') },
            { name: 'popularCache', pattern: this.generateMediaKey('popular', '*') },
            { name: 'latestCache', pattern: this.generateMediaKey('latest', '*') },
            { name: 'topRatedCache', pattern: this.generateMediaKey('toprated', '*') },
            { name: 'favoritesCache', pattern: this.generateMediaKey('favorites', '*') },
            { name: 'typeCache', pattern: this.generateMediaKey('type', '*') },
        ];
        const stats = await Promise.all(patterns.map(async ({ name, pattern }) => {
            const keys = await this.cacheService['redisClient'].keys(pattern);
            return { name, count: keys.length };
        }));
        const result = {
            totalKeys: 0,
            detailCache: 0,
            listCache: 0,
            popularCache: 0,
            latestCache: 0,
            topRatedCache: 0,
            favoritesCache: 0,
            typeCache: 0,
        };
        stats.forEach(({ name, count }) => {
            result[name] = count;
            result.totalKeys += count;
        });
        return result;
    }
    async preheatPopularCache() {
        try {
            const keys = await this.cacheService['redisClient'].keys(this.generateMediaKey('popular', '*'));
            for (const key of keys) {
                const ttl = await this.cacheService.ttl(key);
                if (ttl < 300) {
                    console.log(`Preheating cache for key: ${key}`);
                }
            }
        }
        catch (error) {
            console.error('Preheating cache error:', error);
        }
    }
};
exports.MediaCacheService = MediaCacheService;
exports.MediaCacheService = MediaCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService])
], MediaCacheService);
//# sourceMappingURL=media-cache.service.js.map