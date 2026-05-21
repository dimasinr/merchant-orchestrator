'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/ui/Timeline';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft,
  AlertTriangle,
  RotateCw,
  CheckCircle,
  XCircle,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const txId = params.id as string;

  const {
    transactions,
    user,
    retryTransaction,
    forceCompleteTransaction,
    forceFailTransaction,
    sendToManualReview
  } = useStore();

  const transaction = transactions.find((t) => t.id === txId);

  // States for Confirm Dialogs
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    desc: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'warning',
    title: '',
    desc: '',
    onConfirm: () => {}
  });

  // State for Logs Search & Severity Filter
  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState<string>('ALL');

  if (!transaction) {
    return (
      <div className="space-y-4">
        <PageHeader title="Transaction Not Found" description="The requested transaction record could not be fetched or does not exist." />
        <Link href="/dashboard/transactions" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-650 hover:text-indigo-500 transition-all uppercase">
          <ArrowLeft size={14} />
          <span>Return to transactions log</span>
        </Link>
      </div>
    );
  }

  const handleActionClick = (
    type: 'danger' | 'warning' | 'info',
    title: string,
    desc: string,
    actionFn: () => void
  ) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      desc,
      onConfirm: actionFn
    });
  };

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(transaction.amount);

  // Filtering Logs
  const filteredLogs = transaction.logs.filter((log) => {
    const matchesSearch = log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
                          log.component.toLowerCase().includes(logSearch.toLowerCase());
    const matchesSeverity = logSeverity === 'ALL' || log.severity.toUpperCase() === logSeverity.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 select-none text-zinc-600">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 border-b border-zinc-200/80 pb-4">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-950 transition-all cursor-pointer shadow-3xs"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wide uppercase select-all">
              ID: {transaction.id}
            </span>
            <StatusBadge status={transaction.status} />
          </div>
          <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight mt-0.5 select-all">
            REF: {transaction.referenceId}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Summary, Logs trace, Payload (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Details Grid */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4">Core Payment Telemetry</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Settle Amount</span>
                <p className="text-sm font-extrabold text-zinc-900 font-mono mt-0.5">{formattedAmount}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Client Merchant</span>
                <p className="text-xs font-bold text-zinc-700 truncate mt-0.5">{transaction.merchantName}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Gateway Method</span>
                <p className="text-xs font-extrabold text-zinc-700 font-mono mt-0.5 uppercase">{transaction.paymentMethod}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Retry Index</span>
                <p className="text-xs font-extrabold text-zinc-700 font-mono mt-0.5">
                  {transaction.retryCount} / {transaction.maxRetries}
                </p>
              </div>
            </div>

            {transaction.errorMessage && (
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 mt-5 flex gap-3">
                <ShieldAlert className="text-rose-600 shrink-0" size={16} />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wide">Orchestration Error Message</div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">{transaction.errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Webhook JSON Payload */}
          <JsonViewer data={transaction.payload} title="Ingested API Webhook Request Payload" />

          {/* Terminal styled logs viewer */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-xs">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/50 gap-2">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-zinc-500" />
                <span className="text-zinc-700 font-extrabold select-none text-[10px] uppercase tracking-wider">
                  Trace Logs Explorer
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Search */}
                <input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-white border border-zinc-200 rounded px-2.5 py-0.5 text-[10px] text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans font-semibold"
                />

                {/* Severity Dropdown */}
                <select
                  value={logSeverity}
                  onChange={(e) => setLogSeverity(e.target.value)}
                  className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] text-zinc-700 focus:outline-none focus:border-indigo-500 font-sans font-semibold cursor-pointer"
                >
                  <option value="ALL">Severity: All</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Terminal lines */}
            <div className="p-4 bg-zinc-950 text-[11px] font-mono leading-relaxed max-h-72 overflow-y-auto space-y-1.5 scrollbar-thin">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => {
                  const stamp = new Date(log.timestamp);
                  const isErr = log.severity === 'error' || log.severity === 'critical';
                  const isWarn = log.severity === 'warning';

                  let badgeColor = 'text-indigo-400 bg-indigo-950/30 border border-indigo-900/40';
                  if (isErr) badgeColor = 'text-rose-400 bg-rose-950/30 border border-rose-900/40 animate-pulse';
                  if (isWarn) badgeColor = 'text-amber-400 bg-amber-950/30 border border-amber-900/40';

                  return (
                    <div key={idx} className="flex items-start gap-2 hover:bg-zinc-900/40 p-1 rounded transition-all select-text">
                      <span className="text-zinc-600 shrink-0 text-[10px]">
                        [{stamp.toLocaleTimeString()}]
                      </span>
                      <span className={`px-1 rounded text-[9px] font-bold shrink-0 leading-none py-0.5 uppercase tracking-wide ${badgeColor}`}>
                        {log.severity}
                      </span>
                      <span className="text-zinc-500 shrink-0 font-bold">
                        [{log.component}]
                      </span>
                      <span className={`${isErr ? 'text-rose-300 font-semibold' : isWarn ? 'text-amber-300' : 'text-zinc-300'}`}>
                        {log.message}
                      </span>
                      {log.traceId && (
                        <span className="text-[10px] text-zinc-650 ml-auto shrink-0 select-all font-semibold font-mono">
                          trace_id:{log.traceId}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-zinc-600 select-none uppercase font-bold text-[10px] tracking-wider font-mono">
                  No trace logs matching active filters
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Timeline & Operational Controls */}
        <div className="space-y-6">
          {/* ORCHESTRATION ACTIONS */}
          {user && user.role !== 'VIEWER' &&
            ['ACCEPT_FAILED', 'MANUAL_REVIEW', 'AWAITING_PAYMENT'].includes(transaction.status) && (
              <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Adapter Gateway Controls</h3>
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase">Orchestrate transaction manual overrides</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Action 1: Re-trigger Retry */}
                  {['ACCEPT_FAILED', 'MANUAL_REVIEW'].includes(transaction.status) && (
                    <button
                      onClick={() =>
                        handleActionClick(
                          'info',
                          'Trigger Adapter Re-Submission?',
                          'This will command the core engine to re-invoke the partner merchant callback adapter with current payload.',
                          () => retryTransaction(transaction.id)
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/15 transition-all cursor-pointer animate-pulse"
                    >
                      <RotateCw size={14} />
                      <span>Re-Submit Adapter Call</span>
                    </button>
                  )}

                  {/* Action 2: Force Complete */}
                  {user && user.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() =>
                        handleActionClick(
                          'warning',
                          'Force-Complete Transaction?',
                          'WARNING: This will manually flag this transaction as COMPLETED. No money/tickets will be requested via adapter.',
                          () => forceCompleteTransaction(transaction.id)
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white border border-zinc-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-xs font-bold text-zinc-650 transition-all cursor-pointer shadow-3xs"
                    >
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span>Force Settle Completed</span>
                    </button>
                  )}

                  {/* Action 3: Force Fail */}
                  {user && user.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={() =>
                        handleActionClick(
                          'danger',
                          'Abruptly Abort Transaction?',
                          'DANGER: This action is permanent. This will abort payment lifecycle and push transaction to FAILED state.',
                          () => forceFailTransaction(transaction.id)
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white border border-zinc-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-bold text-zinc-650 transition-all cursor-pointer shadow-3xs"
                    >
                      <XCircle size={14} className="text-rose-600" />
                      <span>Force Terminate Failed</span>
                    </button>
                  )}

                  {/* Action 4: Elevate review */}
                  {transaction.status === 'AWAITING_PAYMENT' && (
                    <button
                      onClick={() =>
                        handleActionClick(
                          'warning',
                          'Escalate to Review Queue?',
                          'This will halt any automated payment listening and push the transaction to Manual Review.',
                          () => sendToManualReview(transaction.id)
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white border border-zinc-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-xs font-bold text-zinc-650 transition-all cursor-pointer shadow-3xs"
                    >
                      <AlertTriangle size={14} className="text-purple-600" />
                      <span>Send to Manual Review</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          {/* TIMELINE LIFECYCLE */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-5">Lifecycle Milestones</h3>
            <Timeline history={transaction.history} />
          </div>
        </div>
      </div>

      {/* CONFIRMATION POPUP DIALOG */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        description={dialogConfig.desc}
        type={dialogConfig.type}
        confirmLabel="Confirm Manual Override"
      />
    </div>
  );
}
