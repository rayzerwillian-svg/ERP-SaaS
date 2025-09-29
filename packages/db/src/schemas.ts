import { z } from "zod";

/** 1.1 Produtos venda direta (1.1.x) */
export const ProdutoVendaDiretaSchema = z.object({
  codigo: z.string().min(1),
  descricao: z.string().min(1),
  fornecedorId: z.string().uuid().optional(),
  qtdPorEmbalagem: z.number().nonnegative(),
  unidadeMedidaId: z.string().uuid(),
  precoPorUn: z.number().nonnegative(),
  precoPorMedida: z.number().nonnegative(),
  medida: z.number().nonnegative(),
});

/** 1.2 Produtos processados (1.2.x) */
export const ProdutoProcessadoSchema = z.object({
  codigo: z.string().min(1),
  materiaPrimaIds: z.array(z.string().uuid()).default([]),
  pesoBrutoPorUn: z.number().nonnegative(),
  pesoLiquidoPorUn: z.number().nonnegative(),
  unidadeMedidaId: z.string().uuid(),
  precoPorUn: z.number().nonnegative(),
  fatorCorrecaoPerda: z.number().min(0).default(0),
  precoPorMedida: z.number().nonnegative(),
});

/** 2. Ficha técnica (2.x) */
export const FichaTecnicaItemSchema = z.object({
  materiaPrimaId: z.string().uuid(),
  unidadeMedidaId: z.string().uuid(),
  quant: z.number().positive(),
  valorIndividual: z.number().min(0),
});
export const FichaTecnicaSchema = z.object({
  produtoId: z.string().uuid(),
  nome: z.string(),
  tipo: z.string().optional(),
  itens: z.array(FichaTecnicaItemSchema),
  qtdProduzida: z.number().positive(),
  custoInsumosTotal: z.number().min(0),
  custosVariaveisTotais: z.number().min(0),
});

/** 3.1 Precificação venda direta (3.1.x) */
export const PrecificacaoRevendaSchema = z.object({
  cod: z.string(),
  produto: z.string(),
  precoVendaAtual: z.number(),
  cmv: z.number(),
  frete: z.number(),
  custoVariavel: z.number(),
  impostosPerc: z.number(),
  impostosValor: z.number(),
  taxaCartaoPerc: z.number(),
  taxaCartaoValor: z.number(),
  taxaAppPerc: z.number(),
  taxaAppValor: z.number(),
  comissaoPerc: z.number(),
  comissaoValor: z.number(),
  margemContribReais: z.number(),
  margemContribPercentual: z.number(),
  cmvReais: z.number(),
  cmvPercentual: z.number(),
  custosVariaveisReais: z.number(),
  custosVariaveisPercentual: z.number(),
  despesasVariaveisReais: z.number(),
  despesasVariaveisPercentual: z.number(),
});

/** 3.2 Precificação processados (3.2.x) */
export const PrecificacaoProcessadoSchema = z.object({
  cod: z.string(),
  produto: z.string(),
  precoVendaAtual: z.number(),
  cmv: z.number(),
  mod: z.number(),
  frete: z.number(),
  custoVariavel: z.number(),
  impostosPerc: z.number(),
  impostosValor: z.number(),
  taxaCartaoPerc: z.number(),
  taxaCartaoValor: z.number(),
  taxaAppPerc: z.number(),
  taxaAppValor: z.number(),
  comissaoPerc: z.number(),
  comissaoValor: z.number(),
  margemContribReais: z.number(),
  margemContribPercentual: z.number(),
  cpvReais: z.number(),
  cpvPercentual: z.number(),
  modReais: z.number(),
  modPercentual: z.number(),
  custosVariaveisReais: z.number(),
  custosVariaveisPercentual: z.number(),
  despesasVariaveisReais: z.number(),
  despesasVariaveisPercentual: z.number(),
});

/** 4. Simulações (4.1/4.2 — campos equivalentes) */
export const SimulacaoSchema = z.object({
  codigo: z.string(),
  produto: z.string(),
  precoPraticado: z.number(),
  previsaoVendas: z.number(),
  faturamentoPrevisto: z.number(),
  custosVariaveis: z.number(),
  impostos: z.number(),
  taxaCartao: z.number(),
  taxaApp: z.number(),
  comissao: z.number(),
  margemContribReais: z.number(),
  margemContribPercentual: z.number(),
  rateioDespesasFixas: z.number(),
  margemLucroReais: z.number(),
  margemLucroPercentual: z.number(),
  markupMultiplicador: z.number(),
  percentualMix: z.number(),
});

