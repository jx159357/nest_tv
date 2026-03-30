import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DailySourceCollectionService } from './daily-source-collection.service';

@ApiTags('调度任务')
@Controller('scheduler')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulerController {
  constructor(private readonly dailySourceCollectionService: DailySourceCollectionService) {}

  @Get('daily-source-collection/summary')
  @ApiOperation({ summary: '获取每日播放源采集任务最近一次执行摘要' })
  @ApiResponse({ status: 200, description: '成功获取执行摘要' })
  getDailySourceCollectionSummary() {
    return this.dailySourceCollectionService.getLastRunSummary();
  }

  @Get('daily-source-collection/dashboard')
  @ApiOperation({ summary: '获取每日播放源采集任务看板数据' })
  @ApiResponse({ status: 200, description: '成功获取任务看板数据' })
  getDailySourceCollectionDashboard() {
    return this.dailySourceCollectionService.getDashboardSummary();
  }

  @Post('daily-source-collection/run')
  @ApiOperation({ summary: '手动触发每日播放源采集任务' })
  @ApiResponse({ status: 201, description: '任务已执行' })
  async runDailySourceCollection() {
    return this.dailySourceCollectionService.runCollection('manual');
  }
}
