import { ref, reactive, onUnmounted, onMounted } from 'vue';
import type { Socket } from 'socket.io-client';
import io from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';
import type {
  DanmakuMessage,
  RoomInfo,
  HeartbeatResponse,
  DanmakuSettings,
  DanmakuServiceConfig,
} from '@/types';

// WebSocket服务类
export class DanmakuWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval: number;
  private heartbeatInterval: number | null = null;
  private isConnected = ref(false);
  private roomId = ref('');
  private userId = ref('');

  // 事件监听器
  private listeners = new Map<string, Set<Function>>();

  // 消息队列（在重连时暂存）
  private messageQueue: any[] = [];

  // 配置选项
  private options = {
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    maxQueueSize: 100,
    autoReconnect: true,
  };

  constructor(private authStore: any) {}

  // 连接WebSocket
  connect(videoId: string, userId: string) {
    try {
      this.roomId.value = videoId;
      this.userId.value = userId;

      const config: DanmakuServiceConfig = {
        serverUrl: (import.meta.env.VITE_WS_URL || 'ws://localhost:3334') + '/danmaku',
        reconnectDelay: this.options.reconnectDelay,
        heartbeatInterval: this.options.heartbeatInterval,
        maxQueueSize: this.options.maxQueueSize,
        autoReconnect: this.options.autoReconnect,
        maxReconnectAttempts: this.maxReconnectAttempts,
      };

      this.socket = io(config.serverUrl, {
        auth: {
          token: this.authStore.token,
          videoId,
          userId,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: config.maxReconnectAttempts,
        reconnectionDelay: config.reconnectDelay,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('❌ WebSocket连接失败:', error);
      this.handleConnectionError(error);
    }
  }

  // 设置事件处理器
  private setupEventHandlers() {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      console.log('✅ WebSocket连接成功');
      this.isConnected.value = true;
      this.reconnectAttempts = 0;

      // 加入房间
      this.socket?.emit('join-room', {
        videoId: this.roomId.value,
        userId: this.userId.value,
      });

      // 发送队列中的消息
      this.flushMessageQueue();

      // 开始心跳
      this.startHeartbeat();

      // 触发连接成功事件
      this.emit('connected');
    });

    // 连接断开
    this.socket.on('disconnect', reason => {
      console.log('❌ WebSocket连接断开:', reason);
      this.isConnected.value = false;
      this.stopHeartbeat();
      this.emit('disconnected', reason);

      // 自动重连
      if (this.options.autoReconnect && reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    // 连接错误
    this.socket.on('connect_error', error => {
      console.error('❌ WebSocket连接错误:', error);
      this.handleConnectionError(error);
    });

    // 接收弹幕消息
    this.socket.on('danmaku-message', (message: DanmakuMessage) => {
      this.emit('message', message);
    });

    // 接收房间信息
    this.socket.on('room-info', (info: RoomInfo) => {
      this.emit('room-info', info);
    });

    // 心跳响应
    this.socket.on('heartbeat-response', (response: HeartbeatResponse) => {
      this.emit('heartbeat', response);
    });

    // 错误消息
    this.socket.on('error', error => {
      console.error('❌ WebSocket错误:', error);
      this.emit('error', error);
    });
  }

  // 发送弹幕消息
  sendDanmaku(message: Omit<DanmakuMessage, 'id' | 'timestamp'>) {
    if (!this.isConnected.value || !this.socket) {
      // 添加到消息队列
      this.addToMessageQueue({
        event: 'send-danmaku',
        data: message,
      });
      return;
    }

    this.socket.emit('send-danmaku', {
      ...message,
      videoId: this.roomId.value,
      userId: this.userId.value,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    });
  }

  // 获取房间信息
  getRoomInfo() {
    if (!this.isConnected.value || !this.socket) return;

    this.socket.emit('get-room-info', {
      videoId: this.roomId.value,
    });
  }

  // 心跳检测
  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected.value && this.socket) {
        this.socket.emit('heartbeat', {
          userId: this.userId.value,
          timestamp: Date.now(),
        });
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 重连处理
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 达到最大重连次数，停止重连');
      this.emit('reconnect-failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectInterval = window.setTimeout(() => {
      if (this.roomId.value && this.userId.value) {
        this.connect(this.roomId.value, this.userId.value);
      }
    }, this.options.reconnectDelay * this.reconnectAttempts);
  }

  // 连接错误处理
  private handleConnectionError(error: any) {
    this.isConnected.value = false;
    this.emit('error', error);

    // 如果启用了自动重连，尝试重连
    if (this.options.autoReconnect) {
      this.handleReconnect();
    }
  }

  // 消息队列管理
  private addToMessageQueue(message: any) {
    if (this.messageQueue.length >= this.options.maxQueueSize) {
      // 队列满，移除最旧的消息
      this.messageQueue.shift();
    }
    this.messageQueue.push(message);
  }

  private flushMessageQueue() {
    if (!this.isConnected.value || !this.socket) return;

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    messages.forEach(message => {
      switch (message.event) {
        case 'send-danmaku':
          this.sendDanmaku(message.data);
          break;
        // 其他消息类型处理
      }
    });
  }

  // 事件管理
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error('❌ 事件回调执行错误:', error);
        }
      });
    }
  }

  // 工具方法
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 状态获取
  get connected(): boolean {
    return this.isConnected.value;
  }

  get currentRoomId(): string {
    return this.roomId.value;
  }

  get currentUserId(): string {
    return this.userId.value;
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.stopHeartbeat();
    this.isConnected.value = false;
    this.reconnectAttempts = 0;
    this.messageQueue = [];

    // 清理事件监听器
    this.listeners.clear();

    // 清理重连定时器
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = 0;
    }
  }

  // 销毁服务
  destroy() {
    this.disconnect();
  }
}

