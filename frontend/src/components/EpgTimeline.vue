<template>
  <div class="epg-timeline">
    <div class="epg-header">
      <h3 class="epg-title">节目单</h3>
      <div class="epg-toggle">
        <button
          :class="['epg-toggle-btn', { active: viewMode === 'list' }]"
          @click="viewMode = 'list'"
        >
          列表
        </button>
        <button
          :class="['epg-toggle-btn', { active: viewMode === 'timeline' }]"
          @click="viewMode = 'timeline'"
        >
          时间线
        </button>
      </div>
    </div>

    <div v-if="loading" class="epg-loading">
      <div class="epg-loading-spinner"></div>
      <span>加载节目单...</span>
    </div>

    <div v-else-if="programs.length === 0" class="epg-empty">暂无节目信息</div>

    <template v-else>
      <div v-if="viewMode === 'list'" ref="listRef" class="epg-list">
        <div v-for="(prog, idx) in programs" :key="idx" :class="['epg-item', programStatus(prog)]">
          <div class="epg-item-time">
            <span class="epg-item-start">{{ formatTime(prog.start) }}</span>
            <span class="epg-item-duration">{{ formatDuration(prog.start, prog.end) }}</span>
          </div>
          <div class="epg-item-dot">
            <span v-if="programStatus(prog) === 'playing'" class="epg-pulse"></span>
          </div>
          <div class="epg-item-content">
            <span class="epg-item-title">{{ prog.title }}</span>
          </div>
        </div>
      </div>

      <div v-else ref="timelineRef" class="epg-timeline-view">
        <div
          v-for="(prog, idx) in programs"
          :key="idx"
          :class="['epg-timeline-item', programStatus(prog)]"
        >
          <div class="epg-timeline-dot-wrapper">
            <span
              v-if="programStatus(prog) === 'playing'"
              class="epg-timeline-dot epg-pulse"
            ></span>
            <span v-else class="epg-timeline-dot"></span>
            <span v-if="idx < programs.length - 1" class="epg-timeline-line"></span>
          </div>
          <div class="epg-timeline-content">
            <div class="epg-timeline-time">
              {{ formatTime(prog.start) }} - {{ formatTime(prog.end) }}
            </div>
            <div class="epg-timeline-title">{{ prog.title }}</div>
            <div class="epg-timeline-duration">{{ formatDuration(prog.start, prog.end) }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick, onMounted } from 'vue';
  import axios from 'axios';

  export interface EpgProgram {
    start: number;
    end: number;
    title: string;
  }

  interface Props {
    channelId: number;
    epgUrl?: string;
  }

  const props = defineProps<Props>();

  const loading = ref(false);
  const programs = ref<EpgProgram[]>([]);
  const viewMode = ref<'list' | 'timeline'>('list');
  const listRef = ref<HTMLElement>();
  const timelineRef = ref<HTMLElement>();

  const fetchEpg = async () => {
    if (!props.channelId) return;
    loading.value = true;
    try {
      const params: Record<string, string> = {};
      if (props.epgUrl) params.epgUrl = props.epgUrl;
      const { data } = await axios.get(`/api/iptv/${props.channelId}/epg`, { params });
      programs.value = cleanEpgData(data.programs || []);
      await nextTick();
      scrollToCurrent();
    } catch {
      programs.value = [];
    } finally {
      loading.value = false;
    }
  };

  const cleanEpgData = (raw: EpgProgram[]): EpgProgram[] => {
    const now = Date.now();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    let endTime = startOfDay + 24 * 3600_000;
    if (today.getHours() >= 18) {
      endTime += 10 * 3600_000;
    }

    return raw
      .filter(p => p.end > now - 3600_000 && p.start < endTime)
      .sort((a, b) => a.start - b.start);
  };

  const programStatus = (prog: EpgProgram): 'past' | 'playing' | 'future' => {
    const now = Date.now();
    if (now >= prog.start && now < prog.end) return 'playing';
    if (now >= prog.end) return 'past';
    return 'future';
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (start: number, end: number): string => {
    const mins = Math.round((end - start) / 60_000);
    if (mins < 60) return `${mins}分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  };

  const scrollToCurrent = () => {
    const container = viewMode.value === 'list' ? listRef.value : timelineRef.value;
    if (!container) return;
    const active = container.querySelector('.playing');
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  watch(() => props.channelId, fetchEpg, { immediate: true });

  let refreshTimer: ReturnType<typeof setInterval> | null = null;
  onMounted(() => {
    refreshTimer = setInterval(() => {
      if (programs.value.length > 0) scrollToCurrent();
    }, 60_000);
  });

  import { onUnmounted } from 'vue';
  onUnmounted(() => {
    if (refreshTimer) clearInterval(refreshTimer);
  });
</script>

<style scoped>
  .epg-timeline {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border-primary);
    border-radius: 12px;
    padding: 16px;
  }

  .epg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .epg-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .epg-toggle {
    display: flex;
    background: var(--border-primary);
    border-radius: 8px;
    overflow: hidden;
  }

  .epg-toggle-btn {
    padding: 6px 14px;
    font-size: 12px;
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .epg-toggle-btn.active {
    background: var(--color-brand-primary);
    color: var(--text-inverse);
  }

  .epg-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .epg-loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-secondary);
    border-top-color: var(--color-brand-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .epg-empty {
    text-align: center;
    padding: 40px 0;
    color: var(--text-muted);
    font-size: 14px;
  }

  .epg-list {
    max-height: 400px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .epg-list::-webkit-scrollbar {
    width: 4px;
  }

  .epg-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  .epg-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .epg-item.past {
    opacity: 0.45;
  }

  .epg-item.playing {
    background: rgba(99, 102, 241, 0.12);
    border: 1px solid rgba(99, 102, 241, 0.25);
  }

  .epg-item.future {
    opacity: 0.8;
  }

  .epg-item-time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 60px;
  }

  .epg-item-start {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }

  .epg-item-duration {
    font-size: 11px;
    color: var(--text-muted);
  }

  .epg-item-dot {
    position: relative;
    width: 10px;
    height: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .epg-item-dot::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-gray-600);
  }

  .epg-item.playing .epg-item-dot::before {
    background: var(--color-brand-primary);
  }

  .epg-pulse {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: rgba(99, 102, 241, 0.4);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.6);
      opacity: 0;
    }
  }

  .epg-item-content {
    flex: 1;
    min-width: 0;
  }

  .epg-item-title {
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .epg-item.playing .epg-item-title {
    color: var(--color-brand-primary-light);
    font-weight: 500;
  }

  .epg-timeline-view {
    max-height: 400px;
    overflow-y: auto;
    padding: 0 4px;
  }

  .epg-timeline-view::-webkit-scrollbar {
    width: 4px;
  }

  .epg-timeline-view::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
  }

  .epg-timeline-item {
    display: flex;
    gap: 14px;
    position: relative;
  }

  .epg-timeline-item.past {
    opacity: 0.4;
  }

  .epg-timeline-item.future {
    opacity: 0.75;
  }

  .epg-timeline-dot-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 16px;
    flex-shrink: 0;
  }

  .epg-timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-gray-600);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .epg-timeline-item.playing .epg-timeline-dot {
    background: var(--color-brand-primary);
    box-shadow: 0 0 8px rgba(99, 102, 241, 0.6);
  }

  .epg-timeline-line {
    width: 2px;
    flex: 1;
    min-height: 20px;
    background: rgba(255, 255, 255, 0.08);
  }

  .epg-timeline-content {
    padding-bottom: 16px;
    flex: 1;
    min-width: 0;
  }

  .epg-timeline-time {
    font-size: 12px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    margin-bottom: 2px;
  }

  .epg-timeline-title {
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .epg-timeline-item.playing .epg-timeline-title {
    color: var(--color-brand-primary-light);
    font-weight: 500;
  }

  .epg-timeline-duration {
    font-size: 11px;
    color: var(--color-gray-600);
    margin-top: 2px;
  }

  @media (max-width: 640px) {
    .epg-list,
    .epg-timeline-view {
      max-height: 300px;
    }
  }
</style>
