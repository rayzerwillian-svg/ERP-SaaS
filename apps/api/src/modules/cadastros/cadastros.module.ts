import { Module } from '@nestjs/common';
import { CadastrosService } from './cadastros.service';
import { ProdutosVendaDiretaController } from './produtos-venda.controller';
import { ProdutosProcessadosController } from './produtos-processados.controller';
import { FornecedoresController } from './fornecedores.controller';
import { UnidadesController } from './unidades.controller';

@Module({
  controllers: [
    ProdutosVendaDiretaController,
    ProdutosProcessadosController,
    FornecedoresController,
    UnidadesController,
  ],
  providers: [CadastrosService],
})
export class CadastrosModule {}
