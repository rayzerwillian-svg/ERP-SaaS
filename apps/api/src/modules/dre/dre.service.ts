import { Injectable } from '@nestjs/common';
import { LancamentoDRESchema } from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

type PlanoContaDto = { codigo: string; nome: string; tipo: string; categoria?: string; subcategoria?: string };
type LancamentoDto = z.infer<typeof LancamentoDRESchema>;

@Injectable()
export class DreService {
  constructor(private readonly prisma: PrismaService) {}

  async listPlano() {
    const contas = await this.prisma.planoDRE.findMany({
      orderBy: { codigo: 'asc' },
    });
    return contas.map((conta) => toPlain(conta));
  }

  async createPlano(entry: PlanoContaDto) {
    const plano = await this.prisma.planoDRE.create({ data: entry });
    return toPlain(plano);
  }

  async listLancamentos() {
    const lancamentos = await this.prisma.lancamentoDRE.findMany({
      orderBy: { data: 'desc' },
    });
    return lancamentos.map((lancamento) => this.toLancamentoDto(lancamento));
  }

  async createLancamento(payload: LancamentoDto) {
    const lancamento = await this.prisma.lancamentoDRE.create({
      data: {
        contaCodigo: payload.contaCodigo,
        descricao: payload.descricao,
        tipoPagamento: payload.tipoPagamento,
        data: new Date(payload.data),
        valor: new Prisma.Decimal(payload.valor),
      },
    });
    return this.toLancamentoDto(lancamento);
  }

  async relatorio() {
    const lancamentos = await this.prisma.lancamentoDRE.findMany();
    const registros = lancamentos.map((lancamento) => this.toLancamentoDto(lancamento));

    const porMes = new Map<string, { receitas: number; despesas: number }>();
    registros.forEach((lancamento) => {
      const data = new Date(lancamento.data);
      const key = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
      const tipo = lancamento.valor >= 0 ? 'receitas' : 'despesas';
      if (!porMes.has(key)) {
        porMes.set(key, { receitas: 0, despesas: 0 });
      }
      const bucket = porMes.get(key)!;
      bucket[tipo] += lancamento.valor;
    });

    const linhas = Array.from(porMes.entries()).map(([competencia, valores]) => ({
      competencia,
      receitas: Number(valores.receitas.toFixed(2)),
      despesas: Number(valores.despesas.toFixed(2)),
      lucro: Number((valores.receitas + valores.despesas).toFixed(2)),
    }));

    const totais = linhas.reduce(
      (acc, linha) => {
        acc.receitas += linha.receitas;
        acc.despesas += linha.despesas;
        acc.lucro += linha.lucro;
        return acc;
      },
      { receitas: 0, despesas: 0, lucro: 0 },
    );

    return { linhas, totais };
  }

  private toLancamentoDto(model: Prisma.LancamentoDRE) {
    return {
      id: model.id,
      contaCodigo: model.contaCodigo,
      descricao: model.descricao,
      tipoPagamento: model.tipoPagamento as LancamentoDto['tipoPagamento'],
      data: model.data.toISOString(),
      valor: Number(model.valor),
    };
  }
}
