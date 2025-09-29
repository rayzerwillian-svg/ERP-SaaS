import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

type SerieBucket = { receita: number; despesa: number };

type DashboardSeriePoint = {
  competencia: string;
  receita: number;
  despesa: number;
};

type DashboardKpis = {
  receita: number;
  cmv: number;
  margemContribPercentual: number;
  lucro: number;
  markupMedio: number;
  mixDigitalPercentual: number;
  custosFixos: number;
  topCanal: string | null;
};

type DashboardOverview = {
  kpis: DashboardKpis;
  receitaDespesa: DashboardSeriePoint[];
  topProdutos: { produto: string; margem: number }[];
  perdasValidade: { produto: string; perda: number }[];
  alerts: string[];
};

const DIGITAL_ORIGIN_REGEX = /(delivery|app|online|e-?commerce|ifood|uber|rapi|rappi|whatsapp)/i;

function competenciaKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function ensureBucket(map: Map<string, SerieBucket>, key: string): SerieBucket {
  if (!map.has(key)) {
    map.set(key, { receita: 0, despesa: 0 });
  }
  return map.get(key)!;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<DashboardOverview> {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

    const [
      receitas,
      despesas,
      vendasImportadas,
      despesasImportadas,
      analises,
      simulacoes,
      despesasFixas,
      produtosProcessados,
      produtosVendaDireta,
    ] = await Promise.all([
      this.prisma.entradaReceita.findMany({ where: { data: { gte: start } } }),
      this.prisma.entradaDespesa.findMany({ where: { data: { gte: start } } }),
      this.prisma.vendaImportada.findMany({ where: { data: { gte: start } } }),
      this.prisma.despesaImportada.findMany({ where: { data: { gte: start } } }),
      this.prisma.analise.findMany(),
      this.prisma.simulacao.findMany(),
      this.prisma.despesaFixa.findMany(),
      this.prisma.produtoProcessado.findMany({
        include: { unidade: true },
      }),
      this.prisma.produtoVendaDireta.findMany(),
    ]);

    const serieMap = new Map<string, SerieBucket>();

    let totalReceita = 0;
    let totalDespesa = 0;

    toPlain(receitas).forEach((entrada) => {
      const date = new Date(entrada.data);
      const key = competenciaKey(date);
      const bucket = ensureBucket(serieMap, key);
      bucket.receita += entrada.valor;
      totalReceita += entrada.valor;
    });

    toPlain(despesas).forEach((entrada) => {
      const date = new Date(entrada.data);
      const key = competenciaKey(date);
      const bucket = ensureBucket(serieMap, key);
      const valor = Math.abs(entrada.valor);
      bucket.despesa += valor;
      totalDespesa += valor;
    });

    const origemTotais = new Map<string, number>();
    let digitalReceita = 0;

    toPlain(vendasImportadas).forEach((entrada) => {
      const date = new Date(entrada.data);
      const key = competenciaKey(date);
      const bucket = ensureBucket(serieMap, key);
      const valor = entrada.valor;
      bucket.receita += valor;
      totalReceita += valor;

      const origem = entrada.origem ?? 'indefinido';
      origemTotais.set(origem, (origemTotais.get(origem) ?? 0) + valor);
      if (DIGITAL_ORIGIN_REGEX.test(origem)) {
        digitalReceita += valor;
      }
    });

    toPlain(despesasImportadas).forEach((entrada) => {
      const date = new Date(entrada.data);
      const key = competenciaKey(date);
      const bucket = ensureBucket(serieMap, key);
      const valor = Math.abs(entrada.valor);
      bucket.despesa += valor;
      totalDespesa += valor;
    });

    const serie = Array.from(serieMap.entries())
      .map(([competencia, valores]) => ({
        competencia,
        receita: Number(valores.receita.toFixed(2)),
        despesa: Number(valores.despesa.toFixed(2)),
      }))
      .sort((a, b) => (a.competencia < b.competencia ? -1 : 1));

    const plainAnalises = toPlain(analises) as Array<{
      produtoId: string;
      margemLucro: number;
      margemContrib: number;
      precoVenda: number;
      produto?: string;
      tipo?: string;
    }>;

    const plainSimulacoes = toPlain(simulacoes) as Array<{
      markupMultiplicador: number;
      margemContribPercentual: number;
    }>;

    const plainDespesasFixas = toPlain(despesasFixas) as Array<{ valorMensal: number }>;

    const custosFixos = plainDespesasFixas.reduce((acc, item) => acc + item.valorMensal, 0);

    const margemContribTotal = plainAnalises.reduce(
      (acc, analise) => acc + (typeof analise.margemContrib === 'number' ? analise.margemContrib : 0),
      0,
    );
    const receitaAnalises = plainAnalises.reduce(
      (acc, analise) => acc + (typeof analise.precoVenda === 'number' ? analise.precoVenda : 0),
      0,
    );

    const margemContribPercentual = receitaAnalises > 0 ? margemContribTotal / receitaAnalises : 0;

    const markupMedio = plainSimulacoes.length
      ? plainSimulacoes.reduce(
          (acc, item) => acc + (typeof item.markupMultiplicador === 'number' ? item.markupMultiplicador : 0),
          0,
        ) / plainSimulacoes.length
      : 0;

    const cmv = plainAnalises.reduce((acc, analise) => {
      if (typeof analise.precoVenda === 'number' && typeof analise.margemContrib === 'number') {
        return acc + (analise.precoVenda - analise.margemContrib);
      }
      return acc;
    }, 0);

    const mixDigitalPercentual = totalReceita > 0 ? digitalReceita / totalReceita : 0;

    const lucro = totalReceita - totalDespesa;

    let topCanal: string | null = null;
    if (origemTotais.size > 0) {
      topCanal = Array.from(origemTotais.entries()).sort((a, b) => b[1] - a[1])[0][0];
    }

    const plainProdutosProcessados = toPlain(produtosProcessados) as Array<{
      id: string;
      codigo: string;
      pesoBrutoPorUn: number;
      pesoLiquidoPorUn: number;
      precoPorUn: number;
      unidade?: { sigla: string };
    }>;

    const plainProdutosVendaDireta = toPlain(produtosVendaDireta) as Array<{
      id: string;
      codigo: string;
      descricao: string;
    }>;

    const produtoNome = new Map<string, string>();
    plainProdutosVendaDireta.forEach((produto) => {
      produtoNome.set(produto.id, `${produto.codigo} - ${produto.descricao}`);
    });
    plainProdutosProcessados.forEach((produto) => {
      const label = `${produto.codigo}${produto.unidade?.sigla ? ` (${produto.unidade.sigla})` : ''}`;
      produtoNome.set(produto.id, label);
    });

    const topProdutos = plainAnalises
      .filter((analise) => typeof analise.margemLucro === 'number')
      .map((analise) => ({
        produto: produtoNome.get(analise.produtoId) ?? analise.produtoId,
        margem: analise.margemLucro,
      }))
      .sort((a, b) => b.margem - a.margem)
      .slice(0, 10);

    const perdasValidade = plainProdutosProcessados
      .map((produto) => {
        const perdaPeso = Math.max(0, produto.pesoBrutoPorUn - produto.pesoLiquidoPorUn);
        const perdaFinanceira = perdaPeso * (produto.precoPorUn ?? 0);
        return {
          produto: `${produto.codigo}${produto.unidade?.sigla ? ` (${produto.unidade.sigla})` : ''}`,
          perda: Number(perdaFinanceira.toFixed(2)),
        };
      })
      .filter((item) => item.perda > 0)
      .sort((a, b) => b.perda - a.perda)
      .slice(0, 10);

    const alerts: string[] = [];
    if (margemContribPercentual < 0.2 && totalReceita > 0) {
      alerts.push(
        `Margem de contribuição média em ${Math.round(margemContribPercentual * 100)}% abaixo do alvo recomendado (>= 25%).`,
      );
    }
    if (mixDigitalPercentual < 0.25 && digitalReceita > 0) {
      alerts.push(
        `Mix digital representa apenas ${Math.round(mixDigitalPercentual * 100)}% das vendas importadas. Considere ativar campanhas.`,
      );
    }
    if (lucro < 0) {
      alerts.push(`Lucro consolidado negativo em ${lucro.toFixed(2)}.`);
    }

    return {
      kpis: {
        receita: Number(totalReceita.toFixed(2)),
        cmv: Number(cmv.toFixed(2)),
        margemContribPercentual: Number(margemContribPercentual.toFixed(4)),
        lucro: Number(lucro.toFixed(2)),
        markupMedio: Number(markupMedio.toFixed(2)),
        mixDigitalPercentual: Number(mixDigitalPercentual.toFixed(4)),
        custosFixos: Number(custosFixos.toFixed(2)),
        topCanal,
      },
      receitaDespesa: serie,
      topProdutos,
      perdasValidade,
      alerts,
    };
  }
}
