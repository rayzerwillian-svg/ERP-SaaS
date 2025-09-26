import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PrecificacaoProcessadoSchema,
  PrecificacaoRevendaSchema,
} from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

type PrecificacaoRevendaDto = z.infer<typeof PrecificacaoRevendaSchema>;
type PrecificacaoProcessadoDto = z.infer<typeof PrecificacaoProcessadoSchema>;

@Injectable()
export class PrecificacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async listRevenda() {
    const itens = await this.prisma.precificacaoRevenda.findMany({
      orderBy: { cod: 'asc' },
    });
    return toPlain(itens);
  }

  async upsertRevenda(dto: PrecificacaoRevendaDto) {
    const data = this.mapRevenda(dto);
    const item = await this.prisma.precificacaoRevenda.upsert({
      where: { cod: dto.cod },
      update: data,
      create: data,
    });
    return toPlain(item);
  }

  async listProcessados() {
    const itens = await this.prisma.precificacaoProcessado.findMany({
      orderBy: { cod: 'asc' },
    });
    return toPlain(itens);
  }

  async upsertProcessado(dto: PrecificacaoProcessadoDto) {
    const data = this.mapProcessado(dto);
    const item = await this.prisma.precificacaoProcessado.upsert({
      where: { cod: dto.cod },
      update: data,
      create: data,
    });
    return toPlain(item);
  }

  sugerirPreco(tipo: 'revenda' | 'processados', payload: { custo: number; margemDesejada: number }) {
    const base = payload.custo;
    const sugerido = base * (1 + payload.margemDesejada / 100);
    return { tipo, precoSugerido: Number(sugerido.toFixed(2)) };
  }

  async findByCod(tipo: 'revenda' | 'processados', cod: string) {
    const item =
      tipo === 'revenda'
        ? await this.prisma.precificacaoRevenda.findUnique({ where: { cod } })
        : await this.prisma.precificacaoProcessado.findUnique({ where: { cod } });

    if (!item) {
      throw new NotFoundException('Precificação não encontrada');
    }

    return toPlain(item);
  }

  private mapRevenda(dto: PrecificacaoRevendaDto) {
    const { cod, produto, ...numericos } = dto;
    return {
      cod,
      produto,
      ...this.toDecimalRecord(numericos),
    };
  }

  private mapProcessado(dto: PrecificacaoProcessadoDto) {
    const { cod, produto, ...numericos } = dto;
    return {
      cod,
      produto,
      ...this.toDecimalRecord(numericos),
    };
  }

  private toDecimalRecord(values: Record<string, number>) {
    return Object.entries(values).reduce<Record<string, Prisma.Decimal>>((acc, [key, value]) => {
      acc[key] = new Prisma.Decimal(value);
      return acc;
    }, {});
  }
}
