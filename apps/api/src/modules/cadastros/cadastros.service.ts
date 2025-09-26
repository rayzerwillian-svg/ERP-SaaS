import { Injectable, NotFoundException } from '@nestjs/common';
import { ProdutoProcessadoSchema, ProdutoVendaDiretaSchema } from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

type ProdutoVendaDiretaDto = z.infer<typeof ProdutoVendaDiretaSchema>;
type ProdutoProcessadoDto = z.infer<typeof ProdutoProcessadoSchema>;

@Injectable()
export class CadastrosService {
  constructor(private readonly prisma: PrismaService) {}

  async listVendaDireta() {
    const itens = await this.prisma.produtoVendaDireta.findMany({
      include: { fornecedor: true, unidade: true },
      orderBy: { descricao: 'asc' },
    });
    return toPlain(itens);
  }

  async getVendaDireta(id: string) {
    const item = await this.prisma.produtoVendaDireta.findUnique({
      where: { id },
      include: { fornecedor: true, unidade: true },
    });
    if (!item) {
      throw new NotFoundException('Produto não encontrado');
    }
    return toPlain(item);
  }

  async createVendaDireta(dto: ProdutoVendaDiretaDto) {
    const created = await this.prisma.produtoVendaDireta.create({
      data: dto,
      include: { fornecedor: true, unidade: true },
    });
    return toPlain(created);
  }

  async updateVendaDireta(id: string, dto: Partial<ProdutoVendaDiretaDto>) {
    const updated = await this.prisma.produtoVendaDireta.update({
      where: { id },
      data: dto,
      include: { fornecedor: true, unidade: true },
    });
    return toPlain(updated);
  }

  async deleteVendaDireta(id: string) {
    await this.prisma.produtoVendaDireta.delete({ where: { id } });
    return { success: true };
  }

  async listProcessados() {
    const itens = await this.prisma.produtoProcessado.findMany({
      include: { unidade: true, materiaPrima: { include: { materiaPrima: true } } },
      orderBy: { codigo: 'asc' },
    });
    return toPlain(itens.map((item) => this.mapProcessado(item)));
  }

  async getProcessado(id: string) {
    const item = await this.prisma.produtoProcessado.findUnique({
      where: { id },
      include: { unidade: true, materiaPrima: { include: { materiaPrima: true } } },
    });
    if (!item) {
      throw new NotFoundException('Produto não encontrado');
    }
    return toPlain(this.mapProcessado(item));
  }

  async createProcessado(dto: ProdutoProcessadoDto) {
    const { materiaPrimaIds = [], ...data } = dto;
    const created = await this.prisma.produtoProcessado.create({
      data: {
        ...data,
        materiaPrima: {
          create: materiaPrimaIds.map((materiaPrimaId) => ({ materiaPrimaId })),
        },
      },
      include: { unidade: true, materiaPrima: { include: { materiaPrima: true } } },
    });
    return toPlain(this.mapProcessado(created));
  }

  async updateProcessado(id: string, dto: Partial<ProdutoProcessadoDto>) {
    const { materiaPrimaIds, ...data } = dto;
    const updated = await this.prisma.$transaction(async (tx) => {
      if (materiaPrimaIds) {
        await tx.produtoProcessadoMateriaPrima.deleteMany({ where: { produtoProcessadoId: id } });
        if (materiaPrimaIds.length > 0) {
          const links = materiaPrimaIds.map((materiaPrimaId) => ({
            produtoProcessadoId: id,
            materiaPrimaId,
          }));
          await tx.produtoProcessadoMateriaPrima.createMany({ data: links, skipDuplicates: true });
        }
      }

      return tx.produtoProcessado.update({
        where: { id },
        data: data as Prisma.ProdutoProcessadoUpdateInput,
        include: { unidade: true, materiaPrima: { include: { materiaPrima: true } } },
      });
    });

    return toPlain(this.mapProcessado(updated));
  }

  async deleteProcessado(id: string) {
    await this.prisma.produtoProcessado.delete({ where: { id } });
    return { success: true };
  }

  async listFornecedores() {
    const fornecedores = await this.prisma.fornecedor.findMany({ orderBy: { nome: 'asc' } });
    return toPlain(fornecedores);
  }

  async createFornecedor(dto: { nome: string; cnpj?: string; email?: string; telefone?: string }) {
    const fornecedor = await this.prisma.fornecedor.create({ data: dto });
    return toPlain(fornecedor);
  }

  async listUnidades() {
    const unidades = await this.prisma.unidadeMedida.findMany({ orderBy: { sigla: 'asc' } });
    return toPlain(unidades);
  }

  async createUnidade(dto: { sigla: string; descricao: string }) {
    const unidade = await this.prisma.unidadeMedida.create({ data: dto });
    return toPlain(unidade);
  }

  private mapProcessado(
    item: Prisma.ProdutoProcessadoGetPayload<{
      include: { unidade: true; materiaPrima: { include: { materiaPrima: true } } };
    }>,
  ) {
    const { materiaPrima, ...rest } = item;
    return {
      ...rest,
      materiaPrimaIds: materiaPrima.map((link) => link.materiaPrimaId),
      materiaPrima: materiaPrima.map((link) => link.materiaPrima),
    };
  }
}
