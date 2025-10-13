import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { UserModule } from '../users/user.module';

/**
 * 认证模块
 * 管理认证相关的功能，包括JWT令牌生成和验证
 */
@Module({
  imports: [
    // 导入用户模块，使用forwardRef解决循环依赖
    forwardRef(() => UserModule),

    // 导入JWT模块，用于JWT令牌生成和验证
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService], // 导出AuthService供其他模块使用
})
export class AuthModule {}