/** 5. Análises (5.1/5.2) */
export const AnaliseSchema = z.object({
  produtoId: z.string().uuid(),
  precoVenda: z.number(),
  custosVariaveis: z.number(),
  custoProduto: z.number(),
  frete: z.number(),
  despesasVariaveis: z.number(),
  impostos: z.number(),
  taxaMaquina: z.number(),
  taxaApp: z.number(),
  comissao: z.number(),
  margemContrib: z.number(),
  rateioFixas: z.number(),
  margemLucro: z.number(),
  markup: z.number(),
  lucroDesejadoPercentual: z.number(),
  precoSugerido: z.number(),
});

/** 6. Despesas fixas (6.x) */
export const DespesaFixaSchema = z.object({
  categoria: z.string(),
  descricao: z.string(),
  valorMensal: z.number(),
  diaVencimento: z.number().min(1).max(31),
});

/** 7. Folha (7.1/7.2/7.3) */
export const EncargosSchema = z.object({
  trabFerias30Perc: z.number(),
  trab13Perc: z.number(),
  trab13FeriasPerc: z.number(),
  socInssPerc: z.number(),
  socSatPerc: z.number(),
  socSalEducPerc: z.number(),
  socIncraSestSebraeSenatPerc: z.number(),
  socFgtsPerc: z.number(),
  socFgtsRescisaoPerc: z.number(),
});
export const ColaboradorSchema = z.object({
  codigo: z.string(),
  nome: z.string(),
  salario: z.number(),
  setor: z.string(),
  cargo: z.string(),
  dataContratacao: z.string(),
  encSociaisPerc: z.number(),
  encTrabPerc: z.number(),
  valeTransporte: z.number(),
  valeRefeicao: z.number(),
  convenioMedico: z.number(),
  cargaHorariaMensal: z.number(),
  valorHora: z.number(),
});

/** 8/9. DRE e Lançamentos (8.x/9.x) */
export const LancamentoDRESchema = z.object({
  contaCodigo: z.string(),
  data: z.string(),
  descricao: z.string(),
  valor: z.number(),
  tipoPagamento: z.enum([
    "cartao_credito",
    "cartao_debito",
    "cartao_alimentacao",
    "cartao_refeicao",
    "dinheiro",
    "pix",
    "transferencia",
    "outros",
  ]),
});

/** 11. Fiscal */
export const FiscalXmlSchema = z.object({
  cnpj: z.string().min(1),
  modelo: z.enum(["NFe", "NFSe", "NFCe", "CTe"]),
  serie: z.string().min(1),
  numero: z.string().min(1),
  data: z.string().min(1),
  storageUrl: z.string().min(1),
});

export const PromptDefinitionSchema = z.object({
  name: z.string().min(1),
  scope: z.enum(["global", "modulo", "role"]),
  entities: z.array(z.string()).default([]),
  inputs: z.record(z.string()).default({}),
  output: z.enum(["text", "json"]),
  llmPreset: z.object({
    model: z.string().min(1),
    mode: z.enum(["text", "json"]),
    temperature: z.number().min(0).max(2),
  }),
  ragCollections: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  policy: z.record(z.any()).optional(),
  version: z.string().min(1),
  ownerRole: z.string().min(1),
  reviewers: z.array(z.string()).default([]),
  status: z.enum(["draft", "approved", "published"]),
});

export const PromptDefinitionUpdateSchema = PromptDefinitionSchema.partial();

export const RagCollectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  source: z.string().min(1),
  status: z.enum(["indexing", "ready"]),
  description: z.string().optional(),
});

export const FiscalEmissionSchema = z.object({
  tipo: z.enum(["nfe", "nfse", "cte", "nfce"]),
  provider: z.enum(["edicom", "svrs_direct", "municipal_legacy"]),
  destinatario: z.string().min(1),
  valor: z.number().nonnegative(),
  dados: z.record(z.any()).optional(),
});

export const FiscalSpedSchema = z.object({
  periodo: z.string().min(6),
  tipo: z.enum(["efd_contribuicoes", "efd_icms_ipi"]),
});

export const FiscalNfseConfigSchema = z.object({
  ambiente: z.enum(["homologacao", "producao"]),
  municipio: z.string().min(1),
  perfil: z.enum(["provisorio", "definitivo"]),
  provider: z.enum(["edicom", "svrs_direct", "municipal_legacy"]).default("edicom"),
  usuario: z.string().optional(),
  senha: z.string().optional(),
  certificado: z.string().optional(),
});

