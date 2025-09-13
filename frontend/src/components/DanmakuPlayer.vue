<template>
  <div class="danmaku-player" ref="danmakuContainer">
    <!-- 弹幕显示区域 -->
    <div class="danmaku-container" :class="{ 'danmaku-hidden': !settings.enabled }">
      <div 
        v-for="danmaku in visibleDanmaku" 
        :key="danmaku.id"
        :class="['danmaku-item', `danmaku-${danmaku.type}`, { 'danmaku-highlighted': danmaku.isHighlighted }]"
        :style="getDanmakuStyle(danmaku)"
      >
        <span class="danmaku-text">{{ danmaku.text }}</span>
      </div>
    </div>

    <!-- 弹幕输入区域 -->
    <div class="danmaku-controls" v-if="showControls">
      <div class="danmaku-input-container">
        <input
          v-model="inputText"
          type="text"
          :placeholder="inputPlaceholder"
          class="danmaku-input"
          @keyup.enter="sendDanmaku"
          :disabled="!isConnected || !settings.enabled"
          maxlength="100"
        />
        <div class="danmaku-color-picker">
          <input
            v-model="selectedColor"
            type="color"
            class="color-input"
            title="选择颜色"
          />
        </div>
        <select v-model="selectedType" class="danmaku-type-select" title="弹幕类型">
          <option value="scroll">滚动</option>
          <option value="top">顶部</option>
          <option value="bottom">底部</option>
        </select>
        <button 
          @click="sendDanmaku"
          :disabled="!isConnected || !inputText.trim() || !settings.enabled"
          class="danmaku-send-btn"
        >
          发送
        </button>
      </div>

      <!-- 弹幕设置按钮 -->
      <div class="danmaku-settings-btn" @click="toggleSettings">
        <i class="settings-icon">⚙️</i>
      </div>
    </div>

    <!-- 弹幕设置面板 -->
    <div v-if="showSettings" class="danmaku-settings-panel">
      <div class="settings-header">
        <h3>弹幕设置</h3>
        <button @click="toggleSettings" class="close-btn">×</button>
      </div>
      
      <div class="settings-content">
        <!-- 基本设置 -->
        <div class="setting-group">
          <label class="setting-label">
            <input type="checkbox" v-model="settings.enabled" />
            启用弹幕
          </label>
          
          <label class="setting-label">
            <input type="checkbox" v-model="settings.display.scroll" />
            显示滚动弹幕
          </label>
          
          <label class="setting-label">
            <input type="checkbox" v-model="settings.display.top" />
            显示顶部弹幕
          </label>
          
          <label class="setting-label">
            <input type="checkbox" v-model="settings.display.bottom" />
            显示底部弹幕
          </label>
        </div>

        <!-- 外观设置 -->
        <div class="setting-group">
          <label class="setting-label">
            透明度: {{ settings.opacity }}%
            <input 
              type="range" 
              v-model="settings.opacity" 
              min="10" 
              max="100" 
              step="10"
              class="range-input"
            />
          </label>
          
          <label class="setting-label">
            字体大小: {{ settings.fontSize }}px
            <input 
              type="range" 
              v-model="settings.fontSize" 
              min="12" 
              max="32" 
              step="2"
              class="range-input"
            />
          </label>
          
          <label class="setting-label">
            滚动速度: {{ settings.speed }}
            <input 
              type="range" 
              v-model="settings.speed" 
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
            <input type="checkbox" v-model="settings.filter.profanity" />
            过滤敏感词
          </label>
          
          <label class="setting-label">
            <input type="checkbox" v-model="settings.filter.spam" />
            过滤垃圾信息
          </label>
          
          <label class="setting-label">
            <input type="checkbox" v-model="settings.filter.highlight" />
            高亮重要弹幕
          </label>
        </div>

        <!-- 房间信息 -->
        <div class="room-info" v-if="roomInfo">
          <p>在线用户: {{ roomInfo.onlineCount }}</p>
          <p>房间ID: {{ props.videoId }}</p>
          <p>连接状态: {{ isConnected ? '已连接' : '未连接' }}</p>
        </div>
      </div>
    </div>

    <!-- 连接状态提示 -->
    <div v-if="!isConnected && settings.enabled" class="connection-status">
      <div class="status-message">
        {{ connectionError || '正在连接弹幕服务器...' }}
      </div>
      <button @click="reconnect" class="reconnect-btn">重新连接</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useDanmakuWebSocket, type DanmakuMessage, type DanmakuSettings, type RoomInfo } from '@/services/danmaku-websocket.service'
