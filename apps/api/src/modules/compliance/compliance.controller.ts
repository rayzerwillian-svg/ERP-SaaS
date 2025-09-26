import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ComplianceAlertSchema,
  ComplianceIncidentSchema,
  ComplianceMonitoringSchema,
  CompliancePolicySchema,
  ComplianceReportSchema,
  ComplianceRiskAssessmentSchema,
  ComplianceScenarioSchema,
  ComplianceTrainingSchema,
  ComplianceWorkflowSchema,
} from '@erp-saas/db';
import { z } from 'zod';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ComplianceService } from './compliance.service';

const UpdateStatusSchema = z.object({ status: z.string().min(1) });

@Controller('compliance')
@UseGuards(RolesGuard)
@Roles('admin', 'gestor', 'fiscal', 'financeiro')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Get('dashboard')
  async dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.dashboard(user.empresaId);
  }

  @Get('monitoramentos')
  async listMonitoramentos(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listMonitoramentos(user.empresaId);
  }

  @Post('monitoramentos')
  async createMonitoramento(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceMonitoringSchema)) body: z.infer<typeof ComplianceMonitoringSchema>,
  ) {
    return this.compliance.createMonitoramento(user.empresaId, body);
  }

  @Patch('monitoramentos/:id')
  async updateMonitoramento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplianceMonitoringSchema.partial())) body: Partial<
      z.infer<typeof ComplianceMonitoringSchema>
    >,
  ) {
    return this.compliance.updateMonitoramento(user.empresaId, id, body);
  }

  @Get('alertas')
  async listAlertas(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listAlertas(user.empresaId);
  }

  @Post('alertas')
  async createAlerta(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceAlertSchema)) body: z.infer<typeof ComplianceAlertSchema>,
  ) {
    return this.compliance.createAlerta(user.empresaId, body);
  }

  @Patch('alertas/:id')
  async acknowledgeAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateStatusSchema)) body: z.infer<typeof UpdateStatusSchema>,
  ) {
    return this.compliance.acknowledgeAlert(user.empresaId, id, body.status);
  }

  @Get('riscos')
  async listRiscos(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listRiscos(user.empresaId);
  }

  @Post('riscos')
  async createRisco(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceRiskAssessmentSchema)) body: z.infer<
      typeof ComplianceRiskAssessmentSchema
    >,
  ) {
    return this.compliance.createRisco(user.empresaId, body);
  }

  @Get('relatorios')
  async listRelatorios(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listRelatorios(user.empresaId);
  }

  @Post('relatorios')
  async createRelatorio(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceReportSchema)) body: z.infer<typeof ComplianceReportSchema>,
  ) {
    return this.compliance.createRelatorio(user.empresaId, body);
  }

  @Patch('relatorios/:id')
  async updateRelatorio(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplianceReportSchema.partial())) body: Partial<
      z.infer<typeof ComplianceReportSchema>
    >,
  ) {
    return this.compliance.updateRelatorio(user.empresaId, id, body);
  }

  @Get('auditoria/logs')
  async listAuditoria(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listAuditoria(user.empresaId);
  }

  @Post('auditoria/logs')
  async createAuditoria(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(
      z.object({
        usuario: z.string().min(1),
        acao: z.string().min(1),
        entidade: z.string().min(1),
        detalhes: z.any().optional(),
      }),
    ))
    body: { usuario: string; acao: string; entidade: string; detalhes?: unknown },
  ) {
    return this.compliance.createAuditoria(user.empresaId, body);
  }

  @Get('workflows')
  async listWorkflows(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listWorkflows(user.empresaId);
  }

  @Post('workflows')
  async createWorkflow(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceWorkflowSchema)) body: z.infer<typeof ComplianceWorkflowSchema>,
  ) {
    return this.compliance.createWorkflow(user.empresaId, body);
  }

  @Patch('workflows/:id')
  async updateWorkflow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplianceWorkflowSchema.partial())) body: Partial<
      z.infer<typeof ComplianceWorkflowSchema>
    >,
  ) {
    return this.compliance.updateWorkflow(user.empresaId, id, body);
  }

  @Get('politicas')
  async listPoliticas(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listPoliticas(user.empresaId);
  }

  @Post('politicas')
  async createPolitica(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(CompliancePolicySchema)) body: z.infer<typeof CompliancePolicySchema>,
  ) {
    return this.compliance.createPolitica(user.empresaId, body);
  }

  @Patch('politicas/:id')
  async updatePolitica(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CompliancePolicySchema.partial())) body: Partial<
      z.infer<typeof CompliancePolicySchema>
    >,
  ) {
    return this.compliance.updatePolitica(user.empresaId, id, body);
  }

  @Get('treinamentos')
  async listTreinamentos(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listTreinamentos(user.empresaId);
  }

  @Post('treinamentos')
  async createTreinamento(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceTrainingSchema)) body: z.infer<typeof ComplianceTrainingSchema>,
  ) {
    return this.compliance.createTreinamento(user.empresaId, body);
  }

  @Patch('treinamentos/:id')
  async updateTreinamento(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplianceTrainingSchema.partial())) body: Partial<
      z.infer<typeof ComplianceTrainingSchema>
    >,
  ) {
    return this.compliance.updateTreinamento(user.empresaId, id, body);
  }

  @Get('incidentes')
  async listIncidentes(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listIncidentes(user.empresaId);
  }

  @Post('incidentes')
  async createIncidente(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceIncidentSchema)) body: z.infer<typeof ComplianceIncidentSchema>,
  ) {
    return this.compliance.createIncidente(user.empresaId, body);
  }

  @Patch('incidentes/:id')
  async updateIncidente(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplianceIncidentSchema.partial())) body: Partial<
      z.infer<typeof ComplianceIncidentSchema>
    >,
  ) {
    return this.compliance.updateIncidente(user.empresaId, id, body);
  }

  @Get('cenarios')
  async listCenarios(@CurrentUser() user: AuthenticatedUser) {
    return this.compliance.listCenarios(user.empresaId);
  }

  @Post('cenarios')
  async createCenario(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(ComplianceScenarioSchema)) body: z.infer<typeof ComplianceScenarioSchema>,
  ) {
    return this.compliance.createCenario(user.empresaId, body);
  }

  @Patch('cenarios/:id')
  async updateCenario(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ComplianceScenarioSchema.partial())) body: Partial<
      z.infer<typeof ComplianceScenarioSchema>
    >,
  ) {
    return this.compliance.updateCenario(user.empresaId, id, body);
  }
}
