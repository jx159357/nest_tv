import { Injectable, Logger } from '@nestjs/common';

/**
 * 弹幕网关服务
 * 由于WebSocket依赖问题，暂时作为普通服务提供弹幕功能
 */
@Injectable()
export class DanmakuGateway {
  private readonly logger = new Logger(DanmakuGateway.name);

  private readonly randomInt = (max: number): number => Math.floor(Math.random() * max) + 1;

  constructor() {
    this.logger.log('弹幕网关服务初始化');
  }

  // 模拟WebSocket连接状态
  connect(videoId: string, userId: string): boolean {
    this.logger.log(`用户 ${userId} 连接到视频 ${videoId} 的弹幕房间`);
    return true;
  }

  // 模拟发送弹幕
  sendDanmaku(message: unknown): boolean {
    this.logger.log(`发送弹幕: ${JSON.stringify(message)}`);
    return true;
  }

  // 获取房间信息
  getRoomInfo(videoId: string): { videoId: string; onlineCount: number; isActive: boolean } {
    this.logger.log(`获取房间信息: ${videoId}`);
    return {
      videoId,
      onlineCount: this.randomInt(100),
      isActive: true,
    };
  }

  // 获取房间统计
  getRoomStats(): { totalRooms: number; totalUsers: number; roomDetails: unknown[] } {
    return {
      totalRooms: 1,
      totalUsers: this.randomInt(50),
      roomDetails: [],
    };
  }

  // 模拟断开连接
  disconnect(): void {
    this.logger.log('弹幕连接已断开');
  }
}
