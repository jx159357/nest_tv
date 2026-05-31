<template>
  <div class="categories-view">
    <header class="categories-header">
      <h1 class="categories-title">分类浏览</h1>
      <p class="categories-subtitle">按类型和流派筛选你喜欢的影视内容</p>
    </header>

    <section class="categories-section">
      <h2 class="section-label">类型</h2>
      <div class="type-grid">
        <button
          v-for="t in types"
          :key="t.name"
          class="type-card"
          :class="{ active: selectedType === t.name }"
          @click="selectType(t.name)"
        >
          <span class="type-icon">{{ typeIconMap[t.name] || '📁' }}</span>
          <span class="type-name">{{ t.label }}</span>
          <span class="type-count">{{ t.count }}</span>
        </button>
      </div>
    </section>

    <section class="categories-section">
      <h2 class="section-label">流派</h2>
      <div class="genre-chips">
        <button
          v-for="g in genres"
          :key="g.name"
          class="genre-chip"
          :class="{ active: selectedGenre === g.name }"
          @click="selectGenre(g.name)"
        >
          {{ g.name }}
          <span class="genre-count">{{ g.count }}</span>
        </button>
      </div>
    </section>

    <section v-if="sources.length > 0" class="categories-section">
      <h2 class="section-label">数据源</h2>
      <div class="genre-chips">
        <button
          v-for="s in sources"
          :key="s.name"
          class="genre-chip"
          :class="{ active: selectedSource === s.name }"
          @click="selectSource(s.name)"
        >
          {{ s.name }}
          <span class="genre-count">{{ s.count }}</span>
        </button>
      </div>
    </section>

    <section v-if="selectedType || selectedGenre || selectedSource" class="categories-section">
      <div class="filter-bar">
        <div class="filter-tags">
          <span v-if="selectedType" class="filter-tag" @click="selectedType = ''">
            {{ typeLabelMap[selectedType] || selectedType }} &times;
          </span>
          <span v-if="selectedGenre" class="filter-tag" @click="selectedGenre = ''">
            {{ selectedGenre }} &times;
          </span>
          <span v-if="selectedSource" class="filter-tag" @click="selectedSource = ''">
            {{ selectedSource }} &times;
          </span>
        </div>
        <button class="btn-clear" @click="clearFilters">清除筛选</button>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-else-if="mediaList.length > 0" class="media-grid">
        <MediaCard
          v-for="media in mediaList"
          :key="media.id"
          :media="media"
          :show-release-date="false"
          @click="goToDetail(media.id)"
        />
      </div>

      <div v-else class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p>暂无匹配内容</p>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button :disabled="page <= 1" @click="goPage(page - 1)">上一页</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { mediaApi } from '@/api/media';
  import MediaCard from '@/components/MediaCard.vue';
  import type { MediaResource } from '@/types/media';
  import { log } from '@/utils/logger';

  const router = useRouter();

  const types = ref<Array<{ name: string; label: string; count: number }>>([]);
  const genres = ref<Array<{ name: string; count: number }>>([]);
  const sources = ref<Array<{ name: string; count: number }>>([]);
  const mediaList = ref<MediaResource[]>([]);
  const loading = ref(false);
  const page = ref(1);
  const totalPages = ref(1);
  const total = ref(0);

  const selectedType = ref('');
  const selectedGenre = ref('');
  const selectedSource = ref('');

  const typeIconMap: Record<string, string> = {
    movie: '🎬',
    tv_series: '📺',
    tv: '📺',
    variety: '🎭',
    anime: '🎨',
    documentary: '🌍',
    short: '📱',
  };

  const typeLabelMap: Record<string, string> = {
    movie: '电影',
    tv_series: '电视剧',
    tv: '电视剧',
    variety: '综艺',
    anime: '动漫',
    documentary: '纪录片',
    short: '短剧',
  };

  const loadCategories = async () => {
    try {
      const [categoryData, sourceData] = await Promise.all([
        mediaApi.getCategoryStats(),
        mediaApi.getSources(),
      ]);
      types.value = categoryData.types;
      genres.value = categoryData.genres;
      sources.value = sourceData;
    } catch (error) {
      log.error('Categories', '加载分类数据失败:', error);
    }
  };

  const loadMedia = async () => {
    if (!selectedType.value && !selectedGenre.value && !selectedSource.value) {
      mediaList.value = [];
      return;
    }

    loading.value = true;
    try {
      const params: Record<string, any> = {
        page: page.value,
        pageSize: 24,
      };
      if (selectedType.value) {
        params.type = selectedType.value;
      }
      if (selectedGenre.value) {
        params.tags = selectedGenre.value;
      }
      if (selectedSource.value) {
        params.source = selectedSource.value;
      }

      const result = await mediaApi.getMediaList(params);
      mediaList.value = result.data;
      page.value = result.page;
      totalPages.value = result.totalPages;
      total.value = result.total;
    } catch (error) {
      log.error('Categories', '加载媒体列表失败:', error);
      mediaList.value = [];
    } finally {
      loading.value = false;
    }
  };

  const selectType = (name: string) => {
    selectedType.value = selectedType.value === name ? '' : name;
    page.value = 1;
  };

  const selectGenre = (name: string) => {
    selectedGenre.value = selectedGenre.value === name ? '' : name;
    page.value = 1;
  };

  const selectSource = (name: string) => {
    selectedSource.value = selectedSource.value === name ? '' : name;
    page.value = 1;
  };

  const clearFilters = () => {
    selectedType.value = '';
    selectedGenre.value = '';
    selectedSource.value = '';
    page.value = 1;
    mediaList.value = [];
  };

  const goPage = (p: number) => {
    page.value = p;
  };

  const goToDetail = (id: number) => {
    if (id) {
      void router.push(`/media/${id}`);
    }
  };

  watch([selectedType, selectedGenre, selectedSource], () => {
    page.value = 1;
    void loadMedia();
  });

  watch(page, () => {
    void loadMedia();
  });

  onMounted(() => {
    void loadCategories();
  });
