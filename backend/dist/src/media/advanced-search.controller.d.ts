import { AdvancedSearchService, SearchResult } from './advanced-search.service';
import type { AdvancedSearchParams } from './advanced-search.service';
export declare class AdvancedSearchController {
    private readonly advancedSearchService;
    constructor(advancedSearchService: AdvancedSearchService);
    advancedSearch(req: any, searchParams: AdvancedSearchParams): Promise<SearchResult>;
    getSearchSuggestions(keyword: string, limit?: number): Promise<import("./advanced-search.service").SearchSuggestion[]>;
    getPopularKeywords(limit?: number): Promise<string[]>;
    getUserSearchHistory(req: any, limit?: number): Promise<string[]>;
    clearUserSearchHistory(req: any): Promise<{
        message: string;
    }>;
    getRelatedKeywords(keyword: string, limit?: number): Promise<string[]>;
    getSearchTrends(days?: number): Promise<{
        totalSearches: number;
        dailyTrends: Array<{
            date: string;
            count: number;
            topKeywords: string[];
        }>;
        popularKeywords: Array<{
            keyword: string;
            count: number;
        }>;
    }>;
    smartSearch(query: string, req: any, body?: {
        userId?: number;
        filters?: any;
    }): Promise<SearchResult>;
    getFilterPresets(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        filters: AdvancedSearchParams;
    }>>;
    private parseSmartSearchQuery;
}
