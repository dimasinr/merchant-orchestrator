'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '../../../store';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatCard } from '../../../components/ui/StatCard';
import {
  Activity,
  Clock,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Terminal,
  Server,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export default function DetailedMonitoringPage() {
  const { metrics, workers, transactions } = useStore();
  const [logs, setLogs] = useState<string[]>([]);

  // Generate dynamic simulated logs based on the state of transactions
  useEffect(() => {
    const defaultLogs = [
      '[SYSTEM] Orchestrator QRIS clearing engine v1.4.2 booted successfully.',
      '[WORKER-0] QRIS callback webhook listener attached to port :8080.',
      '[DATABASE] Global transaction ledger replication synchronous [OK].',
      '[SIGNATURE] Public keys cache warm (12 active bank gateways).',
    ];

    // Grab recent transactions to construct a live log stream
    const txLogs = transactions.slice(0, 10).map(t => {
      const timeStr = new Date(t.createdAt).toLocaleTimeString();
      let statusMsg = '';
      if (t.status === 'COMPLETED') {
        statusMsg = `[SUCCESS] Settlement cleared for REF: ${t.referenceId}. Callback dispatched successfully.`;
      } else if (t.status === 'AWAITING_PAYMENT') {
        statusMsg = `[PENDING] QRIS Image generated for reference ${t.referenceId}. Awaiting end-user scan event.`;
      } else if (t.status === 'ACCEPT_FAILED' || t.status === 'FAILED') {
        statusMsg = `[CRITICAL] QRIS generation callback failed on ${t.merchantName} adapter. Action scheduled for DLQ.`;
      } else {
        statusMsg = `[INFO] Request signature validated. Generating QRIS canvas payload for ${t.referenceId}.`;
      }
      return `[${timeStr}] ${statusMsg}`;
    });

    setLogs([...defaultLogs, ...txLogs]);
  }, [transactions]);

  const getWorkerStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IDLE':
        return 'bg-zinc-50 text-zinc-500 border-zinc-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    }
  };

  return (
    <div className="space-y-6 select-none text-zinc-600">
      <PageHeader
        title="Gateway Telemetry & Logs"
        description="Monitor system uptime, QRIS clearing workers, database sync states, and real-time execution logs."
      />

      {/* METRIC SUMMARIES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Clearing Success Rate"
          value={`${metrics.successRate24h}%`}
          icon={CheckCircle2}
          description="Average QRIS clearing success rate"
        />
        <StatCard
          title="Average Callback Latency"
          value={`${metrics.averageLatencyMs} ms`}
          icon={Clock}
          description="Webhook response latency to merchant endpoints"
        />
        <StatCard
          title="Clearing Throughput"
          value={`${metrics.currentTps} TPS`}
          icon={Activity}
          description="Active transactions routed per second"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Node Diagnostics */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="space-y-0.5 mb-2">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Server size={14} className="text-indigo-600" />
              <span>Core Health Diagnostics</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">API gateways & synchronous service status</p>
          </div>

          <div className="space-y-3">
            {/* System 1 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-zinc-800">QRIS Signature Engine</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                Active
              </span>
            </div>

            {/* System 2 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-zinc-800">Database Replica Sync</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                Synchronized
              </span>
            </div>

            {/* System 3 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span className="text-xs font-semibold text-zinc-800">Bank Callback Listener</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded uppercase">
                Online
              </span>
            </div>

            {/* System 4 */}
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-150">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-zinc-800">Adapter Failover Switch</span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded uppercase">
                Standby
              </span>
            </div>
          </div>
        </div>

        {/* Worker Threads list */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="space-y-0.5 mb-2">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu size={14} className="text-indigo-600" />
              <span>Clearing Worker Threads</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">Background runners processing QRIS webhooks & retries</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workers.map((worker) => (
              <div key={worker.id} className="p-3 border border-zinc-150 rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs font-extrabold text-zinc-800 font-mono">{worker.name}</span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-semibold uppercase">
                    <span>CPU {worker.cpuUsage}%</span>
                    <span>•</span>
                    <span>MEM {worker.memoryUsage}%</span>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getWorkerStatusColor(worker.status)}`}>
                  {worker.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DYNAMIC LOG EXPLORER TERMINAL */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={14} className="text-indigo-600" />
              <span>Gateway Stdout Stream</span>
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">Real-time system events, validation checks, and callback updates</p>
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-50 border border-zinc-200 text-zinc-500 rounded text-[9px] font-extrabold uppercase">
            <RefreshCw size={10} className="animate-spin" />
            <span>Streaming Live</span>
          </span>
        </div>

        <div className="rounded-lg bg-zinc-950 p-4 border border-zinc-900 font-mono text-[10.5px] leading-relaxed text-zinc-300 h-64 overflow-y-auto space-y-1.5 scrollbar-thin">
          {logs.map((log, index) => {
            let color = 'text-zinc-400';
            if (log.includes('[SUCCESS]')) color = 'text-emerald-400';
            if (log.includes('[CRITICAL]')) color = 'text-rose-400 font-bold';
            if (log.includes('[SYSTEM]')) color = 'text-indigo-400 font-bold';
            if (log.includes('[PENDING]')) color = 'text-amber-400';

            return (
              <div key={index} className={color}>
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
