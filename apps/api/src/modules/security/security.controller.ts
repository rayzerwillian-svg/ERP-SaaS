import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  SecurityIncidentSchema,
  SecurityIncidentUpdateSchema,
  SecuritySettingsUpdateSchema,
  SecurityTrainingSchema,
  SecurityTrainingUpdateSchema,
} from '@erp-saas/db';
import type {
  SecurityIncidentInput,
  SecurityIncidentUpdateInput,
  SecuritySettingsUpdateInput,
  SecurityTrainingInput,
  SecurityTrainingUpdateInput,
} from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SecurityService } from './security.service';

@ApiTags('seguranca')
@Controller('seguranca')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Roles('admin', 'gestor')
  @Get('configuracoes')
  async getSettings(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.getSettings(user.empresaId);
  }

  @Roles('admin', 'gestor')
  @Put('configuracoes')
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(SecuritySettingsUpdateSchema)) body: SecuritySettingsUpdateInput,
  ) {
    return this.securityService.updateSettings(user.empresaId, user.nome, body);
  }

  @Roles('admin', 'gestor', 'fiscal')
  @Get('incidentes')
  async listIncidents(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.listIncidents(user.empresaId);
  }

  @Roles('admin', 'gestor')
  @Post('incidentes')
  async createIncident(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(SecurityIncidentSchema)) body: SecurityIncidentInput,
  ) {
    return this.securityService.createIncident(user.empresaId, user.nome, body);
  }

  @Roles('admin', 'gestor')
  @Patch('incidentes/:id')
  async updateIncident(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SecurityIncidentUpdateSchema)) body: SecurityIncidentUpdateInput,
  ) {
    return this.securityService.updateIncident(user.empresaId, user.nome, id, body);
  }

  @Roles('admin', 'gestor', 'fiscal')
  @Get('treinamentos')
  async listTrainings(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.listTrainings(user.empresaId);
  }

  @Roles('admin', 'gestor')
  @Post('treinamentos')
  async createTraining(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(SecurityTrainingSchema)) body: SecurityTrainingInput,
  ) {
    return this.securityService.createTraining(user.empresaId, user.nome, body);
  }

  @Roles('admin', 'gestor')
  @Patch('treinamentos/:id')
  async updateTraining(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SecurityTrainingUpdateSchema)) body: SecurityTrainingUpdateInput,
  ) {
    return this.securityService.updateTraining(user.empresaId, user.nome, id, body);
  }

  @Roles('admin', 'gestor', 'fiscal')
  @Get('logs')
  async listLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.listLogs(user.empresaId);
  }
}
