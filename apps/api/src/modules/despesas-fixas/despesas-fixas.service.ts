import { Injectable, NotFoundException } from '@nestjs/common';
import { DespesaFixaSchema } from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

type DespesaFixaDto = z.infer<typeof DespesaFixaSchema>;

@Injectable()
export class DespesasFixasService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategorias() {
    const categorias = await this.prisma.categoriaDespesaFixa.findMany({
      orderBy: { nome: 'asc' },
    });
    return categorias.map((categoria) => toPlain(categoria));
  }

  async createCategoria(nome: string, descricao?: string) {
    const categoria = await this.prisma.categoriaDespesaFixa.create({
      data: { nome, descricao },
    });
    return toPlain(categoria);
  }

  async listDespesas() {
    const despesas = await this.prisma.despesaFixa.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return despesas.map((despesa) => toPlain(despesa));
  }

  async createDespesa(payload: DespesaFixaDto) {
    const despesa = await this.prisma.despesaFixa.create({
      data: this.mapDespesa(payload),
    });
    return toPlain(despesa);
  }

  async updateDespesa(id: string, payload: Partial<DespesaFixaDto>) {
    try {
      const data = this.mapPartialDespesa(payload);
      const despesa = await this.prisma.despesaFixa.update({
        where: { id },
        data,
      });
      return toPlain(despesa);
    } catch (error) {
      this.handleNotFound(error, 'Despesa fixa não encontrada');
      throw error;
    }
  }

  async deleteDespesa(id: string) {
    try {
      await this.prisma.despesaFixa.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.handleNotFound(error, 'Despesa fixa não encontrada');
      throw error;
    }
  }

  async total() {
    const total = await this.prisma.despesaFixa.aggregate({
      _sum: { valorMensal: true },
    });
    const valor = total._sum.valorMensal?.toNumber() ?? 0;
    return { total: Number(valor.toFixed(2)) };
  }

  private mapDespesa(payload: DespesaFixaDto) {
    return {
      categoria: payload.categoria,
      descricao: payload.descricao,
      diaVencimento: payload.diaVencimento,
      valorMensal: new Prisma.Decimal(payload.valorMensal),
    };
  }

  private mapPartialDespesa(payload: Partial<DespesaFixaDto>) {
    const data: Prisma.DespesaFixaUpdateInput = {};

    if (payload.categoria !== undefined) data.categoria = payload.categoria;
    if (payload.descricao !== undefined) data.descricao = payload.descricao;
    if (payload.diaVencimento !== undefined) data.diaVencimento = payload.diaVencimento;
    if (payload.valorMensal !== undefined) data.valorMensal = new Prisma.Decimal(payload.valorMensal);

    return data;
  }

  private handleNotFound(error: unknown, message: string) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(message);
    }
  }
}
