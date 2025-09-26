import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  PrecificacaoProcessadoInput,
  PrecificacaoProcessadoSchema,
  PrecificacaoRevendaInput,
  PrecificacaoRevendaSchema,
} from '@erp-saas/db';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrecificacaoService } from './precificacao.service';

const PrecoSugeridoSchema = z.object({ custo: z.number().positive(), margemDesejada: z.number().min(0) });

@ApiTags('precificacao')
@Roles('admin', 'gestor', 'financeiro')
@Controller('precificacao')
export class PrecificacaoController {
  constructor(private readonly service: PrecificacaoService) {}

  @Get('revenda')
  listRevenda() {
    return this.service.listRevenda();
  }

  @Post('revenda')
  upsertRevenda(@Body(new ZodValidationPipe(PrecificacaoRevendaSchema)) body: PrecificacaoRevendaInput) {
    return this.service.upsertRevenda(body);
  }

  @Patch('revenda')
  patchRevenda(@Body(new ZodValidationPipe(PrecificacaoRevendaSchema)) body: PrecificacaoRevendaInput) {
    return this.service.upsertRevenda(body);
  }

  @Get('processados')
  listProcessados() {
    return this.service.listProcessados();
  }

  @Post('processados')
  upsertProcessados(@Body(new ZodValidationPipe(PrecificacaoProcessadoSchema)) body: PrecificacaoProcessadoInput) {
    return this.service.upsertProcessado(body);
  }

  @Patch('processados')
  patchProcessados(
    @Body(new ZodValidationPipe(PrecificacaoProcessadoSchema)) body: PrecificacaoProcessadoInput,
  ) {
    return this.service.upsertProcessado(body);
  }

  @Post(':tipo/sugerir-preco')
  sugerir(
    @Param('tipo') tipo: 'revenda' | 'processados',
    @Body(new ZodValidationPipe(PrecoSugeridoSchema)) body: z.infer<typeof PrecoSugeridoSchema>,
  ) {
    return this.service.sugerirPreco(tipo, body);
  }
}
