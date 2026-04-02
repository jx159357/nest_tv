<template>
  <NavigationLayout>
    <div class="space-y-8">
      <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">搜索历史</h1>
          <p class="mt-2 text-sm text-gray-600">集中查看你最近搜索过的关键词，并快速继续探索相关内容。</p>
        </div>
        <button
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || searchHistory.length === 0"
          @click="clearHistory"
        >
          {{ loading ? '处理中...' : '清空搜索历史' }}
        </button>
      </header>

      <section>
        <div v-if="loading" class="py-10 text-center">
          <LoadingSpinner text="加载中..." />
        </div>

        <InlineNotice
          v-else-if="notice"
          :type="notice.type"
          :title="notice.title"
          :message="notice.message"
          dismissible
          @dismiss="clearNotice"
        />

        <div v-else-if="searchHistory.length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10">
          <EmptyState title="暂无搜索历史" description="从首页或顶部搜索框开始搜索后，这里会沉淀你的搜索兴趣。" icon="search" />
        </div>

        <div v-else class="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">最近搜索</h2>
            <div class="mt-4 flex flex-wrap gap-3">
              <button
                v-for="keyword in searchHistory"
                :key="`keyword-${keyword}`"
                type="button"
                class="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                :class="
                  keyword === activeKeyword
                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
                "
                @click="selectKeyword(keyword)"
              >
                {{ keyword }}
              </button>
            </div>
          </section>

          <section class="rounded-2xl bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900">继续探索</h2>
            <p class="mt-2 text-sm text-slate-500">
              {{ activeKeyword ? `基于“${activeKeyword}”的相关搜索建议` : '选择一个最近搜索的关键词后，这里会展示继续探索建议。' }}
            </p>

            <div v-if="relatedLoading" class="py-8 text-center text-sm text-slate-500">正在加载相关建议...</div>
            <div v-else-if="relatedKeywords.length === 0" class="py-8 text-sm text-slate-500">暂无相关建议</div>
            <div v-else class="mt-4 flex flex-wrap gap-3">
              <button
                v-for="keyword in relatedKeywords"
                :key="`related-${keyword}`"
                type="button"
                class="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                @click="searchByKeyword(keyword)"
              >
                {{ keyword }}
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  </NavigationLayout>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { searchApi } from '@/api/search';
  import InlineNotice from '@/components/InlineNotice.vue';
  import NavigationLayout from '@/components/NavigationLayout.vue';
  import LoadingSpinner from '@/components/LoadingSpinner.vue';
  import EmptyState from '@/components/EmptyState.vue';
  import { usePageNotice } from '@/composables/usePageNotice';
  import { getErrorMessage } from '@/utils/error-message';

  const router = useRouter();
  const { notice, setNotice, clearNotice } = usePageNotice();

  const searchHistory = ref<string[]>([]);
  const relatedKeywords = ref<string[]>([]);
  const activeKeyword = ref('');
  const loading = ref(false);
  const relatedLoading = ref(false);

  const loadRelatedKeywords = async (keyword: string) => {
    relatedLoading.value = true;
    try {
      relatedKeywords.value = await searchApi.getRelatedKeywords(keyword, 8);
    } catch (loadError) {
      console.error('加载相关搜索建议失败:', loadError);
      relatedKeywords.value = [];
    } finally {
      relatedLoading.value = false;
    }
  };

  const loadSearchHistory = async () => {
    loading.value = true;
    clearNotice();

    try {
      searchHistory.value = await searchApi.getHistory(20);
      activeKeyword.value = searchHistory.value[0] || '';
      if (activeKeyword.value) {
        await loadRelatedKeywords(activeKeyword.value);
      } else {
        relatedKeywords.value = [];
      }
    } catch (loadError) {
      searchHistory.value = [];
      activeKeyword.value = '';
      relatedKeywords.value = [];
      setNotice('error', getErrorMessage(loadError, '加载搜索历史失败'));
    } finally {
      loading.value = false;
    }
  };

  const selectKeyword = async (keyword: string) => {
    activeKeyword.value = keyword;
    await loadRelatedKeywords(keyword);
  };

  const searchByKeyword = (keyword: string) => {
    void router.push({ path: '/search', query: { q: keyword } });
  };

  const clearHistory = async () => {
    loading.value = true;
    clearNotice();

    try {
      await searchApi.clearHistory();
      searchHistory.value = [];
      activeKeyword.value = '';
      relatedKeywords.value = [];
      setNotice('success', '搜索历史已清空。后续新的搜索会重新沉淀到这里。');
    } catch (clearError) {
      setNotice('error', getErrorMessage(clearError, '清空搜索历史失败'));
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    void loadSearchHistory();
  });
</script>
