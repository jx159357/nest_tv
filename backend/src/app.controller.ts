import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';
import { AppService } from './app.service';

@ApiTags('系统')
@Controller()
export class AppController {
  private readonly version = process.env.APP_VERSION || '1.0.0';

  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '获取系统健康状态' })
  @ApiResponse({ status: 200, description: '系统正常运行' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  @Public()
  @ApiOperation({ summary: '获取应用版本号' })
  @ApiResponse({ status: 200, description: '返回当前版本号' })
  getVersion() {
    return { version: this.version, timestamp: Date.now() };
  }
}
