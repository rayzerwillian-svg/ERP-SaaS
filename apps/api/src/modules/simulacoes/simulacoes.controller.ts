import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SimulacaoInput, SimulacaoSchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { SimulacoesService } from './simulacoes.service';

@ApiTags('simulacoes')
@Roles('admin', 'gestor', 'financeiro', 'estoque')
@Controller('simulacoes')
export class SimulacoesController {
  constructor(private readonly service: SimulacoesService) {}

  @Get(':tipo')
  list(@Param('tipo') tipo: 'revenda' | 'processados') {
    return this.service.list(tipo);
  }

  @Post(':tipo')
  create(
    @Param('tipo') tipo: 'revenda' | 'processados',
    @Body(new ZodValidationPipe(SimulacaoSchema)) body: SimulacaoInput,
  ) {
    return this.service.create(tipo, body);
  }
}
