-- Prisma Migration SQL (initial)
CREATE TABLE "Empresa" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Usuario" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "nome" TEXT NOT NULL,
  "hash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "empresaId" UUID NOT NULL REFERENCES "Empresa"("id") ON DELETE CASCADE
);

CREATE TABLE "UnidadeMedida" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sigla" TEXT NOT NULL,
  "descricao" TEXT NOT NULL
);

CREATE TABLE "Fornecedor" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL,
  "cnpj" TEXT,
  "email" TEXT,
  "telefone" TEXT
);

CREATE TABLE "ProdutoVendaDireta" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "codigo" TEXT NOT NULL UNIQUE,
  "descricao" TEXT NOT NULL,
  "fornecedorId" UUID REFERENCES "Fornecedor"("id") ON DELETE SET NULL,
  "unidadeMedidaId" UUID NOT NULL REFERENCES "UnidadeMedida"("id") ON DELETE RESTRICT,
  "qtdPorEmbalagem" DECIMAL(10,3) NOT NULL,
  "precoPorUn" DECIMAL(10,2) NOT NULL,
  "precoPorMedida" DECIMAL(10,2) NOT NULL,
  "medida" DECIMAL(10,3) NOT NULL
);

CREATE TABLE "ProdutoProcessado" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "codigo" TEXT NOT NULL UNIQUE,
  "unidadeMedidaId" UUID NOT NULL REFERENCES "UnidadeMedida"("id") ON DELETE RESTRICT,
  "pesoBrutoPorUn" DECIMAL(10,3) NOT NULL,
  "pesoLiquidoPorUn" DECIMAL(10,3) NOT NULL,
  "precoPorUn" DECIMAL(10,2) NOT NULL,
  "fatorCorrecaoPerda" DECIMAL(5,4) NOT NULL,
  "precoPorMedida" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "ProdutoProcessadoMateriaPrima" (
  "produtoProcessadoId" UUID NOT NULL REFERENCES "ProdutoProcessado"("id") ON DELETE CASCADE,
  "materiaPrimaId" UUID NOT NULL REFERENCES "ProdutoVendaDireta"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("produtoProcessadoId", "materiaPrimaId")
);

CREATE TABLE "FichaTecnica" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "produtoId" UUID NOT NULL REFERENCES "ProdutoProcessado"("id") ON DELETE CASCADE,
  "nome" TEXT NOT NULL,
  "tipo" TEXT,
  "qtdProduzida" DECIMAL(10,3) NOT NULL,
  "custoInsumosTotal" DECIMAL(10,2) NOT NULL,
  "custosVariaveisTotais" DECIMAL(10,2) NOT NULL
);

CREATE INDEX "FichaTecnica_produtoId_idx" ON "FichaTecnica"("produtoId");

CREATE TABLE "FichaItem" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "fichaId" UUID NOT NULL REFERENCES "FichaTecnica"("id") ON DELETE CASCADE,
  "materiaPrimaId" UUID NOT NULL REFERENCES "ProdutoVendaDireta"("id") ON DELETE RESTRICT,
  "unidadeMedidaId" UUID NOT NULL REFERENCES "UnidadeMedida"("id") ON DELETE RESTRICT,
  "quant" DECIMAL(10,3) NOT NULL,
  "valorIndividual" DECIMAL(10,2) NOT NULL
);

