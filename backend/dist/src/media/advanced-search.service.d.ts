import { Repository } from 'typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { SearchHistory } from '../entities/search-history.entity';
export interface AdvancedSearchParams {
    keyword?: string;
    type?: string[];
    quality?: string[];
    genres?: string[];
    director?: string;
    actors?: string;
    minRating?: number;
    maxRating?: number;
    minYear?: number;
    maxYear?: number;
    sortBy?: 'relevance' | 'rating' | 'views' | 'date' | 'title';
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    pageSize?: number;
    includeInactive?: boolean;
}
export interface SearchResult {
    data: MediaResource[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    suggestions?: string[];
    searchTime: number;
    filters: {
        appliedTypes: string[];
        appliedGenres: string[];
        priceRange?: [number, number];
        yearRange?: [number, number];
    };
}
export interface SearchSuggestion {
    text: string;
    type: 'keyword' | 'title' | 'actor' | 'director' | 'genre';
    count: number;
}
export declare class AdvancedSearchService {
    private readonly mediaResourceRepository;
    private readonly searchHistoryRepository;
    private readonly searchHistory;
    private readonly popularSearches;
    constructor(mediaResourceRepository: Repository<MediaResource>, searchHistoryRepository: Repository<SearchHistory>);
    advancedSearch(params: AdvancedSearchParams, userId?: number): Promise<SearchResult>;
    getSearchSuggestions(keyword: string, limit?: number): Promise<SearchSuggestion[]>;
    getPopularSearchKeywords(limit?: number): Promise<string[]>;
    getUserSearchHistory(userId: number, limit?: number): Promise<string[]>;
    clearUserSearchHistory(userId: number): Promise<void>;
    private recordSearchHistory;
    private generateSearchSuggestions;
    private applySorting;
    private deduplicateSuggestions;
    getRelatedKeywords(keyword: string, limit?: number): Promise<string[]>;
}
