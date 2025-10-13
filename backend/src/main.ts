import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { PerformanceMonitoringMiddleware } from './middleware/performance-monitoring.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppLoggerService } from './common/services/app-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
    bufferLogs: true,
  });

  // 安全的CORS配置
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: (origin, callback) => {
      // 允许开发环境和预定义的生产环境域名
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`CORS阻止的请求来源: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'X-Requested-With',
      'X-Request-ID',
      'Accept-Charset',
    ],
    credentials: true, // 支持凭证（cookies, Authorization headers）
    optionsSuccessStatus: 200, // 预检请求成功状态
    maxAge: 86400, // 预检请求结果缓存24小时
  });

  // 设置响应头以确保字符编码正确
  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
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

  // 应用全局中间件
  const appLogger = app.get(AppLoggerService);
  const requestLoggingMiddleware = new RequestLoggingMiddleware(appLogger);
  const performanceMonitoringMiddleware = new PerformanceMonitoringMiddleware(appLogger);

  app.use(new SecurityHeadersMiddleware().use);
  app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware));
  app.use(performanceMonitoringMiddleware.use.bind(performanceMonitoringMiddleware));

  // 应用全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter(appLogger));

  // 应用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  // 端口检测和动态端口选择
  const getAvailablePort = async (startPort: number, maxAttempts = 10): Promise<number> => {
    const net = await import('net');

    return new Promise((resolve, reject) => {
      const tryPort = (attempt: number) => {
        if (attempt >= maxAttempts) {
          reject(new Error(`无法在 ${startPort}-${startPort + maxAttempts} 范围内找到可用端口`));
          return;
        }

        const port = startPort + attempt;
        const server = net.default.createServer();

        server.listen(port, () => {
          server.close(() => {
            console.log(`✅ 端口 ${port} 可用`);
            resolve(port);
          });
        });

        server.on('error', () => {
          console.log(`端口 ${port} 被占用，尝试下一个...`);
          tryPort(attempt + 1);
        });
      };

      tryPort(0);
    });
  };

  const defaultPort = parseInt(process.env.PORT || '3334', 10);
  let port: number;

  try {
    port = await getAvailablePort(defaultPort);
    console.log(`✅ 端口 ${port} 可用`);
  } catch (error) {
    console.warn(`⚠️ 端口检测失败: ${error.message}`);
    console.log(`🔄 使用动态端口: ${defaultPort + Math.floor(Math.random() * 1000)}`);
    port = defaultPort + Math.floor(Math.random() * 1000);
  }

  await app.listen(port);

  console.log('🚀 Nest TV Backend is running on port', port);
  console.log('📚 API Documentation: http://localhost:' + port + '/api');
}

bootstrap().catch(error => {
  console.error('❌ Failed to start Nest TV Backend:', error);
  process.exit(1);
});
