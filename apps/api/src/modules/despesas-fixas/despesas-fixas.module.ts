import { Module } from '@nestjs/common';
import { DespesasFixasController } from './despesas-fixas.controller';
import { DespesasFixasService } from './despesas-fixas.service';

@Module({
  controllers: [DespesasFixasController],
  providers: [DespesasFixasService],
})
export class DespesasFixasModule {}
