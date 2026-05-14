import { Injectable, Logger } from '@nestjs/common';
import { WatchRoomGateway } from './watch-room.gateway';

export interface WatchRoomInfo {
  id: string;
  mediaId: number;
  mediaTitle: string;
  hostUsername: string;
  onlineCount: number;
  createdAt: string;
}

@Injectable()
export class WatchRoomService {
  private readonly logger = new Logger(WatchRoomService.name);
  private readonly roomMetadata = new Map<
    string,
    { mediaId: number; mediaTitle: string; createdAt: number }
  >();

  constructor(private readonly gateway: WatchRoomGateway) {}

  createRoom(roomId: string, mediaId: number, mediaTitle: string): void {
    this.roomMetadata.set(roomId, { mediaId, mediaTitle, createdAt: Date.now() });
    this.logger.log(`Room created: ${roomId} for media ${mediaTitle}`);
  }

  getRoomInfo(roomId: string): WatchRoomInfo | null {
    const metadata = this.roomMetadata.get(roomId);
    const state = this.gateway.getRoomInfo(roomId);

    if (!metadata) return null;

    return {
      id: roomId,
      mediaId: metadata.mediaId,
      mediaTitle: metadata.mediaTitle,
      hostUsername: state
        ? (Array.from(state.users.values()).find(u => u.userId === state.hostId)?.username ?? '')
        : '',
      onlineCount: state?.users.size ?? 0,
      createdAt: new Date(metadata.createdAt).toISOString(),
    };
  }

  getActiveRooms(): WatchRoomInfo[] {
    const rooms: WatchRoomInfo[] = [];

    for (const [roomId, metadata] of this.roomMetadata.entries()) {
      const state = this.gateway.getRoomInfo(roomId);
      if (state && state.users.size > 0) {
        rooms.push({
          id: roomId,
          mediaId: metadata.mediaId,
          mediaTitle: metadata.mediaTitle,
          hostUsername:
            Array.from(state.users.values()).find(u => u.userId === state.hostId)?.username ?? '',
          onlineCount: state.users.size,
          createdAt: new Date(metadata.createdAt).toISOString(),
        });
      }
    }

    return rooms.sort((a, b) => b.onlineCount - a.onlineCount);
  }

  getStats(): { totalRooms: number; totalUsers: number; activeRooms: number } {
    const gatewayStats = this.gateway.getRoomStats();
    return {
      ...gatewayStats,
      activeRooms: this.getActiveRooms().length,
    };
  }
}
