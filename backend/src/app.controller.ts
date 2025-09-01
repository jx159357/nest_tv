import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('系统')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '获取系统健康状态' })
  @ApiResponse({ status: 200, description: '系统正常运行' })
  getHello(): string {
    return this.appService.getHello();
  }
}
