export const DomainEvents = {
  FINANCEIRO_EXCECAO_DETECTADA: 'Financeiro.ExcecaoDetectada',
  FISCAL_XML_RECEBIDO: 'Fiscal.XmlRecebido',
  COMPRAS_PO_SUGERIDA: 'Compras.POSugerida',
  ESTOQUE_ALERTA_VALIDADE: 'Estoque.AlertaValidade',
  CX_CASO_ABERTO: 'CX.CasoAberto',
} as const;

export { EventBusService } from './event-bus.service';
export { EventsModule } from './events.module';
