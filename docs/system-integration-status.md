# Integração das Camadas do ERP-SaaS

## Backend (NestJS + Prisma)
- Os serviços usam o `PrismaService` para abrir conexões reais com o PostgreSQL, realizando operações CRUD com transações quando necessário. Exemplo: `CadastrosService` grava e consulta produtos, fornecedores e unidades diretamente no banco, mapeando relações e normalizando respostas.
- O módulo fiscal persiste documentos em tabelas específicas, gera eventos de domínio e publica envelopes no barramento global após cada upsert.

## API e Autenticação
- O módulo de autenticação valida credenciais via endpoint `/auth/login`, gera JWTs e integra com NextAuth através do adaptador Prisma. As callbacks propagam `role`, `empresaId` e `accessToken` para a sessão do usuário.
- Guards globais conferem roles e tokens, e decoradores específicos expõem o usuário corrente para os controladores.

## Front-end (Next.js)
- As páginas usam React Query e o cliente `apiFetch` para consumir os endpoints autenticados, invalidando caches após mutações e preenchendo tabelas/tabs com dados do servidor.
- O layout aplica RBAC no menu lateral, enquanto o middleware protege rotas baseando-se nos perfis carregados pela sessão NextAuth.

## IA & Eventos
- O SDK de IA seleciona provedores reais (OpenAI/Cohere) ou mock, agrega contexto via RAG, estima custos e normaliza tool calls.
- O `EventBusService` publica em memória e, quando configurado, encaminha envelopes para NATS e Redis Streams, permitindo orquestração cross-serviços.

## Conclusão
Todas as camadas — banco, API, autenticação, front-end, IA e eventos — estão interligadas por implementações concretas que utilizam Prisma, NestJS, NextAuth e o SDK de IA. Basta configurar as variáveis de ambiente (PostgreSQL, provedores de IA, NATS/Redis) para operar o fluxo end-to-end.
