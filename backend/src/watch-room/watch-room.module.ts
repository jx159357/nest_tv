import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WatchRoomGateway } from './watch-room.gateway';
import { WatchRoomService } from './watch-room.service';
import { WatchRoomController } from './watch-room.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'nest-tv-jwt-secret-key-2024'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '3600s'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [WatchRoomController],
  providers: [WatchRoomGateway, WatchRoomService],
  exports: [WatchRoomService],
})
export class WatchRoomModule {}
