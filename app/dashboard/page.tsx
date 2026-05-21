'use client';

import React from 'react';
import { useStore } from '../../store';
import { StatCard } from '../../components/ui/StatCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Activity,
  Cpu,
  Clock,
  CheckCircle2,
  ArrowRight,
  Code,
  Check,
  Copy,
  Terminal,
  Database
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const { transactions, metrics, workers } = useStore();
  const [copied, setCopied] = React.useState(false);

  const sdkCode = `<!-- Step 1: Inject Orchestrator QRIS SDK Script -->
<script src="https://sdk.paymentorchestrator.com/qris.js" 
        data-merchant-id="mer-001" 
        data-env="sandbox"></script>

<script>
  // Step 2: Initialize & Trigger QRIS Payment Flow
  QrisPay.createPayment({
    amount: 150000,
    referenceId: "REF-20260518-9912",
    customerName: "Budi Santoso",
    customerEmail: "budi@email.com"
  }).then(payment => {
    // Shows the floating QRIS popup screen dynamically
    QrisPay.showPaymentUI(payment.qrCodeData);
  }).catch(error => {
    console.error("Payment generation aborted:", error);
  });
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sdkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter only QRIS transactions
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const formattedVolume = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalVolume);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 select-none text-zinc-600">
      <PageHeader
        title="Payment Gateway Console"
        description="Real-time control panel for active QRIS transactions, merchant adapters, and SDK endpoints."
      />

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Overall Success Rate"
          value={`${metrics.successRate24h}%`}
          icon={CheckCircle2}
          description="Average QRIS transaction success rate"
          trend={{ value: '0.4%', isPositive: true }}
        />
        <StatCard
          title="Active Throughput"
          value={`${metrics.currentTps} TPS`}
          icon={Activity}
          description="Average queries processed per second"
          trend={{ value: '1.2 TPS', isPositive: true }}
        />
        <StatCard
          title="Avg Latency"
          value={`${metrics.averageLatencyMs} ms`}
          icon={Clock}
          description="Gateway response and clearing lag"
          trend={{ value: '12ms', isPositive: false }}
        />
        <StatCard
          title="Clearing Volume"
          value={formattedVolume}
          icon={Database}
          description="Total processed QRIS volume"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: SDK Script Inject Guide */}
        <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Code size={14} className="text-indigo-600" />
                <span>QRIS SDK Integration Script</span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Inject this script inside your client website for quick payment checkout</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-zinc-200 hover:bg-zinc-50 text-[10px] font-bold text-zinc-600 transition-all cursor-pointer"
            >
              {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
              <span>{copied ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>

          <div className="relative rounded-lg overflow-hidden bg-zinc-950 p-4 border border-zinc-900 font-mono text-[11px] leading-relaxed text-indigo-300 select-all">
            <div className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-zinc-600 select-none">
              javascript / html
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap">{sdkCode}</pre>
          </div>
        </div>

        {/* Right Col: Simple Live Queue Status */}
        <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-0.5 mb-5">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Queue Metrics</h3>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">Pending transactions & dead-letter queue metrics</p>
          </div>

          <div className="space-y-3.5 flex-1">
            {/* Queue 1: Active */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <Activity size={13} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-800">Active Queue</div>
                  <div className="text-[9px] text-zinc-400">Processing live requests</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-indigo-600 font-mono">{metrics.queueActive}</span>
            </div>

            {/* Queue 2: DLQ */}
            <Link
              href="/dashboard/dlq"
              className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/60 hover:bg-zinc-100/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                  <Terminal size={13} />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-800 group-hover:text-indigo-600 transition-all">Dead Letter (DLQ)</div>
                  <div className="text-[9px] text-zinc-400">Failed callbacks held</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-rose-600 font-mono">{metrics.queueFailed}</span>
            </Link>
          </div>

          <div className="border-t border-zinc-150 pt-4 mt-5">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
              <span>Clearing Engine Workers</span>
              <span className="text-zinc-800 font-extrabold font-mono">{workers.filter(w => w.status === 'ACTIVE').length} / {workers.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE TRANSACTION STREAM */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-zinc-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Live QRIS Ingestion Stream</h3>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase">Real-time WebSocket transaction activities</p>
          </div>
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-500 transition-all uppercase tracking-wider"
          >
            <span>View All Registry</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-hidden border border-zinc-200 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider select-none">
                  <th className="px-5 py-3">Reference ID</th>
                  <th className="px-5 py-3">Merchant</th>
                  <th className="px-5 py-3">Payment Method</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white text-zinc-600 font-medium">
                {recentTransactions.map((tx) => {
                  const amtStr = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0
                  }).format(tx.amount);
                  const time = new Date(tx.createdAt);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-zinc-50/40 transition-all"
                    >
                      <td className="px-5 py-3.5 font-bold text-zinc-900 font-mono text-xs select-all">
                        {tx.referenceId}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 font-semibold">{tx.merchantName}</td>
                      <td className="px-5 py-3.5 font-mono text-zinc-400">
                        <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-zinc-900 font-mono">{amtStr}</td>
                      <td className="px-5 py-3.5 text-zinc-400 font-mono">
                        {time.toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
