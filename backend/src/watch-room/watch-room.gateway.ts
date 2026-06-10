import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ROOM_LIFECYCLE } from '../common/constants/room-lifecycle.constants';

interface RoomState {
  mediaId: string;
  hostId: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdate: number;
  lastActivity: number;
  users: Map<string, { userId: string; username: string; joinedAt: number }>;
}

interface SyncPayload {
  currentTime: number;
  isPlaying: boolean;
}

interface SerializedRoomState {
  mediaId: string;
  hostId: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdate: number;
  users: Record<string, { userId: string; username: string; joinedAt: number }>;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/watch-room',
})
export class WatchRoomGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(WatchRoomGateway.name);
  private readonly rooms = new Map<string, RoomState>();
  private readonly clientRooms = new Map<string, string>();
  private readonly cleanupTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private onRoomDestroyed: ((roomId: string) => void) | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(): void {
    setInterval(() => this.sweepStaleRooms(), ROOM_LIFECYCLE.STALE_SWEEP_INTERVAL_MS);
    this.logger.log('观影房间定时清理已启动');
  }

  setRoomDestroyedCallback(callback: (roomId: string) => void): void {
    this.onRoomDestroyed = callback;
  }

  handleConnection(client: Socket): void {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token || typeof token !== 'string') {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data = { userId: payload.sub, username: payload.username };
      this.logger.log(`Client connected: ${payload.username} (${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const roomId = this.clientRooms.get(client.id);
    if (roomId) {
      this.leaveRoom(client, roomId);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; mediaId: string },
  ): { success: boolean; room?: SerializedRoomState } {
    const { roomId, mediaId } = data;
    const { userId, username } = client.data;

    this.leaveCurrentRoom(client);

    let room = this.rooms.get(roomId);
    if (!room) {
      if (this.rooms.size >= ROOM_LIFECYCLE.MAX_WATCH_ROOMS) {
        this.logger.warn(`观影房间数量已达上限 ${ROOM_LIFECYCLE.MAX_WATCH_ROOMS}，拒绝创建新房间`);
        return { success: false };
      }

      room = {
        mediaId,
        hostId: userId,
        currentTime: 0,
        isPlaying: false,
        lastUpdate: Date.now(),
        lastActivity: Date.now(),
        users: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    this.cancelPendingCleanup(roomId);

    room.users.set(userId, { userId, username, joinedAt: Date.now() });
    room.lastActivity = Date.now();
    this.clientRooms.set(client.id, roomId);
    client.join(roomId);

    this.server.to(roomId).emit('user-joined', {
      userId,
      username,
      onlineCount: room.users.size,
    });

    this.logger.log(`${username} joined room ${roomId}`);

    const usersObj: Record<string, { userId: string; username: string; joinedAt: number }> = {};
    room.users.forEach((value, key) => {
      usersObj[key] = value;
    });

    return {
      success: true,
      room: {
        mediaId: room.mediaId,
        hostId: room.hostId,
        currentTime: room.currentTime,
        isPlaying: room.isPlaying,
        lastUpdate: room.lastUpdate,
        users: usersObj,
      },
    };
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket): void {
    const roomId = this.clientRooms.get(client.id);
    if (roomId) {
      this.leaveRoom(client, roomId);
    }
  }

  @SubscribeMessage('sync')
  handleSync(@ConnectedSocket() client: Socket, @MessageBody() data: SyncPayload): void {
    const roomId = this.clientRooms.get(client.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const { userId } = client.data;
    if (room.hostId !== userId) return;

    room.currentTime = data.currentTime;
    room.isPlaying = data.isPlaying;
    room.lastUpdate = Date.now();
    room.lastActivity = Date.now();

    client.to(roomId).emit('sync', {
      currentTime: data.currentTime,
      isPlaying: data.isPlaying,
      hostId: userId,
    });
  }

  @SubscribeMessage('chat')
  handleChat(@ConnectedSocket() client: Socket, @MessageBody() data: { message: string }): void {
    const roomId = this.clientRooms.get(client.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (room) {
      room.lastActivity = Date.now();
    }

    const { userId, username } = client.data;

    this.server.to(roomId).emit('chat', {
      userId,
      username,
      message: data.message,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('transfer-host')
  handleTransferHost(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { targetUserId: string },
  ): void {
    const roomId = this.clientRooms.get(client.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const { userId } = client.data;
    if (room.hostId !== userId) return;

    if (room.users.has(data.targetUserId)) {
      room.hostId = data.targetUserId;
      room.lastActivity = Date.now();
      this.server.to(roomId).emit('host-changed', { newHostId: data.targetUserId });
    }
  }

  getRoomInfo(roomId: string): RoomState | null {
    return this.rooms.get(roomId) ?? null;
  }

  getRoomStats(): { totalRooms: number; totalUsers: number } {
    let totalUsers = 0;
    for (const room of this.rooms.values()) {
      totalUsers += room.users.size;
    }
    return { totalRooms: this.rooms.size, totalUsers };
  }

  private leaveRoom(client: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const { userId, username } = client.data;
    room.users.delete(userId);
    client.leave(roomId);
    this.clientRooms.delete(client.id);
    room.lastActivity = Date.now();

    this.server.to(roomId).emit('user-left', {
      userId,
      username,
      onlineCount: room.users.size,
    });

    if (room.users.size === 0) {
      this.scheduleRoomCleanup(roomId);
    } else if (room.hostId === userId) {
      const newHost = room.users.keys().next().value;
      if (newHost) {
        room.hostId = newHost;
        this.server.to(roomId).emit('host-changed', { newHostId: newHost });
      }
    }

    this.logger.log(`${username} left room ${roomId}`);
  }

  private scheduleRoomCleanup(roomId: string): void {
    this.cancelPendingCleanup(roomId);

    const timeout = setTimeout(() => {
      this.cleanupTimeouts.delete(roomId);
      const currentRoom = this.rooms.get(roomId);
      if (currentRoom && currentRoom.users.size === 0) {
        this.rooms.delete(roomId);
        this.onRoomDestroyed?.(roomId);
        this.logger.log(`清理空闲观影房间: ${roomId}`);
      }
    }, ROOM_LIFECYCLE.WATCH_ROOM_EMPTY_TTL_MS);

    this.cleanupTimeouts.set(roomId, timeout);
  }

  private cancelPendingCleanup(roomId: string): void {
    const existing = this.cleanupTimeouts.get(roomId);
    if (existing) {
      clearTimeout(existing);
      this.cleanupTimeouts.delete(roomId);
    }
  }

  private sweepStaleRooms(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.size > 0) continue;

      const age = now - room.lastActivity;
      if (age > ROOM_LIFECYCLE.STALE_ROOM_THRESHOLD_MS) {
        this.cancelPendingCleanup(roomId);
        this.rooms.delete(roomId);
        this.onRoomDestroyed?.(roomId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`定时清理过期观影房间: ${cleaned} 个`);
    }
  }

  private leaveCurrentRoom(client: Socket): void {
    const currentRoom = this.clientRooms.get(client.id);
    if (currentRoom) {
      this.leaveRoom(client, currentRoom);
    }
  }
}
