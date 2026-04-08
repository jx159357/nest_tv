import { AdvancedSearchController } from './advanced-search.controller';

describe('AdvancedSearchController', () => {
  const advancedSearchService = {
    advancedSearch: jest.fn(),
    recordSearchHistory: jest.fn(),
    getUserSearchHistory: jest.fn(),
    clearUserSearchHistory: jest.fn(),
  };

  let controller: AdvancedSearchController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdvancedSearchController(advancedSearchService as never);
  });

  it('passes the authenticated user id into advanced search', async () => {
    advancedSearchService.advancedSearch.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      searchTime: 0,
      filters: { appliedTypes: [], appliedGenres: [] },
    });

    await controller.advancedSearch(7, { keyword: '星际穿越' });

    expect(advancedSearchService.advancedSearch).toHaveBeenCalledWith({ keyword: '星际穿越' }, 7);
  });

  it('records search history for the authenticated user', async () => {
    advancedSearchService.recordSearchHistory.mockResolvedValue(undefined);

    await controller.recordUserSearchHistory(9, { keyword: '奥本海默' });

    expect(advancedSearchService.recordSearchHistory).toHaveBeenCalledWith(9, {
      keyword: '奥本海默',
    });
  });

  it('loads search history for the authenticated user', async () => {
    advancedSearchService.getUserSearchHistory.mockResolvedValue(['沙丘']);

    await controller.getUserSearchHistory(11, '5');

    expect(advancedSearchService.getUserSearchHistory).toHaveBeenCalledWith(11, 5);
  });
});
