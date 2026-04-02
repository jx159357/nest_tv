import ApiClient from './index';

export interface SearchSuggestionItem {
  text: string;
  type: 'keyword' | 'title' | 'actor' | 'director' | 'genre';
  count: number;
}

export interface SearchHistoryPayload {
  keyword: string;
  resultCount?: number;
  searchTime?: number;
  filters?: Record<string, unknown>;
}

export const searchApi = {
  getSuggestions: (keyword: string, limit = 8) => {
    return ApiClient.get<SearchSuggestionItem[]>('/search/suggestions', {
      params: { keyword, limit },
    }, false);
  },

  getPopularKeywords: (limit = 8) => {
    return ApiClient.get<string[]>('/search/popular-keywords', {
      params: { limit },
    }, false);
  },

  getHistory: (limit = 8) => {
    return ApiClient.get<string[]>('/search/history', {
      params: { limit },
    }, false);
  },

  clearHistory: () => {
    return ApiClient.delete<{ message: string }>('/search/history');
  },

  getRelatedKeywords: (keyword: string, limit = 6) => {
    return ApiClient.get<string[]>(`/search/related-keywords/${encodeURIComponent(keyword)}`, {
      params: { limit },
    }, false);
  },

  recordHistory: (payload: SearchHistoryPayload) => {
    return ApiClient.post<{ success: true }>('/search/history', payload);
  },
};
