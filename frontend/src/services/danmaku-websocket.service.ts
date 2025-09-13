import { ref, reactive, onUnmounted, onMounted } from 'vue'
import type { Socket } from 'socket.io-client'
import io from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import type { Danmaku } from '@/types'

// 弹幕消息类型
export interface DanmakuMessage {
  id: string
  userId: string
  videoId: string
  text: string
  color: string
  type: 'scroll' | 'top' | 'bottom'
  priority: number
  timestamp: number
  isHighlighted?: boolean
  filters?: {
    containsSensitive?: boolean
    containsSpam?: boolean
    containsEmojis?: boolean
    keywords?: string[]
  }
  metadata?: {
    userAgent?: string
    location?: string
    platform?: string
  }
  position?: {
    x: number
    y: number
    startTime: number
  }
}

// 房间信息类型
export interface RoomInfo {
  videoId: string
  onlineCount: number
  timestamp: number
}

// 心跳响应类型
export interface HeartbeatResponse {
  status: 'ok' | 'error'
  timestamp: number
  userId: string
}

// 弹幕设置类型
export interface DanmakuSettings {
  enabled: boolean
  opacity: number
  fontSize: number
  speed: number
  color: string
  fontFamily: string
  filter: {
    profanity: boolean
    spam: boolean
    highlight: boolean
  }
  display: {
    scroll: boolean
    top: boolean
    bottom: boolean
  }
}

