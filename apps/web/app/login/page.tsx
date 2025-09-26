'use client';

import { useEffect, useState } from 'react';
import { signIn, getProviders } from 'next-auth/react';
import type { ClientSafeProvider } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);

  useEffect(() => {
    getProviders().then((prov) => setProviders(prov)).catch(() => setProviders(null));
  }, []);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setFormError('Não foi possível autenticar. Verifique suas credenciais.');
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    });

    setIsSubmitting(false);

    if (result?.error) {
      setFormError('Credenciais inválidas.');
      return;
    }

    router.replace(result?.url ?? '/dashboard');
  };

  const oauthProviders = Object.values(providers ?? {}).filter((provider) => provider.type === 'oauth');

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-800">Acessar o ERP</h1>
        <p className="text-sm text-slate-500">Entre com suas credenciais ou utilize um provedor conectado.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      {oauthProviders.length > 0 ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            <span>ou continue com</span>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          {oauthProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {provider.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
