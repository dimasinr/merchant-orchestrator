'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../store';
import { Sidebar } from '../../components/layout/Sidebar';
import { Radio, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, realtimeEnabled, setRealtimeEnabled, simulateStep } = useStore();

  // Route protection - Client Side
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Real-time Event Simulation loop (WebSocket emulation)
  useEffect(() => {
    if (!realtimeEnabled || !isAuthenticated) return;

    const interval = setInterval(() => {
      simulateStep();
    }, 3500); // Trigger a transaction status change/new transaction every 3.5s

    return () => clearInterval(interval);
  }, [realtimeEnabled, isAuthenticated, simulateStep]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 text-zinc-600 select-none">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-indigo-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Establishing secure session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP STATUS BAR */}
        <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* Real-time Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                realtimeEnabled
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200'
              }`}
            >
              <Radio size={13} className={realtimeEnabled ? 'animate-pulse text-emerald-600' : ''} />
              <span>Real-time Stream: {realtimeEnabled ? 'LIVE' : 'PAUSED'}</span>
            </span>

            {/* Sim Mode toggle */}
            <button
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className="text-[10px] font-bold text-zinc-600 hover:text-zinc-900 px-2.5 py-1 rounded bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 transition-all uppercase tracking-wide cursor-pointer shadow-3xs"
            >
              {realtimeEnabled ? 'Pause Socket' : 'Resume Socket'}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* WebSocket connection status */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              {realtimeEnabled ? (
                <>
                  <Wifi size={14} className="text-indigo-500" />
                  <span className="text-zinc-600 font-medium">WS Core: Connected</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-zinc-400" />
                  <span className="text-zinc-400 font-medium">WS Core: Disconnected</span>
                </>
              )}
            </div>

            {/* System Health */}
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/30" />
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Gateway OK</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
