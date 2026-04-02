const SEARCH_HISTORY_STORAGE_KEY = 'nest-tv.recent-searches';
const DEFAULT_HISTORY_LIMIT = 8;

export const normalizeSearchKeyword = (keyword: string) => keyword.trim().replace(/\s+/g, ' ');

export const dedupeKeywords = (keywords: string[], limit = DEFAULT_HISTORY_LIMIT) => {
  const seen = new Set<string>();

  return keywords
    .map(item => normalizeSearchKeyword(item))
    .filter(Boolean)
    .filter(item => {
      const cacheKey = item.toLocaleLowerCase();
      if (seen.has(cacheKey)) {
        return false;
      }

      seen.add(cacheKey);
      return true;
    })
    .slice(0, limit);
};

export const readRecentSearches = () => {
  try {
    const rawValue = globalThis.localStorage?.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? dedupeKeywords(parsed, DEFAULT_HISTORY_LIMIT) : [];
  } catch (error) {
    console.error('读取最近搜索失败:', error);
    return [];
  }
};

export const saveRecentSearch = (keyword: string) => {
  const nextKeyword = normalizeSearchKeyword(keyword);
  if (!nextKeyword) {
    return readRecentSearches();
  }

  const nextSearches = dedupeKeywords([nextKeyword, ...readRecentSearches()], DEFAULT_HISTORY_LIMIT);

  try {
    globalThis.localStorage?.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(nextSearches));
  } catch (error) {
    console.error('保存最近搜索失败:', error);
  }

  return nextSearches;
};

export const clearRecentSearches = () => {
  try {
    globalThis.localStorage?.removeItem(SEARCH_HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('清空最近搜索失败:', error);
  }

  return [] as string[];
};

export const filterRecentSearches = (keywords: string[], keyword: string, limit = 4) => {
  const normalizedKeyword = normalizeSearchKeyword(keyword).toLocaleLowerCase();
  if (!normalizedKeyword) {
    return dedupeKeywords(keywords, limit);
  }

  return dedupeKeywords(keywords.filter(item => item.toLocaleLowerCase().includes(normalizedKeyword)), limit);
};
