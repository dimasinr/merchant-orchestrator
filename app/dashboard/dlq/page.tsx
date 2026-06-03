'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import { canExecuteGatewayActions } from '@/lib/permissions';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Transaction } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { RotateCw, CheckCircle, XCircle, ArrowRight, Database } from 'lucide-react';
import Link from 'next/link';

function DeadLetterQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    transactions,
    user,
    retryTransaction,
    forceCompleteTransaction,
    forceFailTransaction,
    refreshDlq,
    transactionsLoading,
    transactionsError
  } = useStore();

  const isRetryingTab = searchParams.get('type') === 'retrying';

  useEffect(() => {
    refreshDlq(isRetryingTab ? 'retry' : 'dlq');
  }, [isRetryingTab, refreshDlq]);

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

  const handleActionClick = (
    type: 'danger' | 'warning' | 'info',
    title: string,
    desc: string,
    actionFn: () => void
  ) => {
    setDialogConfig({ isOpen: true, type, title, desc, onConfirm: actionFn });
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'referenceId',
        header: 'Reference ID',
        cell: ({ row }) => (
          <span className="font-bold text-zinc-900 font-mono text-xs select-all">{row.original.referenceId}</span>
        )
      },
      {
        accessorKey: 'merchantName',
        header: 'Merchant Client',
        cell: ({ row }) => <span className="text-zinc-600 font-semibold">{row.original.merchantName}</span>
      },
      {
        accessorKey: 'errorMessage',
        header: 'DLQ Error Reason',
        cell: ({ row }) => (
          <div className="max-w-xs truncate text-[11px] text-rose-600 font-semibold" title={row.original.errorMessage || ''}>
            {row.original.errorMessage || '—'}
          </div>
        )
      },
      {
        accessorKey: 'retryProgress',
        header: 'Retry Progress',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-600 font-semibold">
            {row.original.retryProgress ?? `${row.original.retryCount} / ${row.original.maxRetries}`}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Queue Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        id: 'operations',
        header: 'Operator Overrides',
        cell: ({ row }) => {
          const tx = row.original;
          if (!user || !canExecuteGatewayActions(user.role)) return null;

          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() =>
                  handleActionClick('info', 'Retry?', `Retry adapter for ${tx.referenceId}`, () =>
                    retryTransaction(tx.referenceId)
                  )
                }
                className="p-1 rounded bg-white border border-zinc-200 text-indigo-650 hover:bg-zinc-50 cursor-pointer"
                title="Retry"
              >
                <RotateCw size={13} />
              </button>
              {user.role === 'SUPER_ADMIN' && (
                <>
                  <button
                    onClick={() =>
                      handleActionClick('warning', 'Force complete?', `Force complete ${tx.referenceId}`, () =>
                        forceCompleteTransaction(tx.referenceId)
                      )
                    }
                    className="p-1 rounded bg-white border border-zinc-200 text-emerald-600 hover:bg-zinc-50 cursor-pointer"
                  >
                    <CheckCircle size={13} />
                  </button>
                  <button
                    onClick={() =>
                      handleActionClick('danger', 'Force fail?', `Force fail ${tx.referenceId}`, () =>
                        forceFailTransaction(tx.referenceId)
                      )
                    }
                    className="p-1 rounded bg-white border border-zinc-200 text-rose-600 hover:bg-zinc-50 cursor-pointer"
                  >
                    <XCircle size={13} />
                  </button>
                </>
              )}
              <Link
                href={`/dashboard/transactions/${encodeURIComponent(tx.referenceId)}`}
                className="p-1 rounded bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 ml-1.5"
              >
                <ArrowRight size={13} />
              </Link>
            </div>
          );
        }
      }
    ],
    [user, retryTransaction, forceCompleteTransaction, forceFailTransaction]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dead Letter Queue Operations"
        description="Failed transactions and retry queue from API (admin scope)."
      />

      <div className="flex border-b border-zinc-200 mb-5 text-xs font-bold text-zinc-400 uppercase">
        <Link
          href="/dashboard/dlq"
          className={`px-4 py-2.5 border-b-2 ${!isRetryingTab ? 'border-rose-600 text-rose-600' : 'border-transparent'}`}
        >
          DLQ Listing
        </Link>
        <Link
          href="/dashboard/dlq?type=retrying"
          className={`px-4 py-2.5 border-b-2 ${isRetryingTab ? 'border-indigo-600 text-indigo-600' : 'border-transparent'}`}
        >
          Active Retry Queue
        </Link>
      </div>

      {transactionsError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold">
          {transactionsError}
        </div>
      )}

      {transactionsLoading ? (
        <p className="text-xs text-zinc-400 text-center py-12 animate-pulse uppercase font-bold">Loading queue...</p>
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          searchKey="referenceId"
          searchPlaceholder="Filter by reference ID..."
          onRowClick={(tx) => router.push(`/dashboard/transactions/${encodeURIComponent(tx.referenceId)}`)}
        />
      )}

      {!isRetryingTab && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex gap-3 shadow-xs">
          <Database className="text-zinc-400 shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-zinc-500 leading-relaxed font-medium">
            Gateway actions use POST /transactions/{'{id}'}/actions (retry, force_complete, force_fail, manual_review).
          </p>
        </div>
      )}

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

export default function DeadLetterQueuePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
          Synchronizing Dead-Letter Queues...
        </div>
      }
    >
      <DeadLetterQueueContent />
    </Suspense>
  );
}
