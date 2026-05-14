import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

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
export class DanmakuGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DanmakuGateway.name);
  private readonly rooms = new Map<string, DanmakuRoom>();
  private readonly clientRooms = new Map<string, string>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

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
        client.data = { userId, videoId };
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
    client.emit('heartbeat-response', {
      userId: data.userId,
      timestamp: Date.now(),
      serverTime: Date.now(),
    });
  }

  sendDanmaku(message: { videoId: string; userId: number; danmakuId: number }): void {
    this.logger.log(`发送弹幕通知: ${JSON.stringify(message)}`);
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

  private getOrCreateRoom(videoId: string): DanmakuRoom {
    const existingRoom = this.rooms.get(videoId);
    if (existingRoom) {
      return existingRoom;
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

    this.logger.log(`用户 ${userId} 离开弹幕房间 ${videoId}`);

    if (room.users.size === 0 && room.messageCount === 0) {
      this.rooms.delete(videoId);
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

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  disconnect(videoId?: string, userId?: string): void {
    if (videoId && userId) {
      const room = this.rooms.get(videoId);
      room?.users.delete(userId);
      if (room && room.users.size === 0 && room.messageCount === 0) {
        this.rooms.delete(videoId);
      }
      this.logger.log(`用户 ${userId} 已断开视频 ${videoId} 的弹幕连接`);
      return;
    }

    this.logger.log('弹幕连接已断开');
  }
}
