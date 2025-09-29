import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type MovimentoDto = { descricao: string; valor: number; data: string; categoria?: string };
type ImportacaoDto = MovimentoDto & { origem: string };

type MovimentoModel = {
  id: string;
  descricao: string;
  valor: Prisma.Decimal;
  categoria: string | null;
  data: Date;
};

type ImportacaoModel = MovimentoModel & { origem: string };

@Injectable()
export class EntradasService {
  constructor(private readonly prisma: PrismaService) {}

  async listReceitas() {
    const receitas = await this.prisma.entradaReceita.findMany({
      orderBy: { data: 'desc' },
    });
    return receitas.map((item) => this.toMovimentoDto(item));
  }

  async addReceita(payload: MovimentoDto) {
    const receita = await this.prisma.entradaReceita.create({
      data: this.mapMovimento(payload),
    });
    return this.toMovimentoDto(receita);
  }

  async listDespesas() {
    const despesas = await this.prisma.entradaDespesa.findMany({
      orderBy: { data: 'desc' },
    });
    return despesas.map((item) => this.toMovimentoDto(item));
  }

  async addDespesa(payload: MovimentoDto) {
    const despesa = await this.prisma.entradaDespesa.create({
      data: this.mapMovimento(payload),
    });
    return this.toMovimentoDto(despesa);
  }

  async listVendasImportadas() {
    const vendas = await this.prisma.vendaImportada.findMany({
      orderBy: { data: 'desc' },
    });
    return vendas.map((item) => this.toImportacaoDto(item));
  }

  async addVendaImportada(payload: ImportacaoDto) {
    const venda = await this.prisma.vendaImportada.create({
      data: this.mapImportacao(payload),
    });
    return this.toImportacaoDto(venda);
  }

  async listDespesasImportadas() {
    const despesas = await this.prisma.despesaImportada.findMany({
      orderBy: { data: 'desc' },
    });
    return despesas.map((item) => this.toImportacaoDto(item));
  }

  async addDespesaImportada(payload: ImportacaoDto) {
    const despesa = await this.prisma.despesaImportada.create({
      data: this.mapImportacao(payload),
    });
    return this.toImportacaoDto(despesa);
  }

  private mapMovimento(payload: MovimentoDto) {
    return {
      descricao: payload.descricao,
      data: new Date(payload.data),
      categoria: payload.categoria,
      valor: new Prisma.Decimal(payload.valor),
    };
  }

  private mapImportacao(payload: ImportacaoDto) {
    return {
      ...this.mapMovimento(payload),
      origem: payload.origem,
    };
  }

  private toMovimentoDto(model: MovimentoModel) {
    return {
      id: model.id,
      descricao: model.descricao,
      valor: Number(model.valor),
      categoria: model.categoria ?? undefined,
      data: model.data.toISOString(),
    };
  }

  private toImportacaoDto(model: ImportacaoModel) {
    return {
      ...this.toMovimentoDto(model),
      origem: model.origem,
    };
  }
}
