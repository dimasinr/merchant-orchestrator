'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-5 mb-6">
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="text-xs text-zinc-500 font-medium">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
}