CREATE TABLE "PrecificacaoRevenda" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cod" TEXT NOT NULL,
  "produto" TEXT NOT NULL,
  "precoVendaAtual" DECIMAL(10,2) NOT NULL,
  "cmv" DECIMAL(10,2) NOT NULL,
  "frete" DECIMAL(10,2) NOT NULL,
  "custoVariavel" DECIMAL(10,2) NOT NULL,
  "impostosPerc" DECIMAL(8,4) NOT NULL,
  "impostosValor" DECIMAL(10,2) NOT NULL,
  "taxaCartaoPerc" DECIMAL(8,4) NOT NULL,
  "taxaCartaoValor" DECIMAL(10,2) NOT NULL,
  "taxaAppPerc" DECIMAL(8,4) NOT NULL,
  "taxaAppValor" DECIMAL(10,2) NOT NULL,
  "comissaoPerc" DECIMAL(8,4) NOT NULL,
  "comissaoValor" DECIMAL(10,2) NOT NULL,
  "margemContribReais" DECIMAL(10,2) NOT NULL,
  "margemContribPercentual" DECIMAL(8,4) NOT NULL,
  "cmvReais" DECIMAL(10,2) NOT NULL,
  "cmvPercentual" DECIMAL(8,4) NOT NULL,
  "custosVariaveisReais" DECIMAL(10,2) NOT NULL,
  "custosVariaveisPercentual" DECIMAL(8,4) NOT NULL,
  "despesasVariaveisReais" DECIMAL(10,2) NOT NULL,
  "despesasVariaveisPercentual" DECIMAL(8,4) NOT NULL
);

CREATE UNIQUE INDEX "PrecificacaoRevenda_cod_key" ON "PrecificacaoRevenda"("cod");

CREATE TABLE "PrecificacaoProcessado" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cod" TEXT NOT NULL,
  "produto" TEXT NOT NULL,
  "precoVendaAtual" DECIMAL(10,2) NOT NULL,
  "cmv" DECIMAL(10,2) NOT NULL,
  "mod" DECIMAL(10,2) NOT NULL,
  "frete" DECIMAL(10,2) NOT NULL,
  "custoVariavel" DECIMAL(10,2) NOT NULL,
  "impostosPerc" DECIMAL(8,4) NOT NULL,
  "impostosValor" DECIMAL(10,2) NOT NULL,
  "taxaCartaoPerc" DECIMAL(8,4) NOT NULL,
  "taxaCartaoValor" DECIMAL(10,2) NOT NULL,
  "taxaAppPerc" DECIMAL(8,4) NOT NULL,
  "taxaAppValor" DECIMAL(10,2) NOT NULL,
  "comissaoPerc" DECIMAL(8,4) NOT NULL,
  "comissaoValor" DECIMAL(10,2) NOT NULL,
  "margemContribReais" DECIMAL(10,2) NOT NULL,
  "margemContribPercentual" DECIMAL(8,4) NOT NULL,
  "cpvReais" DECIMAL(10,2) NOT NULL,
  "cpvPercentual" DECIMAL(8,4) NOT NULL,
  "modReais" DECIMAL(10,2) NOT NULL,
  "modPercentual" DECIMAL(8,4) NOT NULL,
  "custosVariaveisReais" DECIMAL(10,2) NOT NULL,
  "custosVariaveisPercentual" DECIMAL(8,4) NOT NULL,
  "despesasVariaveisReais" DECIMAL(10,2) NOT NULL,
  "despesasVariaveisPercentual" DECIMAL(8,4) NOT NULL
);

CREATE UNIQUE INDEX "PrecificacaoProcessado_cod_key" ON "PrecificacaoProcessado"("cod");

CREATE TABLE "Simulacao" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tipo" TEXT NOT NULL,
  "codigo" TEXT NOT NULL,
  "produto" TEXT NOT NULL,
  "precoPraticado" DECIMAL(10,2) NOT NULL,
  "previsaoVendas" DECIMAL(12,2) NOT NULL,
  "faturamentoPrevisto" DECIMAL(12,2) NOT NULL,
  "custosVariaveis" DECIMAL(12,2) NOT NULL,
  "impostos" DECIMAL(12,2) NOT NULL,
  "taxaCartao" DECIMAL(12,2) NOT NULL,
  "taxaApp" DECIMAL(12,2) NOT NULL,
  "comissao" DECIMAL(12,2) NOT NULL,
  "margemContribReais" DECIMAL(12,2) NOT NULL,
  "margemContribPercentual" DECIMAL(8,4) NOT NULL,
  "rateioDespesasFixas" DECIMAL(12,2) NOT NULL,
  "margemLucroReais" DECIMAL(12,2) NOT NULL,
  "margemLucroPercentual" DECIMAL(8,4) NOT NULL,
  "markupMultiplicador" DECIMAL(8,4) NOT NULL,
  "percentualMix" DECIMAL(8,4) NOT NULL
);

