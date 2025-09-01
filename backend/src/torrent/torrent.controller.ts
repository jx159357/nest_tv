import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TorrentService } from '../common/services/torrent.service';
import { AppLoggerService, LogLevel, LogContext } from '../common/services/app-logger.service';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('磁力链接播放')
@Controller('torrent')
@UseGuards(JwtAuthGuard)
export class TorrentController {
  private readonly logger: AppLoggerService;

  constructor(
    private readonly torrentService: TorrentService,
    appLoggerService: AppLoggerService,
  ) {
    this.logger = appLoggerService;
  }

  @Post('add')
  @ApiOperation({ summary: '添加磁力链接' })
  @ApiResponse({ status: 200, description: '磁力链接添加成功' })
  async addMagnet(@Body('magnetUri') magnetUri: string, @Body('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'addMagnet' };
    
    try {
      this.logger.logUserAction(userId || 0, 'add_magnet', magnetUri, null, context);
      
      const result = await this.torrentService.addMagnet(magnetUri);
      
      this.logger.logTorrent(result.infoHash, 'added', { name: result.name, length: result.length }, context);
      
      return {
        success: true,
        message: '磁力链接添加成功',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to add magnet: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('info/:infoHash')
  @ApiOperation({ summary: '获取磁力链接信息' })
  @ApiParam({ name: 'infoHash', description: '磁力链接Info Hash' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getTorrentInfo(@Param('infoHash') infoHash: string, @Query('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'getTorrentInfo', infoHash };
    
    try {
      const info = this.torrentService.getTorrentInfo(infoHash);
      
      if (!info) {
        this.logger.warn(`Torrent not found: ${infoHash}`, context);
        return {
          success: false,
          message: '磁力链接不存在',
        };
      }

      this.logger.logTorrent(infoHash, 'info_retrieved', { name: info.name }, context);
      
      return {
        success: true,
        data: info,
      };
    } catch (error) {
      this.logger.error(`Failed to get torrent info: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('largest-video/:infoHash')
  @ApiOperation({ summary: '获取最大视频文件' })
  @ApiParam({ name: 'infoHash', description: '磁力链接Info Hash' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findLargestVideoFile(@Param('infoHash') infoHash: string, @Query('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'findLargestVideoFile', infoHash };
    
    try {
      const file = this.torrentService.findLargestVideoFile(infoHash);
      
      if (!file) {
        this.logger.warn(`No video file found: ${infoHash}`, context);
        return {
          success: false,
          message: '未找到视频文件',
        };
      }

      const playUrl = this.torrentService.generatePlayUrl(infoHash, file.index);
      
      this.logger.logTorrent(infoHash, 'largest_video_found', { fileName: file.name, fileSize: file.length }, context);
      
      return {
        success: true,
        data: {
          file,
          playUrl,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to find largest video: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('stream/:infoHash/:fileIndex')
  @ApiOperation({ summary: '获取文件流' })
  @ApiParam({ name: 'infoHash', description: '磁力链接Info Hash' })
  @ApiParam({ name: 'fileIndex', description: '文件索引' })
  @ApiResponse({ status: 200, description: '流数据' })
  async getFileStream(
    @Param('infoHash') infoHash: string,
    @Param('fileIndex') fileIndex: number,
    @Query('userId') userId?: number,
    @Res() res?: Response,
    @Req() req?: any,
  ): Promise<void> {
    const context: LogContext = { userId, function: 'getFileStream', infoHash, fileIndex };
    
    try {
      const stream = this.torrentService.getFileStream(infoHash, parseInt(fileIndex.toString()));
      
      if (!stream) {
        this.logger.error(`Stream not found: ${infoHash}/${fileIndex}`, context);
        if (res) {
          res.status(404).send('文件流不存在');
        }
        return;
      }

      // 获取文件信息
      const torrentInfo = this.torrentService.getTorrentInfo(infoHash);
      const file = torrentInfo?.files[parseInt(fileIndex.toString())];
      
      if (file && res) {
        // 设置响应头
        res.setHeader('Content-Type', file.type || 'video/mp4');
        res.setHeader('Content-Length', file.length);
        res.setHeader('Accept-Ranges', 'bytes');
        
        // 支持断点续传
        const range = req.headers.range;
        if (range) {
          const parts = range.replace(/bytes=/, '').split('-');
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
          const chunksize = (end - start) + 1;
          
          if (res) {
            res.writeHead(206, {
              'Content-Range': `bytes ${start}-${end}/${file.length}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': chunksize,
              'Content-Type': file.type || 'video/mp4',
            });
            
            const fileStream = (file as any).createReadStream({ start, end });
            fileStream.pipe(res);
          }
        } else {
          if (res) {
            res.setHeader('Content-Type', file.type || 'video/mp4');
            res.setHeader('Content-Length', file.length);
          }
          if (res) {
            stream.pipe(res);
          }
        }

        this.logger.logTorrent(infoHash, 'stream_started', { fileIndex, fileName: file.name }, context);
      } else {
        if (res) {
          stream.pipe(res);
        }
        this.logger.logTorrent(infoHash, 'stream_started', { fileIndex }, context);
      }

    } catch (error) {
      this.logger.error(`Failed to get file stream: ${error.message}`, context, error.stack);
      if (res) {
        res.status(500).send('获取文件流失败');
      }
    }
  }

  @Post('check-health')
  @ApiOperation({ summary: '检查磁力链接健康度' })
  @ApiResponse({ status: 200, description: '检查成功' })
  async checkMagnetHealth(@Body('magnetUri') magnetUri: string, @Body('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'checkMagnetHealth' };
    
    try {
      this.logger.log('Checking magnet health', LogLevel.INFO, { magnetUri, ...context });
      
      const result = await this.torrentService.checkMagnetHealth(magnetUri);
      
      this.logger.log('Magnet health check completed', LogLevel.INFO, { 
        magnetUri, 
        isHealthy: result.isHealthy,
        seeders: result.seeders,
        ...context 
      });
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Failed to check magnet health: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Delete(':infoHash')
  @ApiOperation({ summary: '移除磁力链接' })
  @ApiParam({ name: 'infoHash', description: '磁力链接Info Hash' })
  @ApiResponse({ status: 200, description: '移除成功' })
  async removeTorrent(@Param('infoHash') infoHash: string, @Query('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'removeTorrent', infoHash };
    
    try {
      const success = this.torrentService.removeTorrent(infoHash);
      
      if (success) {
        this.logger.logTorrent(infoHash, 'removed', null, context);
        return {
          success: true,
          message: '磁力链接移除成功',
        };
      } else {
        this.logger.warn(`Torrent not found for removal: ${infoHash}`, context);
        return {
          success: false,
          message: '磁力链接不存在',
        };
      }
    } catch (error) {
      this.logger.error(`Failed to remove torrent: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Get('list')
  @ApiOperation({ summary: '获取所有磁力链接' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAllTorrents(@Query('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'getAllTorrents' };
    
    try {
      const torrents = this.torrentService.getAllTorrents();
      
      this.logger.log('Retrieved all torrents', LogLevel.INFO, { 
        count: torrents.length,
        ...context 
      });
      
      return {
        success: true,
        data: torrents,
      };
    } catch (error) {
      this.logger.error(`Failed to get all torrents: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Post('parse')
  @ApiOperation({ summary: '解析磁力链接' })
  @ApiResponse({ status: 200, description: '解析成功' })
  async parseMagnet(@Body('magnetUri') magnetUri: string, @Body('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'parseMagnet' };
    
    try {
      this.logger.log('Parsing magnet URI', LogLevel.INFO, { magnetUri, ...context });
      
      const parsed = this.torrentService.parseMagnetUri(magnetUri);
      
      this.logger.log('Magnet URI parsed', LogLevel.INFO, { 
        magnetUri, 
        infoHash: parsed.infoHash,
        ...context 
      });
      
      return {
        success: true,
        data: parsed,
      };
    } catch (error) {
      this.logger.error(`Failed to parse magnet: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  @Delete('all')
  @ApiOperation({ summary: '销毁所有磁力链接' })
  @ApiResponse({ status: 200, description: '销毁成功' })
  async destroyAll(@Query('userId') userId?: number): Promise<any> {
    const context: LogContext = { userId, function: 'destroyAll' };
    
    try {
      this.torrentService.destroyAll();
      
      this.logger.logSystemEvent('all_torrents_destroyed', { userId }, LogLevel.INFO, context);
      
      return {
        success: true,
        message: '所有磁力链接已销毁',
      };
    } catch (error) {
      this.logger.error(`Failed to destroy all torrents: ${error.message}`, context, error.stack);
      throw error;
    }
  }
}