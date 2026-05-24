'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '../store';
import { getDefaultRoute } from '@/lib/permissions';
import type { AccountType } from '@/types';
import { ShieldCheck, ArrowRight, Lock, Mail, QrCode, Building2, Store } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginAdmin, loginMerchant, isAuthenticated, accountType, authReady, authError } = useStore();

  const [portal, setPortal] = useState<AccountType>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady) return;
    if (isAuthenticated && accountType) {
      const redirect = searchParams.get('redirect');
      router.push(redirect ?? getDefaultRoute(accountType));
    }
  }, [authReady, isAuthenticated, accountType, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success =
      portal === 'admin' ? await loginAdmin(email, password) : await loginMerchant(email, password);

    if (success) {
      const redirect = searchParams.get('redirect');
      const target =
        redirect &&
        ((portal === 'admin' && redirect.startsWith('/dashboard')) ||
          (portal === 'merchant' && redirect.startsWith('/merchant')))
          ? redirect
          : getDefaultRoute(portal);
      router.push(target);
    } else {
      setError(authError ?? 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        Initializing session...
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative px-4 select-none overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-xl relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md mb-4">
            <QrCode size={22} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">QRIS Payment Orchestrator</h2>
          <p className="text-xs text-zinc-500 max-w-xs mt-1.5 font-medium leading-relaxed">
            Sign in to the admin console or merchant portal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-zinc-100 rounded-lg">
          <button
            type="button"
            onClick={() => setPortal('admin')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer ${
              portal === 'admin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-zinc-500'
            }`}
          >
            <Building2 size={13} />
            Admin
          </button>
          <button
            type="button"
            onClick={() => setPortal('merchant')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer ${
              portal === 'merchant' ? 'bg-white text-indigo-700 shadow-sm' : 'text-zinc-500'
            }`}
          >
            <Store size={13} />
            Merchant
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || authError) && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold">
              {error || authError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md disabled:opacity-50 cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                <span>{portal === 'admin' ? 'Admin Sign In' : 'Merchant Sign In'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
