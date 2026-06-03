'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { canExecuteGatewayActions } from '@/lib/permissions';
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

type TransactionDetailViewProps = {
  referenceId: string;
  basePath: '/dashboard' | '/merchant';
  readOnly?: boolean;
};

export function TransactionDetailView({ referenceId, basePath, readOnly = false }: TransactionDetailViewProps) {
  const router = useRouter();
  const {
    transactions,
    user,
    fetchTransactionByReference,
    retryTransaction,
    forceCompleteTransaction,
    forceFailTransaction,
    sendToManualReview
  } = useStore();

  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setDetailLoading(true);
    fetchTransactionByReference(referenceId).finally(() => {
      if (active) setDetailLoading(false);
    });
    return () => {
      active = false;
    };
  }, [referenceId, fetchTransactionByReference]);

  const transaction = transactions.find(
    (t) => t.referenceId === referenceId || t.id === referenceId
  );

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

  const [logSearch, setLogSearch] = useState('');
  const [logSeverity, setLogSeverity] = useState<string>('ALL');

  const showActions = !readOnly && user && canExecuteGatewayActions(user.role);

  if (detailLoading && !transaction) {
    return (
      <div className="min-h-[300px] flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
        Loading transaction detail...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="space-y-4">
        <PageHeader title="Transaction Not Found" description="The requested transaction could not be loaded from the API." />
        <Link
          href={`${basePath}/transactions`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-650 hover:text-indigo-500 transition-all uppercase"
        >
          <ArrowLeft size={14} />
          <span>Return to transactions</span>
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
    setDialogConfig({ isOpen: true, type, title, desc, onConfirm: actionFn });
  };

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(transaction.amount);

  const filteredLogs = transaction.logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.component.toLowerCase().includes(logSearch.toLowerCase());
    const matchesSeverity = logSeverity === 'ALL' || log.severity.toUpperCase() === logSeverity.toUpperCase();
    return matchesSearch && matchesSeverity;
  });

  const ref = transaction.referenceId;

  return (
    <div className="space-y-6 select-none text-zinc-600">
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
              REF: {ref}
            </span>
            <StatusBadge status={transaction.status} />
          </div>
          {transaction.cashinReferenceNo && (
            <p className="text-[10px] text-zinc-500 mt-1 font-mono">Cashin: {transaction.cashinReferenceNo}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                  <div className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wide">Error Message</div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">{transaction.errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          <JsonViewer data={transaction.payload} title="Webhook / Payload" />

          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col font-mono text-xs shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/50 gap-2">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-zinc-500" />
                <span className="text-zinc-700 font-extrabold select-none text-[10px] uppercase tracking-wider">
                  Trace Logs (API)
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-white border border-zinc-200 rounded px-2.5 py-0.5 text-[10px] text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 font-sans font-semibold"
                />
                <select
                  value={logSeverity}
                  onChange={(e) => setLogSeverity(e.target.value)}
                  className="bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-[10px] text-zinc-700 font-sans font-semibold cursor-pointer"
                >
                  <option value="ALL">All</option>
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-zinc-950 text-[11px] font-mono leading-relaxed max-h-72 overflow-y-auto space-y-1.5">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 hover:bg-zinc-900/40 p-1 rounded">
                    <span className="text-zinc-600 shrink-0 text-[10px]">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-zinc-500 shrink-0 font-bold">[{log.component}]</span>
                    <span className="text-zinc-300">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-600 text-[10px] uppercase font-bold">No logs</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {showActions && ['ACCEPT_FAILED', 'MANUAL_REVIEW', 'AWAITING_PAYMENT', 'FAILED'].includes(transaction.status) && (
            <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Gateway Controls</h3>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() =>
                    handleActionClick('info', 'Retry transaction?', 'POST /transactions/{id}/actions — retry', () =>
                      retryTransaction(ref)
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer"
                >
                  <RotateCw size={14} />
                  <span>Retry</span>
                </button>
                {user?.role === 'SUPER_ADMIN' && (
                  <>
                    <button
                      onClick={() =>
                        handleActionClick('warning', 'Force complete?', 'Marks transaction as completed.', () =>
                          forceCompleteTransaction(ref)
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-200 text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span>Force Complete</span>
                    </button>
                    <button
                      onClick={() =>
                        handleActionClick('danger', 'Force fail?', 'Permanently fails the transaction.', () =>
                          forceFailTransaction(ref)
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-200 text-xs font-bold cursor-pointer"
                    >
                      <XCircle size={14} className="text-rose-600" />
                      <span>Force Fail</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() =>
                    handleActionClick('warning', 'Manual review?', 'Escalates to manual review queue.', () =>
                      sendToManualReview(ref)
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-zinc-200 text-xs font-bold cursor-pointer"
                >
                  <AlertTriangle size={14} className="text-purple-600" />
                  <span>Manual Review</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-5">Lifecycle</h3>
            {transaction.history.length > 0 ? (
              <Timeline history={transaction.history} />
            ) : (
              <p className="text-xs text-zinc-400">No lifecycle data from API.</p>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        description={dialogConfig.desc}
        type={dialogConfig.type}
        confirmLabel="Confirm"
      />
    </div>
  );
}
