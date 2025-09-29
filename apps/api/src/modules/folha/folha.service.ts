import { Injectable, NotFoundException } from '@nestjs/common';
import { EncargosSchema, ColaboradorSchema } from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { PrismaService } from '../../prisma/prisma.service';

type EncargosDto = z.infer<typeof EncargosSchema>;
type ColaboradorDto = z.infer<typeof ColaboradorSchema>;

const ENCARGOS_SINGLETON_ID = 'singleton';

const DEFAULT_ENCARGOS: EncargosDto = {
  trabFerias30Perc: 8.33,
  trab13Perc: 8.33,
  trab13FeriasPerc: 2.78,
  socInssPerc: 7.5,
  socSatPerc: 1,
  socSalEducPerc: 2.5,
  socIncraSestSebraeSenatPerc: 3,
  socFgtsPerc: 8,
  socFgtsRescisaoPerc: 3.2,
};

@Injectable()
export class FolhaService {
  constructor(private readonly prisma: PrismaService) {}

  async getEncargos() {
    const existente = await this.prisma.encargos.findUnique({ where: { id: ENCARGOS_SINGLETON_ID } });
    if (existente) {
      return this.toEncargosDto(existente);
    }

    const created = await this.prisma.encargos.create({
      data: { id: ENCARGOS_SINGLETON_ID, ...this.mapEncargos(DEFAULT_ENCARGOS) },
    });
    return this.toEncargosDto(created);
  }

  async updateEncargos(payload: EncargosDto) {
    const atualizado = await this.prisma.encargos.upsert({
      where: { id: ENCARGOS_SINGLETON_ID },
      update: this.mapEncargos(payload),
      create: { id: ENCARGOS_SINGLETON_ID, ...this.mapEncargos(payload) },
    });
    return this.toEncargosDto(atualizado);
  }

  async listColaboradores() {
    const colaboradores = await this.prisma.colaborador.findMany({
      orderBy: { nome: 'asc' },
    });
    return colaboradores.map((colaborador) => this.toColaboradorDto(colaborador));
  }

  async createColaborador(payload: ColaboradorDto) {
    const valorHora = this.calcularValorHora(payload);
    const colaborador = await this.prisma.colaborador.create({
      data: this.mapColaborador({ ...payload, valorHora }),
    });
    return this.toColaboradorDto(colaborador);
  }

  async updateColaborador(id: string, payload: Partial<ColaboradorDto>) {
    const existente = await this.prisma.colaborador.findUnique({ where: { id } });
    if (!existente) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    const atual = this.toColaboradorDto(existente);
    const { id: _omit, ...semId } = { ...atual, ...payload } as ColaboradorDto & { id: string };
    void _omit;
    const base = semId as ColaboradorDto;
    const valorHora = this.calcularValorHora(base);

    try {
      const atualizado = await this.prisma.colaborador.update({
        where: { id },
        data: this.mapColaborador({ ...base, valorHora }),
      });
      return this.toColaboradorDto(atualizado);
    } catch (error) {
      this.handleNotFound(error, 'Colaborador não encontrado');
      throw error;
    }
  }

  async deleteColaborador(id: string) {
    try {
      await this.prisma.colaborador.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      this.handleNotFound(error, 'Colaborador não encontrado');
      throw error;
    }
  }

  private toEncargosDto(model: Prisma.Encargos): EncargosDto {
    return {
      trabFerias30Perc: this.roundDecimal(model.trabFerias30Perc),
      trab13Perc: this.roundDecimal(model.trab13Perc),
      trab13FeriasPerc: this.roundDecimal(model.trab13FeriasPerc),
      socInssPerc: this.roundDecimal(model.socInssPerc),
      socSatPerc: this.roundDecimal(model.socSatPerc),
      socSalEducPerc: this.roundDecimal(model.socSalEducPerc),
      socIncraSestSebraeSenatPerc: this.roundDecimal(model.socIncraSestSebraeSenatPerc),
      socFgtsPerc: this.roundDecimal(model.socFgtsPerc),
      socFgtsRescisaoPerc: this.roundDecimal(model.socFgtsRescisaoPerc),
    };
  }

  private mapEncargos(payload: EncargosDto) {
    return Object.entries(payload).reduce<Record<string, Prisma.Decimal>>((acc, [key, value]) => {
      acc[key] = new Prisma.Decimal(value);
      return acc;
    }, {});
  }

  private toColaboradorDto(model: Prisma.Colaborador): (ColaboradorDto & { id: string }) {
    return {
      id: model.id,
      codigo: model.codigo,
      nome: model.nome,
      salario: Number(model.salario),
      setor: model.setor,
      cargo: model.cargo,
      dataContratacao: model.dataContratacao.toISOString(),
      encSociaisPerc: Number(model.encSociaisPerc),
      encTrabPerc: Number(model.encTrabPerc),
      valeTransporte: Number(model.valeTransporte),
      valeRefeicao: Number(model.valeRefeicao),
      convenioMedico: Number(model.convenioMedico),
      cargaHorariaMensal: Number(model.cargaHorariaMensal),
      valorHora: this.roundDecimal(model.valorHora, 2),
    };
  }

  private mapColaborador(payload: ColaboradorDto) {
    return {
      codigo: payload.codigo,
      nome: payload.nome,
      salario: new Prisma.Decimal(payload.salario),
      setor: payload.setor,
      cargo: payload.cargo,
      dataContratacao: new Date(payload.dataContratacao),
      encSociaisPerc: new Prisma.Decimal(payload.encSociaisPerc),
      encTrabPerc: new Prisma.Decimal(payload.encTrabPerc),
      valeTransporte: new Prisma.Decimal(payload.valeTransporte),
      valeRefeicao: new Prisma.Decimal(payload.valeRefeicao),
      convenioMedico: new Prisma.Decimal(payload.convenioMedico),
      cargaHorariaMensal: new Prisma.Decimal(payload.cargaHorariaMensal),
      valorHora: new Prisma.Decimal(payload.valorHora),
    };
  }

  private calcularValorHora(colaborador: ColaboradorDto) {
    const encargosPercentuais = colaborador.encSociaisPerc + colaborador.encTrabPerc;
    const beneficios = colaborador.valeTransporte + colaborador.valeRefeicao + colaborador.convenioMedico;
    const salarioComEncargos = colaborador.salario * (1 + encargosPercentuais / 100);
    const custoTotal = salarioComEncargos + beneficios;
    if (!colaborador.cargaHorariaMensal) {
      return 0;
    }
    return Number((custoTotal / colaborador.cargaHorariaMensal).toFixed(2));
  }

  private handleNotFound(error: unknown, message: string) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new NotFoundException(message);
    }
  }

  private roundDecimal(value: Prisma.Decimal | number, digits = 4) {
    return Number(Number(value).toFixed(digits));
  }
}
