<template>
  <div class="watch-room">
    <div class="room-header">
      <h3 class="room-title">一起看</h3>
      <div class="room-actions">
        <button v-if="!isInRoom" class="btn-create" @click="createRoom">创建房间</button>
        <button v-else class="btn-leave" @click="leaveRoom">离开房间</button>
      </div>
    </div>

    <div v-if="!isInRoom" class="room-list">
      <div class="join-by-id">
        <input
          v-model="joinRoomId"
          type="text"
          placeholder="输入房间号加入"
          class="join-id-input"
          @keyup.enter="joinRoomById"
        />
        <button class="btn-join-id" :disabled="!joinRoomId.trim()" @click="joinRoomById">
          加入
        </button>
      </div>

      <div v-if="loading" class="loading-state">加载中...</div>
      <div v-else-if="activeRooms.length === 0" class="empty-state">
        <p>暂无活跃房间</p>
        <span>创建一个房间，将房间号分享给朋友即可一起看</span>
      </div>
      <div v-else class="rooms-grid">
        <div class="rooms-header">
          <span class="rooms-title">活跃房间</span>
          <button class="btn-refresh" @click="loadActiveRooms">刷新</button>
        </div>
        <div
          v-for="room in activeRooms"
          :key="room.id"
          class="room-card"
          @click="joinRoom(room.id)"
        >
          <div class="room-info">
            <div class="room-name">{{ room.mediaTitle }}</div>
            <div class="room-meta">
              <span class="online-count">{{ room.onlineCount }} 人观看</span>
              <span class="host-name">房主: {{ room.hostUsername }}</span>
            </div>
          </div>
          <button class="btn-join">加入</button>
        </div>
      </div>
    </div>

    <div v-else class="room-content">
      <div class="room-status">
        <div class="status-info">
          <span class="status-badge" :class="{ playing: isPlaying }">
            {{ isPlaying ? '播放中' : '已暂停' }}
          </span>
          <span class="online-badge">{{ onlineCount }} 人在线</span>
        </div>
        <div class="room-share">
          <div class="room-id-display">
            <span class="room-id-label">房间号</span>
            <code class="room-id-code">{{ currentRoomId }}</code>
          </div>
          <button class="btn-copy" @click="copyRoomId">复制分享</button>
        </div>
      </div>

      <div class="chat-panel">
        <div ref="chatContainer" class="chat-messages">
          <div
            v-for="(msg, index) in chatMessages"
            :key="index"
            class="chat-message"
            :class="{ self: msg.isSelf, system: msg.isSystem }"
          >
            <span class="msg-user">{{ msg.username }}</span>
            <span class="msg-text">{{ msg.message }}</span>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="chatInput"
            placeholder="发送消息..."
            maxlength="300"
            @keyup.enter="sendChat"
          />
          <button :disabled="!chatInput.trim() || !socket" @click="sendChat">发送</button>
        </div>
      </div>

      <div class="users-list">
        <h4>在线用户</h4>
        <div v-for="user in roomUsers" :key="user.userId" class="user-item">
          <span class="user-name">{{ user.username }}</span>
          <span v-if="user.userId === hostId" class="host-badge">房主</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, nextTick } from 'vue';
  import socketIOClient from 'socket.io-client';
  import { useAuthStore } from '@/stores/auth';

  const io = socketIOClient;
  type Socket = ReturnType<typeof io>;
  import { notifyError, notifyInfo } from '@/composables/useModal';

  interface RoomUser {
    userId: string;
    username: string;
    joinedAt: number;
  }

  interface JoinRoomResponse {
    success: boolean;
    room?: {
      hostId: string;
      users: Record<string, RoomUser>;
      currentTime: number;
      isPlaying: boolean;
    };
  }

  interface ActiveRoom {
    id: string;
    mediaId: number;
    mediaTitle: string;
    hostUsername: string;
    onlineCount: number;
  }

  interface ChatMessage {
    userId: string;
    username: string;
    message: string;
    timestamp: number;
    isSelf: boolean;
    isSystem: boolean;
  }

  const props = defineProps<{
    mediaId: number;
    mediaTitle: string;
  }>();

  const emit = defineEmits<{
    sync: [currentTime: number, isPlaying: boolean];
  }>();

  const authStore = useAuthStore();

  const socket = ref<Socket | null>(null);
  const isInRoom = ref(false);
  const loading = ref(false);
  const activeRooms = ref<ActiveRoom[]>([]);
  const currentRoomId = ref('');
  const isPlaying = ref(false);
  const onlineCount = ref(0);
  const hostId = ref('');
  const roomUsers = ref<RoomUser[]>([]);
  const chatMessages = ref<ChatMessage[]>([]);
  const chatInput = ref('');
  const chatContainer = ref<HTMLElement | null>(null);
  const joinRoomId = ref('');

  const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

  const connectSocket = () => {
    const token = authStore.token || localStorage.getItem('token');
    if (!token) return;

    socket.value = io(`${BASE_URL}/watch-room`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.value.on(
      'user-joined',
      (data: { userId: string; username: string; onlineCount: number }) => {
        onlineCount.value = data.onlineCount;
        if (!roomUsers.value.find(u => u.userId === data.userId)) {
          roomUsers.value.push({
            userId: data.userId,
            username: data.username,
            joinedAt: Date.now(),
          });
        }
        addSystemMessage(`${data.username} 加入了房间`);
      },
    );

    socket.value.on(
      'user-left',
      (data: { userId: string; username: string; onlineCount: number }) => {
        onlineCount.value = data.onlineCount;
        roomUsers.value = roomUsers.value.filter(u => u.userId !== data.userId);
        addSystemMessage(`${data.username} 离开了房间`);
      },
    );

    socket.value.on('sync', (data: { currentTime: number; isPlaying: boolean; hostId: string }) => {
      isPlaying.value = data.isPlaying;
      emit('sync', data.currentTime, data.isPlaying);
    });

    socket.value.on('host-changed', (data: { newHostId: string }) => {
      hostId.value = data.newHostId;
      addSystemMessage('房主已变更');
    });

    socket.value.on(
      'chat',
      (data: { userId: string; username: string; message: string; timestamp: number }) => {
        chatMessages.value.push({
          ...data,
          isSelf: data.userId === authStore.user?.id?.toString(),
          isSystem: false,
        });
        scrollChatToBottom();
      },
    );

    socket.value.on('connect_error', () => {
      addSystemMessage('房间连接失败，请稍后重试');
    });
  };

  const disconnectSocket = () => {
    socket.value?.disconnect();
    socket.value = null;
  };

  const loadActiveRooms = async () => {
    loading.value = true;
    try {
      const token = authStore.token || localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/watch-room/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        activeRooms.value = await response.json();
      }
    } catch {
      // ignore load errors
    } finally {
      loading.value = false;
    }
  };

  const createRoom = async () => {
    if (!socket.value) {
      connectSocket();
    }

    try {
      const token = authStore.token || localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/watch-room/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaId: props.mediaId,
          mediaTitle: props.mediaTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('创建房间失败');
      }

      const created = (await response.json()) as { roomId: string };
      joinRoom(created.roomId, '房间已创建，分享房间号邀请朋友加入吧');
    } catch (error) {
      notifyError('创建房间失败', error instanceof Error ? error.message : '请稍后重试');
    }
  };

  const applyJoinedRoom = (
    roomId: string,
    response: JoinRoomResponse,
    message: string,
  ) => {
    if (response.success && response.room) {
      currentRoomId.value = roomId;
      isInRoom.value = true;
      hostId.value = response.room.hostId;
      const users = response.room.users;
      roomUsers.value = Object.values(users);
      onlineCount.value = roomUsers.value.length;
      isPlaying.value = response.room.isPlaying;
      addSystemMessage(message);

      if (response.room.currentTime > 0 || response.room.isPlaying) {
        emit('sync', response.room.currentTime, response.room.isPlaying);
      }
    }
  };

  const joinRoomById = () => {
    const id = joinRoomId.value.trim();
    if (!id) return;
    joinRoom(id, '已加入房间');
    joinRoomId.value = '';
  };

  const joinRoom = (roomId: string, joinedMessage = '已加入房间') => {
    if (!socket.value) {
      connectSocket();
    }

    socket.value?.emit(
      'join-room',
      { roomId, mediaId: props.mediaId.toString() },
      (response: JoinRoomResponse) => applyJoinedRoom(roomId, response, joinedMessage),
    );
  };

  const leaveRoom = () => {
    socket.value?.emit('leave-room');
    isInRoom.value = false;
    currentRoomId.value = '';
    chatMessages.value = [];
    roomUsers.value = [];
    disconnectSocket();
  };

  const sendChat = () => {
    const message = chatInput.value.trim();
    if (!message || !socket.value) return;

    socket.value.emit('chat', { message: message.slice(0, 300) });
    chatInput.value = '';
  };

  const addSystemMessage = (message: string) => {
    chatMessages.value.push({
      userId: 'system',
      username: '系统',
      message,
      timestamp: Date.now(),
      isSelf: false,
      isSystem: true,
    });
    scrollChatToBottom();
  };

  const scrollChatToBottom = () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoomId.value);
    notifyInfo('已复制', '房间号已复制到剪贴板');
  };

  const sendSync = (currentTime: number, playing: boolean) => {
    socket.value?.emit('sync', { currentTime, isPlaying: playing });
  };

  defineExpose({ sendSync });

  onMounted(() => {
    loadActiveRooms();
  });

  onUnmounted(() => {
    disconnectSocket();
  });
