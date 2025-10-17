"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const request_logging_middleware_1 = require("./middleware/request-logging.middleware");
const performance_monitoring_middleware_1 = require("./middleware/performance-monitoring.middleware");
const security_headers_middleware_1 = require("./middleware/security-headers.middleware");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const app_logger_service_1 = require("./common/services/app-logger.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'error', 'warn'],
        bufferLogs: true,
    });
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = isProduction
        ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://streaming-platform.com']
        : ['http://localhost:3334', 'http://localhost:5173', 'http://127.0.0.1:5173'];
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
                callback(null, true);
            }
            else {
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
        credentials: true,
        optionsSuccessStatus: 200,
        maxAge: 86400,
    });
    app.use((req, res, next) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Nest TV API')
        .setDescription('Nest TV视频流媒体平台API文档')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    app.use('/api/swagger-ui.css', (req, res, next) => {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        next();
    });
    app.use('/api/swagger-ui-bundle.js', (req, res, next) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        next();
    });
    app.use('/api/swagger-ui-standalone-preset.js', (req, res, next) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        next();
    });
    app.use('/api/swagger-ui-init.js', (req, res, next) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        next();
    });
    swagger_1.SwaggerModule.setup('api', app, document, {
        customSiteTitle: 'Nest TV API Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            docExpansion: 'none',
            defaultModelsExpandDepth: 2,
            defaultModelExpandDepth: 2,
        },
    });
    const appLogger = app.get(app_logger_service_1.AppLoggerService);
    const requestLoggingMiddleware = new request_logging_middleware_1.RequestLoggingMiddleware(appLogger);
    const performanceMonitoringMiddleware = new performance_monitoring_middleware_1.PerformanceMonitoringMiddleware(appLogger);
    app.use(new security_headers_middleware_1.SecurityHeadersMiddleware().use);
    app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware));
    app.use(performanceMonitoringMiddleware.use.bind(performanceMonitoringMiddleware));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter(appLogger));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
    }));
    const getAvailablePort = async (startPort, maxAttempts = 10) => {
        const net = await import('net');
        return new Promise((resolve, reject) => {
            const tryPort = (attempt) => {
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
    let port;
    try {
        port = await getAvailablePort(defaultPort);
        console.log(`✅ 端口 ${port} 可用`);
    }
    catch (error) {
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
//# sourceMappingURL=main.js.map