// WebSocket服务类
export class DanmakuWebSocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval: number
  private heartbeatInterval: number | null = null
  private isConnected = ref(false)
  private roomId = ref('')
  private userId = ref('')
  
  // 事件监听器
  private listeners = new Map<string, Set<Function>>()
  
  // 消息队列（在重连时暂存）
  private messageQueue: any[] = []
  
  // 配置选项
  private options = {
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    maxQueueSize: 100,
    autoReconnect: true
  }

  constructor(private authStore: any) {}

  // 连接WebSocket
  connect(videoId: string, userId: string) {
    try {
      // 如果已连接，先断开
      if (this.socket) {
        this.disconnect()
      }

      this.roomId.value = videoId
      this.userId.value = userId

      // 创建Socket连接
      this.socket = io(process.env.VUE_APP_WS_URL || 'http://localhost:3334', {
        path: '/danmaku',
        query: {
          userId,
          videoId
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: false, // 我们自己管理重连
        forceNew: true
      })

      this.setupEventListeners()
      this.startHeartbeat()
      
      console.log('弹幕WebSocket连接成功')
    } catch (error) {
      console.error('弹幕WebSocket连接失败:', error)
      this.handleConnectionError()
    }
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected.value = false
      this.stopHeartbeat()
      this.clearMessageQueue()
      console.log('弹幕WebSocket连接已断开')
    }
  }

  // 设置事件监听器
  private setupEventListeners() {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      this.isConnected.value = true
      this.reconnectAttempts = 0
      console.log('弹幕WebSocket连接成功')
      
      // 发送队列中的消息
      this.flushMessageQueue()
      
      // 通知监听器
      this.emit('connected')
    })

    // 连接失败
    this.socket.on('connect_error', (error) => {
      console.error('弹幕WebSocket连接失败:', error)
      this.handleConnectionError()
    })

    // 断开连接
    this.socket.on('disconnect', (reason) => {
      console.log('弹幕WebSocket断开连接:', reason)
      this.isConnected.value = false
      this.handleDisconnection()
    })

    // 接收弹幕消息
    this.socket.on('danmaku', (message: DanmakuMessage) => {
      this.emit('danmaku', message)
    })

    // 心跳响应
    this.socket.on('heartbeat', (response: HeartbeatResponse) => {
      this.emit('heartbeat', response)
    })

    // 房间信息
    this.socket.on('room_info', (info: RoomInfo) => {
      this.emit('room_info', info)
    })

    // 系统消息
    this.socket.on('system', (message: DanmakuMessage) => {
      this.emit('system', message)
    })

    // 错误消息
    this.socket.on('error', (error) => {
      console.error('弹幕WebSocket错误:', error)
      this.emit('error', error)
    })
  }

  // 发送弹幕消息
  sendDanmaku(message: Omit<DanmakuMessage, 'id' | 'timestamp'>) {
    if (!this.socket || !this.isConnected.value) {
      // 添加到队列，等重连后发送
      this.addToMessageQueue({
        event: 'danmaku',
        data: message
      })
      return false
    }

    try {
      this.socket.emit('danmaku', message)
      return true
    } catch (error) {
      console.error('发送弹幕失败:', error)
      return false
    }
  }

  // 获取房间信息
  getRoomInfo(videoId: string) {
    if (!this.socket) return

    this.socket.emit('get_room_info', { videoId })
  }

  // 发送心跳
  sendHeartbeat() {
    if (!this.socket || !this.isConnected.value) return

    try {
      this.socket.emit('heartbeat')
    } catch (error) {
      console.error('发送心跳失败:', error)
    }
  }

  // 添加事件监听器
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)

    // 如果Socket存在，添加到Socket
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  // 移除事件监听器
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      
      // 如果Socket存在，从Socket移除
      if (this.socket) {
        this.socket.off(event, callback)
      }
    }
  }

  // 清除所有监听器
  removeAllListeners() {
    if (this.socket) {
      for (const [event, callbacks] of this.listeners) {
        for (const callback of callbacks) {
          this.socket.off(event, callback)
        }
      }
    }
    this.listeners.clear()
  }

  // 发送事件（内部使用）
  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`弹幕WebSocket事件处理错误 (${event}):`, error)
        }
      })
    }
  }

  // 开始心跳
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat()
    }, this.options.heartbeatInterval)
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      window.clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 处理连接错误
  private handleConnectionError() {
    this.isConnected.value = false
    this.emit('connection_error')
    
    if (this.options.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    } else {
      this.emit('connection_failed')
    }
  }

  // 处理断开连接
  private handleDisconnection() {
    this.stopHeartbeat()
    this.emit('disconnected')
    
    if (this.options.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect()
    }
  }

  // 计划重连
  private scheduleReconnect() {
    this.reconnectAttempts++
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // 指数退避
    
    console.log(`弹幕WebSocket计划在 ${delay}ms 后重连，尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    this.reconnectInterval = window.setTimeout(() => {
      if (this.authStore.isAuthenticated && this.roomId.value && this.userId.value) {
        this.connect(this.roomId.value, this.userId.value)
      }
    }, delay)
  }

  // 添加消息到队列
  private addToMessageQueue(message: { event: string; data: any }) {
    if (this.messageQueue.length >= this.options.maxQueueSize) {
      // 队列已满，移除最旧的消息
      this.messageQueue.shift()
    }
    this.messageQueue.push(message)
  }

  // 清空消息队列
  private clearMessageQueue() {
    this.messageQueue = []
  }

  // 发送队列中的消息
  private flushMessageQueue() {
    const messages = [...this.messageQueue]
    this.clearMessageQueue()
    
    for (const message of messages) {
      if (message.event === 'danmaku') {
        this.sendDanmaku(message.data)
      }
      // 其他消息类型的处理...
    }
  }

  // 获取连接状态
  getConnectionStatus() {
    return {
      isConnected: this.isConnected.value,
      roomId: this.roomId.value,
      userId: this.userId.value,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.messageQueue.length
    }
  }

  // 更新配置
  updateConfig(newConfig: Partial<typeof this.options>) {
    Object.assign(this.options, newConfig)
  }

  // 清理资源
  destroy() {
    this.disconnect()
    this.removeAllListeners()
    this.clearMessageQueue()
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval)
    }
  }
}

// React Hook风格的使用方式
export function useDanmakuWebSocket(videoId: string) {
  const authStore = useAuthStore()
  const service = new DanmakuWebSocketService(authStore)
  const isConnected = ref(false)
  const roomInfo = ref<RoomInfo | null>(null)
  const error = ref<any>(null)
  
  // 生命周期管理
  onMounted(() => {
    if (authStore.isAuthenticated && videoId) {
      service.connect(videoId, authStore.user.id.toString())
    }
  })

  onUnmounted(() => {
    service.destroy()
  })

  // 设置事件监听
  service.on('connected', () => {
    isConnected.value = true
    error.value = null
  })

  service.on('disconnected', () => {
    isConnected.value = false
  })

  service.on('connection_error', (err) => {
    error.value = err
  })

  service.on('connection_failed', () => {
    error.value = new Error('连接失败，请重试')
  })

  service.on('room_info', (info: RoomInfo) => {
    roomInfo.value = info
  })

  service.on('error', (err) => {
    error.value = err
  })

  // 返回API
  return {
    isConnected: isConnected,
    roomInfo: roomInfo,
    error: error,
    sendDanmaku: (message: Omit<DanmakuMessage, 'id' | 'timestamp'>) => 
      service.sendDanmaku(message),
    getRoomInfo: () => service.getRoomInfo(videoId),
    connect: () => service.connect(videoId, authStore.user.id.toString()),
    disconnect: () => service.disconnect(),
    updateConfig: (config: Partial<typeof service.options>) => 
      service.updateConfig(config),
    getStatus: () => service.getConnectionStatus(),
    
    // 事件监听
    onDanmaku: (callback: (message: DanmakuMessage) => void) => 
      service.on('danmaku', callback),
    onSystem: (callback: (message: DanmakuMessage) => void) => 
      service.on('system', callback),
    onRoomInfo: (callback: (info: RoomInfo) => void) => 
      service.on('room_info', callback),
    onHeartbeat: (callback: (response: HeartbeatResponse) => void) => 
      service.on('heartbeat', callback),
    onError: (callback: (err: any) => void) => 
      service.on('error', callback),
    onConnected: (callback: () => void) => 
      service.on('connected', callback),
    onDisconnected: (callback: () => void) => 
      service.on('disconnected', callback),
    
    // 移除监听器
    off: (event: string, callback: Function) => 
      service.off(event, callback)
  }
}