import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
    bufferLogs: true,
  });

  // 全局设置
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    credentials: true,
  });

  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Nest TV API')
    .setDescription('Nest TV视频流媒体平台API文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;
  await app.listen(port);
  
  console.log('🚀 Nest TV Backend is running on port', port);
  console.log('📚 API Documentation: http://localhost:' + port + '/api');
}

bootstrap().catch(error => {
  console.error('❌ Failed to start Nest TV Backend:', error);
  process.exit(1);
});