import { useAuthStore } from '@/stores/auth'

// Props 定义
interface Props {
  videoId: string
  width?: number
  height?: number
  showControls?: boolean
  maxDanmakuCount?: number
  defaultSettings?: Partial<DanmakuSettings>
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 450,
  showControls: true,
  maxDanmakuCount: 100,
  defaultSettings: () => ({})
})

// 状态管理
const danmakuContainer = ref<HTMLElement>()
const inputText = ref('')
const selectedColor = ref('#FFFFFF')
const selectedType = ref<'scroll' | 'top' | 'bottom'>('scroll')
const showSettings = ref(false)
const roomInfo = ref<RoomInfo | null>(null)
const connectionError = ref<string | null>(null)

// 弹幕列表管理
const danmakuList = ref<DanmakuMessage[]>([])
const visibleDanmaku = computed(() => {
  if (!settings.enabled) return []
  
  let filtered = danmakuList.value

  // 应用类型过滤
  if (!settings.display.scroll) {
    filtered = filtered.filter(d => d.type !== 'scroll')
  }
  if (!settings.display.top) {
    filtered = filtered.filter(d => d.type !== 'top')
  }
  if (!settings.display.bottom) {
    filtered = filtered.filter(d => d.type !== 'bottom')
  }

  // 应用内容过滤
  if (settings.filter.profanity) {
    filtered = filtered.filter(d => !d.filters?.containsSensitive)
  }
  if (settings.filter.spam) {
    filtered = filtered.filter(d => !d.filters?.containsSpam)
  }

  // 限制显示数量
  return filtered.slice(-props.maxDanmakuCount)
})

// 默认设置
const defaultSettings: DanmakuSettings = {
  enabled: true,
  opacity: 80,
  fontSize: 16,
  speed: 5,
  color: '#FFFFFF',
  fontFamily: 'Arial, sans-serif',
  filter: {
    profanity: true,
    spam: true,
    highlight: true
  },
  display: {
    scroll: true,
    top: true,
    bottom: true
  }
}

// 设置状态
const settings = reactive<DanmakuSettings>({
  ...defaultSettings,
  ...props.defaultSettings
})

// 用户认证
const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id?.toString() || '')

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
  onHeartbeat
} = useDanmakuWebSocket(props.videoId)

