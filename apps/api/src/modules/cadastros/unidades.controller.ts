import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CadastrosService } from './cadastros.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('cadastros')
@Roles('admin', 'gestor', 'estoque')
@Controller('cadastros/unidades-medida')
export class UnidadesController {
  constructor(private readonly service: CadastrosService) {}

  @Get()
  list() {
    return this.service.listUnidades();
  }

  @Post()
  create(@Body() body: { sigla: string; descricao: string }) {
    return this.service.createUnidade(body);
  }
}
