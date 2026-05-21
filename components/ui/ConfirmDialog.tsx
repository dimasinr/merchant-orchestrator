'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  type = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getTypeStyle = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="text-red-500" size={24} />,
          buttonBg: 'bg-red-600 hover:bg-red-500 shadow-red-600/10',
          border: 'border-red-900/50',
          lightBg: 'bg-red-950/20'
        };
      case 'info':
        return {
          icon: <Info className="text-indigo-400" size={24} />,
          buttonBg: 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10',
          border: 'border-indigo-900/50',
          lightBg: 'bg-indigo-950/20'
        };
      default: // warning
        return {
          icon: <AlertTriangle className="text-amber-500" size={24} />,
          buttonBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/10',
          border: 'border-amber-900/50',
          lightBg: 'bg-amber-950/20'
        };
    }
  };

  const style = getTypeStyle();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div
        className={`w-full max-w-md bg-zinc-900 border ${style.border} rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200`}
      >
        {/* Top bar with close */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-zinc-800/60 bg-zinc-950/20">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Security & Confirmation
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${style.border} ${style.lightBg}`}>
            {style.icon}
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">{description}</p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-950/40 border-t border-zinc-800/60">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all ${style.buttonBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
