CREATE TABLE "CategoriaDespesaFixa" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "nome" TEXT NOT NULL UNIQUE,
  "descricao" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "DespesaFixa" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "categoria" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "valorMensal" DECIMAL(10,2) NOT NULL,
  "diaVencimento" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DespesaFixa_categoria_idx" ON "DespesaFixa"("categoria");

ALTER TABLE "DespesaFixa"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE "EntradaReceita" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "descricao" TEXT NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "data" TIMESTAMPTZ NOT NULL,
  "categoria" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "EntradaReceita_data_idx" ON "EntradaReceita"("data");
CREATE INDEX "EntradaReceita_categoria_idx" ON "EntradaReceita"("categoria");

CREATE TABLE "EntradaDespesa" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "descricao" TEXT NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "data" TIMESTAMPTZ NOT NULL,
  "categoria" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "EntradaDespesa_data_idx" ON "EntradaDespesa"("data");
CREATE INDEX "EntradaDespesa_categoria_idx" ON "EntradaDespesa"("categoria");

CREATE TABLE "VendaImportada" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "descricao" TEXT NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "data" TIMESTAMPTZ NOT NULL,
  "categoria" TEXT,
  "origem" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "VendaImportada_data_idx" ON "VendaImportada"("data");
CREATE INDEX "VendaImportada_origem_idx" ON "VendaImportada"("origem");

CREATE TABLE "DespesaImportada" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "descricao" TEXT NOT NULL,
  "valor" DECIMAL(12,2) NOT NULL,
  "data" TIMESTAMPTZ NOT NULL,
  "categoria" TEXT,
  "origem" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "DespesaImportada_data_idx" ON "DespesaImportada"("data");
CREATE INDEX "DespesaImportada_origem_idx" ON "DespesaImportada"("origem");
