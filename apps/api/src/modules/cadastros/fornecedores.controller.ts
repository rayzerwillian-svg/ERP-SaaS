import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CadastrosService } from './cadastros.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('cadastros')
@Roles('admin', 'gestor', 'estoque')
@Controller('cadastros/fornecedores')
export class FornecedoresController {
  constructor(private readonly service: CadastrosService) {}

  @Get()
  list() {
    return this.service.listFornecedores();
  }

  @Post()
  create(@Body() body: { nome: string; cnpj?: string; email?: string; telefone?: string }) {
    return this.service.createFornecedor(body);
  }
}
