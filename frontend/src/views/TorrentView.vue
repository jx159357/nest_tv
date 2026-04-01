<template>
  <div class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="mb-3 text-3xl font-bold text-gray-900">磁力资源</h1>
        <p class="text-gray-600">浏览站内已入库磁力源，支持搜索、热门榜、最新榜和磁力链接解析。</p>
      </header>

      <section class="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <div>
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">磁力搜索</h2>
                <p class="mt-1 text-sm text-gray-600">
                  按标题、来源名或媒体描述搜索已入库的磁力资源。
                </p>
              </div>
            </div>

            <form
              class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]"
              @submit.prevent="searchTorrents(1)"
            >
              <input
                v-model="keyword"
                type="text"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="输入关键字，如片名 / 资源组 / infoHash"
              />
              <select
                v-model="category"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">全部分类</option>
                <option value="movie">电影</option>
                <option value="tv_series">电视剧</option>
                <option value="variety">综艺</option>
                <option value="anime">动漫</option>
                <option value="documentary">纪录片</option>
              </select>
              <button
                type="submit"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="searchLoading"
              >
                {{ searchLoading ? '搜索中...' : '搜索' }}
              </button>
            </form>

            <div
              v-if="searchError"
              class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {{ searchError }}
            </div>

            <div class="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div
                class="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                搜索结果
              </div>
              <div v-if="searchLoading" class="px-4 py-10 text-center text-sm text-slate-500">
                加载中...
              </div>
              <div
                v-else-if="searchResults.length === 0"
                class="px-4 py-10 text-center text-sm text-slate-500"
              >
                {{ keyword.trim() ? '没有匹配的磁力资源。' : '先输入关键字开始搜索。' }}
              </div>
              <div v-else class="divide-y divide-slate-200">
                <button
                  v-for="item in searchResults"
                  :key="`${item.infoHash}-${item.mediaResourceId}`"
                  class="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-slate-50"
                  @click="selectTorrent(item.infoHash)"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div class="min-w-0">
                      <div class="truncate font-medium text-slate-900">{{ item.name }}</div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ item.mediaTitle || `媒体 #${item.mediaResourceId}` }} ·
                        {{ item.category || '未分类' }}
                      </div>
                    </div>
                    <div class="flex shrink-0 flex-wrap gap-2 text-xs text-slate-500">
                      <span class="rounded-full bg-slate-100 px-2.5 py-1">{{
                        formatSize(item.size)
                      }}</span>
                      <span class="rounded-full bg-slate-100 px-2.5 py-1"
                        >做种 {{ item.seeders ?? '—' }}</span
                      >
                      <span class="rounded-full bg-slate-100 px-2.5 py-1"
                        >吸血 {{ item.leechers ?? '—' }}</span
                      >
                    </div>
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ item.infoHash }} · 入库 {{ formatDateTime(item.added) }}
                  </div>
                </button>
              </div>
            </div>

            <div
              v-if="searchPagination.totalPages > 1"
              class="mt-4 flex items-center justify-between text-sm text-slate-600"
            >
              <span
                >第 {{ searchPagination.page }} / {{ searchPagination.totalPages }} 页，共
                {{ searchPagination.total }} 条</span
              >
              <div class="flex gap-2">
                <button
                  class="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                  :disabled="searchPagination.page <= 1 || searchLoading"
                  @click="searchTorrents(searchPagination.page - 1)"
                >
                  上一页
                </button>
                <button
                  class="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                  :disabled="searchPagination.page >= searchPagination.totalPages || searchLoading"
                  @click="searchTorrents(searchPagination.page + 1)"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 class="text-xl font-semibold text-gray-900">磁力解析</h2>
            <p class="mt-1 text-sm text-gray-600">
              粘贴 magnet 链接，快速查看解析出的 infoHash、tracker 和 web seed。
            </p>

            <form class="mt-4 space-y-3" @submit.prevent="parseMagnetUri">
              <textarea
                v-model="magnetInput"
                rows="6"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="magnet:?xt=urn:btih:..."
              />
              <button
                type="submit"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="parseLoading"
              >
                {{ parseLoading ? '解析中...' : '解析磁力链接' }}
              </button>
            </form>

            <div
              v-if="parseError"
              class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {{ parseError }}
            </div>

            <div
              v-if="parsedMagnet"
              class="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
            >
              <div>
                <span class="font-medium text-slate-900">名称：</span
                >{{ parsedMagnet.name || '未命名' }}
              </div>
              <div>
                <span class="font-medium text-slate-900">InfoHash：</span
                >{{ parsedMagnet.infoHash }}
              </div>
              <div>
                <span class="font-medium text-slate-900">Tracker：</span
                >{{ parsedMagnet.announce.length }}
              </div>
              <div>
                <span class="font-medium text-slate-900">Web Seed：</span
                >{{ parsedMagnet.urlList.length }}
              </div>
              <div>
                <span class="font-medium text-slate-900">关键字：</span
                >{{ parsedMagnet.keywords.join(' / ') || '无' }}
              </div>
              <div class="flex flex-wrap gap-2 pt-1">
                <button
                  class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                  @click="queueParsedMagnetTask"
                >
                  加入下载任务
                </button>
                <RouterLink
                  to="/downloads"
                  class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  查看下载任务
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)_minmax(360px,1fr)]"
      >
        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">热门磁力</h2>
              <p class="mt-1 text-sm text-gray-600">按播放热度排序</p>
            </div>
            <button class="text-sm text-blue-600 hover:underline" @click="loadPopularTorrents">
              刷新
            </button>
          </div>
          <div v-if="popularLoading" class="py-8 text-center text-sm text-slate-500">加载中...</div>
          <div v-else class="space-y-3">
            <button
              v-for="item in popularTorrents"
              :key="`popular-${item.infoHash}`"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="selectTorrent(item.infoHash)"
            >
              <div class="font-medium text-slate-900">{{ item.name }}</div>
              <div class="mt-1 text-xs text-slate-500">
                做种 {{ item.seeders ?? '—' }} · {{ formatSize(item.size) }}
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">最新磁力</h2>
              <p class="mt-1 text-sm text-gray-600">按入库时间排序</p>
            </div>
            <button class="text-sm text-blue-600 hover:underline" @click="loadLatestTorrents">
              刷新
            </button>
          </div>
          <div v-if="latestLoading" class="py-8 text-center text-sm text-slate-500">加载中...</div>
          <div v-else class="space-y-3">
            <button
              v-for="item in latestTorrents"
              :key="`latest-${item.infoHash}`"
              class="w-full rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-slate-50"
              @click="selectTorrent(item.infoHash)"
            >
              <div class="font-medium text-slate-900">{{ item.name }}</div>
              <div class="mt-1 text-xs text-slate-500">
                {{ formatDateTime(item.added) }} · {{ item.category || '未分类' }}
              </div>
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <div class="mb-4">
            <h2 class="text-xl font-semibold text-gray-900">磁力详情</h2>
            <p class="mt-1 text-sm text-gray-600">查看已入库磁力的详细信息、健康状态和关联媒体。</p>
          </div>

          <div v-if="selectedLoading" class="py-10 text-center text-sm text-slate-500">
            加载详情中...
          </div>
          <div
            v-else-if="selectedError"
            class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ selectedError }}
          </div>
          <div v-else-if="selectedInfo" class="space-y-4 text-sm text-slate-700">
            <div>
              <div class="text-lg font-semibold text-slate-900">
                {{ selectedInfo.name || selectedInfo.infoHash }}
              </div>
              <div class="mt-1 text-xs text-slate-500">{{ selectedInfo.infoHash }}</div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-xs text-slate-500">关联源数</div>
                <div class="mt-1 text-lg font-semibold text-slate-900">
                  {{ selectedInfo.relatedSourcesCount }}
                </div>
              </div>
              <div class="rounded-xl bg-slate-50 p-3">
                <div class="text-xs text-slate-500">体积</div>
                <div class="mt-1 text-lg font-semibold text-slate-900">
                  {{ formatSize(selectedInfo.size) }}
                </div>
              </div>
            </div>

            <div v-if="selectedHealth" class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-2 text-sm font-medium text-slate-900">健康状态</div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span
                  :class="[
                    'rounded-full px-2.5 py-1 font-medium',
                    selectedHealth.isHealthy
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700',
                  ]"
                >
                  {{ selectedHealth.isHealthy ? '可用' : '异常' }}
                </span>
                <span class="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700"
                  >做种 {{ selectedHealth.seeders ?? '—' }}</span
                >
                <span class="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700"
                  >吸血 {{ selectedHealth.leechers ?? '—' }}</span
                >
              </div>
              <div class="mt-2 text-xs text-slate-500">
                最近校验 {{ formatDateTime(selectedHealth.lastChecked) }}
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-2 text-sm font-medium text-slate-900">快速操作</div>
              <div class="flex flex-wrap gap-2">
                <button
                  class="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  @click="copyMagnetUri"
                >
                  复制 Magnet
                </button>
                <button
                  class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  @click="copyInfoHash"
                >
                  复制 Hash
                </button>
                <button
                  class="rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  @click="queueSelectedTorrentTask"
                >
                  加入下载任务
                </button>
                <button
                  class="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  @click="openMagnetInClient"
                >
                  启动本地客户端
                </button>
                <RouterLink
                  to="/downloads"
                  class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  查看下载任务
                </RouterLink>
              </div>
              <div class="mt-3 text-xs text-slate-500">
                Tracker {{ selectedInfo.announce.length }} · Web Seed
                {{ selectedInfo.urlList.length }} · 关键字 {{ selectedInfo.keywords.length }}
              </div>
              <div
                v-if="actionMessage"
                class="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              >
                {{ actionMessage }}
              </div>
            </div>

            <div>
              <div class="mb-2 text-sm font-medium text-slate-900">关联媒体</div>
              <div v-if="selectedInfo.linkedMedia.length === 0" class="text-xs text-slate-500">
                暂无关联媒体
              </div>
              <div v-else class="space-y-2">
                <RouterLink
                  v-for="media in selectedInfo.linkedMedia"
                  :key="media.id"
                  :to="{ name: 'media-detail', params: { id: media.id } }"
                  class="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
                >
                  <div>
                    <div class="font-medium text-slate-900">{{ media.title }}</div>
                    <div class="text-xs text-slate-500">{{ media.type }}</div>
                  </div>
                  <span class="text-xs text-blue-600">打开</span>
                </RouterLink>
              </div>
            </div>

            <details class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary class="cursor-pointer text-sm font-medium text-slate-900">
                文件列表（{{ selectedInfo.files.length }}）
              </summary>
              <div class="mt-3 space-y-2 text-xs text-slate-600">
                <div
                  v-for="file in selectedInfo.files"
                  :key="file.name"
                  class="rounded-lg bg-white px-3 py-2"
                >
                  {{ file.name }}<span v-if="file.size"> · {{ formatSize(file.size) }}</span>
                </div>
              </div>
            </details>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div class="mb-2 text-sm font-medium text-slate-900">最近操作</div>
              <div v-if="recentActions.length === 0" class="text-xs text-slate-500">
                暂无最近操作记录
              </div>
              <div v-else class="space-y-2 text-xs text-slate-600">
                <div
                  v-for="item in recentActions"
                  :key="`${item.infoHash}-${item.timestamp}`"
                  class="rounded-lg bg-white px-3 py-2"
                >
                  {{ item.action }} · {{ item.infoHash }} · {{ formatDateTime(item.timestamp) }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-10 text-center text-sm text-slate-500">
            从左侧搜索结果或榜单中选择一个磁力资源。
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { RouterLink } from 'vue-router';
  import {
    torrentApi,
    type ParsedMagnetResult,
    type TorrentHealthResult,
    type TorrentInfoResult,
    type TorrentListItem,
  } from '@/api/torrent';
  import { useDownloadsStore } from '@/stores/downloads';

  const keyword = ref('');
  const category = ref('');
  const magnetInput = ref('');
  const downloadsStore = useDownloadsStore();

  const searchResults = ref<TorrentListItem[]>([]);
  const searchPagination = ref({ page: 1, totalPages: 1, total: 0, pageSize: 10 });
  const popularTorrents = ref<TorrentListItem[]>([]);
  const latestTorrents = ref<TorrentListItem[]>([]);
  const selectedInfo = ref<TorrentInfoResult | null>(null);
  const selectedHealth = ref<TorrentHealthResult | null>(null);
  const parsedMagnet = ref<ParsedMagnetResult | null>(null);
  const recentActions = ref<Array<{ infoHash: string; action: string; timestamp: string }>>([]);
  const actionMessage = ref<string | null>(null);

  const searchLoading = ref(false);
  const popularLoading = ref(false);
  const latestLoading = ref(false);
  const selectedLoading = ref(false);
  const parseLoading = ref(false);

  const searchError = ref<string | null>(null);
  const selectedError = ref<string | null>(null);
  const parseError = ref<string | null>(null);

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleString('zh-CN');
  };
  const recordRecentAction = (infoHash: string, action: string) => {
    recentActions.value = [
      {
        infoHash,
        action,
        timestamp: new Date().toISOString(),
      },
      ...recentActions.value,
    ].slice(0, 8);
  };

  const getSelectedMagnetUri = () => {
    if (!selectedInfo.value) {
      return '';
    }

    if (selectedInfo.value.magnetUri) {
      return selectedInfo.value.magnetUri;
    }

    const segments = [`magnet:?xt=urn:btih:${selectedInfo.value.infoHash}`];
    if (selectedInfo.value.name) {
      segments.push(`dn=${encodeURIComponent(selectedInfo.value.name)}`);
    }

    selectedInfo.value.announce.forEach(item => {
      segments.push(`tr=${encodeURIComponent(item)}`);
    });

    selectedInfo.value.urlList.forEach(item => {
      segments.push(`ws=${encodeURIComponent(item)}`);
    });

    return segments.join('&');
  };

  const queueMagnetTask = (options: {
    magnetUri: string;
    name: string;
    infoHash: string;
    sourceLabel: string;
    mediaResourceId?: number | null;
    autoStart?: boolean;
  }) => {
    if (!options.magnetUri) {
      actionMessage.value = '当前磁力链接不可用';
      return null;
    }

    const task = downloadsStore.enqueueTask({
      url: options.magnetUri,
      fileName: options.name || options.infoHash,
      type: 'magnet',
      sourceLabel: options.sourceLabel,
      mediaResourceId: options.mediaResourceId,
      metadata: {
        title: options.name,
        description: `InfoHash: ${options.infoHash}`,
      },
    });

    if (options.autoStart) {
      downloadsStore.startTask(task.id);
    }

    actionMessage.value = options.autoStart
      ? `已加入下载任务并尝试启动本地客户端：${task.fileName}`
      : `已加入下载任务：${task.fileName}`;
    recordRecentAction(options.infoHash, options.autoStart ? '启动本地客户端' : '加入下载任务');
    return task;
  };

  const copyText = async (value: string, successMessage: string, action: string, infoHash: string) => {
    try {
      await navigator.clipboard.writeText(value);
      actionMessage.value = successMessage;
      recordRecentAction(infoHash, action);
    } catch {
      actionMessage.value = '复制失败，请手动处理';
    }
  };

  const copyMagnetUri = async () => {
    if (!selectedInfo.value) {
      actionMessage.value = '请先选择一个磁力资源';
      return;
    }

    await copyText(
      getSelectedMagnetUri(),
      'Magnet 链接已复制到剪贴板。',
      '复制 Magnet',
      selectedInfo.value.infoHash,
    );
  };

  const copyInfoHash = async () => {
    if (!selectedInfo.value) {
      actionMessage.value = '请先选择一个磁力资源';
      return;
    }

    await copyText(
      selectedInfo.value.infoHash,
      'InfoHash 已复制到剪贴板。',
      '复制 Hash',
      selectedInfo.value.infoHash,
    );
  };

  const queueSelectedTorrentTask = () => {
    if (!selectedInfo.value) {
      actionMessage.value = '请先选择一个磁力资源';
      return;
    }

    queueMagnetTask({
      magnetUri: getSelectedMagnetUri(),
      name: selectedInfo.value.name || selectedInfo.value.infoHash,
      infoHash: selectedInfo.value.infoHash,
      sourceLabel: '磁力资源页',
      mediaResourceId: selectedInfo.value.linkedMedia[0]?.id ?? null,
    });
  };

  const queueParsedMagnetTask = () => {
    if (!parsedMagnet.value || !magnetInput.value.trim()) {
      actionMessage.value = '请先解析一个 magnet 链接';
      return;
    }

    queueMagnetTask({
      magnetUri: magnetInput.value.trim(),
      name: parsedMagnet.value.name || parsedMagnet.value.infoHash,
      infoHash: parsedMagnet.value.infoHash,
      sourceLabel: '磁力解析',
    });
  };

  const openMagnetInClient = () => {
    if (!selectedInfo.value) {
      actionMessage.value = '请先选择一个磁力资源';
      return;
    }

    queueMagnetTask({
      magnetUri: getSelectedMagnetUri(),
      name: selectedInfo.value.name || selectedInfo.value.infoHash,
      infoHash: selectedInfo.value.infoHash,
      sourceLabel: '磁力资源页',
      mediaResourceId: selectedInfo.value.linkedMedia[0]?.id ?? null,
      autoStart: true,
    });
  };


  const formatSize = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return value;
      }
      value = parsed;
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const searchTorrents = async (page = 1) => {
    if (!keyword.value.trim()) {
      searchResults.value = [];
      searchPagination.value = { page: 1, totalPages: 1, total: 0, pageSize: 10 };
      return;
    }

    searchLoading.value = true;
    searchError.value = null;
    try {
      const response = await torrentApi.search({
        keyword: keyword.value.trim(),
        page,
        pageSize: 10,
      });

      const filtered = category.value
        ? response.data.filter(item => item.category === category.value)
        : response.data;

      searchResults.value = filtered;
      searchPagination.value = {
        page: response.page,
        totalPages: Math.max(response.totalPages, 1),
        total: category.value ? filtered.length : response.total,
        pageSize: response.pageSize,
      };
    } catch (error: unknown) {
      searchError.value = getErrorMessage(error, '搜索磁力资源失败');
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  };

  const loadPopularTorrents = async () => {
    popularLoading.value = true;
    try {
      popularTorrents.value = await torrentApi.getPopular({
        limit: 8,
        category: category.value || undefined,
      });
    } catch {
      popularTorrents.value = [];
    } finally {
      popularLoading.value = false;
    }
  };

  const loadLatestTorrents = async () => {
    latestLoading.value = true;
    try {
      latestTorrents.value = await torrentApi.getLatest({
        limit: 8,
        category: category.value || undefined,
      });
    } catch {
      latestTorrents.value = [];
    } finally {
      latestLoading.value = false;
    }
  };

  const selectTorrent = async (hash: string) => {
    selectedLoading.value = true;
    selectedError.value = null;
    try {
      const [info, health] = await Promise.all([
        torrentApi.getInfo(hash),
        torrentApi.getHealth(hash),
      ]);
      selectedInfo.value = info;
      selectedHealth.value = health;
    } catch (error: unknown) {
      selectedError.value = getErrorMessage(error, '加载磁力详情失败');
      selectedInfo.value = null;
      selectedHealth.value = null;
    } finally {
      selectedLoading.value = false;
    }
  };

  const parseMagnetUri = async () => {
    if (!magnetInput.value.trim()) {
      parseError.value = '请先输入 magnet 链接';
      return;
    }

    parseLoading.value = true;
    parseError.value = null;
    try {
      parsedMagnet.value = await torrentApi.parseMagnet(magnetInput.value.trim());
      if (parsedMagnet.value.infoHash) {
        await selectTorrent(parsedMagnet.value.infoHash);
      }
    } catch (error: unknown) {
      parsedMagnet.value = null;
      parseError.value = getErrorMessage(error, '解析 magnet 链接失败');
    } finally {
      parseLoading.value = false;
    }
  };

  onMounted(() => {
    void loadPopularTorrents();
    void loadLatestTorrents();
  });
</script>

