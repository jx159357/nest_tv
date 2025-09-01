import { PartialType } from '@nestjs/swagger';
import { CreateParseProviderDto } from './create-parse-provider.dto';

export class UpdateParseProviderDto extends PartialType(CreateParseProviderDto) {}