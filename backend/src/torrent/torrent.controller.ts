import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('磁力链接播放')
@Controller('torrent')
@UseGuards(JwtAuthGuard)
export class TorrentController {
  /**
   * 获取磁力链接信息
   */
  @Get('info/:hash')
  @ApiOperation({ summary: '获取磁力链接信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '磁力链接不存在' })
  getTorrentInfo(@Param('hash') hash: string) {
    // 简化实现：返回占位信息
    return {
      infoHash: hash,
      name: `Torrent ${hash}`,
      size: 'Unknown',
      files: [],
      announce: [],
    };
  }

  /**
   * 检查磁力链接健康度
   */
  @Get('health/:hash')
  @ApiOperation({ summary: '检查磁力链接健康度' })
  @ApiResponse({ status: 200, description: '检查成功' })
  @ApiResponse({ status: 404, description: '磁力链接不存在' })
  checkTorrentHealth(@Param('hash') hash: string) {
    // 简化实现：返回占位信息
    return {
      infoHash: hash,
      isHealthy: true,
      seeders: Math.floor(Math.random() * 100),
      leechers: Math.floor(Math.random() * 50),
      lastChecked: new Date().toISOString(),
    };
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
      throw new Error('无效的磁力链接URI');
    }

    // 简化实现：解析基本参数
    const params = new URLSearchParams(magnetUri.substring(8));
    const xt = params.get('xt');
    const dn = params.get('dn');
    const tr = params.getAll('tr');

    return {
      infoHash: xt?.replace('urn:btih:', '') || '',
      name: dn || '',
      announce: tr || [],
    };
  }

  /**
   * 搜索磁力链接
   */
  @Get('search')
  @ApiOperation({ summary: '搜索磁力链接' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  searchTorrents(
    @Query('keyword') keyword: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    // 简化实现：返回占位结果
    return {
      data: Array.from({ length: pageSize }, (_, index) => ({
        infoHash: `hash_${(page - 1) * pageSize + index}`,
        name: `${keyword} ${index + 1}`,
        size: `${Math.floor(Math.random() * 10) + 1} GB`,
        seeders: Math.floor(Math.random() * 1000),
        leechers: Math.floor(Math.random() * 500),
        added: new Date().toISOString(),
      })),
      total: 100,
      page,
      pageSize,
      totalPages: Math.ceil(100 / pageSize),
    };
  }

  /**
   * 获取热门磁力链接
   */
  @Get('popular')
  @ApiOperation({ summary: '获取热门磁力链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getPopularTorrents(@Query('limit') limit: number = 20, @Query('category') category?: string) {
    // 简化实现：返回占位结果
    return Array.from({ length: limit }, (_, index) => ({
      infoHash: `popular_${index}`,
      name: `热门资源 ${index + 1}`,
      size: `${Math.floor(Math.random() * 10) + 1} GB`,
      seeders: Math.floor(Math.random() * 1000),
      leechers: Math.floor(Math.random() * 500),
      category: category || '电影',
      added: new Date().toISOString(),
    }));
  }

  /**
   * 获取最新磁力链接
   */
  @Get('latest')
  @ApiOperation({ summary: '获取最新磁力链接' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getLatestTorrents(@Query('limit') limit: number = 20, @Query('category') category?: string) {
    // 简化实现：返回占位结果
    return Array.from({ length: limit }, (_, index) => ({
      infoHash: `latest_${index}`,
      name: `最新资源 ${index + 1}`,
      size: `${Math.floor(Math.random() * 10) + 1} GB`,
      seeders: Math.floor(Math.random() * 100),
      leechers: Math.floor(Math.random() * 50),
      category: category || '电影',
      added: new Date().toISOString(),
    }));
  }
}
