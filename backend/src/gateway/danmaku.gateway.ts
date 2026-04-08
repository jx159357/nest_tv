import { Injectable, Logger } from '@nestjs/common';

/**
 * 弹幕网关服务
 * 由于WebSocket依赖问题，暂时作为普通服务提供弹幕功能
 */
@Injectable()
export class DanmakuGateway {
  private readonly logger = new Logger(DanmakuGateway.name);
  private readonly rooms = new Map<
    string,
    {
      users: Set<string>;
      messageCount: number;
      lastActivity: Date | null;
    }
  >();

  constructor() {
    this.logger.log('弹幕网关服务初始化');
  }

  private getOrCreateRoom(videoId: string) {
    const existingRoom = this.rooms.get(videoId);
    if (existingRoom) {
      return existingRoom;
    }

    const nextRoom = {
      users: new Set<string>(),
      messageCount: 0,
      lastActivity: null as Date | null,
    };
    this.rooms.set(videoId, nextRoom);
    return nextRoom;
  }

  // 模拟WebSocket连接状态
  connect(videoId: string, userId: string): boolean {
    const room = this.getOrCreateRoom(videoId);
    room.users.add(userId);
    this.logger.log(`用户 ${userId} 连接到视频 ${videoId} 的弹幕房间`);
    return true;
  }

  // 模拟发送弹幕
  sendDanmaku(message: unknown): boolean {
    if (typeof message === 'object' && message !== null && 'videoId' in message) {
      const videoId = String((message as { videoId: string }).videoId);
      const room = this.getOrCreateRoom(videoId);
      room.messageCount += 1;
      room.lastActivity = new Date();
    }
    this.logger.log(`发送弹幕: ${JSON.stringify(message)}`);
    return true;
  }

  // 获取房间信息
  getRoomInfo(videoId: string): {
    videoId: string;
    onlineCount: number;
    messageCount: number;
    isActive: boolean;
    lastActivity: string | null;
  } {
    const room = this.rooms.get(videoId);
    this.logger.log(`获取房间信息: ${videoId}`);
    return {
      videoId,
      onlineCount: room?.users.size || 0,
      messageCount: room?.messageCount || 0,
      isActive: Boolean(room && (room.users.size > 0 || room.messageCount > 0)),
      lastActivity: room?.lastActivity ? room.lastActivity.toISOString() : null,
    };
  }

  // 获取房间统计
  getRoomStats(): { totalRooms: number; totalUsers: number; roomDetails: unknown[] } {
    const roomDetails = [...this.rooms.entries()].map(([videoId, room]) => ({
      videoId,
      onlineCount: room.users.size,
      messageCount: room.messageCount,
      lastActivity: room.lastActivity ? room.lastActivity.toISOString() : null,
    }));

    return {
      totalRooms: this.rooms.size,
      totalUsers: roomDetails.reduce((total, room) => total + room.onlineCount, 0),
      roomDetails,
    };
  }

  // 模拟断开连接
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
