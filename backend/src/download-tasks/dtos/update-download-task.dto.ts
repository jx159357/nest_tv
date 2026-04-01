import { PartialType } from '@nestjs/swagger';
import { CreateDownloadTaskDto } from './create-download-task.dto';

export class UpdateDownloadTaskDto extends PartialType(CreateDownloadTaskDto) {}