export const ComplianceMonitoringSchema = z.object({
  titulo: z.string().min(1),
  modulo: z.string().min(1),
  categoria: z.string().min(1),
  descricao: z.string().optional(),
  status: z.string().min(1),
  severidade: z.string().min(1),
  detectedAt: z.string().optional(),
});

export const ComplianceAlertSchema = z.object({
  monitoringId: z.string().uuid().optional(),
  canal: z.string().min(1),
  destinatarios: z.array(z.string().email()).min(1),
  mensagem: z.string().min(1),
  status: z.string().min(1),
});

export const ComplianceRiskAssessmentSchema = z.object({
  monitoringId: z.string().uuid().optional(),
  modulo: z.string().min(1),
  risco: z.string().min(1),
  score: z.number().min(0).max(100),
  probabilidade: z.number().min(0).max(100),
  impacto: z.number().min(0).max(100),
  status: z.string().min(1),
  recomendacoes: z.string().optional(),
});

export const ComplianceReportSchema = z.object({
  tipo: z.string().min(1),
  periodoInicio: z.string().min(1),
  periodoFim: z.string().min(1),
  formato: z.string().min(1),
  status: z.string().min(1),
  destino: z.array(z.string().email()).min(1),
  arquivoUrl: z.string().url().optional(),
  geradoEm: z.string().optional(),
});

export const ComplianceWorkflowSchema = z.object({
  nome: z.string().min(1),
  tipo: z.string().min(1),
  descricao: z.string().optional(),
  etapas: z.array(
    z.object({
      nome: z.string().min(1),
      responsavelRole: z.string().min(1),
    }),
  ).min(1),
  status: z.string().min(1),
  requerMfa: z.boolean().optional(),
});

export const CompliancePolicySchema = z.object({
  titulo: z.string().min(1),
  categoria: z.string().min(1),
  versao: z.string().min(1),
  vigenteDesde: z.string().min(1),
  vigenteAte: z.string().optional(),
  urlDocumento: z.string().url().optional(),
  obrigatoria: z.boolean().default(false),
  status: z.string().min(1),
});

export const ComplianceTrainingSchema = z.object({
  curso: z.string().min(1),
  categoria: z.string().min(1),
  cargaHoraria: z.number().min(0),
  responsavel: z.string().min(1),
  prazoConclusao: z.string().min(1),
  status: z.string().min(1),
  certificadosUrl: z.string().url().optional(),
});

export const ComplianceIncidentSchema = z.object({
  titulo: z.string().min(1),
  categoria: z.string().min(1),
  descricao: z.string().min(1),
  status: z.string().min(1),
  severidade: z.string().min(1),
  impacto: z.string().min(1),
  responsavel: z.string().min(1),
  acaoCorretiva: z.string().optional(),
  detectedAt: z.string().optional(),
  resolvedAt: z.string().optional(),
});

export const ComplianceScenarioSchema = z.object({
  titulo: z.string().min(1),
  regulacaoAlvo: z.string().min(1),
  descricao: z.string().optional(),
  impactoPrevisto: z.number().min(0),
  recomendacoes: z.string().optional(),
  status: z.string().min(1),
});

export const SecuritySettingsSchema = z.object({
  requireMfa: z.boolean().default(true),
  allowedFactors: z.string().default('totp,sms,email'),
  passwordMinLength: z.number().min(6),
  passwordRequireUppercase: z.boolean(),
  passwordRequireNumber: z.boolean(),
  passwordRequireSymbol: z.boolean(),
  passwordRotationDays: z.number().min(0),
  sessionTimeoutMinutes: z.number().min(5),
  sessionMaxDevices: z.number().min(1),
  ssoEnabled: z.boolean(),
  ssoProvider: z.string().optional().nullable(),
  encryptionAtRest: z.boolean(),
  encryptionInTransit: z.boolean(),
  encryptionInUse: z.boolean(),
  keyRotationDays: z.number().min(1),
  dataClassificationMatrix: z.string().optional().nullable(),
  dataMaskingPolicies: z.string().optional().nullable(),
  logRetentionDays: z.number().min(1),
  anomalyDetectionEnabled: z.boolean(),
  wafEnabled: z.boolean(),
  vulnerabilityScanSchedule: z.string().optional().nullable(),
  complianceContact: z.string().optional().nullable(),
  backupFrequencyHours: z.number().min(1),
  zeroTrustEnabled: z.boolean(),
  apiRateLimitPerMinute: z.number().min(1),
  apiTokenRotationDays: z.number().min(1),
});

