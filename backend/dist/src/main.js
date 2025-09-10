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
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;
    await app.listen(port);
    console.log('🚀 Nest TV Backend is running on port', port);
    console.log('📚 API Documentation: http://localhost:' + port + '/api');
}
bootstrap().catch(error => {
    console.error('❌ Failed to start Nest TV Backend:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map