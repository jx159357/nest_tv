"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = new swagger_1.DocumentBuilder()
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3336;
    await app.listen(port);
    console.log(`🚀 Nest TV Backend is running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap().catch(error => {
    console.error('❌ Failed to start Nest TV Backend:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map