export const SecuritySettingsUpdateSchema = SecuritySettingsSchema.partial();

export const SecurityIncidentSchema = z.object({
  titulo: z.string().min(1),
  severidade: z.string().min(1),
  status: z.string().min(1).default('aberto'),
  descricao: z.string().optional(),
  reportedBy: z.string().optional(),
  detectedAt: z.string().optional(),
  resolvedAt: z.string().optional(),
  planoAcao: z.string().optional(),
});

export const SecurityIncidentUpdateSchema = z.object({
  status: z.string().min(1).optional(),
  resolvedAt: z.string().optional(),
  planoAcao: z.string().optional(),
  descricao: z.string().optional(),
});

export const SecurityTrainingSchema = z.object({
  titulo: z.string().min(1),
  publicoAlvo: z.string().min(1),
  descricao: z.string().optional(),
  cargaHoraria: z.number().min(0),
  dueDate: z.string().optional(),
  completionRate: z.number().min(0).max(100).optional(),
  participantes: z.number().min(0).optional(),
  responsavel: z.string().optional(),
  recursos: z.string().optional(),
  status: z.string().min(1),
});

export const SecurityTrainingUpdateSchema = SecurityTrainingSchema.partial();

export type ProdutoVendaDiretaInput = z.infer<typeof ProdutoVendaDiretaSchema>;
export type ProdutoProcessadoInput = z.infer<typeof ProdutoProcessadoSchema>;
export type FichaTecnicaInput = z.infer<typeof FichaTecnicaSchema>;
export type PrecificacaoRevendaInput = z.infer<typeof PrecificacaoRevendaSchema>;
export type PrecificacaoProcessadoInput = z.infer<typeof PrecificacaoProcessadoSchema>;
export type SimulacaoInput = z.infer<typeof SimulacaoSchema>;
export type AnaliseInput = z.infer<typeof AnaliseSchema>;
export type DespesaFixaInput = z.infer<typeof DespesaFixaSchema>;
export type EncargosInput = z.infer<typeof EncargosSchema>;
export type ColaboradorInput = z.infer<typeof ColaboradorSchema>;
export type LancamentoDREInput = z.infer<typeof LancamentoDRESchema>;
export type FiscalXmlInput = z.infer<typeof FiscalXmlSchema>;
export type FiscalEmissionInput = z.infer<typeof FiscalEmissionSchema>;
export type FiscalSpedInput = z.infer<typeof FiscalSpedSchema>;
export type FiscalNfseConfigInput = z.infer<typeof FiscalNfseConfigSchema>;
export type PromptDefinitionInput = z.infer<typeof PromptDefinitionSchema>;
export type PromptDefinitionUpdateInput = z.infer<typeof PromptDefinitionUpdateSchema>;
export type RagCollectionInput = z.infer<typeof RagCollectionSchema>;
export type ComplianceMonitoringInput = z.infer<typeof ComplianceMonitoringSchema>;
export type ComplianceAlertInput = z.infer<typeof ComplianceAlertSchema>;
export type ComplianceRiskAssessmentInput = z.infer<typeof ComplianceRiskAssessmentSchema>;
export type ComplianceReportInput = z.infer<typeof ComplianceReportSchema>;
export type ComplianceWorkflowInput = z.infer<typeof ComplianceWorkflowSchema>;
export type CompliancePolicyInput = z.infer<typeof CompliancePolicySchema>;
export type ComplianceTrainingInput = z.infer<typeof ComplianceTrainingSchema>;
export type ComplianceIncidentInput = z.infer<typeof ComplianceIncidentSchema>;
export type ComplianceScenarioInput = z.infer<typeof ComplianceScenarioSchema>;
export type SecuritySettingsInput = z.infer<typeof SecuritySettingsSchema>;
export type SecuritySettingsUpdateInput = z.infer<typeof SecuritySettingsUpdateSchema>;
export type SecurityIncidentInput = z.infer<typeof SecurityIncidentSchema>;
export type SecurityIncidentUpdateInput = z.infer<typeof SecurityIncidentUpdateSchema>;
export type SecurityTrainingInput = z.infer<typeof SecurityTrainingSchema>;
export type SecurityTrainingUpdateInput = z.infer<typeof SecurityTrainingUpdateSchema>;
