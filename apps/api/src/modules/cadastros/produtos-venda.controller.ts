import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProdutoVendaDiretaInput, ProdutoVendaDiretaSchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { CadastrosService } from './cadastros.service';

@ApiTags('cadastros')
@Roles('admin', 'gestor', 'estoque')
@Controller('cadastros/produtos/venda-direta')
export class ProdutosVendaDiretaController {
  constructor(private readonly service: CadastrosService) {}

  @Get()
  list() {
    return this.service.listVendaDireta();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getVendaDireta(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(ProdutoVendaDiretaSchema)) body: ProdutoVendaDiretaInput) {
    return this.service.createVendaDireta(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ProdutoVendaDiretaSchema.partial())) body: Partial<ProdutoVendaDiretaInput>,
  ) {
    return this.service.updateVendaDireta(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteVendaDireta(id);
  }
}
