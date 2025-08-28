import { PartialType } from '@nestjs/swagger';
import { CreateMediaResourceDto } from './create-media-resource.dto';

export class UpdateMediaResourceDto extends PartialType(CreateMediaResourceDto) {}