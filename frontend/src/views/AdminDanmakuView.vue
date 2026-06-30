<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--text-primary)">弹幕管理</h1>
        <p class="mt-2" style="color: var(--text-muted)">
          查看弹幕运行态并维护当前服务进程内的过滤规则。
        </p>
      </div>
      <button class="btn-secondary" @click="loadDanmakuState">刷新</button>
    </div>

    <div v-if="notice" class="rounded-xl border px-4 py-3 text-sm" :class="noticeClass">
      {{ notice.message }}
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <div class="dm-stat-card">
        <div class="dm-stat-label">活跃房间</div>
        <div class="dm-stat-value">{{ health?.performance.activeRooms ?? 0 }}</div>
      </div>
      <div class="dm-stat-card">
        <div class="dm-stat-label">在线连接</div>
        <div class="dm-stat-value dm-stat-blue">
          {{ health?.performance.activeConnections ?? 0 }}
        </div>
      </div>
      <div class="dm-stat-card">
        <div class="dm-stat-label">房间消息</div>
        <div class="dm-stat-value dm-stat-indigo">{{ health?.performance.totalMessages ?? 0 }}</div>
      </div>
      <div class="dm-stat-card">
        <div class="dm-stat-label">规则级别</div>
        <div class="dm-stat-value dm-stat-emerald">{{ rulesForm.level }}</div>
      </div>
      <div class="dm-stat-card">
        <div class="dm-stat-label">敏感词条数</div>
        <div class="dm-stat-value dm-stat-rose">{{ sensitiveWordCount }}</div>
      </div>
      <div class="dm-stat-card">
        <div class="dm-stat-label">垃圾模式数</div>
        <div class="dm-stat-value dm-stat-amber">{{ spamPatternCount }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="dm-section">
        <div class="mb-4">
          <h2 class="dm-section-title">过滤规则</h2>
          <p class="dm-section-desc">使用换行分隔规则项，保存后立即影响当前后端进程。</p>
        </div>

        <div class="space-y-4">
          <label class="block">
            <span class="dm-label">敏感词</span>
            <textarea
              v-model="sensitiveWordsText"
              rows="6"
              class="dm-textarea"
              placeholder="每行一个敏感词"
            />
          </label>

          <label class="block">
            <span class="dm-label">垃圾模式</span>
            <textarea
              v-model="spamPatternsText"
              rows="6"
              class="dm-textarea"
              placeholder="每行一个正则或匹配片段"
            />
          </label>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="block">
              <span class="dm-label">规则级别</span>
              <select v-model="rulesForm.level" class="dm-select">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>

            <label class="dm-checkbox-label">
              <input v-model="rulesForm.autoBlock" type="checkbox" class="h-4 w-4 rounded" />
              自动拦截命中规则的弹幕
            </label>
          </div>

          <div class="flex justify-end">
            <button
              class="btn-secondary mr-3 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="saving"
              @click="
                showConfirm(
                  '确定要恢复默认过滤规则吗？当前自定义规则将被覆盖。',
                  resetRules,
                  '恢复默认规则',
                  '恢复默认',
                )
              "
            >
              恢复默认规则
            </button>
            <button
              class="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="saving"
              @click="saveRules"
            >
              {{ saving ? '保存中...' : '保存规则' }}
            </button>
          </div>
        </div>
      </section>

      <section class="dm-section">
        <div class="mb-4">
          <h2 class="dm-section-title">运行状态</h2>
          <p class="dm-section-desc">基于当前后端进程的弹幕网关与房间统计。</p>
        </div>

        <div v-if="health" class="space-y-4 text-sm" style="color: var(--text-secondary)">
          <div>
            <div class="dm-kv-label">状态</div>
            <div class="mt-1">{{ health.message }}</div>
          </div>
          <div>
            <div class="dm-kv-label">数据库 / WebSocket</div>
            <div class="mt-1">{{ health.database }} / {{ health.websocket }}</div>
          </div>
          <div>
            <div class="dm-kv-label">最后更新</div>
            <div class="mt-1">{{ formatDateTime(health.lastUpdate) }}</div>
          </div>
          <div>
            <div class="dm-kv-label">服务运行时长</div>
            <div class="mt-1">{{ formatUptime(health.uptime) }}</div>
          </div>
        </div>
        <EmptyState
          v-else
          title="暂无弹幕运行数据"
          description="弹幕网关尚未返回运行状态"
          icon="document"
        />
      </section>
    </div>

    <section class="dm-section">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="dm-section-title">举报弹幕</h2>
          <p class="dm-section-desc">当前已被举报的弹幕列表，按举报次数和最近举报时间排序。</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <input
            v-model="reportSearch"
            type="text"
            class="dm-input"
            placeholder="搜索弹幕内容 / 原因 / 视频ID"
          />
          <button class="btn-secondary" @click="loadReportedDanmaku">刷新列表</button>
        </div>
      </div>

      <div class="mb-4 flex flex-wrap gap-2">
        <button
          class="dm-filter-chip"
          :class="reportStatusFilter === 'all' ? 'dm-filter-chip-active' : ''"
          @click="reportStatusFilter = 'all'"
        >
          全部
        </button>
        <button
          class="dm-filter-chip"
          :class="reportStatusFilter === 'reported' ? 'dm-filter-chip-amber' : ''"
          @click="reportStatusFilter = 'reported'"
        >
          待处理
        </button>
        <button
          class="dm-filter-chip"
          :class="reportStatusFilter === 'hidden' ? 'dm-filter-chip-rose' : ''"
          @click="reportStatusFilter = 'hidden'"
        >
          已隐藏
        </button>
      </div>

      <EmptyState
        v-if="filteredReportedDanmaku.length === 0"
        title="暂无举报弹幕"
        description="当前筛选条件下没有举报弹幕"
        icon="document"
      />
      <div v-else class="space-y-3">
        <div v-for="item in filteredReportedDanmaku" :key="item.id" class="dm-report-item">
          <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="text-sm font-medium" style="color: var(--text-primary)">
                {{ item.text }}
              </div>
              <div class="mt-1 text-xs" style="color: var(--text-muted)">
                video={{ item.videoId }} · user={{ item.userId }} · 状态={{ item.status }}
              </div>
              <div class="mt-1 text-xs" style="color: var(--text-muted)">
                最新原因：{{ item.latestReason || '—' }}
              </div>
            </div>
            <div class="text-xs md:text-right" style="color: var(--text-muted)">
              <div>举报 {{ item.reportCount }} 次</div>
              <div class="mt-1">最近：{{ formatDateTime(item.lastReportedAt || undefined) }}</div>
              <div class="mt-2 flex flex-wrap justify-end gap-2">
                <button
                  v-if="item.status !== 'hidden'"
                  class="dm-action-btn dm-action-rose"
                  @click="
                    showConfirm(
                      '确定要隐藏该弹幕吗？隐藏后其他用户将无法看到此弹幕。',
                      () => moderateReportedDanmaku(item.id, 'hide'),
                      '隐藏弹幕',
                      '隐藏',
                    )
                  "
                >
                  隐藏弹幕
                </button>
                <button
                  v-else
                  class="dm-action-btn dm-action-emerald"
                  @click="
                    showConfirm(
                      '确定要恢复该弹幕显示吗？恢复后其他用户将可以再次看到此弹幕。',
                      () => moderateReportedDanmaku(item.id, 'restore'),
                      '恢复弹幕',
                      '恢复',
                    )
                  "
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
  import { showConfirm } from '@/composables/useModal';
  import EmptyState from '@/components/EmptyState.vue';

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
    notice.value?.type === 'success' ? 'dm-notice-success' : 'dm-notice-error',
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

<style scoped>
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-inverse);
    background: var(--color-brand-primary);
    transition: all 0.2s;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-card);
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--bg-secondary);
  }

  .dm-stat-card {
    border-radius: 8px;
    background: var(--bg-card);
    padding: 16px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-primary);
  }

  .dm-stat-label {
    font-size: 14px;
    color: var(--text-muted);
  }

  .dm-stat-value {
    margin-top: 8px;
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .dm-stat-blue {
    color: var(--color-info, #3b82f6);
  }

  .dm-stat-indigo {
    color: var(--color-brand-primary-light, #6366f1);
  }

  .dm-stat-emerald {
    color: var(--color-success, #10b981);
  }

  .dm-stat-rose {
    color: var(--color-danger, #f43f5e);
  }

  .dm-stat-amber {
    color: var(--color-warning, #f59e0b);
  }

  .dm-section {
    border-radius: 8px;
    background: var(--bg-card);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-primary);
  }

  .dm-section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .dm-section-desc {
    margin-top: 4px;
    font-size: 14px;
    color: var(--text-muted);
  }

  .dm-label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .dm-textarea {
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .dm-textarea:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  .dm-select {
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .dm-select:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  .dm-checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-primary);
    padding: 12px 16px;
    font-size: 14px;
    color: var(--text-secondary);
  }

  .dm-kv-label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }

  .dm-input {
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
    padding: 8px 12px;
    font-size: 14px;
    background: var(--bg-card);
    color: var(--text-primary);
    outline: none;
  }

  .dm-input:focus {
    border-color: var(--border-focus);
  }

  .dm-filter-chip {
    border-radius: 9999px;
    border: 1px solid var(--border-secondary);
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    background: var(--bg-card);
    transition: all 0.2s;
    cursor: pointer;
  }

  .dm-filter-chip:hover {
    background: var(--bg-secondary);
  }

  .dm-filter-chip-active {
    border-color: var(--border-focus);
    background: rgba(99, 102, 241, 0.1);
    color: var(--color-brand-primary-light, #818cf8);
  }

  .dm-filter-chip-amber {
    border-color: var(--color-warning-border, rgba(245, 158, 11, 0.3));
    background: var(--color-warning-bg, rgba(245, 158, 11, 0.1));
    color: var(--color-warning, #f59e0b);
  }

  .dm-filter-chip-rose {
    border-color: var(--color-danger-border, rgba(244, 63, 94, 0.3));
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.1));
    color: var(--color-danger, #f43f5e);
  }

  .dm-report-item {
    border-radius: 12px;
    border: 1px solid var(--border-primary);
    padding: 12px 16px;
    transition: background 0.15s;
  }

  .dm-report-item:hover {
    background: var(--bg-secondary);
  }

  .dm-action-btn {
    border-radius: 9999px;
    border: 1px solid;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s;
    cursor: pointer;
  }

  .dm-action-rose {
    border-color: var(--color-danger-border, rgba(244, 63, 94, 0.3));
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.08));
    color: var(--color-danger, #f43f5e);
  }

  .dm-action-rose:hover {
    background: var(--color-danger-bg, rgba(244, 63, 94, 0.15));
  }

  .dm-action-emerald {
    border-color: var(--color-success-border, rgba(16, 185, 129, 0.3));
    background: var(--color-success-bg, rgba(16, 185, 129, 0.08));
    color: var(--color-success, #10b981);
  }

  .dm-action-emerald:hover {
    background: var(--color-success-bg, rgba(16, 185, 129, 0.15));
  }

  .dm-notice-success {
    border-color: rgba(52, 211, 153, 0.3);
    background-color: rgba(16, 185, 129, 0.15);
    color: var(--color-success-light, #34d399);
  }

  .dm-notice-error {
    border-color: rgba(251, 113, 133, 0.3);
    background-color: rgba(239, 68, 68, 0.15);
    color: var(--color-error-light, #f87171);
  }
</style>
