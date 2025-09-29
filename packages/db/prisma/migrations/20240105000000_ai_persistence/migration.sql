CREATE TABLE "AiPrompt" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "entities" TEXT[] NOT NULL DEFAULT '{}',
  "inputs" JSONB NOT NULL,
  "output" TEXT NOT NULL,
  "llmModel" TEXT NOT NULL,
  "llmMode" TEXT NOT NULL,
  "temperature" DECIMAL(4,3) NOT NULL,
  "ragCollections" TEXT[] NOT NULL DEFAULT '{}',
  "tools" TEXT[] NOT NULL DEFAULT '{}',
  "policy" JSONB,
  "version" TEXT NOT NULL,
  "ownerRole" TEXT NOT NULL,
  "reviewers" TEXT[] NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "AiPrompt_name_scope_key" ON "AiPrompt"("name", "scope");

CREATE TABLE "AiExecution" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "promptId" UUID,
  "model" TEXT NOT NULL,
  "mode" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "outputJson" JSONB,
  "outputText" TEXT,
  "toolCalls" JSONB,
  "usageInputTokens" INTEGER NOT NULL DEFAULT 0,
  "usageOutputTokens" INTEGER NOT NULL DEFAULT 0,
  "usageCost" DECIMAL(12,6) NOT NULL DEFAULT 0,
  "latencyMs" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdByRole" TEXT,
  CONSTRAINT "AiExecution_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "AiPrompt"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "AiExecution_promptId_idx" ON "AiExecution"("promptId");
CREATE INDEX "AiExecution_createdAt_idx" ON "AiExecution"("createdAt");

CREATE TABLE "RagCollection" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "source" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "RagDocument" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "collectionId" UUID NOT NULL REFERENCES "RagCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "title" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "metadata" JSONB,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "RagDocument_collectionId_idx" ON "RagDocument"("collectionId");
CREATE INDEX "RagDocument_status_idx" ON "RagDocument"("status");
