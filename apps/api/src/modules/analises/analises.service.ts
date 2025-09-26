import { Injectable } from '@nestjs/common';
import { AnaliseSchema } from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

@Injectable()
export class AnalisesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tipo: 'revenda' | 'processados') {
    const analises = await this.prisma.analise.findMany({
      where: { tipo },
      orderBy: { precoVenda: 'desc' },
    });
    return toPlain(analises);
  }

  async create(tipo: 'revenda' | 'processados', payload: z.infer<typeof AnaliseSchema>) {
    const precoSugerido = this.calcularPreco(payload);
    const data = this.toDecimalRecord({ ...payload, precoSugerido });
    const analise = await this.prisma.analise.create({
      data: { tipo, ...data },
    });
    return toPlain(analise);
  }

  private calcularPreco(payload: z.infer<typeof AnaliseSchema>) {
    const margemDesejada = payload.lucroDesejadoPercentual / 100;
    const base =
      payload.custoProduto +
      payload.despesasVariaveis +
      payload.frete +
      payload.impostos +
      payload.taxaMaquina +
      payload.taxaApp +
      payload.comissao +
      payload.rateioFixas;
    const preco = Number((base * (1 + margemDesejada)).toFixed(2));
    return preco;
  }

  private toDecimalRecord(values: Record<string, string | number>) {
    return Object.entries(values).reduce<Record<string, Prisma.Decimal | string>>((acc, [key, value]) => {
      if (typeof value === 'number') {
        acc[key] = new Prisma.Decimal(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
}
