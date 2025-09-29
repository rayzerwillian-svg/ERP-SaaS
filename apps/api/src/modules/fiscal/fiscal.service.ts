import { Injectable } from '@nestjs/common';
import {
  FiscalEmissionSchema,
  FiscalNfseConfigInput,
  FiscalNfseConfigSchema,
  FiscalSpedSchema,
  FiscalXmlSchema,
} from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DomainEvents, EventBusService } from '../../events';

type XmlDto = z.infer<typeof FiscalXmlSchema>;
type EmissionDto = z.infer<typeof FiscalEmissionSchema>;
type SpedDto = z.infer<typeof FiscalSpedSchema>;
type NfseDto = z.infer<typeof FiscalNfseConfigSchema>;

@Injectable()
export class FiscalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventBusService,
  ) {}

  async listXml() {
    const documentos = await this.prisma.fiscalXmlDocument.findMany({
      orderBy: { dataEmissao: 'desc' },
      include: { eventos: { orderBy: { createdAt: 'desc' } } },
      take: 200,
    });

    return documentos.map((documento) => this.mapXml(documento));
  }

  async addXml(payload: XmlDto) {
    const dataEmissao = new Date(payload.data);
    const chave = this.buildChave(payload);

    const documento = await this.prisma.$transaction(async (tx) => {
      const upserted = await tx.fiscalXmlDocument.upsert({
        where: { chave },
        update: {
          cnpj: payload.cnpj,
          modelo: payload.modelo,
          serie: payload.serie,
          numero: payload.numero,
          dataEmissao,
          storageUrl: payload.storageUrl,
        },
        create: {
          chave,
          cnpj: payload.cnpj,
          modelo: payload.modelo,
          serie: payload.serie,
          numero: payload.numero,
          dataEmissao,
          storageUrl: payload.storageUrl,
        },
      });

      const evento = await tx.fiscalXmlEvent.create({
        data: {
          documentId: upserted.id,
          tipo: DomainEvents.FISCAL_XML_RECEBIDO,
        },
      });

      const documentWithEvents = await tx.fiscalXmlDocument.findUniqueOrThrow({
        where: { id: upserted.id },
        include: { eventos: { orderBy: { createdAt: 'desc' } } },
      });

      return { documentWithEvents, eventoId: evento.id };
    });

    await this.events.publish(DomainEvents.FISCAL_XML_RECEBIDO, {
      documentId: documento.documentWithEvents.id,
      chave,
      eventoId: documento.eventoId,
      cnpj: payload.cnpj,
      modelo: payload.modelo,
      serie: payload.serie,
      numero: payload.numero,
      data: payload.data,
    });

    return this.mapXml(documento.documentWithEvents);
  }

  async emitirDocumento(payload: EmissionDto) {
    const protocolo = randomUUID();
    const emissao = await this.prisma.fiscalEmissionRequest.create({
      data: {
        tipo: payload.tipo,
        provider: payload.provider,
        destinatario: payload.destinatario,
        valor: new Prisma.Decimal(payload.valor),
        status: 'enviado',
        protocolo,
        payload: payload.dados ?? null,
      },
    });

    return {
      id: emissao.id,
      protocolo: emissao.protocolo,
      status: emissao.status,
      tipo: emissao.tipo,
      provider: emissao.provider,
      createdAt: emissao.createdAt.toISOString(),
    };
  }

  async gerarSped(payload: SpedDto) {
    const arquivo = `sped-${payload.tipo}-${payload.periodo}.txt`;
    const job = await this.prisma.fiscalSpedJob.create({
      data: {
        periodo: payload.periodo,
        tipo: payload.tipo,
        status: 'gerado',
        arquivo,
      },
    });

    return {
      id: job.id,
      periodo: job.periodo,
      tipo: job.tipo,
      status: job.status,
      arquivo: job.arquivo,
      createdAt: job.createdAt.toISOString(),
    };
  }

  async getNfseConfig() {
    const config = await this.prisma.fiscalNfseConfig.findFirst({ orderBy: { updatedAt: 'desc' } });

    if (!config) {
      return {
        ambiente: 'homologacao' as const,
        municipio: '',
        perfil: 'provisorio' as const,
        provider: 'edicom' as const,
        usuario: undefined,
        senha: undefined,
        certificado: undefined,
      } satisfies Partial<FiscalNfseConfigInput>;
    }

    return {
      ambiente: config.ambiente as FiscalNfseConfigInput['ambiente'],
      municipio: config.municipio,
      perfil: config.perfil as FiscalNfseConfigInput['perfil'],
      provider: config.provider as FiscalNfseConfigInput['provider'],
      usuario: config.usuario ?? undefined,
      senha: config.senha ?? undefined,
      certificado: config.certificado ?? undefined,
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  async updateNfseConfig(payload: NfseDto) {
    const existing = await this.prisma.fiscalNfseConfig.findFirst();

    if (existing) {
      await this.prisma.fiscalNfseConfig.update({
        where: { id: existing.id },
        data: {
          ambiente: payload.ambiente,
          municipio: payload.municipio,
          perfil: payload.perfil,
          provider: payload.provider,
          usuario: payload.usuario,
          senha: payload.senha,
          certificado: payload.certificado,
        },
      });
    } else {
      await this.prisma.fiscalNfseConfig.create({
        data: {
          ambiente: payload.ambiente,
          municipio: payload.municipio,
          perfil: payload.perfil,
          provider: payload.provider,
          usuario: payload.usuario,
          senha: payload.senha,
          certificado: payload.certificado,
        },
      });
    }

    return this.getNfseConfig();
  }

  private buildChave(payload: XmlDto) {
    return `${payload.cnpj}-${payload.modelo}-${payload.serie}-${payload.numero}-${payload.data}`;
  }

  private mapXml(
    documento: Prisma.FiscalXmlDocumentGetPayload<{
      include: { eventos: true };
    }>,
  ) {
    return {
      id: documento.id,
      chave: documento.chave,
      cnpj: documento.cnpj,
      modelo: documento.modelo,
      serie: documento.serie,
      numero: documento.numero,
      data: documento.dataEmissao.toISOString(),
      storageUrl: documento.storageUrl,
      manifestado: documento.manifestado,
      createdAt: documento.createdAt.toISOString(),
      updatedAt: documento.updatedAt.toISOString(),
      eventos: documento.eventos
        .map((evento) => ({
          id: evento.id,
          tipo: evento.tipo,
          createdAt: evento.createdAt.toISOString(),
          payload: evento.payload ?? null,
        })),
    };
  }
}
