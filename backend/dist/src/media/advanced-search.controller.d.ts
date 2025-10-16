import { AdvancedSearchService, SearchResult } from './advanced-search.service';
import type { AdvancedSearchParams } from './advanced-search.service';
export declare class AdvancedSearchController {
    private readonly advancedSearchService;
    constructor(advancedSearchService: AdvancedSearchService);
    advancedSearch(req: any, searchParams: AdvancedSearchParams): Promise<SearchResult>;
    getSearchSuggestions(keyword: string, limit?: string): Promise<import("./advanced-search.service").SearchSuggestion[]>;
    getPopularKeywords(limit?: string): Promise<string[]>;
    getUserSearchHistory(req: any, limit?: string): Promise<string[]>;
    clearUserSearchHistory(req: any): Promise<{
        message: string;
    }>;
    getRelatedKeywords(keyword: string, limit?: string): Promise<string[]>;
    getSearchTrends(days?: string): Promise<{
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
