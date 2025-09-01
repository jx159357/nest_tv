import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParseProvidersService } from './parse-providers.service';
import { ParseProvidersController } from './parse-providers.controller';
import { ParseProvider } from '../entities/parse-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ParseProvider])],
  controllers: [ParseProvidersController],
  providers: [ParseProvidersService],
  exports: [ParseProvidersService],
})
export class ParseProvidersModule {}