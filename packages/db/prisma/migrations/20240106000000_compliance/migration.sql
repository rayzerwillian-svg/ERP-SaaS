-- Compliance and Regulatory module
CREATE TABLE "ComplianceMonitoring" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "modulo" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "descricao" TEXT,
  "status" TEXT NOT NULL,
  "severidade" TEXT NOT NULL,
  "detectedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceAlert" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "monitoringId" TEXT,
  "canal" TEXT NOT NULL,
  "destinatarios" TEXT[] NOT NULL,
  "mensagem" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "triggeredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "acknowledgedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceRiskAssessment" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "monitoringId" TEXT,
  "modulo" TEXT NOT NULL,
  "risco" TEXT NOT NULL,
  "score" NUMERIC(5,2) NOT NULL,
  "probabilidade" NUMERIC(5,2) NOT NULL,
  "impacto" NUMERIC(5,2) NOT NULL,
  "status" TEXT NOT NULL,
  "recomendacoes" TEXT,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceReport" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "periodoInicio" TIMESTAMPTZ NOT NULL,
  "periodoFim" TIMESTAMPTZ NOT NULL,
  "formato" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "destino" TEXT[] NOT NULL,
  "arquivoUrl" TEXT,
  "geradoEm" TIMESTAMPTZ,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceAuditLog" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "usuario" TEXT NOT NULL,
  "acao" TEXT NOT NULL,
  "entidade" TEXT NOT NULL,
  "detalhes" JSONB,
  "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceWorkflow" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT,
  "etapas" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "requerMfa" BOOLEAN NOT NULL DEFAULT FALSE,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "CompliancePolicy" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "versao" TEXT NOT NULL,
  "vigenteDesde" TIMESTAMPTZ NOT NULL,
  "vigenteAte" TIMESTAMPTZ,
  "urlDocumento" TEXT,
  "obrigatoria" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceTraining" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "curso" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "cargaHoraria" NUMERIC(6,2) NOT NULL,
  "responsavel" TEXT NOT NULL,
  "prazoConclusao" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL,
  "certificadosUrl" TEXT,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceIncident" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "severidade" TEXT NOT NULL,
  "impacto" TEXT NOT NULL,
  "responsavel" TEXT NOT NULL,
  "acaoCorretiva" TEXT,
  "detectedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "ComplianceScenario" (
  "id" TEXT PRIMARY KEY,
  "empresaId" TEXT NOT NULL,
  "titulo" TEXT NOT NULL,
  "regulacaoAlvo" TEXT NOT NULL,
  "descricao" TEXT,
  "impactoPrevisto" NUMERIC(12,2) NOT NULL,
  "recomendacoes" TEXT,
  "status" TEXT NOT NULL,
  "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "ComplianceMonitoring_empresa_modulo_idx" ON "ComplianceMonitoring"("empresaId", "modulo");
CREATE INDEX "ComplianceMonitoring_empresa_status_idx" ON "ComplianceMonitoring"("empresaId", "status");
CREATE INDEX "ComplianceAlert_empresa_status_idx" ON "ComplianceAlert"("empresaId", "status");
CREATE INDEX "ComplianceAlert_monitoring_idx" ON "ComplianceAlert"("monitoringId");
CREATE INDEX "ComplianceRiskAssessment_empresa_modulo_idx" ON "ComplianceRiskAssessment"("empresaId", "modulo");
CREATE INDEX "ComplianceReport_empresa_tipo_idx" ON "ComplianceReport"("empresaId", "tipo");
CREATE INDEX "ComplianceAuditLog_empresa_entidade_idx" ON "ComplianceAuditLog"("empresaId", "entidade");
CREATE INDEX "ComplianceAuditLog_empresa_occurred_idx" ON "ComplianceAuditLog"("empresaId", "occurredAt");
CREATE INDEX "ComplianceWorkflow_empresa_tipo_idx" ON "ComplianceWorkflow"("empresaId", "tipo");
CREATE INDEX "CompliancePolicy_empresa_categoria_idx" ON "CompliancePolicy"("empresaId", "categoria");
CREATE INDEX "ComplianceTraining_empresa_categoria_idx" ON "ComplianceTraining"("empresaId", "categoria");
CREATE INDEX "ComplianceTraining_empresa_status_idx" ON "ComplianceTraining"("empresaId", "status");
CREATE INDEX "ComplianceIncident_empresa_categoria_idx" ON "ComplianceIncident"("empresaId", "categoria");
CREATE INDEX "ComplianceIncident_empresa_status_idx" ON "ComplianceIncident"("empresaId", "status");
CREATE INDEX "ComplianceScenario_empresa_regulacao_idx" ON "ComplianceScenario"("empresaId", "regulacaoAlvo");

ALTER TABLE "ComplianceMonitoring" ADD CONSTRAINT "ComplianceMonitoring_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceAlert" ADD CONSTRAINT "ComplianceAlert_monitoringId_fkey"
  FOREIGN KEY ("monitoringId") REFERENCES "ComplianceMonitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ComplianceRiskAssessment" ADD CONSTRAINT "ComplianceRiskAssessment_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceRiskAssessment" ADD CONSTRAINT "ComplianceRiskAssessment_monitoringId_fkey"
  FOREIGN KEY ("monitoringId") REFERENCES "ComplianceMonitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ComplianceReport" ADD CONSTRAINT "ComplianceReport_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceAuditLog" ADD CONSTRAINT "ComplianceAuditLog_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceWorkflow" ADD CONSTRAINT "ComplianceWorkflow_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CompliancePolicy" ADD CONSTRAINT "CompliancePolicy_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceTraining" ADD CONSTRAINT "ComplianceTraining_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceIncident" ADD CONSTRAINT "ComplianceIncident_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ComplianceScenario" ADD CONSTRAINT "ComplianceScenario_empresaId_fkey"
  FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
