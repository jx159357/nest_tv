"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['log', 'error', 'warn'],
        bufferLogs: true,
    });
    app.enableCors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Nest TV API')
        .setDescription('Nest TV视频流媒体平台API文档')
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
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