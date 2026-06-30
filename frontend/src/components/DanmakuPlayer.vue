<template>
  <div ref="danmakuContainer" class="danmaku-player">
    <!-- 弹幕显示区域 -->
    <div
      class="danmaku-container"
      :class="{ 'danmaku-hidden': !settings.enabled, 'report-mode': reportMode }"
    >
      <div
        v-for="danmaku in visibleDanmaku"
        :key="danmaku.id"
        :class="[
          'danmaku-item',
          `danmaku-${danmaku.type}`,
          { 'danmaku-highlighted': danmaku.isHighlighted, 'danmaku-clickable': reportMode },
        ]"
        :style="getDanmakuStyle(danmaku)"
        @click="reportMode && handleReportClick(danmaku)"
        @animationend="handleAnimationEnd(danmaku)"
      >
        <span class="danmaku-text">{{ danmaku.text }}</span>
      </div>
    </div>

    <!-- 弹幕输入区域 -->
    <div
      v-if="showControls"
      class="danmaku-controls"
      :class="{ 'controls-visible': controlsVisible }"
    >
      <button class="danmaku-toggle-btn" title="弹幕开关" @click="toggleDanmaku">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="toggle-icon"
        >
          <path v-if="settings.enabled" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle v-if="settings.enabled" cx="12" cy="12" r="3" />
          <path
            v-if="!settings.enabled"
            d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
          />
          <line v-if="!settings.enabled" x1="1" y1="1" x2="23" y2="23" />
        </svg>
      </button>
      <button class="danmaku-toggle-btn" title="收起弹幕栏" @click="toggleControls">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="toggle-icon"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      <div class="danmaku-input-row">
        <input
          v-model="inputText"
          type="text"
          :placeholder="inputPlaceholder"
          class="danmaku-input"
          :disabled="!canSendDanmaku"
          maxlength="100"
          @focus="showControlsPanel"
          @keydown.stop
          @keyup.enter.stop="sendDanmaku"
        />
        <div class="danmaku-extra">
          <input v-model="selectedColor" type="color" class="color-input" title="弹幕颜色" />
          <select v-model="selectedType" class="danmaku-type-select" title="弹幕位置" @keydown.stop>
            <option value="scroll">滚动</option>
            <option value="top">顶部</option>
            <option value="bottom">底部</option>
          </select>
          <button
            :disabled="!canSendDanmaku || !inputText.trim()"
            class="danmaku-send-btn"
            @click="sendDanmaku"
          >
            发送
          </button>
          <button class="danmaku-settings-btn" title="弹幕设置" @click="toggleSettings">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="settings-svg"
            >
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
              />
            </svg>
          </button>
          <button
            class="danmaku-settings-btn"
            :class="{ 'report-active': reportMode }"
            :title="reportMode ? '退出举报模式' : '举报弹幕'"
            @click="toggleReportMode"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="settings-svg"
            >
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="danmakuSuggestions.length > 0" class="danmaku-suggestions">
        <button
          v-for="suggestion in danmakuSuggestions"
          :key="suggestion.text"
          class="danmaku-suggestion-chip"
          type="button"
          @click="applySuggestion(suggestion)"
        >
          {{ suggestion.text }}
        </button>
        <button
          class="danmaku-suggestion-refresh"
          type="button"
          :disabled="suggestionsLoading"
          @click="loadDanmakuSuggestions"
        >
          刷新建议
        </button>
      </div>
    </div>

    <!-- 弹幕开关浮动按钮（控件隐藏时） -->
    <button
      v-if="showControls && !controlsVisible"
      class="danmaku-float-toggle"
      :class="{ active: settings.enabled }"
      title="展开弹幕栏"
      @click="toggleControls"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="float-icon"
      >
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      <span class="float-label">弹幕</span>
    </button>

    <!-- 弹幕设置面板 -->
    <div v-if="showSettings" class="danmaku-settings-panel">
      <div class="settings-header">
        <h3>弹幕设置</h3>
        <button class="close-btn" @click="toggleSettings">×</button>
      </div>

      <div class="settings-content">
        <!-- 基本设置 -->
        <div class="setting-group">
          <label class="setting-label">
            <input v-model="settings.enabled" type="checkbox" />
            启用弹幕
          </label>

          <label class="setting-label">
            <input v-model="settings.display.scroll" type="checkbox" />
            显示滚动弹幕
          </label>

          <label class="setting-label">
            <input v-model="settings.display.top" type="checkbox" />
            显示顶部弹幕
          </label>

          <label class="setting-label">
            <input v-model="settings.display.bottom" type="checkbox" />
            显示底部弹幕
          </label>
        </div>

        <!-- 外观设置 -->
        <div class="setting-group">
          <label class="setting-label">
            透明度: {{ settings.opacity }}%
            <input
              v-model="settings.opacity"
              type="range"
              min="10"
              max="100"
              step="10"
              class="range-input"
            />
          </label>

          <label class="setting-label">
            字体大小: {{ settings.fontSize }}px
            <input
              v-model="settings.fontSize"
              type="range"
              min="12"
              max="32"
              step="2"
              class="range-input"
            />
          </label>

          <label class="setting-label">
            滚动速度: {{ settings.speed }}
            <input
              v-model="settings.speed"
              type="range"
              min="1"
              max="10"
              step="1"
              class="range-input"
            />
          </label>
        </div>

        <!-- 过滤设置 -->
        <div class="setting-group">
          <label class="setting-label">
            <input v-model="settings.filter.profanity" type="checkbox" />
            过滤敏感词
          </label>

          <label class="setting-label">
            <input v-model="settings.filter.spam" type="checkbox" />
            过滤垃圾信息
          </label>

          <label class="setting-label">
            <input v-model="settings.filter.highlight" type="checkbox" />
            高亮重要弹幕
          </label>

          <div v-if="backendFilterRules" class="room-info mt-3">
            <p>服务端过滤级别: {{ backendFilterRules.level }}</p>
            <p>自动拦截: {{ backendFilterRules.autoBlock ? '开启' : '关闭' }}</p>
            <p>敏感词条数: {{ backendFilterRules.sensitiveWords.length }}</p>
          </div>
        </div>

        <!-- 自定义过滤规则 -->
        <div class="setting-group">
          <h4 class="setting-group-title">自定义过滤</h4>
          <div class="custom-filter-input">
            <input
              v-model="newFilterKeyword"
              type="text"
              placeholder="输入关键词或正则表达式"
              class="filter-input"
              @keyup.enter="addFilterKeyword"
            />
            <button class="filter-add-btn" @click="addFilterKeyword">添加</button>
          </div>
          <div v-if="customFilterKeywords.length > 0" class="filter-keyword-list">
            <span v-for="(kw, idx) in customFilterKeywords" :key="idx" class="filter-keyword-tag">
              {{ kw }}
              <button class="tag-remove" @click="removeFilterKeyword(idx)">&times;</button>
            </span>
          </div>
          <p v-if="customFilterKeywords.length > 0" class="filter-count">
            已过滤 {{ filteredCount }} 条弹幕
          </p>
        </div>

        <!-- 房间信息 -->
        <div v-if="roomInfo" class="room-info">
          <p>在线用户: {{ roomInfo.onlineCount }}</p>
          <p v-if="roomInfo.messageCount !== undefined">弹幕总数: {{ roomInfo.messageCount }}</p>
          <p v-if="roomInfo.lastActivity">最近活跃: {{ formatRoomTime(roomInfo.lastActivity) }}</p>
          <p>房间ID: {{ props.videoId }}</p>
          <p>连接状态: {{ roomConnectionLabel }}</p>
          <button v-if="canUseHttpFallback" class="reconnect-btn mt-2" @click="refreshRoomSummary">
            刷新房间信息
          </button>
        </div>
      </div>
    </div>

    <!-- 连接状态提示（自动消失的 toast 样式） -->
    <Transition name="toast-fade">
      <div v-if="showConnectionToast && !isConnected && settings.enabled" class="connection-toast">
        <span>{{ connectionStatusMessage }}</span>
        <button class="toast-close" @click="showConnectionToast = false">&times;</button>
      </div>
    </Transition>

    <Transition name="toast-fade">
      <div v-if="sendFeedback" class="connection-toast connection-toast--success">
        <span>{{ sendFeedback }}</span>
      </div>
    </Transition>

    <!-- 举报弹窗 -->
    <Transition name="toast-fade">
      <div v-if="reportTarget" class="report-dialog-backdrop" @click.self="reportTarget = null">
        <div class="report-dialog">
          <div class="report-dialog-header">
            <span>举报弹幕</span>
            <button class="toast-close" @click="reportTarget = null">&times;</button>
          </div>
          <p class="report-dialog-text">"{{ reportTarget.text }}"</p>
          <div class="report-reasons">
            <label v-for="reason in reportReasons" :key="reason" class="report-reason-item">
              <input v-model="reportReason" type="radio" :value="reason" />
              <span>{{ reason }}</span>
            </label>
          </div>
          <button
            class="danmaku-send-btn report-submit"
            :disabled="!reportReason || reportSubmitting"
            @click="submitReport"
          >
            {{ reportSubmitting ? '提交中...' : '提交举报' }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, onUnmounted, watch, type CSSProperties } from 'vue';
  import {
    useDanmakuWebSocket,
    type DanmakuMessage,
    type DanmakuSettings,
    type RoomInfo,
  } from '@/services/danmaku-websocket.service';
  import { danmakuApi, type DanmakuSuggestionItem } from '@/api/danmaku';
  import { useAuthStore } from '@/stores/auth';

  // Props 定义
  interface Props {
    videoId: string;
    mediaResourceId?: number;
    width?: number;
    height?: number;
    showControls?: boolean;
    maxDanmakuCount?: number;
    defaultSettings?: Partial<DanmakuSettings>;
  }

  const props = withDefaults(defineProps<Props>(), {
    width: 800,
    height: 450,
    showControls: true,
    maxDanmakuCount: 100,
    defaultSettings: () => ({}),
  });

  // 状态管理
  const danmakuContainer = ref<HTMLElement>();
  const inputText = ref('');
  const selectedColor = ref('#FFFFFF');
  const selectedType = ref<'scroll' | 'top' | 'bottom'>('scroll');
  const showSettings = ref(false);
  const controlsVisible = ref(false);
  const showConnectionToast = ref(false);
  const roomInfo = ref<RoomInfo | null>(null);

  // 举报功能
  const reportMode = ref(false);
  const reportTarget = ref<DanmakuMessage | null>(null);
  const reportReason = ref('');
  const reportSubmitting = ref(false);
  const reportReasons = ['违规内容', '垃圾广告', '恶意刷屏', '色情低俗', '其他'];
  const connectionError = ref<string | null>(null);
  const sendFeedback = ref<string | null>(null);
  const danmakuSuggestions = ref<DanmakuSuggestionItem[]>([]);
  const suggestionsLoading = ref(false);
  const backendFilterRules = ref<Awaited<ReturnType<typeof danmakuApi.getFilterRules>> | null>(
    null,
  );

  // 弹幕列表管理
  const danmakuList = ref<DanmakuMessage[]>([]);
  const scrollPositions = new Map<string, number>();
  const seenDanmakuIds = new Set<string>();
  const topLaneCounter = ref(0);
  const bottomLaneCounter = ref(0);
  const MAX_TOP_LANES = 8;
  const MAX_BOTTOM_LANES = 5;

  const getFilteredDanmaku = () => {
    if (!settings.enabled) return [];

    let filtered = danmakuList.value;

    if (!settings.display.scroll) {
      filtered = filtered.filter(d => d.type !== 'scroll');
    }
    if (!settings.display.top) {
      filtered = filtered.filter(d => d.type !== 'top');
    }
    if (!settings.display.bottom) {
      filtered = filtered.filter(d => d.type !== 'bottom');
    }

    if (settings.filter.profanity) {
      filtered = filtered.filter(d => !d.filters?.containsSensitive);
    }
    if (settings.filter.spam) {
      filtered = filtered.filter(d => !d.filters?.containsSpam);
    }

    if (customFilterKeywords.value.length > 0) {
      filtered = filtered.filter(d => !matchesCustomFilter(d.text));
    }

    return filtered;
  };

  const visibleDanmaku = computed(() => {
    const filtered = getFilteredDanmaku();
    return filtered.slice(-props.maxDanmakuCount);
  });

  const filteredCount = computed(() => danmakuList.value.length - getFilteredDanmaku().length);

  // 默认设置
  const initialDefaultSettings: DanmakuSettings = {
    enabled: true,
    opacity: 80,
    fontSize: 16,
    speed: 5,
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    filter: {
      profanity: true,
      spam: true,
      highlight: true,
    },
    display: {
      scroll: true,
      top: true,
      bottom: true,
    },
  };

  const getDefaultSettings = (): DanmakuSettings => ({
    ...initialDefaultSettings,
    ...props.defaultSettings,
    filter: {
      ...initialDefaultSettings.filter,
      ...props.defaultSettings.filter,
    },
    display: {
      ...initialDefaultSettings.display,
      ...props.defaultSettings.display,
    },
  });

  // 设置状态
  const settings = reactive<DanmakuSettings>(getDefaultSettings());

  // 自定义过滤关键词
  const newFilterKeyword = ref('');
  const customFilterKeywords = ref<string[]>([]);
  const getSessionKey = () => `danmaku_filters_${props.videoId}`;

  const resetSessionState = () => {
    customFilterKeywords.value = [];
    Object.assign(settings, getDefaultSettings());
  };

  const loadSessionFilters = () => {
    resetSessionState();

    try {
      const saved = sessionStorage.getItem(getSessionKey());
      if (saved) {
        const data = JSON.parse(saved);
        if (data.keywords) customFilterKeywords.value = data.keywords;
        if (data.settings) {
          Object.assign(settings.filter, data.settings.filter || {});
          Object.assign(settings.display, data.settings.display || {});
          settings.enabled = data.settings.enabled ?? settings.enabled;
          settings.opacity = data.settings.opacity ?? settings.opacity;
          settings.fontSize = data.settings.fontSize ?? settings.fontSize;
          settings.speed = data.settings.speed ?? settings.speed;
        }
      }
    } catch {
      // ignore parse errors
    }
  };

  const saveSessionFilters = () => {
    try {
      sessionStorage.setItem(
        getSessionKey(),
        JSON.stringify({
          keywords: customFilterKeywords.value,
          settings: {
            enabled: settings.enabled,
            filter: { ...settings.filter },
            display: { ...settings.display },
            opacity: settings.opacity,
            fontSize: settings.fontSize,
            speed: settings.speed,
          },
        }),
      );
    } catch {
      // ignore storage errors
    }
  };

  const addFilterKeyword = () => {
    const kw = newFilterKeyword.value.trim();
    if (!kw || customFilterKeywords.value.includes(kw)) return;
    customFilterKeywords.value.push(kw);
    newFilterKeyword.value = '';
    saveSessionFilters();
  };

  const removeFilterKeyword = (idx: number) => {
    customFilterKeywords.value.splice(idx, 1);
    saveSessionFilters();
  };

  const matchesCustomFilter = (text: string): boolean => {
    if (customFilterKeywords.value.length === 0) return false;
    return customFilterKeywords.value.some(kw => {
      try {
        return new RegExp(kw, 'i').test(text);
      } catch {
        return text.toLowerCase().includes(kw.toLowerCase());
      }
    });
  };

  watch(
    () => [
      settings.enabled,
      settings.filter,
      settings.display,
      settings.opacity,
      settings.fontSize,
      settings.speed,
    ],
    () => {
      saveSessionFilters();
    },
    { deep: true },
  );

  // 用户认证
  const authStore = useAuthStore();
  const userId = computed(() => authStore.user?.id?.toString() || '');
  const resolvedMediaResourceId = computed(() => {
    if (typeof props.mediaResourceId === 'number' && Number.isFinite(props.mediaResourceId)) {
      return props.mediaResourceId;
    }

    const inferred = Number(props.videoId);
    return Number.isFinite(inferred) ? inferred : null;
  });
  const canUseHttpFallback = computed(() =>
    Boolean(userId.value && props.videoId && resolvedMediaResourceId.value),
  );
  const canSendDanmaku = computed(
    () => settings.enabled && (isConnected.value || canUseHttpFallback.value),
  );
  const roomConnectionLabel = computed(() => {
    if (isConnected.value) return '已连接';
    if (canUseHttpFallback.value) return 'HTTP 回退中';
    return '未连接';
  });
  const connectionStatusMessage = computed(() => {
    if (connectionError.value) {
      return canUseHttpFallback.value
        ? `${connectionError.value}，已切换到 HTTP 回退模式。`
        : connectionError.value;
    }

    if (canUseHttpFallback.value) {
      return '实时连接不可用，当前可通过 HTTP 回退发送弹幕。';
    }

    return '正在连接弹幕服务器...';
  });

  // WebSocket 服务集成
  const {
    isConnected,
    connect: wsConnect,
    disconnect: wsDisconnect,
    sendDanmaku: wsSendDanmaku,
    getRoomInfo: wsGetRoomInfo,
    onDanmaku,
    onSystem,
    onRoomInfo,
    onConnected,
    onDisconnected,
    onError,
    onHeartbeat,
    onReconnectFailed,
  } = useDanmakuWebSocket(props.videoId);

  // 事件监听设置
  const handleFullscreenChange = () => {
    if (document.fullscreenElement) {
      controlsVisible.value = false;
    }
  };

  const showControlsPanel = () => {
    controlsVisible.value = true;
  };

  onMounted(() => {
    loadSessionFilters();
    setupEventListeners();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    if (userId.value && props.videoId) {
      wsConnect();
    }
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    cleanup();
  });

  // 事件监听器设置
  const setupEventListeners = () => {
    // 接收弹幕消息
    onDanmaku((message: DanmakuMessage) => {
      addDanmaku(message);
    });

    // 接收系统消息
    onSystem((message: DanmakuMessage) => {
      addDanmaku({
        ...message,
        isHighlighted: true,
        color: '#00FF00',
      });
    });

    // 接收房间信息
    onRoomInfo((info: RoomInfo) => {
      roomInfo.value = info;
    });

    // 连接状态变化
    onConnected(() => {
      connectionError.value = null;
      showConnectionToast.value = false;
      wsGetRoomInfo();
      void loadHttpRoomInfo();
    });

    onDisconnected(() => {
      connectionError.value = '连接已断开，正在重连...';
    });

    onError((error: unknown) => {
      connectionError.value = error instanceof Error ? error.message : '连接错误';
    });

    onReconnectFailed(() => {
      connectionError.value = canUseHttpFallback.value
        ? '实时连接失败，已切换到 HTTP 回退模式'
        : '弹幕服务器连接失败，请刷新页面重试';
      showConnectionToast.value = true;
    });

    // 心跳响应
    onHeartbeat(() => {
      // 保持连接活跃
    });
  };

  // 弹幕管理
  const addDanmaku = (danmaku: DanmakuMessage) => {
    const id = danmaku.id || `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    if (seenDanmakuIds.has(id)) {
      return;
    }

    seenDanmakuIds.add(id);
    if (danmaku.type === 'scroll') {
      scrollPositions.set(id, Math.random() * 70 + 5);
    } else if (danmaku.type === 'top') {
      scrollPositions.set(id, (topLaneCounter.value % MAX_TOP_LANES) * 12 + 2);
      topLaneCounter.value++;
    } else if (danmaku.type === 'bottom') {
      scrollPositions.set(id, (bottomLaneCounter.value % MAX_BOTTOM_LANES) * 12 + 2);
      bottomLaneCounter.value++;
    }
    danmakuList.value.push({
      ...danmaku,
      id,
      timestamp: danmaku.timestamp || Date.now(),
    });

    // 限制弹幕总数
    if (danmakuList.value.length > props.maxDanmakuCount * 2) {
      const retained = danmakuList.value.slice(-props.maxDanmakuCount);
      const retainedIds = new Set(retained.map(item => item.id).filter(Boolean) as string[]);
      seenDanmakuIds.clear();
      retainedIds.forEach(itemId => seenDanmakuIds.add(itemId));
      danmakuList.value = retained;
    }
  };

  // 发送弹幕
  const sendDanmaku = async () => {
    if (!inputText.value.trim() || !canSendDanmaku.value) return;

    const text = inputText.value.trim();
    const basePayload = {
      text,
      color: selectedColor.value,
      type: selectedType.value,
      priority: 1,
      userId: userId.value,
      videoId: props.videoId,
      isHighlighted: false,
    };

    if (isConnected.value) {
      const sentMessage = wsSendDanmaku(basePayload);
      if (sentMessage) {
        addDanmaku(sentMessage);
      }
      inputText.value = '';
      sendFeedback.value = '弹幕已发送';
      window.setTimeout(() => {
        sendFeedback.value = null;
      }, 2000);
      return;
    }

    if (!resolvedMediaResourceId.value) {
      connectionError.value = '缺少媒体资源 ID，无法发送弹幕';
      return;
    }

    try {
      const created = await danmakuApi.sendDanmaku({
        text,
        color: selectedColor.value,
        type: selectedType.value,
        priority: 1,
        videoId: props.videoId,
        mediaResourceId: resolvedMediaResourceId.value,
      });

      addDanmaku({
        id: String(created.id),
        userId: String(created.userId || userId.value),
        videoId: created.videoId,
        text: created.text,
        color: created.color,
        type: created.type,
        priority: created.priority,
        timestamp:
          created.metadata?.timestamp ||
          (created.createdAt ? new Date(created.createdAt).getTime() : Date.now()),
        isHighlighted: created.isHighlighted,
      });
      inputText.value = '';
      connectionError.value = null;
      sendFeedback.value = '弹幕已通过 HTTP 回退发送';
      window.setTimeout(() => {
        sendFeedback.value = null;
      }, 2000);
      await loadHttpRoomInfo();
    } catch (error: unknown) {
      connectionError.value = error instanceof Error ? error.message : '发送弹幕失败';
    }
  };

  const loadHttpRoomInfo = async () => {
    if (!props.videoId) {
      return;
    }

    try {
      const response = await danmakuApi.getRoomInfo(props.videoId);
      roomInfo.value = {
        videoId: response.videoId,
        onlineCount: response.onlineUsers,
        messageCount: response.messageCount,
        isActive: response.isActive,
        lastActivity: response.lastActivity,
        timestamp: response.lastActivity ? new Date(response.lastActivity).getTime() : Date.now(),
      };
    } catch {
      // ignore fallback fetch failures; websocket state stays primary
    }
  };

  const loadFilterRules = async () => {
    if (!authStore.isAdmin) {
      backendFilterRules.value = null;
      return;
    }

    try {
      backendFilterRules.value = await danmakuApi.getFilterRules();
    } catch {
      // ignore rules fetch errors in player surface
    }
  };

  const loadDanmakuSuggestions = async () => {
    if (!props.videoId && !resolvedMediaResourceId.value) return;

    suggestionsLoading.value = true;
    try {
      const response = await danmakuApi.getSuggestions({
        videoId: props.videoId,
        mediaResourceId: resolvedMediaResourceId.value ?? undefined,
        type: 'relevant',
        limit: 5,
      });
      danmakuSuggestions.value = response.suggestions;
    } catch {
      danmakuSuggestions.value = [];
    } finally {
      suggestionsLoading.value = false;
    }
  };

  const applySuggestion = (suggestion: DanmakuSuggestionItem) => {
    inputText.value = suggestion.text;
    selectedColor.value = suggestion.color || selectedColor.value;
    selectedType.value = suggestion.type || selectedType.value;
    showControlsPanel();
  };

  const refreshRoomSummary = async () => {
    await loadHttpRoomInfo();
    await loadFilterRules();
  };

  // 弹幕样式计算
  const getDanmakuStyle = (danmaku: DanmakuMessage): CSSProperties => {
    const baseStyle: CSSProperties = {
      color: danmaku.color || settings.color,
      fontSize: `${settings.fontSize}px`,
      fontFamily: settings.fontFamily,
      opacity: settings.opacity / 100,
      zIndex: danmaku.priority || 1,
    };

    if (danmaku.isHighlighted) {
      baseStyle.fontWeight = 'bold';
      baseStyle.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)';
    }

    const lanePos = scrollPositions.get(danmaku.id);

    if (danmaku.type === 'scroll') {
      baseStyle.top = `${lanePos ?? 10}%`;
      baseStyle.left = '100%';
      const duration = Math.max(6, (11 - settings.speed) * 1.5);
      baseStyle.animation = `danmaku-scroll-lr ${duration}s linear forwards`;
    } else if (danmaku.type === 'top') {
      baseStyle.top = `${lanePos ?? 2}%`;
      baseStyle.left = '50%';
      baseStyle.transform = 'translateX(-50%)';
      const duration = Math.max(5, (11 - settings.speed) * 1.2);
      baseStyle.animation = `danmaku-fade-in-out ${duration}s ease forwards`;
    } else if (danmaku.type === 'bottom') {
      baseStyle.bottom = `${lanePos ?? 2}%`;
      baseStyle.left = '50%';
      baseStyle.transform = 'translateX(-50%)';
      const duration = Math.max(5, (11 - settings.speed) * 1.2);
      baseStyle.animation = `danmaku-fade-in-out ${duration}s ease forwards`;
    }

    return baseStyle;
  };

  const handleAnimationEnd = (danmaku: DanmakuMessage) => {
    const idx = danmakuList.value.findIndex(d => d.id === danmaku.id);
    if (idx !== -1) {
      danmakuList.value.splice(idx, 1);
    }
  };

  // UI 交互
  const toggleSettings = () => {
    showSettings.value = !showSettings.value;
  };

  const toggleDanmaku = () => {
    settings.enabled = !settings.enabled;
  };

  const toggleControls = () => {
    controlsVisible.value = !controlsVisible.value;
  };

  const toggleReportMode = () => {
    reportMode.value = !reportMode.value;
    if (!reportMode.value) {
      reportTarget.value = null;
    }
  };

  const handleReportClick = (danmaku: DanmakuMessage) => {
    if (!danmaku.id) return;
    reportTarget.value = danmaku;
    reportReason.value = '';
  };

  const submitReport = async () => {
    if (!reportTarget.value || !reportReason.value || reportSubmitting.value) return;
    const danmakuId = Number(reportTarget.value.id);
    if (!Number.isFinite(danmakuId)) return;

    reportSubmitting.value = true;
    try {
      await danmakuApi.reportDanmaku(danmakuId, reportReason.value);
      sendFeedback.value = '举报已提交';
      window.setTimeout(() => {
        sendFeedback.value = null;
      }, 2000);
      reportTarget.value = null;
      reportMode.value = false;
    } catch {
      sendFeedback.value = '举报提交失败';
      window.setTimeout(() => {
        sendFeedback.value = null;
      }, 2000);
    } finally {
      reportSubmitting.value = false;
    }
  };

  // 清理资源
  const cleanup = () => {
    wsDisconnect();
  };

  // 监听设置变化
  watch(
    () => settings.enabled,
    newVal => {
      if (newVal && userId.value && props.videoId && !isConnected.value) {
        wsConnect();
      }
    },
  );

  // 计算属性
  const inputPlaceholder = computed(() => {
    if (!isConnected.value && canUseHttpFallback.value) return '发送弹幕 (HTTP 回退)';
    if (!isConnected.value) return '连接中...';
    if (!settings.enabled) return '弹幕已禁用';
    return '发送弹幕 (按Enter)';
  });

  const formatRoomTime = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('zh-CN');
  };

  watch(
    () => props.videoId,
    () => {
      danmakuList.value = [];
      scrollPositions.clear();
      seenDanmakuIds.clear();
      loadSessionFilters();
      void loadHttpRoomInfo();
      void loadFilterRules();
      void loadDanmakuSuggestions();
    },
    { immediate: true },
  );
</script>

<style scoped>
  .danmaku-player {
    --danmaku-edge: clamp(10px, 2.4vw, 18px);
    --danmaku-controls-bottom: clamp(12px, 5%, 34px);
    --danmaku-controls-max: 760px;
    --danmaku-float-top: var(--danmaku-edge);
    --danmaku-float-left: var(--danmaku-edge);
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: transparent;
    z-index: 9999;
    pointer-events: none;
  }

  .danmaku-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .danmaku-container.danmaku-hidden {
    display: none;
  }

  .danmaku-item {
    position: absolute;
    max-width: min(80%, 760px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    user-select: none;
    pointer-events: none;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    will-change: transform, opacity;
  }

  .danmaku-scroll {
    max-width: none;
    overflow: visible;
    text-overflow: clip;
  }

  .danmaku-highlighted {
    font-weight: bold;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  }

  .danmaku-controls {
    position: absolute;
    right: var(--danmaku-edge);
    bottom: var(--danmaku-controls-bottom);
    left: var(--danmaku-edge);
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: center;
    gap: 6px 8px;
    width: auto;
    max-width: min(
      var(--danmaku-controls-max),
      calc(100% - var(--danmaku-edge) - var(--danmaku-edge))
    );
    max-height: calc(100% - var(--danmaku-edge) - var(--danmaku-controls-bottom));
    overflow: visible;
    margin-inline: auto;
    background: rgba(0, 0, 0, 0.75);
    padding: 8px 10px;
    border-radius: 8px;
    z-index: 9999;
    pointer-events: none;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    opacity: 0;
    transition: opacity 0.3s ease;
    white-space: normal;
  }

  .danmaku-controls.controls-visible {
    opacity: 1;
    pointer-events: all;
  }

  .danmaku-toggle-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: color 0.2s;
  }

  .danmaku-toggle-btn:hover {
    color: var(--text-inverse);
  }

  .toggle-icon {
    width: 18px;
    height: 18px;
  }

  .danmaku-input-row {
    display: grid;
    grid-template-columns: minmax(120px, 1fr) auto;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .danmaku-input {
    background: var(--border-secondary);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-inverse);
    padding: 6px 10px;
    border-radius: 4px;
    outline: none;
    width: 100%;
    min-width: 0;
    font-size: 13px;
  }

  .danmaku-input:focus {
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }

  .danmaku-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .danmaku-extra {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: flex-end;
    min-width: 0;
  }

  .color-input {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: none;
    padding: 0;
    flex-shrink: 0;
  }

  .danmaku-type-select {
    background: var(--bg-cinema-soft);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
    padding: 5px 6px;
    border-radius: 4px;
    outline: none;
    font-size: 12px;
    cursor: pointer;
    max-width: 96px;
  }

  .danmaku-type-select option {
    background: var(--bg-cinema-soft);
    color: var(--text-primary);
  }

  .danmaku-send-btn {
    background: var(--color-brand-primary);
    border: none;
    color: var(--text-inverse);
    padding: 5px 14px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .danmaku-send-btn:hover:not(:disabled) {
    background: var(--color-brand-primary-dark);
  }

  .danmaku-send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .danmaku-settings-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    width: 28px;
    height: 28px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    flex-shrink: 0;
  }

  .danmaku-settings-btn:hover {
    color: var(--text-inverse);
  }

  .settings-svg {
    width: 16px;
    height: 16px;
  }

  .danmaku-float-toggle {
    position: absolute;
    top: var(--danmaku-float-top);
    left: var(--danmaku-float-left);
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid var(--border-secondary);
    color: rgba(255, 255, 255, 0.7);
    padding: 5px 10px;
    border-radius: 4px;
    min-height: 32px;
    cursor: pointer;
    z-index: 9999;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
    pointer-events: all;
  }

  .danmaku-float-toggle:hover {
    background: rgba(0, 0, 0, 0.8);
    color: var(--text-inverse);
  }

  .danmaku-float-toggle.active {
    border-color: rgba(99, 102, 241, 0.4);
  }

  .float-icon {
    width: 14px;
    height: 14px;
  }

  .float-label {
    font-size: 12px;
  }

  .danmaku-settings-panel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    width: min(400px, calc(100% - var(--danmaku-edge) - var(--danmaku-edge)));
    min-width: 0;
    max-height: min(68vh, calc(100% - var(--danmaku-edge) - var(--danmaku-edge)));
    overflow-y: auto;
    z-index: 10000;
    backdrop-filter: blur(12px);
    color: var(--text-inverse);
    pointer-events: all;
  }

  .danmaku-suggestions {
    grid-column: 1 / -1;
    display: flex;
    gap: 6px;
    max-width: 100%;
    overflow-x: auto;
    padding-top: 2px;
    scrollbar-width: thin;
  }

  .danmaku-suggestion-chip,
  .danmaku-suggestion-refresh {
    flex: 0 0 auto;
    max-width: 180px;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.82);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }

  .danmaku-suggestion-chip:hover,
  .danmaku-suggestion-refresh:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
    color: var(--text-inverse);
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  .settings-header h3 {
    margin: 0;
    color: var(--text-inverse);
    font-size: 15px;
  }

  .close-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--border-secondary);
    color: var(--text-inverse);
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-primary);
    font-size: 13px;
  }

  .setting-label input[type='checkbox'] {
    width: 15px;
    height: 15px;
    accent-color: var(--color-brand-primary);
  }

  .range-input {
    flex: 1;
    margin-left: 8px;
    accent-color: var(--color-brand-primary);
  }

  .setting-group-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  .custom-filter-input {
    display: flex;
    gap: 8px;
  }

  .filter-input {
    flex: 1;
    padding: 7px 10px;
    background: var(--border-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
  }

  .filter-input:focus {
    border-color: var(--border-focus);
  }

  .filter-add-btn {
    padding: 7px 14px;
    background: var(--color-brand-primary);
    border: none;
    border-radius: 6px;
    color: var(--text-inverse);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .filter-add-btn:hover {
    background: var(--color-brand-primary-dark);
  }

  .filter-keyword-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-keyword-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: var(--color-error-overlay);
    border: 1px solid var(--color-error-border);
    border-radius: 12px;
    font-size: 12px;
    color: var(--color-error-light);
  }

  .tag-remove {
    background: none;
    border: none;
    color: var(--color-error-light);
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 0 2px;
  }

  .tag-remove:hover {
    color: var(--color-error);
  }

  .filter-count {
    font-size: 12px;
    color: var(--text-muted);
  }

  .room-info {
    background: rgba(102, 126, 234, 0.1);
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 8px;
    padding: 12px;
  }

  .room-info p {
    margin: 4px 0;
    color: var(--text-primary);
    font-size: 13px;
  }

  .connection-toast {
    position: absolute;
    top: var(--danmaku-edge);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: var(--color-warning-light);
    padding: 6px 14px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 200;
    font-size: 12px;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(251, 191, 36, 0.2);
    max-width: 90%;
    pointer-events: all;
  }

  .connection-toast--success {
    color: var(--color-success-light);
    border-color: var(--color-success-border);
  }

  .toast-close {
    background: none;
    border: none;
    color: inherit;
    font-size: 16px;
    cursor: pointer;
    padding: 0 2px;
    opacity: 0.6;
  }

  .toast-close:hover {
    opacity: 1;
  }

  .toast-fade-enter-active,
  .toast-fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .toast-fade-enter-from,
  .toast-fade-leave-to {
    opacity: 0;
  }

  .danmaku-container.report-mode {
    pointer-events: all;
  }

  .danmaku-item.danmaku-clickable {
    cursor: pointer;
    pointer-events: all;
  }

  .danmaku-item.danmaku-clickable:hover {
    opacity: 0.8;
    text-decoration: underline;
  }

  .report-active {
    color: var(--color-error);
  }

  .report-dialog-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    pointer-events: all;
  }

  .report-dialog {
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 16px;
    width: min(320px, calc(100% - var(--danmaku-edge) - var(--danmaku-edge)));
    min-width: 0;
    color: var(--text-inverse);
    backdrop-filter: blur(12px);
  }

  .report-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .report-dialog-text {
    font-size: 12px;
    color: var(--text-tertiary);
    margin-bottom: 12px;
    word-break: break-all;
  }

  .report-reasons {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  .report-reason-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-primary);
    cursor: pointer;
  }

  .report-reason-item input[type='radio'] {
    accent-color: var(--color-brand-primary);
  }

  .report-submit {
    width: 100%;
    text-align: center;
  }

  @media (max-width: 640px) {
    .danmaku-player {
      --danmaku-edge: 8px;
    }

    .danmaku-controls {
      padding: 5px 8px;
      max-height: calc(100% - var(--danmaku-edge) - var(--danmaku-controls-bottom));
      overflow-y: auto;
    }

    .danmaku-input-row {
      grid-column: 1 / -1;
      grid-template-columns: 1fr;
    }

    .danmaku-input {
      font-size: 12px;
      padding: 5px 8px;
    }

    .danmaku-extra {
      justify-content: flex-start;
    }

    .danmaku-type-select {
      max-width: none;
    }

    .danmaku-send-btn {
      flex: 1 1 auto;
      min-width: 64px;
    }

    .danmaku-settings-panel {
      width: calc(100% - var(--danmaku-edge) - var(--danmaku-edge));
      max-height: calc(100% - var(--danmaku-edge) - var(--danmaku-edge));
    }
  }

  @media (max-width: 420px) {
    .danmaku-controls {
      grid-template-columns: auto auto;
    }

    .danmaku-float-toggle {
      padding: 6px 8px;
    }

    .float-label {
      display: none;
    }
  }

  .danmaku-settings-panel::-webkit-scrollbar {
    width: 5px;
  }

  .danmaku-settings-panel::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .danmaku-settings-panel::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .danmaku-settings-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
</style>

<style>
  @keyframes danmaku-scroll-lr {
    from {
      left: 100%;
    }
    to {
      left: -10%;
    }
  }

  @keyframes danmaku-fade-in-out {
    0% {
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
</style>
