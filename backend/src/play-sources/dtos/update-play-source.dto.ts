import { PartialType } from '@nestjs/swagger';
import { CreatePlaySourceDto } from './create-play-source.dto';

export class UpdatePlaySourceDto extends PartialType(CreatePlaySourceDto) {}