// 事件监听设置
onMounted(() => {
  setupEventListeners()
  
  if (userId.value && props.videoId) {
    wsConnect(props.videoId, userId.value)
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  startAnimationLoop()
})

onUnmounted(() => {
  cleanup()
})

// 事件监听器设置
const setupEventListeners = () => {
  // 接收弹幕消息
  onDanmaku((message: DanmakuMessage) => {
    addDanmaku(message)
  })

  // 接收系统消息
  onSystem((message: DanmakuMessage) => {
    addDanmaku({
      ...message,
      isHighlighted: true,
      color: '#00FF00'
    })
  })

  // 接收房间信息
  onRoomInfo((info: RoomInfo) => {
    roomInfo.value = info
  })

  // 连接状态变化
  onConnected(() => {
    connectionError.value = null
    wsGetRoomInfo(props.videoId)
  })

  onDisconnected(() => {
    connectionError.value = '连接已断开'
  })

  onError((error: any) => {
    connectionError.value = error.message || '连接错误'
  })

  // 心跳响应
  onHeartbeat(() => {
    // 保持连接活跃
  })
}

// 弹幕管理
const addDanmaku = (danmaku: DanmakuMessage) => {
  danmakuList.value.push({
    ...danmaku,
    id: danmaku.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: danmaku.timestamp || Date.now()
  })

  // 限制弹幕总数
  if (danmakuList.value.length > props.maxDanmakuCount * 2) {
    danmakuList.value = danmakuList.value.slice(-props.maxDanmakuCount)
  }
}

// 发送弹幕
const sendDanmaku = () => {
  if (!inputText.value.trim() || !isConnected.value || !settings.enabled) return

  const success = wsSendDanmaku({
    text: inputText.value.trim(),
    color: selectedColor.value,
    type: selectedType.value,
    priority: 1,
    userId: userId.value,
    videoId: props.videoId,
    isHighlighted: false
  })

  if (success) {
    inputText.value = ''
  }
}

// 弹幕样式计算
const getDanmakuStyle = (danmaku: DanmakuMessage) => {
  const baseStyle: any = {
    color: danmaku.color || settings.color,
    fontSize: `${settings.fontSize}px`,
    fontFamily: settings.fontFamily,
    opacity: settings.opacity / 100,
    zIndex: danmaku.priority || 1
  }

  if (danmaku.isHighlighted) {
    baseStyle.fontWeight = 'bold'
    baseStyle.textShadow = '0 0 10px rgba(255, 255, 255, 0.8)'
  }

  return baseStyle
}

// 动画循环
let animationFrame: number | null = null
const startAnimationLoop = () => {
  const animate = () => {
    updateDanmakuPositions()
    animationFrame = requestAnimationFrame(animate)
  }
  animate()
}

const stopAnimationLoop = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

// 更新弹幕位置
const updateDanmakuPositions = () => {
  if (!danmakuContainer.value || !settings.enabled) return

  const container = danmakuContainer.value
  const containerWidth = container.offsetWidth
  const containerHeight = container.offsetHeight

  const scrollDanmaku = visibleDanmaku.value.filter(d => d.type === 'scroll')
  const currentTime = Date.now()

  scrollDanmaku.forEach((danmaku: any) => {
    if (!danmaku.position) {
      danmaku.position = {
        x: containerWidth,
        y: Math.random() * (containerHeight - 50) + 25,
        startTime: currentTime
      }
    }

    const elapsed = currentTime - danmaku.position.startTime
    const speed = (11 - settings.speed) * 50 // 速度转换为像素/秒
    const distance = (elapsed / 1000) * speed
    
    danmaku.position.x = containerWidth + distance

    // 如果弹幕完全移出屏幕，重置位置
    if (danmaku.position.x > containerWidth + 200) {
      danmaku.position.startTime = currentTime
      danmaku.position.x = -200
    }
  })
}

// UI 交互
const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const reconnect = () => {
  if (userId.value && props.videoId) {
    connectionError.value = null
    wsConnect(props.videoId, userId.value)
  }
}

const handleResize = () => {
  // 重新计算弹幕位置
  nextTick(() => {
    updateDanmakuPositions()
  })
}

// 清理资源
const cleanup = () => {
  wsDisconnect()
  stopAnimationLoop()
  window.removeEventListener('resize', handleResize)
}

// 监听设置变化
watch(() => settings.enabled, (newVal) => {
  if (newVal && userId.value && props.videoId && !isConnected.value) {
    wsConnect(props.videoId, userId.value)
  }
})

// 计算属性
const inputPlaceholder = computed(() => {
  if (!isConnected.value) return '连接中...'
  if (!settings.enabled) return '弹幕已禁用'
  return '发送弹幕 (按Enter)'
})
</script>

<style scoped>
.danmaku-player {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
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
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  will-change: transform;
}

.danmaku-scroll {
  animation: scroll-right-to-left 8s linear;
}

.danmaku-top {
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.danmaku-bottom {
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

.danmaku-highlighted {
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

@keyframes scroll-right-to-left {
  from {
    transform: translateX(100vw);
  }
  to {
    transform: translateX(-100%);
  }
}

.danmaku-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 15px;
  border-radius: 25px;
  z-index: 100;
  pointer-events: all;
}

.danmaku-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.danmaku-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  outline: none;
  width: 200px;
  font-size: 14px;
}

.danmaku-input:focus {
  border-color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.danmaku-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-input {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: none;
}

.danmaku-type-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 8px;
  border-radius: 15px;
  outline: none;
  font-size: 12px;
}

.danmaku-send-btn {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.danmaku-send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.danmaku-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.danmaku-settings-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.danmaku-settings-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.settings-icon {
  font-size: 16px;
}

.danmaku-settings-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(20, 20, 20, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 20px;
  min-width: 350px;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  backdrop-filter: blur(10px);
  color: white;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.settings-header h3 {
  margin: 0;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 14px;
}

.setting-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.range-input {
  flex: 1;
  margin-left: 10px;
  accent-color: #667eea;
}

.room-info {
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 10px;
  padding: 15px;
}

.room-info p {
  margin: 5px 0;
  color: #fff;
  font-size: 14px;
}

.connection-status {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 0, 0, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 200;
}

.status-message {
  font-size: 14px;
}

.reconnect-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.reconnect-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .danmaku-controls {
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px;
  }

  .danmaku-input-container {
    flex-wrap: wrap;
    justify-content: center;
  }

  .danmaku-input {
    width: 150px;
  }

  .danmaku-settings-panel {
    min-width: 300px;
    max-width: 90vw;
  }
}

/* 滚动条样式 */
.danmaku-settings-panel::-webkit-scrollbar {
  width: 6px;
}

.danmaku-settings-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.danmaku-settings-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.danmaku-settings-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>