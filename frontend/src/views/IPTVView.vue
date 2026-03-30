<template>
  <div class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="mb-3 text-3xl font-bold text-gray-900">IPTV 频道</h1>
        <p class="text-gray-600">浏览、筛选和校验已入库 IPTV 频道，并支持从 M3U 链接快速导入。</p>
      </header>

      <section class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-slate-500">频道总数</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">
            {{ stats?.totalChannels || 0 }}
          </div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-slate-500">活跃频道</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">
            {{ stats?.activeChannels || 0 }}
          </div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-slate-500">频道分组</div>
          <div class="mt-2 text-3xl font-semibold text-slate-900">
            {{ stats?.totalGroups || 0 }}
          </div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-slate-500">当前筛选</div>
          <div class="mt-2 text-base font-semibold text-slate-900">
            {{ selectedGroup || '全部分组' }}
          </div>
          <div class="mt-1 text-xs text-slate-500">
            {{ activeOnly ? '仅看活跃频道' : '包含停用频道' }}
          </div>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm">
          <div class="text-sm text-slate-500">校验操作</div>
          <button
            class="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            :disabled="selectedChannelId === null || validatingChannel"
            @click="validateSelectedChannel"
          >
            {{ validatingChannel ? '校验中...' : '校验当前频道' }}
          </button>
        </div>
      </section>

      <section class="mb-8 rounded-2xl bg-white p-6 shadow-sm">
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <div>
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-gray-900">频道检索</h2>
                <p class="mt-1 text-sm text-gray-600">按名称、分组、国家、清晰度检索 IPTV 频道。</p>
              </div>
            </div>

            <form
              class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5"
              @submit.prevent="loadChannels(1)"
            >
              <input
                v-model="search"
                type="text"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="搜索频道名 / 描述 / 分组"
              />
              <select
                v-model="selectedGroup"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">全部分组</option>
                <option v-for="group in groups" :key="group" :value="group">{{ group }}</option>
              </select>
              <input
                v-model="country"
                type="text"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="国家，如 CN"
              />
              <input
                v-model="resolution"
                type="text"
                class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="清晰度，如 1080p"
              />
              <button
                type="submit"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="loading"
              >
                {{ loading ? '加载中...' : '筛选频道' }}
              </button>
            </form>

            <label class="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                v-model="activeOnly"
                type="checkbox"
                class="rounded border-slate-300"
                @change="loadChannels(1)"
              />
              仅看活跃频道
            </label>

            <div
              v-if="pageError"
              class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {{ pageError }}
            </div>

            <div class="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div
                class="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                频道列表
              </div>
              <div v-if="loading" class="px-4 py-10 text-center text-sm text-slate-500">
                加载中...
              </div>
              <div
                v-else-if="channels.length === 0"
                class="px-4 py-10 text-center text-sm text-slate-500"
              >
                暂无匹配频道
              </div>
              <div v-else class="divide-y divide-slate-200">
                <button
                  v-for="channel in channels"
                  :key="channel.id"
                  class="flex w-full flex-col gap-2 px-4 py-4 text-left transition hover:bg-slate-50"
                  :class="channel.id === selectedChannelId ? 'bg-blue-50/70' : ''"
                  @click="selectChannel(channel.id)"
                >
                  <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div class="min-w-0">
                      <div class="truncate font-medium text-slate-900">{{ channel.name }}</div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ channel.group }} · {{ channel.country || '未知国家' }} ·
                        {{ channel.language || '未知语言' }}
                      </div>
                    </div>
                    <div class="flex shrink-0 flex-wrap gap-2 text-xs">
                      <span
                        :class="[
                          'rounded-full px-2.5 py-1 font-medium',
                          channel.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600',
                        ]"
                      >
                        {{ channel.isActive ? '活跃' : '停用' }}
                      </span>
                      <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                        {{ channel.resolution || channel.streamFormat || '未标记' }}
                      </span>
                    </div>
                  </div>
                  <div class="text-xs text-slate-400">
                    {{ channel.url }}
                  </div>
                </button>
              </div>
            </div>

            <div
              v-if="pagination.totalPages > 1"
              class="mt-4 flex items-center justify-between text-sm text-slate-600"
            >
              <span
                >第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共
                {{ pagination.total }} 条</span
              >
              <div class="flex gap-2">
                <button
                  class="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                  :disabled="pagination.page <= 1 || loading"
                  @click="loadChannels(pagination.page - 1)"
                >
                  上一页
                </button>
                <button
                  class="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-50"
                  :disabled="pagination.page >= pagination.totalPages || loading"
                  @click="loadChannels(pagination.page + 1)"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 class="text-xl font-semibold text-gray-900">M3U 导入</h2>
            <p class="mt-1 text-sm text-gray-600">
              输入 M3U 播放列表地址，快速导入新的 IPTV 频道。
            </p>

            <form class="mt-4 space-y-3" @submit.prevent="importM3UPlaylist">
              <input
                v-model="m3uUrl"
                type="url"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="https://example.com/playlist.m3u"
              />
              <button
                type="submit"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                :disabled="importing"
              >
                {{ importing ? '导入中...' : '导入 M3U' }}
              </button>
            </form>

            <div
              v-if="importMessage"
              class="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              {{ importMessage }}
            </div>

            <div class="mt-6 space-y-4">
              <div>
                <div class="mb-2 text-sm font-medium text-slate-900">热门频道</div>
                <div class="space-y-2 text-sm text-slate-600">
                  <button
                    v-for="channel in stats?.popularChannels || []"
                    :key="`popular-${channel.id}`"
                    class="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                    @click="selectChannel(channel.id)"
                  >
                    <span>{{ channel.name }}</span>
                    <span class="text-xs text-slate-400">{{ channel.viewCount }}</span>
                  </button>
                </div>
              </div>

              <div>
                <div class="mb-2 text-sm font-medium text-slate-900">最近导入</div>
                <div class="space-y-2 text-sm text-slate-600">
                  <button
                    v-for="channel in stats?.recentChannels || []"
                    :key="`recent-${channel.id}`"
                    class="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:bg-slate-50"
                    @click="selectChannel(channel.id)"
                  >
                    <span>{{ channel.name }}</span>
                    <span class="text-xs text-slate-400">{{
                      formatDateTime(channel.createdAt)
                    }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-xl font-semibold text-gray-900">频道详情</h2>

        <div v-if="selectedLoading" class="py-10 text-center text-sm text-slate-500">
          加载详情中...
        </div>
        <div
          v-else-if="selectedError"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ selectedError }}
        </div>
        <div
          v-else-if="selectedChannel"
          class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]"
        >
          <div class="space-y-4">
            <div>
              <div class="text-2xl font-semibold text-slate-900">{{ selectedChannel.name }}</div>
              <div class="mt-2 flex flex-wrap gap-2 text-xs">
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{{
                  selectedChannel.group
                }}</span>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{{
                  selectedChannel.country || '未知国家'
                }}</span>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{{
                  selectedChannel.language || '未知语言'
                }}</span>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{{
                  selectedChannel.resolution || selectedChannel.streamFormat || '未标记'
                }}</span>
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <div>
                <span class="font-medium text-slate-900">主流地址：</span>{{ selectedChannel.url }}
              </div>
              <div class="mt-2">
                <span class="font-medium text-slate-900">描述：</span
                >{{ selectedChannel.description || '暂无描述' }}
              </div>
              <div class="mt-2">
                <span class="font-medium text-slate-900">最近校验：</span
                >{{ formatDateTime(selectedChannel.lastCheckedAt) }}
              </div>
            </div>

            <div
              v-if="selectedChannel.backupUrls && selectedChannel.backupUrls.length > 0"
              class="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
            >
              <div class="mb-2 font-medium text-slate-900">备用地址</div>
              <div class="space-y-2">
                <div
                  v-for="item in selectedChannel.backupUrls"
                  :key="item"
                  class="rounded-lg bg-white px-3 py-2 text-xs text-slate-600"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div class="text-sm font-medium text-slate-900">操作</div>
            <div class="mt-4 space-y-3 text-sm">
              <button
                class="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="validatingChannel"
                @click="validateSelectedChannel"
              >
                {{ validatingChannel ? '校验中...' : '校验频道可用性' }}
              </button>
              <button
                class="w-full rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-white"
                @click="openChannelUrl(selectedChannel.url)"
              >
                在新窗口打开主流
              </button>
            </div>

            <div
              class="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
            >
              <div>
                <span class="font-medium text-slate-900">观看数：</span
                >{{ selectedChannel.viewCount }}
              </div>
              <div class="mt-2">
                <span class="font-medium text-slate-900">创建时间：</span
                >{{ formatDateTime(selectedChannel.createdAt) }}
              </div>
              <div class="mt-2">
                <span class="font-medium text-slate-900">更新时间：</span
                >{{ formatDateTime(selectedChannel.updatedAt) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="py-10 text-center text-sm text-slate-500">
          从上方频道列表中选择一个频道查看详情。
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { iptvApi, type IPTVChannel, type IPTVStats } from '@/api/iptv';

  const channels = ref<IPTVChannel[]>([]);
  const groups = ref<string[]>([]);
  const stats = ref<IPTVStats | null>(null);
  const selectedChannel = ref<IPTVChannel | null>(null);
  const selectedChannelId = ref<number | null>(null);

  const search = ref('');
  const selectedGroup = ref('');
  const country = ref('');
  const resolution = ref('');
  const activeOnly = ref(true);
  const m3uUrl = ref('');

  const loading = ref(false);
  const selectedLoading = ref(false);
  const validatingChannel = ref(false);
  const importing = ref(false);

  const pageError = ref<string | null>(null);
  const selectedError = ref<string | null>(null);
  const importMessage = ref<string | null>(null);

  const pagination = ref({ page: 1, totalPages: 1, total: 0, limit: 10 });

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

  const getErrorMessage = (error: unknown, fallback: string) => {
    return error instanceof Error ? error.message : fallback;
  };

  const loadGroups = async () => {
    try {
      groups.value = await iptvApi.getGroups();
    } catch {
      groups.value = [];
    }
  };

  const loadStats = async () => {
    try {
      stats.value = await iptvApi.getStats();
    } catch {
      stats.value = null;
    }
  };

  const loadChannels = async (page = pagination.value.page) => {
    loading.value = true;
    pageError.value = null;
    try {
      const response = await iptvApi.getChannels({
        page,
        limit: 12,
        group: selectedGroup.value || undefined,
        country: country.value || undefined,
        resolution: resolution.value || undefined,
        activeOnly: activeOnly.value,
        search: search.value || undefined,
      });

      channels.value = response.data;
      pagination.value = {
        page: response.page,
        totalPages: Math.max(response.totalPages, 1),
        total: response.total,
        limit: response.limit,
      };
    } catch (error: unknown) {
      channels.value = [];
      pageError.value = getErrorMessage(error, '加载 IPTV 频道失败');
    } finally {
      loading.value = false;
    }
  };

  const selectChannel = async (id: number) => {
    selectedLoading.value = true;
    selectedError.value = null;
    selectedChannelId.value = id;
    try {
      selectedChannel.value = await iptvApi.getChannel(id);
    } catch (error: unknown) {
      selectedChannel.value = null;
      selectedError.value = getErrorMessage(error, '加载频道详情失败');
    } finally {
      selectedLoading.value = false;
    }
  };

  const validateSelectedChannel = async () => {
    if (!selectedChannelId.value) {
      return;
    }

    validatingChannel.value = true;
    try {
      const result = await iptvApi.validateChannel(selectedChannelId.value);
      importMessage.value = result.isValid ? '频道校验通过' : '频道当前不可用';
      await Promise.all([
        loadChannels(pagination.value.page),
        loadStats(),
        selectChannel(selectedChannelId.value),
      ]);
    } catch (error: unknown) {
      importMessage.value = getErrorMessage(error, '频道校验失败');
    } finally {
      validatingChannel.value = false;
    }
  };

  const importM3UPlaylist = async () => {
    if (!m3uUrl.value.trim()) {
      importMessage.value = '请先输入 M3U 地址';
      return;
    }

    importing.value = true;
    try {
      const channels = await iptvApi.importFromM3U(m3uUrl.value.trim());
      importMessage.value = `已导入 ${channels.length} 个频道`;
      await Promise.all([loadChannels(1), loadGroups(), loadStats()]);
    } catch (error: unknown) {
      importMessage.value = getErrorMessage(error, 'M3U 导入失败');
    } finally {
      importing.value = false;
    }
  };

  const openChannelUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  onMounted(() => {
    void Promise.all([loadGroups(), loadStats(), loadChannels(1)]);
  });
</script>
