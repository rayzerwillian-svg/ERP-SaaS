import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EntradasService } from './entradas.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('entradas')
@Roles('admin', 'gestor', 'fiscal', 'financeiro')
@Controller()
export class EntradasController {
  constructor(private readonly service: EntradasService) {}

  @Get('entradas/receitas')
  listReceitas() {
    return this.service.listReceitas();
  }

  @Post('entradas/receitas')
  addReceita(@Body() body: { descricao: string; valor: number; data: string; categoria?: string }) {
    return this.service.addReceita(body);
  }

  @Get('entradas/despesas')
  listDespesas() {
    return this.service.listDespesas();
  }

  @Post('entradas/despesas')
  addDespesa(@Body() body: { descricao: string; valor: number; data: string; categoria?: string }) {
    return this.service.addDespesa(body);
  }

  @Get('ingestao/vendas-importadas')
  listVendasImportadas() {
    return this.service.listVendasImportadas();
  }

  @Post('ingestao/vendas-importadas')
  addVendaImportada(
    @Body() body: { descricao: string; valor: number; data: string; categoria?: string; origem: string },
  ) {
    return this.service.addVendaImportada(body);
  }

  @Get('ingestao/despesas-importadas')
  listDespesasImportadas() {
    return this.service.listDespesasImportadas();
  }

  @Post('ingestao/despesas-importadas')
  addDespesaImportada(
    @Body() body: { descricao: string; valor: number; data: string; categoria?: string; origem: string },
  ) {
    return this.service.addDespesaImportada(body);
  }
}
