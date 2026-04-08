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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TorrentService } from './torrent.service';
import { TorrentSearchQueryDto } from './dtos/torrent-search-query.dto';
import { TorrentRankQueryDto } from './dtos/torrent-rank-query.dto';

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
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchTorrents(@Query() queryDto: TorrentSearchQueryDto) {
    return this.torrentService.searchTorrents(
      queryDto.keyword || '',
      queryDto.page,
      queryDto.pageSize,
      queryDto.category,
    );
  }

  /**
   * 获取热门磁力链接
   */
  @Get('popular')
  @ApiOperation({ summary: '获取热门磁力链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getPopularTorrents(@Query() queryDto: TorrentRankQueryDto) {
    return this.torrentService.getPopularTorrents(queryDto.limit, queryDto.category);
  }

  /**
   * 获取最新磁力链接
   */
  @Get('latest')
  @ApiOperation({ summary: '获取最新磁力链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getLatestTorrents(@Query() queryDto: TorrentRankQueryDto) {
    return this.torrentService.getLatestTorrents(queryDto.limit, queryDto.category);
  }
}
