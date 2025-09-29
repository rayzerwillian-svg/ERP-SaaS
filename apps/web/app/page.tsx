import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Bem-vindo ao ERP SaaS</h2>
      <p className="text-gray-600">
        Utilize o menu ao lado para navegar pelos módulos de cadastros, ficha técnica, precificação, simulações, análises,
        fiscal e IA.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard" className="rounded-lg border bg-white p-4 shadow-sm hover:border-blue-400">
          <h3 className="text-lg font-medium">Dashboard Financeiro</h3>
          <p className="text-sm text-gray-500">KPIs e gráficos em tempo real com suporte a IA.</p>
        </Link>
        <Link href="/ia/prompt-studio" className="rounded-lg border bg-white p-4 shadow-sm hover:border-blue-400">
          <h3 className="text-lg font-medium">Prompt Studio</h3>
          <p className="text-sm text-gray-500">Gerencie prompts, políticas e coleções de RAG.</p>
        </Link>
      </div>
    </section>
  );
}
