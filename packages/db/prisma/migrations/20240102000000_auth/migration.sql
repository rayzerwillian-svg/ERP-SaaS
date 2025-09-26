-- Add NextAuth tables and seed initial admin user

ALTER TABLE "Usuario" ALTER COLUMN "hash" SET DEFAULT '';
ALTER TABLE "Usuario" ALTER COLUMN "role" SET DEFAULT 'viewer';

CREATE TABLE "Account" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT
);

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
  ON "Account" ("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account" ("userId");

CREATE TABLE "Session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES "Usuario"("id") ON DELETE CASCADE,
  "expires" TIMESTAMPTZ NOT NULL
);

CREATE INDEX "Session_userId_idx" ON "Session" ("userId");

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMPTZ NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken" ("token");

INSERT INTO "Empresa" ("id", "nome")
VALUES ('54a4db52-a84f-4317-bd01-116a2ae2fe64', 'Empresa Demo')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Usuario" ("id", "email", "nome", "hash", "role", "empresaId")
VALUES (
  '6010659d-afc2-4d8c-8832-e2165d1d08df',
  'admin@erp.local',
  'Administrador',
  '$2a$10$uVdVd/gVno4ZATM5VXL/oOc5Za/ugsKkpqPAkUrgALtJVQwwvWyJa',
  'admin',
  '54a4db52-a84f-4317-bd01-116a2ae2fe64'
)
ON CONFLICT ("id") DO NOTHING;
