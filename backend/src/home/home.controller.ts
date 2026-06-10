import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';
import { Public } from '../auth/public.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('bootstrap')
  @Public()
  async getBootstrap(@Query('limit') limit?: number) {
    const data = await this.homeService.getBootstrapData(limit ?? 8);
    return {
      success: true,
      data,
    };
  }
}
