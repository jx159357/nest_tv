import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, Min } from 'class-validator';

export enum AdminDownloadTaskAction {
  RETRY = 'retry',
  CANCEL = 'cancel',
}

export class AdminDownloadTaskActionDto {
  @ApiProperty({ enum: AdminDownloadTaskAction, description: '管理端下载任务处置动作' })
  @IsEnum(AdminDownloadTaskAction)
  action: AdminDownloadTaskAction;
}

export class AdminBatchDownloadTaskActionDto extends AdminDownloadTaskActionDto {
  @ApiProperty({ type: [Number], description: '要批量处理的下载任务 ID 列表' })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  ids: number[];
}
