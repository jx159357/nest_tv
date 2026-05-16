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

export interface SseSearchEvent {
  type: 'media' | 'torrents' | 'error' | 'timeout' | 'done';
  source?: string;
  data?: unknown[];
  total?: number;
  searchTime?: number;
  message?: string;
  keyword?: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getToken = (): string => {
  return localStorage.getItem('token') || '';
};

export const searchApi = {
  getSuggestions: (keyword: string, limit = 8) => {
    return ApiClient.get<SearchSuggestionItem[]>(
      '/search/suggestions',
      {
        params: { keyword, limit },
      },
      false,
    );
  },

  getPopularKeywords: (limit = 8) => {
    return ApiClient.get<string[]>(
      '/search/popular-keywords',
      {
        params: { limit },
      },
      false,
    );
  },

  getHistory: (limit = 8) => {
    return ApiClient.get<string[]>(
      '/search/history',
      {
        params: { limit },
      },
      false,
    );
  },

  clearHistory: () => {
    return ApiClient.delete<{ message: string }>('/search/history');
  },

  getRelatedKeywords: (keyword: string, limit = 6) => {
    return ApiClient.get<string[]>(
      `/search/related-keywords/${encodeURIComponent(keyword)}`,
      {
        params: { limit },
      },
      false,
    );
  },

  recordHistory: (payload: SearchHistoryPayload) => {
    return ApiClient.post<{ success: true }>('/search/history', payload);
  },

  streamSearch: (
    keyword: string,
    options: {
      type?: string;
      limit?: number;
      onEvent: (event: SseSearchEvent) => void;
      onError?: (error: Error) => void;
      onDone?: () => void;
    },
  ): (() => void) => {
    const params = new URLSearchParams({ keyword });
    if (options.type) params.set('type', options.type);
    if (options.limit) params.set('limit', String(options.limit));

    const token = getToken();
    const url = `${BASE_URL}/search/stream?${params.toString()}`;

    const controller = new AbortController();

    fetch(url, {
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`SSE 请求失败: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法读取响应流');

        const decoder = new TextDecoder();
        let buffer = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const payload = JSON.parse(line.slice(6)) as SseSearchEvent;
              options.onEvent(payload);
              if (payload.type === 'done') {
                options.onDone?.();
                return;
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        options.onDone?.();
      })
      .catch(err => {
        if ((err as Error).name !== 'AbortError') {
          options.onError?.(err as Error);
        }
      });

    return () => controller.abort();
  },
};
