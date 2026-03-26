import ApiClient from './index';
import type { MediaResource } from '@/types/media';

export const recommendationsApi = {
  getPersonalized: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/personalized', {
      params: { limit },
    });
  },

  getTrending: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/trending', {
      params: { limit },
    });
  },

  getLatest: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/latest', {
      params: { limit },
    });
  },

  getTopRated: (limit = 8) => {
    return ApiClient.get<MediaResource[]>('/recommendations/top-rated', {
      params: { limit },
    });
  },
};
