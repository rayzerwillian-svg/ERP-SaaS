import { Module } from '@nestjs/common';
import { AnalisesController } from './analises.controller';
import { AnalisesService } from './analises.service';

@Module({
  controllers: [AnalisesController],
  providers: [AnalisesService],
})
export class AnalisesModule {}
