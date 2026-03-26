import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TorrentService } from './torrent.service';

@ApiTags('磁力链接播放')
@Controller('torrent')
@UseGuards(JwtAuthGuard)
export class TorrentController {
  constructor(private readonly torrentService: TorrentService) {}

  /**
   * 获取磁力链接信息
   */
  @Get('info/:hash')
  @ApiOperation({ summary: '获取磁力链接信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '磁力链接不存在' })
  async getTorrentInfo(@Param('hash') hash: string) {
    const result = await this.torrentService.getTorrentInfo(hash);
    if (!result) {
      throw new NotFoundException('磁力链接不存在');
    }

    return result;
  }

  /**
   * 检查磁力链接健康度
   */
  @Get('health/:hash')
  @ApiOperation({ summary: '检查磁力链接健康度' })
  @ApiResponse({ status: 200, description: '检查成功' })
  @ApiResponse({ status: 404, description: '磁力链接不存在' })
  async checkTorrentHealth(@Param('hash') hash: string) {
    const result = await this.torrentService.checkTorrentHealth(hash);
    if (!result) {
      throw new NotFoundException('磁力链接不存在');
    }

    return result;
  }

  /**
   * 解析磁力链接URI
   */
  @Post('parse')
  @ApiOperation({ summary: '解析磁力链接URI' })
  @ApiResponse({ status: 200, description: '解析成功' })
  @ApiResponse({ status: 400, description: '无效的磁力链接' })
  parseMagnetUri(@Body() body: { magnetUri: string }) {
    const { magnetUri } = body;

    if (!magnetUri || !magnetUri.startsWith('magnet:')) {
      throw new BadRequestException('无效的磁力链接URI');
    }

    return this.torrentService.parseMagnetUri(magnetUri);
  }

  /**
   * 搜索磁力链接
   */
  @Get('search')
  @ApiOperation({ summary: '搜索磁力链接' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  async searchTorrents(
    @Query('keyword') keyword: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.torrentService.searchTorrents(keyword || '', page, pageSize);
  }

  /**
   * 获取热门磁力链接
   */
  @Get('popular')
  @ApiOperation({ summary: '获取热门磁力链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPopularTorrents(
    @Query('limit') limit: number = 20,
    @Query('category') category?: string,
  ) {
    return this.torrentService.getPopularTorrents(limit, category);
  }

  /**
   * 获取最新磁力链接
   */
  @Get('latest')
  @ApiOperation({ summary: '获取最新磁力链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getLatestTorrents(
    @Query('limit') limit: number = 20,
    @Query('category') category?: string,
  ) {
    return this.torrentService.getLatestTorrents(limit, category);
  }
}
