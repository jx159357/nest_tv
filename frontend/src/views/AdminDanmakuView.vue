<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">弹幕管理</h1>
        <p class="mt-2 text-gray-600">查看弹幕运行态并维护当前服务进程内的过滤规则。</p>
      </div>
      <button
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        @click="loadDanmakuState"
      >
        刷新
      </button>
    </div>

    <div v-if="notice" class="rounded-xl border px-4 py-3 text-sm" :class="noticeClass">
      {{ notice.message }}
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">活跃房间</div>
        <div class="mt-2 text-2xl font-semibold text-gray-900">
          {{ health?.performance.activeRooms ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">在线连接</div>
        <div class="mt-2 text-2xl font-semibold text-blue-600">
          {{ health?.performance.activeConnections ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">房间消息</div>
        <div class="mt-2 text-2xl font-semibold text-indigo-600">
          {{ health?.performance.totalMessages ?? 0 }}
        </div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">规则级别</div>
        <div class="mt-2 text-2xl font-semibold text-emerald-600">{{ rulesForm.level }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">敏感词条数</div>
        <div class="mt-2 text-2xl font-semibold text-rose-600">{{ sensitiveWordCount }}</div>
      </div>
      <div class="rounded-lg bg-white p-4 shadow">
        <div class="text-sm text-gray-500">垃圾模式数</div>
        <div class="mt-2 text-2xl font-semibold text-amber-600">{{ spamPatternCount }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="rounded-lg bg-white p-6 shadow">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-gray-900">过滤规则</h2>
          <p class="mt-1 text-sm text-gray-500">使用换行分隔规则项，保存后立即影响当前后端进程。</p>
        </div>

        <div class="space-y-4">
          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700">敏感词</span>
            <textarea
              v-model="sensitiveWordsText"
              rows="6"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="每行一个敏感词"
            />
          </label>

          <label class="block">
            <span class="mb-2 block text-sm font-medium text-gray-700">垃圾模式</span>
            <textarea
              v-model="spamPatternsText"
              rows="6"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              placeholder="每行一个正则或匹配片段"
            />
          </label>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-gray-700">规则级别</span>
              <select
                v-model="rulesForm.level"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>

            <label
              class="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700"
            >
              <input v-model="rulesForm.autoBlock" type="checkbox" class="h-4 w-4 rounded" />
              自动拦截命中规则的弹幕
            </label>
          </div>

          <div class="flex justify-end">
            <button
              class="mr-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              :disabled="saving"
              @click="resetRules"
            >
              恢复默认规则
            </button>
            <button
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              :disabled="saving"
              @click="saveRules"
            >
              {{ saving ? '保存中...' : '保存规则' }}
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-lg bg-white p-6 shadow">
        <div class="mb-4">
          <h2 class="text-lg font-semibold text-gray-900">运行状态</h2>
          <p class="mt-1 text-sm text-gray-500">基于当前后端进程的弹幕网关与房间统计。</p>
        </div>

        <div v-if="health" class="space-y-4 text-sm text-gray-700">
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-gray-400">状态</div>
            <div class="mt-1">{{ health.message }}</div>
          </div>
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-gray-400">
              数据库 / WebSocket
            </div>
            <div class="mt-1">{{ health.database }} / {{ health.websocket }}</div>
          </div>
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-gray-400">最后更新</div>
            <div class="mt-1">{{ formatDateTime(health.lastUpdate) }}</div>
          </div>
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-gray-400">
              服务运行时长
            </div>
            <div class="mt-1">{{ formatUptime(health.uptime) }}</div>
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">暂无弹幕运行数据</div>
      </section>
    </div>

    <section class="rounded-lg bg-white p-6 shadow">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">举报弹幕</h2>
          <p class="mt-1 text-sm text-gray-500">
            当前已被举报的弹幕列表，按举报次数和最近举报时间排序。
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <input
            v-model="reportSearch"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="搜索弹幕内容 / 原因 / 视频ID"
          />
          <button
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="loadReportedDanmaku"
          >
            刷新列表
          </button>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          class="rounded-full border px-3 py-1 text-xs font-medium transition"
          :class="
            reportStatusFilter === 'all'
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="reportStatusFilter = 'all'"
        >
          全部
        </button>
        <button
          class="rounded-full border px-3 py-1 text-xs font-medium transition"
          :class="
            reportStatusFilter === 'reported'
              ? 'border-amber-300 bg-amber-50 text-amber-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="reportStatusFilter = 'reported'"
        >
          待处理
        </button>
        <button
          class="rounded-full border px-3 py-1 text-xs font-medium transition"
          :class="
            reportStatusFilter === 'hidden'
              ? 'border-rose-300 bg-rose-50 text-rose-700'
              : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
          "
          @click="reportStatusFilter = 'hidden'"
        >
          已隐藏
        </button>
      </div>

      <div v-if="filteredReportedDanmaku.length === 0" class="text-sm text-gray-500">
        当前筛选下没有举报弹幕。
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="item in filteredReportedDanmaku"
          :key="item.id"
          class="rounded-xl border border-gray-200 px-4 py-3"
        >
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="text-sm font-medium text-gray-900">{{ item.text }}</div>
              <div class="mt-1 text-xs text-gray-500">
                video={{ item.videoId }} · user={{ item.userId }} · 状态={{ item.status }}
              </div>
              <div class="mt-1 text-xs text-gray-500">最新原因：{{ item.latestReason || '—' }}</div>
            </div>
            <div class="text-xs text-gray-500 md:text-right">
              <div>举报 {{ item.reportCount }} 次</div>
              <div class="mt-1">最近：{{ formatDateTime(item.lastReportedAt || undefined) }}</div>
              <div class="mt-2 flex flex-wrap justify-end gap-2">
                <button
                  v-if="item.status !== 'hidden'"
                  class="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                  @click="moderateReportedDanmaku(item.id, 'hide')"
                >
                  隐藏弹幕
                </button>
                <button
                  v-else
                  class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  @click="moderateReportedDanmaku(item.id, 'restore')"
                >
                  恢复显示
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import {
    danmakuApi,
    type DanmakuFilterRulesSnapshot,
    type DanmakuHealthStatus,
    type ReportedDanmakuItem,
  } from '@/api/danmaku';

  const health = ref<DanmakuHealthStatus | null>(null);
  const sensitiveWordsText = ref('');
  const spamPatternsText = ref('');
  const rulesForm = ref<Pick<DanmakuFilterRulesSnapshot, 'level' | 'autoBlock'>>({
    level: 'medium',
    autoBlock: false,
  });
  const reportedDanmaku = ref<ReportedDanmakuItem[]>([]);
  const reportSearch = ref('');
  const reportStatusFilter = ref<'all' | 'reported' | 'hidden'>('all');
  const saving = ref(false);
  const notice = ref<{ type: 'success' | 'error'; message: string } | null>(null);

  const noticeClass = computed(() =>
    notice.value?.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-rose-200 bg-rose-50 text-rose-700',
  );
  const sensitiveWordCount = computed(() => toLines(sensitiveWordsText.value).length);
  const spamPatternCount = computed(() => toLines(spamPatternsText.value).length);
  const filteredReportedDanmaku = computed(() => {
    const keyword = reportSearch.value.trim().toLocaleLowerCase();

    return reportedDanmaku.value.filter(item => {
      const matchesStatus =
        reportStatusFilter.value === 'all' ? true : item.status === reportStatusFilter.value;
      if (!matchesStatus) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [item.text, item.latestReason, item.videoId]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .includes(keyword);
    });
  });

  const toLines = (value: string) =>
    value
      .split(/\r?\n/)
      .map(item => item.trim())
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index);

  const formatDateTime = (value?: string) => {
    if (!value) return '暂无';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '暂无' : parsed.toLocaleString('zh-CN');
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const loadDanmakuState = async () => {
    notice.value = null;

    try {
      const [nextHealth, nextRules, nextReportedDanmaku] = await Promise.all([
        danmakuApi.getHealth(),
        danmakuApi.getFilterRules(),
        danmakuApi.getReportedDanmaku(8),
      ]);

      health.value = nextHealth;
      sensitiveWordsText.value = nextRules.sensitiveWords.join('\n');
      spamPatternsText.value = nextRules.spamPatterns.join('\n');
      rulesForm.value = {
        level: nextRules.level,
        autoBlock: nextRules.autoBlock,
      };
      reportedDanmaku.value = nextReportedDanmaku.data;
    } catch (error: unknown) {
      notice.value = {
        type: 'error',
        message: error instanceof Error ? error.message : '加载弹幕管理数据失败',
      };
    }
  };

  const loadReportedDanmaku = async () => {
    try {
      const response = await danmakuApi.getReportedDanmaku(8);
      reportedDanmaku.value = response.data;
    } catch (error: unknown) {
      notice.value = {
        type: 'error',
        message: error instanceof Error ? error.message : '加载举报弹幕失败',
      };
    }
  };

  const moderateReportedDanmaku = async (id: number, action: 'hide' | 'restore') => {
    try {
      const response = await danmakuApi.moderateDanmaku(id, { action });
      notice.value = {
        type: 'success',
        message: response.message,
      };
      await loadReportedDanmaku();
    } catch (error: unknown) {
      notice.value = {
        type: 'error',
        message: error instanceof Error ? error.message : '处理举报弹幕失败',
      };
    }
  };

  const saveRules = async () => {
    saving.value = true;
    notice.value = null;

    try {
      const response = await danmakuApi.updateFilterRules({
        sensitiveWords: toLines(sensitiveWordsText.value),
        spamPatterns: toLines(spamPatternsText.value),
        level: rulesForm.value.level,
        autoBlock: rulesForm.value.autoBlock,
      });

      sensitiveWordsText.value = response.updatedRules.sensitiveWords.join('\n');
      spamPatternsText.value = response.updatedRules.spamPatterns.join('\n');
      rulesForm.value = {
        level: response.updatedRules.level,
        autoBlock: response.updatedRules.autoBlock,
      };
      notice.value = {
        type: 'success',
        message: '弹幕过滤规则已更新。',
      };
      await loadDanmakuState();
    } catch (error: unknown) {
      notice.value = {
        type: 'error',
        message: error instanceof Error ? error.message : '更新弹幕规则失败',
      };
    } finally {
      saving.value = false;
    }
  };

  const resetRules = async () => {
    saving.value = true;
    notice.value = null;

    try {
      const response = await danmakuApi.resetFilterRules();
      sensitiveWordsText.value = response.updatedRules.sensitiveWords.join('\n');
      spamPatternsText.value = response.updatedRules.spamPatterns.join('\n');
      rulesForm.value = {
        level: response.updatedRules.level,
        autoBlock: response.updatedRules.autoBlock,
      };
      notice.value = {
        type: 'success',
        message: '弹幕过滤规则已恢复默认值。',
      };
      await loadDanmakuState();
    } catch (error: unknown) {
      notice.value = {
        type: 'error',
        message: error instanceof Error ? error.message : '恢复默认规则失败',
      };
    } finally {
      saving.value = false;
    }
  };

  void loadDanmakuState();
</script>
