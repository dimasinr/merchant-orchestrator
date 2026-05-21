'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../store';
import { Role } from '../types';
import { ShieldCheck, ArrowRight, Lock, Mail, Users, QrCode } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useStore();

  const [email, setEmail] = useState('alex.rivera@orchestrator.io');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<Role>('SUPER_ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in? Redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      setTimeout(async () => {
        const nameMap: Record<Role, string> = {
          SUPER_ADMIN: 'Alex Rivera (Owner)',
          OPERATOR: 'Devin Cole (Operator)',
          VIEWER: 'Sarah Jenkins (Auditor)',
          MERCHANT_ADMIN: 'Budi Santoso (Merchant)'
        };

        const success = await login(email, selectedRole, nameMap[selectedRole]);
        if (success) {
          router.push('/dashboard');
        } else {
          setError('Failed to establish session credentials.');
          setLoading(false);
        }
      }, 800);
    } catch (err) {
      setError('An unexpected validation error occurred.');
      setLoading(false);
    }
  };

  const handleRoleQuickSelect = (role: Role, emailAddr: string) => {
    setSelectedRole(role);
    setEmail(emailAddr);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative px-4 select-none overflow-hidden font-sans">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-8 shadow-xl relative z-10 animate-in fade-in duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/10 mb-4">
            <QrCode size={22} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">QRIS Payment Orchestrator</h2>
          <p className="text-xs text-zinc-500 max-w-xs mt-1.5 font-medium leading-relaxed">
            Enterprise merchant control console for clearing, routing, and SDK payment generation.
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Identity Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@orchestrator.io"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                Session Token / Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Authorized Access Role
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium appearance-none cursor-pointer"
              >
                <option value="SUPER_ADMIN">SUPER ADMIN (All actions + Settings)</option>
                <option value="OPERATOR">OPERATOR (DLQ + Retry actions)</option>
                <option value="VIEWER">VIEWER (Read-only analytics)</option>
                <option value="MERCHANT_ADMIN">MERCHANT ADMIN (Merchant config only)</option>
              </select>
            </div>
          </div>

          {/* Connect Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer mt-6"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authorizing Session Token...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                <span>Establish Secure Session</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Quick select test accounts */}
        <div className="mt-8 border-t border-zinc-150 pt-6">
          <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider text-center mb-3">
            Quick-Select Demonstration Identities
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleRoleQuickSelect('SUPER_ADMIN', 'alex.rivera@orchestrator.io')}
              className={`px-3 py-2 rounded-lg border text-[10px] font-bold text-left transition-all cursor-pointer ${
                selectedRole === 'SUPER_ADMIN'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <div className="font-bold text-zinc-800">Alex R.</div>
              <div className="text-[8px] opacity-70 mt-0.5">SUPER ADMIN</div>
            </button>
            <button
              onClick={() => handleRoleQuickSelect('OPERATOR', 'devin.cole@orchestrator.io')}
              className={`px-3 py-2 rounded-lg border text-[10px] font-bold text-left transition-all cursor-pointer ${
                selectedRole === 'OPERATOR'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <div className="font-bold text-zinc-800">Devin C.</div>
              <div className="text-[8px] opacity-70 mt-0.5">OPERATOR</div>
            </button>
            <button
              onClick={() => handleRoleQuickSelect('VIEWER', 'sarah.jenkins@orchestrator.io')}
              className={`px-3 py-2 rounded-lg border text-[10px] font-bold text-left transition-all cursor-pointer ${
                selectedRole === 'VIEWER'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <div className="font-bold text-zinc-800">Sarah J.</div>
              <div className="text-[8px] opacity-70 mt-0.5">VIEWER</div>
            </button>
            <button
              onClick={() => handleRoleQuickSelect('MERCHANT_ADMIN', 'budi.santoso@merchant.io')}
              className={`px-3 py-2 rounded-lg border text-[10px] font-bold text-left transition-all cursor-pointer ${
                selectedRole === 'MERCHANT_ADMIN'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 font-bold'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-300'
              }`}
            >
              <div className="font-bold text-zinc-800">Budi S.</div>
              <div className="text-[8px] opacity-70 mt-0.5">MERCHANT ADMIN</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
