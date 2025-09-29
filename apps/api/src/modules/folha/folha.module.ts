import { Module } from '@nestjs/common';
import { FolhaController } from './folha.controller';
import { FolhaService } from './folha.service';

@Module({
  controllers: [FolhaController],
  providers: [FolhaService],
})
export class FolhaModule {}
