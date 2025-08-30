"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = parseInt(process.env.PORT) || 3335;
    await app.listen(port);
    console.log(`🚀 Nest TV Backend is running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap().catch(error => {
    console.error('❌ Failed to start Nest TV Backend:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map