// 创建全局服务实例
let danmakuService: DanmakuWebSocketService | null = null;

/**
 * 初始化弹幕WebSocket服务
 */
export function initDanmakuService(authStore: any): DanmakuWebSocketService {
  if (!danmakuService) {
    danmakuService = new DanmakuWebSocketService(authStore);
  }
  return danmakuService;
}

/**
 * 获取弹幕服务实例
 */
export function getDanmakuService(): DanmakuWebSocketService | null {
  return danmakuService;
}

// Vue组合式API弹幕服务集成
export function useDanmakuWebSocket(videoId: string) {
  const authStore = useAuthStore();
  const service = initDanmakuService(authStore);
  const isConnected = ref(false);
  const roomInfo = ref<RoomInfo | null>(null);

  // 连接管理
  const connect = () => {
    if (authStore.user?.id && videoId) {
      service.connect(videoId, authStore.user.id.toString());
    }
  };

  // 断开连接
  const disconnect = () => {
    service.disconnect();
  };

  // 发送弹幕
  const sendDanmaku = (message: Omit<DanmakuMessage, 'id' | 'timestamp'>) => {
    return service.sendDanmaku(message);
  };

  // 获取房间信息
  const getRoomInfo = () => {
    service.getRoomInfo();
  };

  // 事件监听
  const onDanmaku = (callback: (message: DanmakuMessage) => void) => {
    service.on('danmaku-message', callback);
  };

  const onSystem = (callback: (message: DanmakuMessage) => void) => {
    service.on('system-message', callback);
  };

  const onRoomInfo = (callback: (info: RoomInfo) => void) => {
    service.on('room-info', callback);
  };

  const onConnected = (callback: () => void) => {
    service.on('connected', callback);
  };

  const onDisconnected = (callback: (reason: string) => void) => {
    service.on('disconnected', callback);
  };

  const onError = (callback: (error: any) => void) => {
    service.on('error', callback);
  };

  const onHeartbeat = (callback: (response: HeartbeatResponse) => void) => {
    service.on('heartbeat-response', callback);
  };

  // 设置事件监听器
  onMounted(() => {
    connect();
    service.on('connected', () => (isConnected.value = true));
    service.on('disconnected', () => (isConnected.value = false));
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    roomInfo,
    connect,
    disconnect,
    sendDanmaku,
    getRoomInfo,
    onDanmaku,
    onSystem,
    onRoomInfo,
    onConnected,
    onDisconnected,
    onError,
    onHeartbeat,
  };
}
