import { Injectable, NotFoundException } from '@nestjs/common';
import { FichaTecnicaSchema, FichaTecnicaItemSchema } from '@erp-saas/db';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

type FichaDto = z.infer<typeof FichaTecnicaSchema>;
type FichaItemDto = z.infer<typeof FichaTecnicaItemSchema>;

const fichaInclude = {
  produto: {
    select: {
      id: true,
      codigo: true,
    },
  },
  itens: {
    include: {
      materiaPrima: {
        select: {
          id: true,
          codigo: true,
          descricao: true,
        },
      },
      unidade: {
        select: {
          id: true,
          sigla: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  },
};

@Injectable()
export class FichasService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const fichas = await this.prisma.fichaTecnica.findMany({
      include: fichaInclude,
      orderBy: { nome: 'asc' },
    });
    return toPlain(fichas);
  }

  async get(id: string) {
    const ficha = await this.prisma.fichaTecnica.findUnique({
      where: { id },
      include: fichaInclude,
    });

    if (!ficha) {
      throw new NotFoundException('Ficha técnica não encontrada');
    }

    return toPlain(ficha);
  }

  async create(dto: FichaDto) {
    const { itens, ...data } = dto;
    const created = await this.prisma.fichaTecnica.create({
      data: {
        ...data,
        itens: {
          create: itens.map((item) => ({ ...item })),
        },
      },
      include: fichaInclude,
    });

    return toPlain(created);
  }

  async update(id: string, dto: Partial<FichaDto>) {
    const { itens, ...rest } = dto;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (itens) {
        await tx.fichaItem.deleteMany({ where: { fichaId: id } });
        if (itens.length > 0) {
          await tx.fichaItem.createMany({
            data: itens.map((item) => ({
              fichaId: id,
              ...item,
            })),
          });
        }
      }

      return tx.fichaTecnica.update({
        where: { id },
        data: rest,
        include: fichaInclude,
      });
    });

    return toPlain(updated);
  }

  async delete(id: string) {
    await this.ensureFichaExists(id);
    await this.prisma.fichaTecnica.delete({ where: { id } });
    return { success: true };
  }

  async addItem(id: string, item: FichaItemDto) {
    await this.ensureFichaExists(id);
    await this.prisma.fichaItem.create({
      data: {
        fichaId: id,
        ...item,
      },
    });

    return this.get(id);
  }

  async updateItem(id: string, itemId: string, item: FichaItemDto) {
    await this.ensureFichaExists(id);
    const existing = await this.prisma.fichaItem.findFirst({
      where: { id: itemId, fichaId: id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado para a ficha técnica');
    }

    await this.prisma.fichaItem.update({
      where: { id: itemId },
      data: item,
    });

    return this.get(id);
  }

  async removeItem(id: string, itemId: string) {
    await this.ensureFichaExists(id);
    const existing = await this.prisma.fichaItem.findFirst({
      where: { id: itemId, fichaId: id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Item não encontrado para a ficha técnica');
    }

    await this.prisma.fichaItem.delete({ where: { id: itemId } });
    return this.get(id);
  }

  async recalcular(id: string) {
    const ficha = await this.prisma.fichaTecnica.findUnique({
      where: { id },
      include: {
        itens: {
          select: { quant: true, valorIndividual: true },
        },
      },
    });

    if (!ficha) {
      throw new NotFoundException('Ficha técnica não encontrada');
    }

    const custoInsumosTotal = ficha.itens.reduce((acc, item) => acc + Number(item.quant) * Number(item.valorIndividual), 0);
    const custosVariaveisTotais = Number((custoInsumosTotal * 0.1).toFixed(2));

    await this.prisma.fichaTecnica.update({
      where: { id },
      data: {
        custoInsumosTotal,
        custosVariaveisTotais,
      },
    });

    return this.get(id);
  }

  private async ensureFichaExists(id: string) {
    const exists = await this.prisma.fichaTecnica.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Ficha técnica não encontrada');
    }
  }
}
