'use client';

import React from 'react';
import { TransactionHistoryEntry, TransactionStatus } from '../../types';
import { Check, AlertCircle, RefreshCw, Clock } from 'lucide-react';

interface TimelineProps {
  history: TransactionHistoryEntry[];
}

export function Timeline({ history }: TimelineProps) {
  // Sort history by timestamp ascending
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Check size={14} className="text-emerald-400" />;
      case 'FAILED':
      case 'ACCEPT_FAILED':
      case 'QRIS_EXPIRED':
        return <AlertCircle size={14} className="text-red-400" />;
      case 'ACCEPT_SUBMITTING':
        return <RefreshCw size={14} className="text-indigo-400 animate-spin" />;
      default:
        return <Clock size={14} className="text-amber-400" />;
    }
  };

  const getStatusColorClass = (status: TransactionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-emerald-500/10 shadow-md';
      case 'FAILED':
      case 'ACCEPT_FAILED':
      case 'QRIS_EXPIRED':
        return 'border-red-500 bg-red-950/40 text-red-400 shadow-red-500/10 shadow-md';
      case 'ACCEPT_SUBMITTING':
        return 'border-indigo-500 bg-indigo-950/40 text-indigo-400 shadow-indigo-500/10 shadow-md';
      case 'MANUAL_REVIEW':
        return 'border-purple-500 bg-purple-950/40 text-purple-400 shadow-purple-500/10 shadow-md';
      default:
        return 'border-amber-500 bg-amber-950/40 text-amber-400 shadow-amber-500/10 shadow-md';
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-zinc-800">
      {sortedHistory.map((step, idx) => {
        const stepDate = new Date(step.timestamp);
        const isLast = idx === sortedHistory.length - 1;

        return (
          <div key={idx} className="relative flex flex-col md:flex-row md:items-start gap-4">
            {/* Stepper Node Icon */}
            <div
              className={`absolute -left-[27px] w-6 h-6 rounded-full border flex items-center justify-center z-10 ${getStatusColorClass(
                step.status
              )}`}
            >
              {getStatusIcon(step.status)}
            </div>

            {/* Stepper Content */}
            <div className="flex-1 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 shadow-sm relative">
              {isLast && (
                <div className="absolute top-0 right-4 -translate-y-1/2 bg-indigo-600 text-white font-bold rounded-full px-2 py-0.5 text-[8px] uppercase tracking-wider shadow">
                  Current State
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wide">
                  {step.status.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                  {stepDate.toLocaleDateString()} {stepDate.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                {step.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
