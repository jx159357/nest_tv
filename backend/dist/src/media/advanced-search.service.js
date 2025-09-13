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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const search_history_entity_1 = require("../entities/search-history.entity");
let AdvancedSearchService = class AdvancedSearchService {
    mediaResourceRepository;
    searchHistoryRepository;
    searchHistory = new Map();
    popularSearches = new Map();
    constructor(mediaResourceRepository, searchHistoryRepository) {
        this.mediaResourceRepository = mediaResourceRepository;
        this.searchHistoryRepository = searchHistoryRepository;
    }
    async advancedSearch(params, userId) {
        const startTime = Date.now();
        const { keyword = '', type = [], quality = [], genres = [], director = '', actors = '', minRating, maxRating, minYear, maxYear, sortBy = 'relevance', sortOrder = 'DESC', page = 1, pageSize = 10, includeInactive = false, } = params;
        if (keyword && userId) {
            await this.recordSearchHistory(userId, keyword);
        }
        const queryBuilder = this.mediaResourceRepository.createQueryBuilder('mediaResource')
            .leftJoinAndSelect('mediaResource.poster', 'poster');
        if (!includeInactive) {
            queryBuilder.andWhere('mediaResource.isActive = :isActive', { isActive: true });
        }
        if (keyword.trim()) {
            const keywordPattern = `%${keyword.trim()}%`;
            queryBuilder.andWhere(`(mediaResource.title LIKE :keyword OR 
          mediaResource.description LIKE :keyword OR 
          mediaResource.originalTitle LIKE :keyword OR 
          mediaResource.director LIKE :keyword OR 
          mediaResource.actors LIKE :keyword)`, { keyword: keywordPattern });
        }
        if (type.length > 0) {
            queryBuilder.andWhere('mediaResource.type IN (:...types)', { types: type });
        }
        if (quality.length > 0) {
            queryBuilder.andWhere('mediaResource.quality IN (:...qualities)', { qualities: quality });
        }
        if (genres.length > 0) {
            genres.forEach(genre => {
                queryBuilder.andWhere('JSON_CONTAINS(mediaResource.genres, :genre)', { genre });
            });
        }
        if (director.trim()) {
            queryBuilder.andWhere('mediaResource.director LIKE :director', {
                director: `%${director.trim()}%`
            });
        }
        if (actors.trim()) {
            queryBuilder.andWhere('mediaResource.actors LIKE :actors', {
                actors: `%${actors.trim()}%`
            });
        }
        if (minRating !== undefined) {
            queryBuilder.andWhere('mediaResource.rating >= :minRating', { minRating });
        }
        if (maxRating !== undefined) {
            queryBuilder.andWhere('mediaResource.rating <= :maxRating', { maxRating });
        }
        if (minYear !== undefined) {
            const minDate = new Date(minYear, 0, 1);
            queryBuilder.andWhere('mediaResource.releaseDate >= :minDate', { minDate });
        }
        if (maxYear !== undefined) {
            const maxDate = new Date(maxYear + 1, 0, 1);
            queryBuilder.andWhere('mediaResource.releaseDate < :maxDate', { maxDate });
        }
        this.applySorting(queryBuilder, sortBy, sortOrder, keyword);
        const total = await queryBuilder.getCount();
        const skip = (page - 1) * pageSize;
        const data = await queryBuilder
            .skip(skip)
            .take(pageSize)
            .getMany();
        const searchTime = Date.now() - startTime;
        const suggestions = await this.generateSearchSuggestions(keyword);
        return {
            data,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
            suggestions: suggestions.slice(0, 5),
            searchTime,
            filters: {
                appliedTypes: type,
                appliedGenres: genres,
                yearRange: minYear !== undefined && maxYear !== undefined ? [minYear, maxYear] : undefined,
            },
        };
    }
    async getSearchSuggestions(keyword, limit = 8) {
        if (!keyword.trim()) {
            return [];
        }
        const suggestions = [];
        const titleSuggestions = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.title')
            .addSelect('COUNT(*)', 'count')
            .where('mediaResource.title LIKE :keyword', { keyword: `${keyword.trim()}%` })
            .andWhere('mediaResource.isActive = :isActive', { isActive: true })
            .groupBy('mediaResource.title')
            .orderBy('count', 'DESC')
            .take(limit / 2)
            .getRawMany();
        titleSuggestions.forEach(item => {
            suggestions.push({
                text: item.title,
                type: 'title',
                count: parseInt(item.count),
            });
        });
        const directorSuggestions = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.director')
            .addSelect('COUNT(*)', 'count')
            .where('mediaResource.director LIKE :keyword', { keyword: `${keyword.trim()}%` })
            .andWhere('mediaResource.isActive = :isActive', { isActive: true })
            .andWhere('mediaResource.director IS NOT NULL')
            .groupBy('mediaResource.director')
            .orderBy('count', 'DESC')
            .take(Math.max(1, Math.floor(limit / 4)))
            .getRawMany();
        directorSuggestions.forEach(item => {
            if (item.director) {
                suggestions.push({
                    text: item.director,
                    type: 'director',
                    count: parseInt(item.count),
                });
            }
        });
        const actorSuggestions = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.actors')
            .addSelect('COUNT(*)', 'count')
            .where('mediaResource.actors LIKE :keyword', { keyword: `%${keyword.trim()}%` })
            .andWhere('mediaResource.isActive = :isActive', { isActive: true })
            .andWhere('mediaResource.actors IS NOT NULL')
            .groupBy('mediaResource.actors')
            .orderBy('count', 'DESC')
            .take(Math.max(1, Math.floor(limit / 4)))
            .getRawMany();
        actorSuggestions.forEach(item => {
            if (item.actors) {
                const actorList = item.actors.split(',').map(actor => actor.trim()).slice(0, 2);
                actorList.forEach(actor => {
                    if (actor.includes(keyword.trim())) {
                        suggestions.push({
                            text: actor,
                            type: 'actor',
                            count: parseInt(item.count),
                        });
                    }
                });
            }
        });
        const genreSuggestions = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.genres')
            .addSelect('COUNT(*)', 'count')
            .where('JSON_CONTAINS(mediaResource.genres, :keyword)', { keyword: keyword.trim() })
            .andWhere('mediaResource.isActive = :isActive', { isActive: true })
            .groupBy('mediaResource.genres')
            .orderBy('count', 'DESC')
            .take(Math.max(1, Math.floor(limit / 4)))
            .getRawMany();
        genreSuggestions.forEach(item => {
            if (item.genres && Array.isArray(item.genres)) {
                item.genres.forEach((genre) => {
                    if (genre.includes(keyword.trim())) {
                        suggestions.push({
                            text: genre,
                            type: 'genre',
                            count: parseInt(item.count),
                        });
                    }
                });
            }
        });
        const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
        return uniqueSuggestions
            .sort((a, b) => {
            const aExact = a.text.toLowerCase() === keyword.toLowerCase();
            const bExact = b.text.toLowerCase() === keyword.toLowerCase();
            const aStartsWith = a.text.toLowerCase().startsWith(keyword.toLowerCase());
            const bStartsWith = b.text.toLowerCase().startsWith(keyword.toLowerCase());
            if (aExact !== bExact)
                return aExact ? -1 : 1;
            if (aStartsWith !== bStartsWith)
                return aStartsWith ? -1 : 1;
            return b.count - a.count;
        })
            .slice(0, limit);
    }
    async getPopularSearchKeywords(limit = 20) {
        const popularKeywords = await this.searchHistoryRepository
            .createQueryBuilder('searchHistory')
            .select('searchHistory.keyword')
            .addSelect('COUNT(*)', 'count')
            .where('searchHistory.createdAt > :since', {
            since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        })
            .groupBy('searchHistory.keyword')
            .orderBy('count', 'DESC')
            .take(limit)
            .getRawMany();
        return popularKeywords.map(item => item.keyword);
    }
    async getUserSearchHistory(userId, limit = 10) {
        const history = await this.searchHistoryRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return history.map(item => item.keyword);
    }
    async clearUserSearchHistory(userId) {
        await this.searchHistoryRepository.delete({ userId });
    }
    async recordSearchHistory(userId, keyword) {
        try {
            const existingRecord = await this.searchHistoryRepository.findOne({
                where: { userId, keyword },
                order: { createdAt: 'DESC' },
            });
            if (existingRecord) {
                const timeDiff = Date.now() - existingRecord.createdAt.getTime();
                if (timeDiff < 5 * 60 * 1000) {
                    return;
                }
            }
            const searchHistory = this.searchHistoryRepository.create({
                userId,
                keyword: keyword.trim(),
            });
            await this.searchHistoryRepository.save(searchHistory);
        }
        catch (error) {
            console.warn('Failed to record search history:', error);
        }
    }
    async generateSearchSuggestions(keyword) {
        if (!keyword.trim()) {
            return [];
        }
        const suggestions = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.title')
            .distinct(true)
            .where('mediaResource.title LIKE :keyword', { keyword: `${keyword.trim()}%` })
            .andWhere('mediaResource.isActive = :isActive', { isActive: true })
            .take(5)
            .getMany();
        return suggestions.map(item => item.title);
    }
    applySorting(queryBuilder, sortBy, sortOrder, keyword) {
        const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
        switch (sortBy) {
            case 'relevance':
                if (keyword.trim()) {
                    queryBuilder
                        .addOrderBy('CASE WHEN mediaResource.title LIKE :exactKeyword THEN 1 ELSE 2 END', 'ASC')
                        .addOrderBy('mediaResource.rating', order);
                }
                else {
                    queryBuilder.addOrderBy('mediaResource.rating', order);
                }
                break;
            case 'rating':
                queryBuilder.addOrderBy('mediaResource.rating', order);
                break;
            case 'views':
                queryBuilder.addOrderBy('mediaResource.views', order);
                break;
            case 'date':
                queryBuilder.addOrderBy('mediaResource.releaseDate', order);
                break;
            case 'title':
                queryBuilder.addOrderBy('mediaResource.title', order);
                break;
            default:
                queryBuilder
                    .addOrderBy('mediaResource.rating', order)
                    .addOrderBy('mediaResource.releaseDate', order);
        }
    }
    deduplicateSuggestions(suggestions) {
        const seen = new Set();
        return suggestions.filter(suggestion => {
            const key = `${suggestion.text}:${suggestion.type}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    async getRelatedKeywords(keyword, limit = 5) {
        const mediaWithKeyword = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select(['mediaResource.genres', 'mediaResource.director', 'mediaResource.actors'])
            .where('(mediaResource.title LIKE :keyword OR mediaResource.description LIKE :keyword)', {
            keyword: `%${keyword}%`,
        })
            .andWhere('mediaResource.isActive = :isActive', { isActive: true })
            .take(20)
            .getMany();
        const relatedKeywords = new Set();
        mediaWithKeyword.forEach(media => {
            if (media.genres && Array.isArray(media.genres)) {
                media.genres.forEach((genre) => {
                    if (genre && !genre.toLowerCase().includes(keyword.toLowerCase())) {
                        relatedKeywords.add(genre);
                    }
                });
            }
            if (media.director && !media.director.toLowerCase().includes(keyword.toLowerCase())) {
                relatedKeywords.add(media.director);
            }
            if (media.actors) {
                const actors = media.actors.split(',').map(actor => actor.trim());
                actors.forEach(actor => {
                    if (actor && !actor.toLowerCase().includes(keyword.toLowerCase())) {
                        relatedKeywords.add(actor);
                    }
                });
            }
        });
        return Array.from(relatedKeywords).slice(0, limit);
    }
};
exports.AdvancedSearchService = AdvancedSearchService;
exports.AdvancedSearchService = AdvancedSearchService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(media_resource_entity_1.MediaResource)),
    __param(1, (0, typeorm_1.InjectRepository)(search_history_entity_1.SearchHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdvancedSearchService);
//# sourceMappingURL=advanced-search.service.js.map