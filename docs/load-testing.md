# Plano de Teste de Carga e Estresse

Este guia descreve como executar testes de carga e estresse no ERP SaaS, cobrindo preparação do ambiente, ferramentas sugeridas, roteiros de teste e critérios de aprovação. Utilize-o como referência para validar a resiliência da plataforma antes de disponibilizar novas releases.

## 1. Objetivos

- **Carga**: Garantir que as APIs REST (NestJS) e o front-end Next.js suportem o throughput esperado com latência aceitável.
- **Estresse**: Identificar o ponto de saturação e observar a recuperação do sistema após remover a carga excessiva.
- **Confiabilidade**: Validar que o pipeline de eventos (NATS/Redis) e o módulo de IA (SDK GenAI/RAG) continuam operacionais sob demanda elevada.

## 2. Ambiente de Teste

| Componente | Requisito | Observações |
| --- | --- | --- |
| Banco de Dados | PostgreSQL 14+ com `DATABASE_URL` dedicado | Executar `pnpm --filter @erp-saas/db prisma migrate deploy` antes dos testes.
| API | `apps/api` rodando com `NODE_ENV=production` | Habilitar logs estruturados (`LOG_LEVEL=info`).
| Web | `apps/web` em modo produção (`next start`) | Ativar cache CDN quando disponível.
| Eventos | NATS e/ou Redis Streams acessíveis | Configurar `EVENT_BUS_URL` correspondente.
| IA | Provedor escolhido (OpenAI/Cohere) e Qdrant/PGVector | Preencher `AI_PROVIDER`, `VECTOR_DB_URL` e chaves de API.

## 3. Ferramentas Recomendadas

- **k6** para testes de carga HTTP (script em JavaScript/TypeScript).
- **Artillery** como alternativa quando precisamos de cenários mais simples.
- **Locust** para cenários baseados em Python com usuários virtuais complexos.
- **pg_stat_statements / pgBadger** para observar o comportamento do PostgreSQL.
- **Grafana + Prometheus** para dashboards de métricas (CPU, memória, latência, taxa de erro).

## 4. Preparação dos Dados

1. Popular o banco com fixtures representativas (`pnpm seed` ou scripts dedicados).
2. Configurar usuários com cada role (`admin`, `gestor`, `fiscal`, `financeiro`, `estoque`, `rh`, `atendimento`, `viewer`).
3. Provisionar coleções RAG de teste (ex.: `ncm_br`, `cfop_rules`).
4. Habilitar jobs assíncronos relevantes (importação de XML, geração de SPED, execuções de IA).

## 5. Cenários de Carga (k6)

### 5.1 Login e Navegação Básica

- VUs: 50 → 200.
- Duração: rampa de 5 min + sustentação 10 min.
- Fluxo: login → dashboard → cadastros → ficha técnica → logout.
- Métricas: TTFB < 500 ms em 95º percentil, erro < 1%.

### 5.2 Operações Financeiras

- VUs: 30 → 120.
- Endpoints: `/precificacao/*`, `/simulacoes/*`, `/analises/*`, `/dre/*`, `/entradas/*`.
- Validar cálculos de preço sugerido e geração de relatórios.

### 5.3 Fiscal e Eventos

- VUs: 20 → 80.
- Endpoints: `/fiscal/xml`, `/fiscal/sped/efd-contribuicoes`, `/ai/complete` (pré-validação NF-e).
- Monitorar emissão de eventos `Fiscal.XmlRecebido` e latência média < 1,5 s.

## 6. Cenários de Estresse

1. **Burst**: Multiplicar subitamente os VUs por 3 durante 2 minutos para avaliar filas e auto-escalonamento.
2. **Soak**: Manter 100 VUs por 2 horas para analisar consumo de memória, conexões DB e vazamentos.
3. **Failover**: Derrubar intencionalmente um nó (API ou DB read replica) e observar o comportamento do sistema.

## 7. Critérios de Aceite

- Taxa de erro global ≤ 1% durante testes de carga; ≤ 3% durante pico de estresse.
- P95 de latência para endpoints críticos ≤ 800 ms.
- Sem crescimento contínuo de memória (“memory leak”) nos pods.
- Consumo de CPU < 75% sustentado em serviços críticos.
- Event bus processando mensagens em < 5 s em 99% dos casos.
- IA completions com sucesso ≥ 99% e custo médio controlado (definir budget).

## 8. Coleta e Relatórios

- Exportar métricas do k6/Artillery (`summary.json`) e anexar nos pipelines CI/CD.
- Gerar dashboards (Grafana) com comparação pré/pós release.
- Elaborar relatório final com observações, gargalos, melhorias propostas e captura de logs relevantes.

## 9. Automatização

- Integrar scripts de carga ao GitHub Actions (executar sob demanda em branches de release).
- Utilizar ambientes efêmeros (preview) para isolar efeitos.
- Acompanhar custos e tempo de execução para manter o processo sustentável.

## 10. Próximos Passos

- Versionar scripts k6/Artillery em `tests/performance/`.
- Implementar testes específicos para módulos pendentes (CRM, Procurement, PDV etc.).
- Ajustar limites de auto-escalonamento após cada rodada de testes.

> **Nota:** Este documento serve como base para planejamento e execução de testes de carga/estresse. Adapte conforme o volume transacional real e evoluções do produto.
