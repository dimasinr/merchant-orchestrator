'use client';

import React from 'react';
import { TransactionStatus } from '@/types';

interface StatusBadgeProps {
  status: TransactionStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = '';
  let textClass = '';
  let borderClass = '';
  let dotClass = '';
  let label: string = status;

  switch (status) {
    case 'RECEIVED':
      bgClass = 'bg-slate-50';
      textClass = 'text-slate-600';
      borderClass = 'border-slate-200';
      dotClass = 'bg-slate-400';
      label = 'Received';
      break;
    case 'AWAITING_PAYMENT':
      bgClass = 'bg-amber-50';
      textClass = 'text-amber-700';
      borderClass = 'border-amber-200/80';
      dotClass = 'bg-amber-500 animate-pulse';
      label = 'Awaiting Payment';
      break;
    case 'PAYMENT_CONFIRMED':
      bgClass = 'bg-sky-50';
      textClass = 'text-sky-700';
      borderClass = 'border-sky-200/80';
      dotClass = 'bg-sky-500';
      label = 'Payment Confirmed';
      break;
    case 'ACCEPT_SUBMITTING':
      bgClass = 'bg-indigo-50';
      textClass = 'text-indigo-700';
      borderClass = 'border-indigo-200/80';
      dotClass = 'bg-indigo-500 animate-ping';
      label = 'Submitting Adapter';
      break;
    case 'COMPLETED':
      bgClass = 'bg-emerald-50';
      textClass = 'text-emerald-700';
      borderClass = 'border-emerald-200/80';
      dotClass = 'bg-emerald-500';
      label = 'Completed';
      break;
    case 'QRIS_EXPIRED':
      bgClass = 'bg-zinc-100';
      textClass = 'text-zinc-500';
      borderClass = 'border-zinc-200';
      dotClass = 'bg-zinc-400';
      label = 'Expired';
      break;
    case 'ACCEPT_FAILED':
      bgClass = 'bg-rose-50';
      textClass = 'text-rose-700';
      borderClass = 'border-rose-200/80';
      dotClass = 'bg-rose-500 animate-pulse';
      label = 'Adapter Failed';
      break;
    case 'MANUAL_REVIEW':
      bgClass = 'bg-purple-50';
      textClass = 'text-purple-700';
      borderClass = 'border-purple-200/80';
      dotClass = 'bg-purple-500 animate-pulse';
      label = 'Manual Review';
      break;
    case 'FAILED':
      bgClass = 'bg-red-50';
      textClass = 'text-red-700';
      borderClass = 'border-red-200/80';
      dotClass = 'bg-red-500';
      label = 'Failed';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold border rounded-full ${bgClass} ${textClass} ${borderClass} select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </span>
  );
}
