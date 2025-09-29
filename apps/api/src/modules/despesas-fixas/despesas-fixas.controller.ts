import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DespesaFixaInput, DespesaFixaSchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { DespesasFixasService } from './despesas-fixas.service';
import { z } from 'zod';

const CategoriaSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
});

@ApiTags('despesas-fixas')
@Roles('admin', 'gestor', 'financeiro')
@Controller('despesas-fixas')
export class DespesasFixasController {
  constructor(private readonly service: DespesasFixasService) {}

  @Get('categorias')
  listCategorias() {
    return this.service.listCategorias();
  }

  @Post('categorias')
  createCategoria(@Body(new ZodValidationPipe(CategoriaSchema)) body: z.infer<typeof CategoriaSchema>) {
    return this.service.createCategoria(body.nome, body.descricao);
  }

  @Get()
  list() {
    return this.service.listDespesas();
  }

  @Post()
  create(@Body(new ZodValidationPipe(DespesaFixaSchema)) body: DespesaFixaInput) {
    return this.service.createDespesa(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(DespesaFixaSchema.partial())) body: Partial<z.infer<typeof DespesaFixaSchema>>,
  ) {
    return this.service.updateDespesa(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteDespesa(id);
  }

  @Get('total')
  total() {
    return this.service.total();
  }
}