</script>

<style scoped>
  .categories-view {
    min-height: 100vh;
    background: var(--bg-page);
    color: var(--text-primary);
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .categories-header {
    margin-bottom: 32px;
  }

  .categories-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
  }

  .categories-subtitle {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-muted);
  }

  .categories-section {
    margin-bottom: 32px;
  }

  .section-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  .type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px 12px;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-primary);
  }

  .type-card:hover {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
    transform: translateY(-2px);
  }

  .type-card.active {
    background: rgba(229, 9, 20, 0.12);
    border-color: var(--border-focus);
    color: var(--color-brand-primary-light);
  }

  .type-icon {
    font-size: 28px;
  }

  .type-name {
    font-size: 14px;
    font-weight: 600;
  }

  .type-count {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .genre-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .genre-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 20px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .genre-chip:hover {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
    color: var(--text-primary);
  }

  .genre-chip.active {
    background: rgba(229, 9, 20, 0.12);
    border-color: var(--border-focus);
    color: var(--color-brand-primary-light);
  }

  .genre-count {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--bg-secondary);
    padding: 1px 6px;
    border-radius: 8px;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
  }

  .filter-tags {
    display: flex;
    gap: 8px;
  }

  .filter-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: rgba(229, 9, 20, 0.12);
    border-radius: 16px;
    font-size: 13px;
    color: var(--color-brand-primary-light);
    cursor: pointer;
  }

  .filter-tag:hover {
    background: rgba(229, 9, 20, 0.2);
  }

  .btn-clear {
    padding: 6px 14px;
    background: none;
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    font-size: 13px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-clear:hover {
    color: var(--text-primary);
    border-color: var(--text-muted);
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px 0;
    color: var(--text-muted);
  }

  .loading-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--bg-tertiary);
    border-top-color: var(--border-focus);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 60px 0;
    color: var(--text-muted);
  }

  .empty-state svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  .empty-state p {
    font-size: 15px;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 32px;
    padding: 16px 0;
  }

  .pagination button {
    padding: 8px 20px;
    background: var(--bg-card);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pagination button:hover:not(:disabled) {
    background: var(--bg-secondary);
    border-color: var(--border-secondary);
  }

  .pagination button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pagination span {
    font-size: 14px;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .type-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .media-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }

    .categories-title {
      font-size: 22px;
    }
  }
</style>
