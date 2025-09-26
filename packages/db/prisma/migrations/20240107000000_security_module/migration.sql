CREATE TABLE "SecuritySettings" (
    "id" TEXT PRIMARY KEY,
    "empresaId" TEXT UNIQUE,
    "requireMfa" BOOLEAN NOT NULL DEFAULT true,
    "allowedFactors" TEXT NOT NULL DEFAULT 'totp,sms,email',
    "passwordMinLength" INTEGER NOT NULL DEFAULT 12,
    "passwordRequireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireNumber" BOOLEAN NOT NULL DEFAULT true,
    "passwordRequireSymbol" BOOLEAN NOT NULL DEFAULT true,
    "passwordRotationDays" INTEGER NOT NULL DEFAULT 90,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "sessionMaxDevices" INTEGER NOT NULL DEFAULT 5,
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ssoProvider" TEXT,
    "encryptionAtRest" BOOLEAN NOT NULL DEFAULT true,
    "encryptionInTransit" BOOLEAN NOT NULL DEFAULT true,
    "encryptionInUse" BOOLEAN NOT NULL DEFAULT false,
    "keyRotationDays" INTEGER NOT NULL DEFAULT 180,
    "dataClassificationMatrix" TEXT,
    "dataMaskingPolicies" TEXT,
    "logRetentionDays" INTEGER NOT NULL DEFAULT 365,
    "anomalyDetectionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "wafEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vulnerabilityScanSchedule" TEXT,
    "complianceContact" TEXT,
    "backupFrequencyHours" INTEGER NOT NULL DEFAULT 24,
    "zeroTrustEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiRateLimitPerMinute" INTEGER NOT NULL DEFAULT 600,
    "apiTokenRotationDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecuritySettings_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "SecurityIncident" (
    "id" TEXT PRIMARY KEY,
    "empresaId" TEXT,
    "titulo" TEXT NOT NULL,
    "severidade" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "descricao" TEXT,
    "reportedBy" TEXT,
    "detectedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "planoAcao" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityIncident_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SecurityIncident_empresaId_status_idx" ON "SecurityIncident" ("empresaId", "status");

CREATE TABLE "SecurityTraining" (
    "id" TEXT PRIMARY KEY,
    "empresaId" TEXT,
    "titulo" TEXT NOT NULL,
    "publicoAlvo" TEXT NOT NULL,
    "descricao" TEXT,
    "cargaHoraria" INTEGER NOT NULL,
    "dueDate" TIMESTAMP WITH TIME ZONE,
    "completionRate" DECIMAL(5,2),
    "participantes" INTEGER NOT NULL DEFAULT 0,
    "responsavel" TEXT,
    "recursos" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planejado',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityTraining_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SecurityTraining_empresaId_status_idx" ON "SecurityTraining" ("empresaId", "status");

CREATE TABLE "SecurityAuditLog" (
    "id" TEXT PRIMARY KEY,
    "empresaId" TEXT,
    "actor" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "contexto" TEXT,
    "origem" TEXT,
    "recordedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityAuditLog_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "SecurityAuditLog_empresaId_recordedAt_idx" ON "SecurityAuditLog" ("empresaId", "recordedAt");
