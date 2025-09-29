import { Injectable } from '@nestjs/common';
import { SimulacaoSchema } from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

@Injectable()
export class SimulacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tipo: 'revenda' | 'processados') {
    const simulacoes = await this.prisma.simulacao.findMany({
      where: { tipo },
      orderBy: { codigo: 'asc' },
    });
    return toPlain(simulacoes);
  }

  async create(tipo: 'revenda' | 'processados', payload: z.infer<typeof SimulacaoSchema>) {
    const data = this.toDecimalRecord(payload);
    const simulacao = await this.prisma.simulacao.create({
      data: { tipo, ...data },
    });
    return toPlain(simulacao);
  }

  private toDecimalRecord(values: z.infer<typeof SimulacaoSchema>) {
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
