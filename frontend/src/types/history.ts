// 观看历史相关类型
export interface WatchHistory {
  id: number;
  userId: number;
  user?: User;
  mediaResourceId: number;
  mediaResource?: MediaResource;
  playSourceId?: number;
  playSource?: PlaySource;
  currentTime: number;
  duration: number;
  completed: boolean;
  watchedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchHistoryItem {
  id: number;
  mediaResource: MediaResource;
  currentTime: number;
  duration: number;
  completed: boolean;
  watchedAt: Date;
}

export interface WatchHistoryQueryParams {
  page?: number;
  limit?: number;
  userId?: number;
  mediaResourceId?: number;
  completed?: boolean;
}

export interface WatchHistoryCreateData {
  mediaResourceId: number;
  playSourceId?: number;
  currentTime: number;
  duration: number;
  completed: boolean;
}

export interface WatchHistoryUpdateData {
  currentTime?: number;
  duration?: number;
  completed?: boolean;
}

// 推荐相关类型
export interface Recommendation {
  id: number;
  userId: number;
  user?: User;
  mediaResourceId: number;
  mediaResource?: MediaResource;
  type: RecommendationType;
  score: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export enum RecommendationType {
  PERSONALIZED = 'personalized',
  POPULAR = 'popular',
  EDITORIAL = 'editorial',
  SIMILAR = 'similar',
  TRENDING = 'trending',
}

export interface RecommendationQueryParams {
  page?: number;
  limit?: number;
  type?: RecommendationType;
  userId?: number;
  minScore?: number;
}

export interface RecommendationCreateData {
  mediaResourceId: number;
  type: RecommendationType;
  score: number;
  metadata?: any;
}