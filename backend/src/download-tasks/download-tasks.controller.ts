import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUserId } from '../decorators/current-user.decorator';
import { DownloadTasksService } from './download-tasks.service';
import { CreateDownloadTaskDto } from './dtos/create-download-task.dto';
import { UpdateDownloadTaskDto } from './dtos/update-download-task.dto';
import { DownloadTaskQueryDto } from './dtos/download-task-query.dto';

@ApiTags('下载任务')
@Controller('download-tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DownloadTasksController {
  constructor(private readonly downloadTasksService: DownloadTasksService) {}

  @Get('user/me')
  @ApiOperation({ summary: '获取当前用户下载任务' })
  @ApiResponse({ status: 200, description: '成功获取下载任务列表' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findMine(@GetCurrentUserId() userId: number, @Query() queryDto: DownloadTaskQueryDto) {
    return this.downloadTasksService.findMine(userId, queryDto);
  }

  @Get('user/me/stats')
  @ApiOperation({ summary: '获取当前用户下载任务统计' })
  @ApiResponse({ status: 200, description: '成功获取下载任务统计' })
  async getMineStats(@GetCurrentUserId() userId: number) {
    return this.downloadTasksService.getMineStats(userId);
  }

  @Post()
  @ApiOperation({ summary: '创建或更新当前用户下载任务' })
  @ApiResponse({ status: 201, description: '下载任务已保存' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createOrUpdateMine(
    @GetCurrentUserId() userId: number,
    @Body() createDownloadTaskDto: CreateDownloadTaskDto,
  ) {
    return this.downloadTasksService.upsertMine(userId, createDownloadTaskDto);
  }

  @Patch(':clientId')
  @ApiOperation({ summary: '更新当前用户下载任务' })
  @ApiResponse({ status: 200, description: '下载任务更新成功' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateMine(
    @GetCurrentUserId() userId: number,
    @Param('clientId') clientId: string,
    @Body() updateDownloadTaskDto: UpdateDownloadTaskDto,
  ) {
    return this.downloadTasksService.updateMine(userId, clientId, updateDownloadTaskDto);
  }

  @Delete('user/me/completed')
  @ApiOperation({ summary: '清空当前用户已完成下载任务' })
  @ApiResponse({ status: 200, description: '已完成任务清理成功' })
  async clearCompletedMine(@GetCurrentUserId() userId: number) {
    return this.downloadTasksService.clearCompletedMine(userId);
  }

  @Delete(':clientId')
  @ApiOperation({ summary: '删除当前用户下载任务' })
  @ApiResponse({ status: 200, description: '下载任务删除成功' })
  async removeMine(@GetCurrentUserId() userId: number, @Param('clientId') clientId: string) {
    await this.downloadTasksService.removeMine(userId, clientId);
    return { success: true };
  }
}
