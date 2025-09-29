-- CreateTable
CREATE TABLE "FiscalXmlDocument" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dataEmissao" TIMESTAMP(3) NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "manifestado" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiscalXmlDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalXmlDocument_chave_key" ON "FiscalXmlDocument"("chave");

-- CreateIndex
CREATE INDEX "FiscalXmlDocument_cnpj_idx" ON "FiscalXmlDocument"("cnpj");

-- CreateIndex
CREATE INDEX "FiscalXmlDocument_dataEmissao_idx" ON "FiscalXmlDocument"("dataEmissao");

-- CreateTable
CREATE TABLE "FiscalXmlEvent" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiscalXmlEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FiscalXmlEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "FiscalXmlDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FiscalXmlEvent_documentId_idx" ON "FiscalXmlEvent"("documentId");

-- CreateIndex
CREATE INDEX "FiscalXmlEvent_tipo_idx" ON "FiscalXmlEvent"("tipo");

-- CreateTable
CREATE TABLE "FiscalEmissionRequest" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiscalEmissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FiscalEmissionRequest_protocolo_key" ON "FiscalEmissionRequest"("protocolo");

-- CreateTable
CREATE TABLE "FiscalSpedJob" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiscalSpedJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalSpedJob_periodo_idx" ON "FiscalSpedJob"("periodo");

-- CreateIndex
CREATE INDEX "FiscalSpedJob_tipo_idx" ON "FiscalSpedJob"("tipo");

-- CreateTable
CREATE TABLE "FiscalNfseConfig" (
    "id" TEXT NOT NULL,
    "ambiente" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "perfil" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "usuario" TEXT,
    "senha" TEXT,
    "certificado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FiscalNfseConfig_pkey" PRIMARY KEY ("id")
);
