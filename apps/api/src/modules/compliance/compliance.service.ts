import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ComplianceAlertInput,
  ComplianceIncidentInput,
  ComplianceMonitoringInput,
  CompliancePolicyInput,
  ComplianceReportInput,
  ComplianceRiskAssessmentInput,
  ComplianceScenarioInput,
  ComplianceTrainingInput,
  ComplianceWorkflowInput,
} from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(empresaId: string) {
    const [monitoramentos, alertas, riscos, incidentes, treinamentos] = await Promise.all([
      this.prisma.complianceMonitoring.count({ where: { empresaId, status: 'ativo' } }),
      this.prisma.complianceAlert.count({ where: { empresaId, status: 'pendente' } }),
      this.prisma.complianceRiskAssessment.findMany({
        where: { empresaId },
        select: { score: true },
      }),
      this.prisma.complianceIncident.count({ where: { empresaId, status: 'aberto' } }),
      this.prisma.complianceTraining.count({ where: { empresaId, status: 'pendente' } }),
    ]);

    const riscoMedio =
      riscos.length > 0
        ? Number(
            (
              riscos.reduce((acc, item) => acc + item.score.toNumber(), 0) /
              riscos.length
            ).toFixed(2),
          )
        : 0;

    return {
      monitoramentosAtivos: monitoramentos,
      alertasPendentes: alertas,
      riscoMedio,
      incidentesAbertos: incidentes,
      treinamentosPendentes: treinamentos,
    };
  }

  async listMonitoramentos(empresaId: string) {
    const registros = await this.prisma.complianceMonitoring.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
    return registros.map((registro) => toPlain(registro));
  }

  async createMonitoramento(empresaId: string, payload: ComplianceMonitoringInput) {
    const registro = await this.prisma.complianceMonitoring.create({
      data: {
        empresaId,
        titulo: payload.titulo,
        modulo: payload.modulo,
        categoria: payload.categoria,
        descricao: payload.descricao,
        status: payload.status,
        severidade: payload.severidade,
        detectedAt: payload.detectedAt ? new Date(payload.detectedAt) : undefined,
      },
    });

    return toPlain(registro);
  }

  async updateMonitoramento(
    empresaId: string,
    id: string,
    payload: Partial<ComplianceMonitoringInput>,
  ) {
    await this.ensureMonitoramento(empresaId, id);

    const registro = await this.prisma.complianceMonitoring.update({
      where: { id },
      data: {
        titulo: payload.titulo,
        modulo: payload.modulo,
        categoria: payload.categoria,
        descricao: payload.descricao,
        status: payload.status,
        severidade: payload.severidade,
        detectedAt: payload.detectedAt ? new Date(payload.detectedAt) : undefined,
        resolvedAt:
          payload.status && payload.status.toLowerCase() === 'resolvido'
            ? new Date()
            : undefined,
      },
    });

    return toPlain(registro);
  }

  async listAlertas(empresaId: string) {
    const alertas = await this.prisma.complianceAlert.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
    });
    return alertas.map((alerta) => toPlain(alerta));
  }

  async createAlerta(empresaId: string, payload: ComplianceAlertInput) {
    if (payload.monitoringId) {
      await this.ensureMonitoramento(empresaId, payload.monitoringId);
    }

    const alerta = await this.prisma.complianceAlert.create({
      data: {
        empresaId,
        monitoringId: payload.monitoringId,
        canal: payload.canal,
        destinatarios: payload.destinatarios,
        mensagem: payload.mensagem,
        status: payload.status,
      },
    });

    return toPlain(alerta);
  }

  async acknowledgeAlert(empresaId: string, id: string, status: string) {
    await this.ensureAlerta(empresaId, id);
    const alerta = await this.prisma.complianceAlert.update({
      where: { id },
      data: {
        status,
        acknowledgedAt: new Date(),
      },
    });

    return toPlain(alerta);
  }

  async listRiscos(empresaId: string) {
    const riscos = await this.prisma.complianceRiskAssessment.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return riscos.map((risco) => toPlain(risco));
  }

  async createRisco(empresaId: string, payload: ComplianceRiskAssessmentInput) {
    if (payload.monitoringId) {
      await this.ensureMonitoramento(empresaId, payload.monitoringId);
    }

    const risco = await this.prisma.complianceRiskAssessment.create({
      data: {
        empresaId,
        monitoringId: payload.monitoringId,
        modulo: payload.modulo,
        risco: payload.risco,
        score: new Prisma.Decimal(payload.score),
        probabilidade: new Prisma.Decimal(payload.probabilidade),
        impacto: new Prisma.Decimal(payload.impacto),
        status: payload.status,
        recomendacoes: payload.recomendacoes,
      },
    });

    return toPlain(risco);
  }

  async listRelatorios(empresaId: string) {
    const relatorios = await this.prisma.complianceReport.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return relatorios.map((relatorio) => toPlain(relatorio));
  }

  async createRelatorio(empresaId: string, payload: ComplianceReportInput) {
    const relatorio = await this.prisma.complianceReport.create({
      data: {
        empresaId,
        tipo: payload.tipo,
        periodoInicio: new Date(payload.periodoInicio),
        periodoFim: new Date(payload.periodoFim),
        formato: payload.formato,
        status: payload.status,
        destino: payload.destino,
        arquivoUrl: payload.arquivoUrl,
        geradoEm: payload.geradoEm ? new Date(payload.geradoEm) : undefined,
      },
    });

    return toPlain(relatorio);
  }

  async updateRelatorio(
    empresaId: string,
    id: string,
    payload: Partial<ComplianceReportInput>,
  ) {
    await this.ensureRelatorio(empresaId, id);
    const relatorio = await this.prisma.complianceReport.update({
      where: { id },
      data: {
        status: payload.status,
        arquivoUrl: payload.arquivoUrl,
        geradoEm: payload.geradoEm ? new Date(payload.geradoEm) : undefined,
      },
    });

    return toPlain(relatorio);
  }

  async listAuditoria(empresaId: string) {
    const logs = await this.prisma.complianceAuditLog.findMany({
      where: { empresaId },
      orderBy: { occurredAt: 'desc' },
      take: 200,
    });
    return logs.map((log) => toPlain(log));
  }

  async createAuditoria(
    empresaId: string,
    payload: { usuario: string; acao: string; entidade: string; detalhes?: unknown },
  ) {
    const log = await this.prisma.complianceAuditLog.create({
      data: {
        empresaId,
        usuario: payload.usuario,
        acao: payload.acao,
        entidade: payload.entidade,
        detalhes: payload.detalhes as Prisma.JsonValue | undefined,
      },
    });

    return toPlain(log);
  }

  async listWorkflows(empresaId: string) {
    const workflows = await this.prisma.complianceWorkflow.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return workflows.map((workflow) => toPlain(workflow));
  }

  async createWorkflow(empresaId: string, payload: ComplianceWorkflowInput) {
    const workflow = await this.prisma.complianceWorkflow.create({
      data: {
        empresaId,
        nome: payload.nome,
        tipo: payload.tipo,
        descricao: payload.descricao,
        etapas: payload.etapas as Prisma.JsonArray,
        status: payload.status,
        requerMfa: payload.requerMfa ?? false,
      },
    });

    return toPlain(workflow);
  }

  async updateWorkflow(
    empresaId: string,
    id: string,
    payload: Partial<ComplianceWorkflowInput>,
  ) {
    await this.ensureWorkflow(empresaId, id);

    const workflow = await this.prisma.complianceWorkflow.update({
      where: { id },
      data: {
        nome: payload.nome,
        tipo: payload.tipo,
        descricao: payload.descricao,
        etapas: payload.etapas as Prisma.JsonArray | undefined,
        status: payload.status,
        requerMfa: payload.requerMfa,
      },
    });

    return toPlain(workflow);
  }

  async listPoliticas(empresaId: string) {
    const politicas = await this.prisma.compliancePolicy.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return politicas.map((politica) => toPlain(politica));
  }

  async createPolitica(empresaId: string, payload: CompliancePolicyInput) {
    const politica = await this.prisma.compliancePolicy.create({
      data: {
        empresaId,
        titulo: payload.titulo,
        categoria: payload.categoria,
        versao: payload.versao,
        vigenteDesde: new Date(payload.vigenteDesde),
        vigenteAte: payload.vigenteAte ? new Date(payload.vigenteAte) : undefined,
        urlDocumento: payload.urlDocumento,
        obrigatoria: payload.obrigatoria ?? false,
        status: payload.status,
      },
    });

    return toPlain(politica);
  }

  async updatePolitica(
    empresaId: string,
    id: string,
    payload: Partial<CompliancePolicyInput>,
  ) {
    await this.ensurePolitica(empresaId, id);
    const politica = await this.prisma.compliancePolicy.update({
      where: { id },
      data: {
        titulo: payload.titulo,
        categoria: payload.categoria,
        versao: payload.versao,
        vigenteDesde: payload.vigenteDesde ? new Date(payload.vigenteDesde) : undefined,
        vigenteAte: payload.vigenteAte ? new Date(payload.vigenteAte) : undefined,
        urlDocumento: payload.urlDocumento,
        obrigatoria: payload.obrigatoria,
        status: payload.status,
      },
    });

    return toPlain(politica);
  }

  async listTreinamentos(empresaId: string) {
    const treinamentos = await this.prisma.complianceTraining.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return treinamentos.map((treinamento) => toPlain(treinamento));
  }

  async createTreinamento(empresaId: string, payload: ComplianceTrainingInput) {
    const treinamento = await this.prisma.complianceTraining.create({
      data: {
        empresaId,
        curso: payload.curso,
        categoria: payload.categoria,
        cargaHoraria: new Prisma.Decimal(payload.cargaHoraria),
        responsavel: payload.responsavel,
        prazoConclusao: new Date(payload.prazoConclusao),
        status: payload.status,
        certificadosUrl: payload.certificadosUrl,
      },
    });

    return toPlain(treinamento);
  }

  async updateTreinamento(
    empresaId: string,
    id: string,
    payload: Partial<ComplianceTrainingInput>,
  ) {
    await this.ensureTreinamento(empresaId, id);
    const treinamento = await this.prisma.complianceTraining.update({
      where: { id },
      data: {
        curso: payload.curso,
        categoria: payload.categoria,
        cargaHoraria: payload.cargaHoraria
          ? new Prisma.Decimal(payload.cargaHoraria)
          : undefined,
        responsavel: payload.responsavel,
        prazoConclusao: payload.prazoConclusao ? new Date(payload.prazoConclusao) : undefined,
        status: payload.status,
        certificadosUrl: payload.certificadosUrl,
      },
    });

    return toPlain(treinamento);
  }

  async listIncidentes(empresaId: string) {
    const incidentes = await this.prisma.complianceIncident.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return incidentes.map((incidente) => toPlain(incidente));
  }

  async createIncidente(empresaId: string, payload: ComplianceIncidentInput) {
    const incidente = await this.prisma.complianceIncident.create({
      data: {
        empresaId,
        titulo: payload.titulo,
        categoria: payload.categoria,
        descricao: payload.descricao,
        status: payload.status,
        severidade: payload.severidade,
        impacto: payload.impacto,
        responsavel: payload.responsavel,
        acaoCorretiva: payload.acaoCorretiva,
        detectedAt: payload.detectedAt ? new Date(payload.detectedAt) : undefined,
        resolvedAt: payload.resolvedAt ? new Date(payload.resolvedAt) : undefined,
      },
    });

    return toPlain(incidente);
  }

  async updateIncidente(
    empresaId: string,
    id: string,
    payload: Partial<ComplianceIncidentInput>,
  ) {
    await this.ensureIncidente(empresaId, id);
    const incidente = await this.prisma.complianceIncident.update({
      where: { id },
      data: {
        titulo: payload.titulo,
        categoria: payload.categoria,
        descricao: payload.descricao,
        status: payload.status,
        severidade: payload.severidade,
        impacto: payload.impacto,
        responsavel: payload.responsavel,
        acaoCorretiva: payload.acaoCorretiva,
        detectedAt: payload.detectedAt ? new Date(payload.detectedAt) : undefined,
        resolvedAt: payload.resolvedAt ? new Date(payload.resolvedAt) : undefined,
      },
    });

    return toPlain(incidente);
  }

  async listCenarios(empresaId: string) {
    const cenarios = await this.prisma.complianceScenario.findMany({
      where: { empresaId },
      orderBy: { criadoEm: 'desc' },
    });
    return cenarios.map((cenario) => toPlain(cenario));
  }

  async createCenario(empresaId: string, payload: ComplianceScenarioInput) {
    const cenario = await this.prisma.complianceScenario.create({
      data: {
        empresaId,
        titulo: payload.titulo,
        regulacaoAlvo: payload.regulacaoAlvo,
        descricao: payload.descricao,
        impactoPrevisto: new Prisma.Decimal(payload.impactoPrevisto),
        recomendacoes: payload.recomendacoes,
        status: payload.status,
      },
    });

    return toPlain(cenario);
  }

  async updateCenario(
    empresaId: string,
    id: string,
    payload: Partial<ComplianceScenarioInput>,
  ) {
    await this.ensureCenario(empresaId, id);
    const cenario = await this.prisma.complianceScenario.update({
      where: { id },
      data: {
        titulo: payload.titulo,
        regulacaoAlvo: payload.regulacaoAlvo,
        descricao: payload.descricao,
        impactoPrevisto: payload.impactoPrevisto
          ? new Prisma.Decimal(payload.impactoPrevisto)
          : undefined,
        recomendacoes: payload.recomendacoes,
        status: payload.status,
      },
    });

    return toPlain(cenario);
  }

  private async ensureMonitoramento(empresaId: string, id: string) {
    const exists = await this.prisma.complianceMonitoring.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Monitoramento não encontrado');
    }
  }

  private async ensureAlerta(empresaId: string, id: string) {
    const exists = await this.prisma.complianceAlert.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Alerta não encontrado');
    }
  }

  private async ensureRelatorio(empresaId: string, id: string) {
    const exists = await this.prisma.complianceReport.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Relatório não encontrado');
    }
  }

  private async ensureWorkflow(empresaId: string, id: string) {
    const exists = await this.prisma.complianceWorkflow.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Workflow não encontrado');
    }
  }

  private async ensurePolitica(empresaId: string, id: string) {
    const exists = await this.prisma.compliancePolicy.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Política não encontrada');
    }
  }

  private async ensureTreinamento(empresaId: string, id: string) {
    const exists = await this.prisma.complianceTraining.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Treinamento não encontrado');
    }
  }

  private async ensureIncidente(empresaId: string, id: string) {
    const exists = await this.prisma.complianceIncident.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Incidente não encontrado');
    }
  }

  private async ensureCenario(empresaId: string, id: string) {
    const exists = await this.prisma.complianceScenario.findFirst({
      where: { id, empresaId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Cenário não encontrado');
    }
  }
}
