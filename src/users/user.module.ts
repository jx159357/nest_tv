import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * 用户模块
 * 管理用户相关的功能，包括注册、登录、用户信息管理等
 */
@Module({
  imports: [
    // 导入TypeORM模块，用于数据库操作
    TypeOrmModule.forFeature([User]),
    
    // 导入JWT模块，用于JWT令牌生成和验证
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService], // 导出UserService供其他模块使用
})
export class UserModule {}