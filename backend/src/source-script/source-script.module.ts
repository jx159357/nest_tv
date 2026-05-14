import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourceScript } from '../entities/source-script.entity';
import { SourceScriptService } from './source-script.service';
import { SourceScriptController } from './source-script.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SourceScript])],
  controllers: [SourceScriptController],
  providers: [SourceScriptService],
  exports: [SourceScriptService],
})
export class SourceScriptModule {}
