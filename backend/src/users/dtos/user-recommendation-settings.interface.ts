export enum RecommendationFreshnessBias {
  BALANCED = 'balanced',
  FRESH = 'fresh',
  CLASSIC = 'classic',
}

export interface UserRecommendationSettings {
  preferredTypes?: string[];
  preferredGenres?: string[];
  excludedGenres?: string[];
  preferredKeywords?: string[];
  freshnessBias?: RecommendationFreshnessBias;
}
