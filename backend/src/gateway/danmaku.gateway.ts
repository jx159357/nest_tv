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

interface DanmakuRoom {
  users: Map<string, { userId: string; joinedAt: number }>;
  messageCount: number;
  lastActivity: Date | null;
}

interface DanmakuMessage {
  id: string;
  text: string;
  color: string;
  type: 'scroll' | 'top' | 'bottom';
  priority: number;
  userId: string;
  videoId: string;
  timestamp: number;
  isHighlighted?: boolean;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/danmaku',
})
export class DanmakuGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(DanmakuGateway.name);
  private readonly rooms = new Map<string, DanmakuRoom>();
  private readonly clientRooms = new Map<string, string>();
  private readonly cleanupTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(): void {
    setInterval(() => this.sweepStaleRooms(), ROOM_LIFECYCLE.STALE_SWEEP_INTERVAL_MS);
    this.logger.log('弹幕房间定时清理已启动');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = client.handshake.auth?.token;
      const videoId = client.handshake.auth?.videoId;
      const userId = client.handshake.auth?.userId;

      if (!token || !videoId || !userId) {
        this.logger.warn(
          `连接缺少必要参数: token=${!!token}, videoId=${videoId}, userId=${userId}`,
        );
        client.disconnect();
        return;
      }

      try {
        const payload = this.jwtService.verify(token);
        client.data = { userId: payload.sub || userId, videoId };
      } catch {
        this.logger.warn(`JWT验证失败，拒绝连接: userId=${userId}`);
        client.disconnect();
        return;
      }

      this.logger.log(`弹幕客户端连接: userId=${userId}, videoId=${videoId}`);
    } catch (error) {
      this.logger.error('弹幕连接处理失败:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const videoId = client.data?.videoId;
    const userId = client.data?.userId;

    if (videoId && userId) {
      this.leaveRoom(client, videoId, userId);
    }

    this.logger.log(`弹幕客户端断开: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { videoId: string; userId: string },
  ): void {
    const { videoId, userId } = data;
    const room = this.getOrCreateRoom(videoId);
    if (!room) return;

    this.cancelPendingCleanup(videoId);

    room.users.set(userId, { userId, joinedAt: Date.now() });
    this.clientRooms.set(client.id, videoId);
    client.join(videoId);

    this.logger.log(`用户 ${userId} 加入弹幕房间 ${videoId}`);

    this.server.to(videoId).emit('room-info', {
      videoId,
      onlineCount: room.users.size,
      messageCount: room.messageCount,
      isActive: true,
      lastActivity: room.lastActivity?.toISOString() || null,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(@ConnectedSocket() client: Socket): void {
    const videoId = client.data?.videoId;
    const userId = client.data?.userId;

    if (videoId && userId) {
      this.leaveRoom(client, videoId, userId);
    }
  }

  @SubscribeMessage('send-danmaku')
  handleSendDanmaku(@ConnectedSocket() client: Socket, @MessageBody() data: DanmakuMessage): void {
    const { videoId, userId } = client.data;

    if (!videoId) {
      this.logger.warn('发送弹幕失败: 未加入房间');
      return;
    }

    const room = this.getOrCreateRoom(videoId);
    if (!room) return;

    room.messageCount += 1;
    room.lastActivity = new Date();

    const message: DanmakuMessage = {
      ...data,
      videoId,
      userId,
      id: data.id || this.generateMessageId(),
      timestamp: data.timestamp || Date.now(),
    };

    this.server.to(videoId).emit('danmaku-message', message);
    this.logger.log(`弹幕发送: [${videoId}] ${data.text}`);
  }

  @SubscribeMessage('get-room-info')
  handleGetRoomInfo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { videoId: string },
  ): void {
    const room = this.rooms.get(data.videoId);

    client.emit('room-info', {
      videoId: data.videoId,
      onlineCount: room?.users.size || 0,
      messageCount: room?.messageCount || 0,
      isActive: Boolean(room && room.users.size > 0),
      lastActivity: room?.lastActivity?.toISOString() || null,
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; timestamp: number },
  ): void {
    const videoId = client.data?.videoId;
    if (videoId) {
      const room = this.rooms.get(videoId);
      if (room) {
        room.lastActivity = new Date();
      }
    }

    client.emit('heartbeat-response', {
      userId: data.userId,
      timestamp: Date.now(),
      serverTime: Date.now(),
    });
  }

  sendDanmaku(message: {
    videoId: string;
    userId: number;
    danmakuId: number;
    text?: string;
    color?: string;
    type?: string;
  }): void {
    this.logger.log(`发送弹幕通知: ${JSON.stringify(message)}`);
    if (this.server && message.videoId) {
      this.server.to(message.videoId).emit('danmaku-created', {
        danmakuId: message.danmakuId,
        videoId: message.videoId,
        userId: message.userId,
        text: message.text || '',
        color: message.color || '#FFFFFF',
        type: message.type || 'scroll',
        timestamp: Date.now(),
      });
    }
  }

  getRoomInfo(videoId: string): {
    videoId: string;
    onlineCount: number;
    messageCount: number;
    isActive: boolean;
    lastActivity: string | null;
  } {
    const room = this.rooms.get(videoId);
    return {
      videoId,
      onlineCount: room?.users.size || 0,
      messageCount: room?.messageCount || 0,
      isActive: Boolean(room && (room.users.size > 0 || room.messageCount > 0)),
      lastActivity: room?.lastActivity?.toISOString() || null,
    };
  }

  getRoomStats(): { totalRooms: number; totalUsers: number; roomDetails: unknown[] } {
    const roomDetails = [...this.rooms.entries()].map(([videoId, room]) => ({
      videoId,
      onlineCount: room.users.size,
      messageCount: room.messageCount,
      lastActivity: room.lastActivity?.toISOString() || null,
    }));

    return {
      totalRooms: this.rooms.size,
      totalUsers: roomDetails.reduce((total, room) => total + (room as any).onlineCount, 0),
      roomDetails,
    };
  }

  private getOrCreateRoom(videoId: string): DanmakuRoom | null {
    const existingRoom = this.rooms.get(videoId);
    if (existingRoom) {
      return existingRoom;
    }

    if (this.rooms.size >= ROOM_LIFECYCLE.MAX_DANMAKU_ROOMS) {
      this.logger.warn(`弹幕房间数量已达上限 ${ROOM_LIFECYCLE.MAX_DANMAKU_ROOMS}，拒绝创建新房间`);
      return null;
    }

    const nextRoom: DanmakuRoom = {
      users: new Map(),
      messageCount: 0,
      lastActivity: null,
    };
    this.rooms.set(videoId, nextRoom);
    return nextRoom;
  }

  private leaveRoom(client: Socket, videoId: string, userId: string): void {
    const room = this.rooms.get(videoId);
    if (!room) return;

    room.users.delete(userId);
    client.leave(videoId);
    this.clientRooms.delete(client.id);

    this.logger.log(`用户 ${userId} 离开弹幕房间 ${videoId}`);

    if (room.users.size === 0) {
      this.scheduleRoomCleanup(videoId);
    } else {
      this.server.to(videoId).emit('room-info', {
        videoId,
        onlineCount: room.users.size,
        messageCount: room.messageCount,
        isActive: room.users.size > 0,
        lastActivity: room.lastActivity?.toISOString() || null,
        timestamp: Date.now(),
      });
    }
  }

  private scheduleRoomCleanup(videoId: string): void {
    this.cancelPendingCleanup(videoId);

    const room = this.rooms.get(videoId);
    if (!room) return;

    if (room.messageCount === 0) {
      this.rooms.delete(videoId);
      this.cleanupTimeouts.delete(videoId);
      return;
    }

    const timeout = setTimeout(() => {
      this.cleanupTimeouts.delete(videoId);
      const currentRoom = this.rooms.get(videoId);
      if (currentRoom && currentRoom.users.size === 0) {
        this.rooms.delete(videoId);
        this.logger.log(`清理空闲弹幕房间: ${videoId}`);
      }
    }, ROOM_LIFECYCLE.DANMAKU_EMPTY_TTL_MS);

    this.cleanupTimeouts.set(videoId, timeout);
  }

  private cancelPendingCleanup(videoId: string): void {
    const existing = this.cleanupTimeouts.get(videoId);
    if (existing) {
      clearTimeout(existing);
      this.cleanupTimeouts.delete(videoId);
    }
  }

  private sweepStaleRooms(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [videoId, room] of this.rooms.entries()) {
      if (room.users.size > 0) continue;

      const lastActive = room.lastActivity?.getTime() ?? 0;
      const age = now - lastActive;

      if (age > ROOM_LIFECYCLE.STALE_ROOM_THRESHOLD_MS) {
        this.cancelPendingCleanup(videoId);
        this.rooms.delete(videoId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.log(`定时清理过期弹幕房间: ${cleaned} 个`);
    }
  }

  disconnect(videoId?: string, userId?: string): void {
    if (videoId && userId) {
      const room = this.rooms.get(videoId);
      if (room) {
        room.users.delete(userId);
        if (room.users.size === 0) {
          this.scheduleRoomCleanup(videoId);
        }
      }
      this.logger.log(`用户 ${userId} 已断开视频 ${videoId} 的弹幕连接`);
      return;
    }

    this.logger.log('弹幕连接已断开');
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
