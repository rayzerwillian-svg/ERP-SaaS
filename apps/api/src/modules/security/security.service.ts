import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  SecurityIncidentInput,
  SecurityIncidentUpdateInput,
  SecuritySettingsUpdateInput,
  SecurityTrainingInput,
  SecurityTrainingUpdateInput,
} from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(empresaId: string) {
    const settings = await this.ensureSettings(empresaId);
    return toPlain(settings);
  }

  async updateSettings(empresaId: string, actor: string, payload: SecuritySettingsUpdateInput) {
    const settings = await this.ensureSettings(empresaId);

    if (Object.keys(payload).length === 0) {
      return toPlain(settings);
    }

    const data: Prisma.SecuritySettingsUpdateInput = {};

    if (payload.requireMfa !== undefined) data.requireMfa = payload.requireMfa;
    if (payload.allowedFactors !== undefined) data.allowedFactors = payload.allowedFactors;
    if (payload.passwordMinLength !== undefined) data.passwordMinLength = payload.passwordMinLength;
    if (payload.passwordRequireUppercase !== undefined)
      data.passwordRequireUppercase = payload.passwordRequireUppercase;
    if (payload.passwordRequireNumber !== undefined)
      data.passwordRequireNumber = payload.passwordRequireNumber;
    if (payload.passwordRequireSymbol !== undefined)
      data.passwordRequireSymbol = payload.passwordRequireSymbol;
    if (payload.passwordRotationDays !== undefined)
      data.passwordRotationDays = payload.passwordRotationDays;
    if (payload.sessionTimeoutMinutes !== undefined)
      data.sessionTimeoutMinutes = payload.sessionTimeoutMinutes;
    if (payload.sessionMaxDevices !== undefined) data.sessionMaxDevices = payload.sessionMaxDevices;
    if (payload.ssoEnabled !== undefined) data.ssoEnabled = payload.ssoEnabled;
    if (payload.ssoProvider !== undefined) data.ssoProvider = payload.ssoProvider ?? null;
    if (payload.encryptionAtRest !== undefined) data.encryptionAtRest = payload.encryptionAtRest;
    if (payload.encryptionInTransit !== undefined) data.encryptionInTransit = payload.encryptionInTransit;
    if (payload.encryptionInUse !== undefined) data.encryptionInUse = payload.encryptionInUse;
    if (payload.keyRotationDays !== undefined) data.keyRotationDays = payload.keyRotationDays;
    if (payload.dataClassificationMatrix !== undefined)
      data.dataClassificationMatrix = payload.dataClassificationMatrix ?? null;
    if (payload.dataMaskingPolicies !== undefined)
      data.dataMaskingPolicies = payload.dataMaskingPolicies ?? null;
    if (payload.logRetentionDays !== undefined) data.logRetentionDays = payload.logRetentionDays;
    if (payload.anomalyDetectionEnabled !== undefined)
      data.anomalyDetectionEnabled = payload.anomalyDetectionEnabled;
    if (payload.wafEnabled !== undefined) data.wafEnabled = payload.wafEnabled;
    if (payload.vulnerabilityScanSchedule !== undefined)
      data.vulnerabilityScanSchedule = payload.vulnerabilityScanSchedule ?? null;
    if (payload.complianceContact !== undefined) data.complianceContact = payload.complianceContact ?? null;
    if (payload.backupFrequencyHours !== undefined) data.backupFrequencyHours = payload.backupFrequencyHours;
    if (payload.zeroTrustEnabled !== undefined) data.zeroTrustEnabled = payload.zeroTrustEnabled;
    if (payload.apiRateLimitPerMinute !== undefined)
      data.apiRateLimitPerMinute = payload.apiRateLimitPerMinute;
    if (payload.apiTokenRotationDays !== undefined)
      data.apiTokenRotationDays = payload.apiTokenRotationDays;

    const updated = await this.prisma.securitySettings.update({
      where: { id: settings.id },
      data,
    });

    await this.logAction(empresaId, actor, 'security.settings.updated', {
      fields: Object.keys(payload),
    });

    return toPlain(updated);
  }

  async listIncidents(empresaId: string) {
    const incidentes = await this.prisma.securityIncident.findMany({
      where: { empresaId },
      orderBy: { detectedAt: 'desc' },
    });
    return incidentes.map((incident) => toPlain(incident));
  }

  async createIncident(empresaId: string, actor: string, payload: SecurityIncidentInput) {
    const incident = await this.prisma.securityIncident.create({
      data: {
        empresaId,
        titulo: payload.titulo,
        severidade: payload.severidade,
        status: payload.status ?? 'aberto',
        descricao: payload.descricao,
        reportedBy: payload.reportedBy,
        detectedAt: payload.detectedAt ? new Date(payload.detectedAt) : new Date(),
        resolvedAt: payload.resolvedAt ? new Date(payload.resolvedAt) : undefined,
        planoAcao: payload.planoAcao,
      },
    });

    await this.logAction(empresaId, actor, 'security.incident.created', {
      id: incident.id,
      titulo: incident.titulo,
      severidade: incident.severidade,
    });

    return toPlain(incident);
  }

  async updateIncident(
    empresaId: string,
    actor: string,
    id: string,
    payload: SecurityIncidentUpdateInput,
  ) {
    await this.ensureIncident(empresaId, id);

    const incident = await this.prisma.securityIncident.update({
      where: { id },
      data: {
        status: payload.status,
        resolvedAt: payload.resolvedAt ? new Date(payload.resolvedAt) : undefined,
        planoAcao: payload.planoAcao,
        descricao: payload.descricao,
      },
    });

    await this.logAction(empresaId, actor, 'security.incident.updated', {
      id,
      status: payload.status,
    });

    return toPlain(incident);
  }

  async listTrainings(empresaId: string) {
    const treinamentos = await this.prisma.securityTraining.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
    return treinamentos.map((treinamento) => toPlain(treinamento));
  }

  async createTraining(empresaId: string, actor: string, payload: SecurityTrainingInput) {
    const treinamento = await this.prisma.securityTraining.create({
      data: {
        empresaId,
        titulo: payload.titulo,
        publicoAlvo: payload.publicoAlvo,
        descricao: payload.descricao,
        cargaHoraria: payload.cargaHoraria,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
        completionRate:
          payload.completionRate !== undefined ? new Prisma.Decimal(payload.completionRate) : undefined,
        participantes: payload.participantes ?? 0,
        responsavel: payload.responsavel,
        recursos: payload.recursos,
        status: payload.status,
      },
    });

    await this.logAction(empresaId, actor, 'security.training.created', {
      id: treinamento.id,
      titulo: treinamento.titulo,
    });

    return toPlain(treinamento);
  }

  async updateTraining(
    empresaId: string,
    actor: string,
    id: string,
    payload: SecurityTrainingUpdateInput,
  ) {
    await this.ensureTraining(empresaId, id);

    const data: Prisma.SecurityTrainingUpdateInput = {};

    if (payload.titulo !== undefined) data.titulo = payload.titulo;
    if (payload.publicoAlvo !== undefined) data.publicoAlvo = payload.publicoAlvo;
    if (payload.descricao !== undefined) data.descricao = payload.descricao;
    if (payload.cargaHoraria !== undefined) data.cargaHoraria = payload.cargaHoraria;
    if (payload.dueDate !== undefined) data.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    if (payload.completionRate !== undefined)
      data.completionRate = payload.completionRate !== undefined ? new Prisma.Decimal(payload.completionRate) : null;
    if (payload.participantes !== undefined) data.participantes = payload.participantes;
    if (payload.responsavel !== undefined) data.responsavel = payload.responsavel;
    if (payload.recursos !== undefined) data.recursos = payload.recursos;
    if (payload.status !== undefined) data.status = payload.status;

    const treinamento = await this.prisma.securityTraining.update({
      where: { id },
      data,
    });

    await this.logAction(empresaId, actor, 'security.training.updated', {
      id,
      status: payload.status,
    });

    return toPlain(treinamento);
  }

  async listLogs(empresaId: string) {
    const logs = await this.prisma.securityAuditLog.findMany({
      where: { empresaId },
      orderBy: { recordedAt: 'desc' },
      take: 100,
    });

    return logs.map((log) => toPlain(log));
  }

  private async ensureSettings(empresaId: string) {
    let settings = await this.prisma.securitySettings.findUnique({ where: { empresaId } });
    if (!settings) {
      settings = await this.prisma.securitySettings.create({
        data: { empresaId },
      });
    }
    return settings;
  }

  private async ensureIncident(empresaId: string, id: string) {
    const incident = await this.prisma.securityIncident.findUnique({
      where: { id },
    });

    if (!incident || incident.empresaId !== empresaId) {
      throw new NotFoundException('Incidente não encontrado');
    }

    return incident;
  }

  private async ensureTraining(empresaId: string, id: string) {
    const treinamento = await this.prisma.securityTraining.findUnique({
      where: { id },
    });

    if (!treinamento || treinamento.empresaId !== empresaId) {
      throw new NotFoundException('Treinamento não encontrado');
    }

    return treinamento;
  }

  private async logAction(
    empresaId: string,
    actor: string,
    acao: string,
    contexto?: Record<string, unknown>,
  ) {
    await this.prisma.securityAuditLog.create({
      data: {
        empresaId,
        actor,
        acao,
        origem: 'api',
        contexto: contexto ? JSON.stringify(contexto) : null,
      },
    });
  }
}
