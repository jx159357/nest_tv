import { RecommendationService } from './recommendation.service';

describe('RecommendationService', () => {
  const mediaResourceRepository = {
    find: jest.fn(),
  };
  const recommendationRepository = {};
  const watchHistoryRepository = {
    find: jest.fn(),
  };
  const searchHistoryRepository = {
    find: jest.fn(),
  };
  const userRepository = {
    findOne: jest.fn(),
  };
  const cacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  };

  let service: RecommendationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecommendationService(
      mediaResourceRepository as never,
      recommendationRepository as never,
      watchHistoryRepository as never,
      searchHistoryRepository as never,
      userRepository as never,
      cacheManager as never,
    );
  });

  it('builds a search-based profile when recent searches exist without watch history', async () => {
    cacheManager.get.mockResolvedValue(null);
    watchHistoryRepository.find.mockResolvedValue([]);
    searchHistoryRepository.find.mockResolvedValue([
      {
        keyword: '沙丘',
        resultCount: 6,
        isActive: true,
        createdAt: new Date(),
      },
    ]);
    userRepository.findOne.mockResolvedValue(null);

    const profile = await service.getRecommendationProfile(1);

    expect(profile.strategy).toBe('search-based');
    expect(profile.recentSearchKeywords[0]).toMatchObject({ key: '沙丘' });
  });

  it('boosts personalized items with matching recent search keywords', async () => {
    cacheManager.get.mockResolvedValue(null);
    watchHistoryRepository.find.mockResolvedValue([]);
    searchHistoryRepository.find.mockResolvedValue([
      {
        keyword: '沙丘',
        resultCount: 8,
        isActive: true,
        createdAt: new Date(),
      },
    ]);
    userRepository.findOne.mockResolvedValue(null);
    mediaResourceRepository.find.mockResolvedValue([
      {
        id: 1,
        title: '沙丘',
        description: '科幻史诗',
        type: 'movie',
        rating: 8.5,
        viewCount: 500,
        isActive: true,
        genres: ['科幻'],
        createdAt: new Date(),
      },
      {
        id: 2,
        title: '普通电影',
        description: '剧情片',
        type: 'movie',
        rating: 8.8,
        viewCount: 600,
        isActive: true,
        genres: ['剧情'],
        createdAt: new Date(),
      },
    ]);

    const items = await service.getPersonalizedRecommendationItems(1, 2);

    expect(items[0].media.title).toBe('沙丘');
    expect(items[0].reasons.some(reason => reason.includes('最近搜索'))).toBe(true);
  });
});
