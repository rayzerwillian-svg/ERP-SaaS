'use client';

const agentes = [
  { nome: 'CFO', politicas: 'Aprovar narrativas financeiras e alertas de exceção.' },
  { nome: 'Compras', politicas: 'Sugerir POSugerida e negociar fornecedores.' },
  { nome: 'Estoque', politicas: 'Emitir alerta de validade e auditoria FEFO.' },
  { nome: 'Fiscal', politicas: 'Pré-validação NF-e e SPED com humano no loop.' },
  { nome: 'CX', politicas: 'Triagem de casos e rascunhos de resposta omnichannel.' },
];

export default function AgentesPage() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Agentes Inteligentes</h2>
        <p className="text-sm text-gray-600">Orquestração via eventos (NATS/Redis) e políticas customizadas.</p>
      </header>

      <ul className="grid gap-3 md:grid-cols-2">
        {agentes.map((agente) => (
          <li key={agente.nome} className="rounded-md border bg-white p-4 shadow">
            <h3 className="text-lg font-semibold text-blue-700">{agente.nome}</h3>
            <p className="text-sm text-gray-600">{agente.politicas}</p>
            <button
              onClick={() => alert(`${agente.nome}: CFO.AlertaValidade emitido com contexto completo.`)}
              className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
            >
              Disparar evento de teste
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