</script>

<style scoped>
  .watch-room {
    background: var(--bg-card);
    border-radius: 14px;
    border: 1px solid var(--border-primary);
    overflow: hidden;
  }

  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-primary);
  }

  .room-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .btn-create,
  .btn-leave {
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-create {
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    border: none;
    color: var(--text-inverse);
  }

  .btn-create:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .btn-leave {
    background: transparent;
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: var(--color-error);
  }

  .btn-leave:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .room-list {
    padding: 16px 20px;
  }

  .join-by-id {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .join-id-input {
    flex: 1;
    padding: 8px 12px;
    background: var(--border-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 13px;
    outline: none;
  }

  .join-id-input:focus {
    border-color: var(--border-focus);
  }

  .btn-join-id {
    padding: 8px 16px;
    background: var(--color-brand-primary);
    border: none;
    border-radius: 8px;
    color: var(--text-inverse);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .btn-join-id:hover:not(:disabled) {
    background: #5558e6;
  }

  .btn-join-id:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .rooms-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .rooms-title {
    font-size: 13px;
    color: var(--text-tertiary);
  }

  .btn-refresh {
    padding: 3px 10px;
    background: var(--border-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 4px;
    color: var(--text-tertiary);
    font-size: 11px;
    cursor: pointer;
  }

  .btn-refresh:hover {
    background: var(--border-secondary);
  }

  .loading-state,
  .empty-state {
    text-align: center;
    padding: 24px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .empty-state span {
    display: block;
    margin-top: 8px;
    font-size: 12px;
  }

  .rooms-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .room-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--border-primary);
    border: 1px solid var(--border-primary);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .room-card:hover {
    background: var(--border-primary);
  }

  .room-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .room-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .btn-join {
    padding: 6px 12px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    color: #818cf8;
    font-size: 12px;
    cursor: pointer;
  }

  .btn-join:hover {
    background: rgba(99, 102, 241, 0.25);
  }

  .room-content {
    padding: 16px 20px;
  }

  .room-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .status-info {
    display: flex;
    gap: 10px;
  }

  .status-badge {
    padding: 4px 10px;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 12px;
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .status-badge.playing {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .online-badge {
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.15);
    border-radius: 12px;
    font-size: 12px;
    color: #818cf8;
  }

  .room-share {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .room-id-display {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .room-id-label {
    font-size: 12px;
    color: var(--text-muted);
  }

  .room-id-code {
    padding: 3px 8px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.25);
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    color: #a5b4fc;
    letter-spacing: 0.5px;
  }

  .btn-copy {
    padding: 4px 10px;
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 6px;
    color: #818cf8;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-copy:hover {
    background: rgba(99, 102, 241, 0.25);
  }

  .chat-panel {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .chat-messages {
    height: 200px;
    overflow-y: auto;
    padding: 12px;
  }

  .chat-message {
    margin-bottom: 8px;
    font-size: 13px;
  }

  .chat-message.system {
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
  }

  .chat-message.self .msg-user {
    color: #818cf8;
  }

  .msg-user {
    color: var(--text-tertiary);
    margin-right: 8px;
  }

  .msg-text {
    color: var(--text-primary);
  }

  .chat-input {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid var(--border-primary);
  }

  .chat-input input {
    flex: 1;
    padding: 8px 12px;
    background: var(--border-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 13px;
  }

  .chat-input button {
    padding: 8px 16px;
    background: var(--color-brand-primary);
    border: none;
    border-radius: 8px;
    color: var(--text-inverse);
    font-size: 13px;
    cursor: pointer;
  }

  .chat-input button:hover {
    background: #5558e6;
  }

  .users-list h4 {
    font-size: 14px;
    color: var(--text-tertiary);
    margin-bottom: 10px;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
  }

  .user-name {
    color: var(--text-primary);
  }

  .host-badge {
    padding: 2px 6px;
    background: rgba(251, 191, 36, 0.2);
    border-radius: 4px;
    font-size: 11px;
    color: var(--color-warning-light);
  }
</style>