CREATE INDEX "Simulacao_tipo_idx" ON "Simulacao"("tipo");

CREATE TABLE "Analise" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tipo" TEXT NOT NULL,
  "produtoId" TEXT NOT NULL,
  "precoVenda" DECIMAL(10,2) NOT NULL,
  "custosVariaveis" DECIMAL(10,2) NOT NULL,
  "custoProduto" DECIMAL(10,2) NOT NULL,
  "frete" DECIMAL(10,2) NOT NULL,
  "despesasVariaveis" DECIMAL(10,2) NOT NULL,
  "impostos" DECIMAL(10,2) NOT NULL,
  "taxaMaquina" DECIMAL(10,2) NOT NULL,
  "taxaApp" DECIMAL(10,2) NOT NULL,
  "comissao" DECIMAL(10,2) NOT NULL,
  "margemContrib" DECIMAL(10,2) NOT NULL,
  "rateioFixas" DECIMAL(10,2) NOT NULL,
  "margemLucro" DECIMAL(10,2) NOT NULL,
  "markup" DECIMAL(8,4) NOT NULL,
  "lucroDesejadoPercentual" DECIMAL(8,4) NOT NULL,
  "precoSugerido" DECIMAL(10,2) NOT NULL
);

CREATE INDEX "Analise_tipo_idx" ON "Analise"("tipo");
CREATE INDEX "Analise_produtoId_idx" ON "Analise"("produtoId");

CREATE TABLE "DespesaFixa" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoria" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "valorMensal" DECIMAL(10,2) NOT NULL,
  "diaVencimento" INT NOT NULL
);

CREATE INDEX "DespesaFixa_categoria_idx" ON "DespesaFixa"("categoria");

CREATE TABLE "Encargos" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "trabFerias30Perc" DECIMAL(8,4) NOT NULL,
  "trab13Perc" DECIMAL(8,4) NOT NULL,
  "trab13FeriasPerc" DECIMAL(8,4) NOT NULL,
  "socInssPerc" DECIMAL(8,4) NOT NULL,
  "socSatPerc" DECIMAL(8,4) NOT NULL,
  "socSalEducPerc" DECIMAL(8,4) NOT NULL,
  "socIncraSestSebraeSenatPerc" DECIMAL(8,4) NOT NULL,
  "socFgtsPerc" DECIMAL(8,4) NOT NULL,
  "socFgtsRescisaoPerc" DECIMAL(8,4) NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "Colaborador" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "codigo" TEXT NOT NULL UNIQUE,
  "nome" TEXT NOT NULL,
  "salario" DECIMAL(10,2) NOT NULL,
  "setor" TEXT NOT NULL,
  "cargo" TEXT NOT NULL,
  "dataContratacao" TIMESTAMPTZ NOT NULL,
  "encSociaisPerc" DECIMAL(8,4) NOT NULL,
  "encTrabPerc" DECIMAL(8,4) NOT NULL,
  "valeTransporte" DECIMAL(10,2) NOT NULL,
  "valeRefeicao" DECIMAL(10,2) NOT NULL,
  "convenioMedico" DECIMAL(10,2) NOT NULL,
  "cargaHorariaMensal" DECIMAL(10,2) NOT NULL,
  "valorHora" DECIMAL(10,2) NOT NULL
);

CREATE INDEX "Colaborador_setor_idx" ON "Colaborador"("setor");

CREATE TABLE "PlanoDRE" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "codigo" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "categoria" TEXT,
  "subcategoria" TEXT
);

CREATE TABLE "LancamentoDRE" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "contaCodigo" TEXT NOT NULL,
  "data" TIMESTAMPTZ NOT NULL,
  "descricao" TEXT NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "tipoPagamento" TEXT NOT NULL
);

CREATE INDEX "LancamentoDRE_contaCodigo_idx" ON "LancamentoDRE"("contaCodigo");
CREATE INDEX "LancamentoDRE_data_idx" ON "LancamentoDRE"("data");
