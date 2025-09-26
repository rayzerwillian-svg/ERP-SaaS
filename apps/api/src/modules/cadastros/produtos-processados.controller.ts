import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProdutoProcessadoInput, ProdutoProcessadoSchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { CadastrosService } from './cadastros.service';

@ApiTags('cadastros')
@Roles('admin', 'gestor', 'estoque')
@Controller('cadastros/produtos/processados')
export class ProdutosProcessadosController {
  constructor(private readonly service: CadastrosService) {}

  @Get()
  list() {
    return this.service.listProcessados();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.getProcessado(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(ProdutoProcessadoSchema)) body: ProdutoProcessadoInput) {
    return this.service.createProcessado(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ProdutoProcessadoSchema.partial())) body: Partial<ProdutoProcessadoInput>,
  ) {
    return this.service.updateProcessado(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.deleteProcessado(id);
  }
}
