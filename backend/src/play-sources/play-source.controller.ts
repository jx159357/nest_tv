import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PlaySourceService } from './play-source.service';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
import { PlaySource, PlaySourceStatus } from '../entities/play-source.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('播放源')
@Controller('play-sources')
export class PlaySourceController {
  constructor(private readonly playSourceService: PlaySourceService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '创建播放源' })
  @ApiResponse({ status: 201, description: '播放源创建成功', type: PlaySource })
  async create(@Body() createPlaySourceDto: CreatePlaySourceDto): Promise<PlaySource> {
    return await this.playSourceService.create(createPlaySourceDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '批量创建播放源' })
  @ApiResponse({ status: 201, description: '播放源批量创建成功', type: [PlaySource] })
  async createBulk(@Body() createPlaySourceDtos: CreatePlaySourceDto[]): Promise<PlaySource[]> {
    return await this.playSourceService.createBulk(createPlaySourceDtos);
  }

  @Get()
  @ApiOperation({ summary: '分页查询播放源' })
  @ApiResponse({ status: 200, description: '成功获取播放源列表' })
  async findAll(@Query() queryDto: PlaySourceQueryDto) {
    return await this.playSourceService.findAll(queryDto);
  }

  @Get('media/:mediaResourceId')
  @ApiOperation({ summary: '根据影视资源ID获取播放源' })
  @ApiParam({ name: 'mediaResourceId', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '成功获取播放源列表', type: [PlaySource] })
  async findByMediaResourceId(@Param('mediaResourceId') mediaResourceId: number): Promise<PlaySource[]> {
    return await this.playSourceService.findByMediaResourceId(mediaResourceId);
  }

  @Get('media/:mediaResourceId/best')
  @ApiOperation({ summary: '获取影视资源的最佳播放源' })
  @ApiParam({ name: 'mediaResourceId', description: '影视资源ID' })
  @ApiResponse({ status: 200, description: '成功获取最佳播放源', type: PlaySource })
  async getBestPlaySource(@Param('mediaResourceId') mediaResourceId: number): Promise<PlaySource | null> {
    return await this.playSourceService.getBestPlaySource(mediaResourceId);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID获取播放源详情' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '成功获取播放源详情', type: PlaySource })
  async findById(@Param('id') id: number): Promise<PlaySource> {
    return await this.playSourceService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新播放源' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '播放源更新成功', type: PlaySource })
  async update(
    @Param('id') id: number,
    @Body() updatePlaySourceDto: UpdatePlaySourceDto
  ): Promise<PlaySource> {
    return await this.playSourceService.update(id, updatePlaySourceDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '更新播放源状态' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiQuery({ name: 'status', description: '播放源状态' })
  @ApiResponse({ status: 200, description: '播放源状态更新成功', type: PlaySource })
  async updateStatus(
    @Param('id') id: number,
    @Query('status') status: PlaySourceStatus
  ): Promise<PlaySource> {
    return await this.playSourceService.updateStatus(id, status);
  }

  @Patch(':id/play')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '增加播放次数' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '播放次数增加成功' })
  async incrementPlayCount(@Param('id') id: number): Promise<void> {
    await this.playSourceService.incrementPlayCount(id);
  }

  @Patch(':id/validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '验证播放源链接有效性' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '播放源验证结果' })
  async validatePlaySource(@Param('id') id: number): Promise<{ isValid: boolean }> {
    const isValid = await this.playSourceService.validatePlaySource(id);
    return { isValid };
  }

  @Patch('bulk/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '批量更新播放源状态' })
  @ApiQuery({ name: 'status', description: '播放源状态' })
  @ApiResponse({ status: 200, description: '播放源状态批量更新成功' })
  async updateBulkStatus(
    @Body() ids: number[],
    @Query('status') status: PlaySourceStatus
  ): Promise<void> {
    await this.playSourceService.updateBulkStatus(ids, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '删除播放源' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '播放源删除成功' })
  async remove(@Param('id') id: number): Promise<void> {
    await this.playSourceService.remove(id);
  }

  @Patch(':id/soft-delete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '软删除播放源' })
  @ApiParam({ name: 'id', description: '播放源ID' })
  @ApiResponse({ status: 200, description: '播放源软删除成功', type: PlaySource })
  async softDelete(@Param('id') id: number): Promise<PlaySource> {
    return await this.playSourceService.softDelete(id);
  }
}