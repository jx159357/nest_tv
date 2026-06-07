import { ref, onUnmounted, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { log } from '@/utils/logger';
import type {
  DanmakuMessage,
  RoomInfo,
  HeartbeatResponse,
  DanmakuSettings,
  DanmakuServiceConfig,
} from '@/types/danmaku';

type DanmakuEventListener = (...args: any[]) => void;
type SocketClient = typeof import('socket.io-client')['default'];
type Socket = ReturnType<SocketClient>;

let socketClientLoader: Promise<SocketClient> | null = null;

const loadSocketClient = (): Promise<SocketClient> => {
  socketClientLoader ??= import('socket.io-client').then(module => module.default);
  return socketClientLoader;
};

export type { DanmakuMessage, RoomInfo, HeartbeatResponse, DanmakuSettings, DanmakuServiceConfig };

// WebSocket服务类
export class DanmakuWebSocketService {
  private socket: Socket | null = null;
  private heartbeatInterval: number | null = null;
  private isConnected = ref(false);
  private roomId = ref('');
  private userId = ref('');
  private connectionVersion = 0;

  // 事件监听器
  private listeners = new Map<string, Set<DanmakuEventListener>>();

  // 消息队列（在重连时暂存）
  private messageQueue: any[] = [];

  // 配置选项
  private options = {
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    maxQueueSize: 100,
  };

  constructor(private authStore: any) {}

  // 连接WebSocket
  async connect(videoId: string, userId: string) {
    try {
      const version = ++this.connectionVersion;

      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
        this.stopHeartbeat();
        this.isConnected.value = false;
      }

      this.roomId.value = videoId;
      this.userId.value = userId;

      const config: DanmakuServiceConfig = {
        serverUrl:
          (import.meta.env.VITE_WS_URL ||
            (location.protocol === 'https:' ? 'https://' : 'http://') + location.host) + '/danmaku',
        reconnectDelay: this.options.reconnectDelay,
        heartbeatInterval: this.options.heartbeatInterval,
        maxQueueSize: this.options.maxQueueSize,
        maxReconnectAttempts: 5,
      };

      const io = await loadSocketClient();
      if (version !== this.connectionVersion) {
        return;
      }

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
      log.error('DanmakuWS', 'WebSocket连接失败:', error);
      this.handleConnectionError(error);
    }
  }

  // 设置事件处理器
  private setupEventHandlers() {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      log.debug('DanmakuWS', 'connected');
      this.isConnected.value = true;

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
    this.socket.on('disconnect', (reason: string) => {
      log.debug('DanmakuWS', 'disconnected:', reason);
      this.isConnected.value = false;
      this.stopHeartbeat();
      this.emit('disconnected', reason);
    });

    // 连接错误（Socket.IO 内置重连会自动处理，不手动重连）
    this.socket.on('connect_error', (error: Error) => {
      log.error('DanmakuWS', 'WebSocket连接错误:', error);
      this.isConnected.value = false;
    });

    // Socket.IO 内置重连失败（达到最大重试次数）
    this.socket.on('reconnect_failed', () => {
      log.warn('DanmakuWS', 'Socket.IO reconnect failed');
      this.emit('reconnect-failed');
    });

    // Socket.IO 内置重连尝试
    this.socket.io.on('reconnect_attempt', (attempt: number) => {
      log.debug('DanmakuWS', `Socket.IO reconnect attempt ${attempt}`);
    });

    // 接收弹幕消息
    this.socket.on('danmaku-message', (message: DanmakuMessage) => {
      this.emit('danmaku-message', message);
    });

    // 接收通过HTTP创建的弹幕广播
    this.socket.on(
      'danmaku-created',
      (data: {
        danmakuId: number;
        videoId: string;
        userId: number;
        text: string;
        color: string;
        type: string;
        timestamp: number;
      }) => {
        const message: DanmakuMessage = {
          id: String(data.danmakuId),
          userId: String(data.userId),
          videoId: data.videoId,
          text: data.text,
          color: data.color,
          type: data.type as DanmakuMessage['type'],
          priority: 1,
          timestamp: data.timestamp,
        };
        this.emit('danmaku-message', message);
      },
    );

    // 接收系统消息
    this.socket.on('system-message', (message: DanmakuMessage) => {
      this.emit('system-message', message);
    });

    // 接收房间信息
    this.socket.on('room-info', (info: RoomInfo) => {
      this.emit('room-info', info);
    });

    // 心跳响应
    this.socket.on('heartbeat-response', (response: HeartbeatResponse) => {
      this.emit('heartbeat-response', response);
    });

    // 错误消息
    this.socket.on('error', (error: Error) => {
      log.error('DanmakuWS', 'WebSocket错误:', error);
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

  // 连接错误处理
  private handleConnectionError(error: any) {
    this.isConnected.value = false;
    this.emit('error', error);
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
  on(event: string, callback: DanmakuEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: DanmakuEventListener) {
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
          log.error('DanmakuWS', '事件回调执行错误:', error);
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
    this.connectionVersion++;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.stopHeartbeat();
    this.isConnected.value = false;
    this.roomId.value = '';
    this.userId.value = '';
    this.messageQueue = [];

    this.listeners.clear();
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
      void service.connect(videoId, authStore.user.id.toString());
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

  const onReconnectFailed = (callback: () => void) => {
    service.on('reconnect-failed', callback);
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
    onReconnectFailed,
  };
}
