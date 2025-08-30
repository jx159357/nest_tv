/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-08-28 11:23:26
 * @LastEditors: jxwd
 * @LastEditTime: 2025-08-28 17:31:14
 */
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const port = parseInt(process.env.PORT) || 3335
  await app.listen(port)
  console.log(`🚀 Nest TV Backend is running on port ${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api`)
}

bootstrap().catch(error => {
  console.error('❌ Failed to start Nest TV Backend:', error)
  process.exit(1)
})
