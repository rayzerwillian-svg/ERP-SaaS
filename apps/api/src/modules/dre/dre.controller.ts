import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DreService } from './dre.service';
import { LancamentoDREInput, LancamentoDRESchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('dre')
@Roles('admin', 'gestor', 'fiscal', 'financeiro')
@Controller('dre')
export class DreController {
  constructor(private readonly service: DreService) {}

  @Get('plano')
  listPlano() {
    return this.service.listPlano();
  }

  @Post('plano')
  createPlano(@Body() body: { codigo: string; nome: string; tipo: string; categoria?: string; subcategoria?: string }) {
    return this.service.createPlano(body);
  }

  @Get('lancamentos')
  listLancamentos() {
    return this.service.listLancamentos();
  }

  @Post('lancamentos')
  createLancamento(@Body(new ZodValidationPipe(LancamentoDRESchema)) body: LancamentoDREInput) {
    return this.service.createLancamento(body);
  }

  @Get('relatorio')
  relatorio() {
    return this.service.relatorio();
  }
}
