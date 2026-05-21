'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-white tracking-tight">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-xs mt-1.5 leading-relaxed font-medium">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
