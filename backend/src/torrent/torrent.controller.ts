import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Param,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TorrentService } from './torrent.service';
import { TorrentStreamService } from './torrent-stream.service';
import { TorrentSearchQueryDto } from './dtos/torrent-search-query.dto';
import { TorrentRankQueryDto } from './dtos/torrent-rank-query.dto';

@ApiTags('磁力链接播放')
@Controller('torrent')
@UseGuards(JwtAuthGuard)
export class TorrentController {
  constructor(
    private readonly torrentService: TorrentService,
    private readonly torrentStreamService: TorrentStreamService,
  ) {}

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

  /**
   * 获取种子文件列表（不下载）
   */
  @Post('stream/info')
  @ApiOperation({ summary: '获取种子文件列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStreamInfo(@Body() body: { magnetUri: string }) {
    if (!body.magnetUri?.startsWith('magnet:')) {
      throw new BadRequestException('无效的磁力链接');
    }
    return this.torrentStreamService.getTorrentInfo(body.magnetUri);
  }

  /**
   * 流式播放磁力链接视频（支持 token query 参数认证，兼容 video 标签）
   */
  @Get('stream/:infoHash')
  @ApiOperation({ summary: '流式播放视频' })
  async streamVideo(
    @Param('infoHash') infoHash: string,
    @Query('magnet') magnetUri: string,
    @Query('file') fileIndex: string = '0',
    @Req() req: any,
    @Res() res: any,
  ) {
    if (!magnetUri?.startsWith('magnet:')) {
      throw new BadRequestException('需要提供有效的磁力链接');
    }

    try {
      const { stream, mimeType, fileSize, fileName } = await this.torrentStreamService.createStream(
        magnetUri,
        parseInt(fileIndex, 10) || 0,
      );

      // 处理 HTTP Range 请求（视频拖拽）
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        });

        // WebTorrent createReadStream 支持 start/end 选项
        const rangedStream = (stream as any).file?.createReadStream?.({ start, end }) || stream;
        rangedStream.pipe(res);
      } else {
        res.status(200);
        res.set({
          'Accept-Ranges': 'bytes',
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
        });
        stream.pipe(res);
      }

      // 客户端断开时清理
      res.on('close', () => {
        const hash = infoHash.toLowerCase();
        this.torrentStreamService.releaseTorrent(hash, 'stream');
      });
    } catch (error: any) {
      throw new BadRequestException(`流式播放失败: ${error.message}`);
    }
  }

  /**
   * 获取活跃种子统计
   */
  @Get('stream-stats')
  @ApiOperation({ summary: '获取活跃种子统计' })
  getStreamStats() {
    return this.torrentStreamService.getStats();
  }
}
