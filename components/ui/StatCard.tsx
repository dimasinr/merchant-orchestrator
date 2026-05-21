'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number | string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, description, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white border border-zinc-200/80 rounded-xl p-5 flex flex-col relative overflow-hidden shadow-xs ${className}`}>
      {/* Background radial highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-150 flex items-center justify-center text-zinc-600">
          <Icon size={15} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-none">{value}</span>
        {trend && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/60' : 'bg-rose-50 text-rose-600 border border-rose-100/60'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-zinc-400 mt-2 font-medium">{description}</p>}
    </div>
  );
}
