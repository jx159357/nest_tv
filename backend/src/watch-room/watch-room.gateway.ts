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

interface RoomState {
  mediaId: string;
  hostId: string;
  currentTime: number;
  isPlaying: boolean;
  lastUpdate: number;
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
export class WatchRoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WatchRoomGateway.name);
  private readonly rooms = new Map<string, RoomState>();
  private readonly clientRooms = new Map<string, string>();

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
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
      room = {
        mediaId,
        hostId: userId,
        currentTime: 0,
        isPlaying: false,
        lastUpdate: Date.now(),
        users: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    room.users.set(userId, { userId, username, joinedAt: Date.now() });
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

    this.server.to(roomId).emit('user-left', {
      userId,
      username,
      onlineCount: room.users.size,
    });

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    } else if (room.hostId === userId) {
      const newHost = room.users.keys().next().value;
      if (newHost) {
        room.hostId = newHost;
        this.server.to(roomId).emit('host-changed', { newHostId: newHost });
      }
    }

    this.logger.log(`${username} left room ${roomId}`);
  }

  private leaveCurrentRoom(client: Socket): void {
    const currentRoom = this.clientRooms.get(client.id);
    if (currentRoom) {
      this.leaveRoom(client, currentRoom);
    }
  }
}
