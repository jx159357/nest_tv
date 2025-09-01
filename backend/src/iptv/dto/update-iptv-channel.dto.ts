import { PartialType } from '@nestjs/swagger';
import { CreateIPTVChannelDto } from './create-iptv-channel.dto';

export class UpdateIPTVChannelDto extends PartialType(CreateIPTVChannelDto) {}