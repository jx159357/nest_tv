import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum DanmakuModerationAction {
  HIDE = 'hide',
  RESTORE = 'restore',
}

export class ModerateDanmakuDto {
  @ApiProperty({ enum: DanmakuModerationAction, description: '弹幕处置动作' })
  @IsEnum(DanmakuModerationAction)
  action: DanmakuModerationAction;
}
