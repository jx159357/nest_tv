import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WatchRoomService } from './watch-room.service';

@ApiTags('一起看')
@Controller('watch-room')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchRoomController {
  constructor(private readonly watchRoomService: WatchRoomService) {}

  @Post('create')
  @ApiOperation({ summary: '创建观看房间' })
  @ApiResponse({ status: 201, description: '创建成功' })
  createRoom(@Body() body: { mediaId: number; mediaTitle: string }) {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.watchRoomService.createRoom(roomId, body.mediaId, body.mediaTitle);
    return { roomId, mediaId: body.mediaId };
  }

  @Get('active')
  @ApiOperation({ summary: '获取活跃房间列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getActiveRooms() {
    return this.watchRoomService.getActiveRooms();
  }

  @Get(':roomId')
  @ApiOperation({ summary: '获取房间信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '房间不存在' })
  getRoomInfo(@Param('roomId') roomId: string) {
    const info = this.watchRoomService.getRoomInfo(roomId);
    if (!info) {
      return { error: '房间不存在' };
    }
    return info;
  }

  @Get('stats/overview')
  @ApiOperation({ summary: '获取房间统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStats() {
    return this.watchRoomService.getStats();
  }
}
