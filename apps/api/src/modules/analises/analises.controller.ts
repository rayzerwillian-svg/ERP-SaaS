import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnaliseInput, AnaliseSchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalisesService } from './analises.service';

@ApiTags('analises')
@Roles('admin', 'gestor', 'financeiro')
@Controller('analises')
export class AnalisesController {
  constructor(private readonly service: AnalisesService) {}

  @Get(':tipo')
  list(@Param('tipo') tipo: 'revenda' | 'processados') {
    return this.service.list(tipo);
  }

  @Post(':tipo')
  create(
    @Param('tipo') tipo: 'revenda' | 'processados',
    @Body(new ZodValidationPipe(AnaliseSchema)) body: AnaliseInput,
  ) {
    return this.service.create(tipo, body);
  }
}
