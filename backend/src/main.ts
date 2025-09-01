/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-08-28 11:23:26
 * @LastEditors: jxwd
 * @LastEditTime: 2025-08-28 17:31:14
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Nest TV API')
    .setDescription('Nest TV视频流媒体平台API文档')
    .setVersion('1.0')
    .addTag('auth', '认证与授权')
    .addTag('users', '用户管理')
    .addTag('media', '媒体资源管理')
    .addTag('play-sources', '播放源管理')
    .addTag('watch-history', '观看历史')
    .addTag('recommendations', '推荐系统')
    .addTag('admin', '后台管理')
    .addTag('crawler', '爬虫服务')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3336;
  await app.listen(port);
  console.log(`🚀 Nest TV Backend is running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap().catch(error => {
  console.error('❌ Failed to start Nest TV Backend:', error);
  process.exit(1);
});
