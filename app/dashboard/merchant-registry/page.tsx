'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Store, CheckCircle, Clock } from 'lucide-react';

type MockRegistry = {
  id: string;
  name: string;
  businessType: string;
  contactEmail: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  registeredAt: string;
};

const MOCK_REGISTRY_DATA: MockRegistry[] = [
  {
    id: 'reg-001',
    name: 'PT Maju Bersama',
    businessType: 'Retail',
    contactEmail: 'contact@majubersama.co.id',
    status: 'VERIFIED',
    registeredAt: '2026-05-20T10:00:00Z'
  },
  {
    id: 'reg-002',
    name: 'Sentosa Electronics',
    businessType: 'Electronics',
    contactEmail: 'admin@sentosa.id',
    status: 'PENDING',
    registeredAt: '2026-05-25T14:30:00Z'
  },
  {
    id: 'reg-003',
    name: 'Global Fresh Market',
    businessType: 'F&B',
    contactEmail: 'hello@globalfresh.com',
    status: 'PENDING',
    registeredAt: '2026-05-26T09:15:00Z'
  }
];

export default function MerchantRegistryPendingPage() {
  const columns = useMemo<ColumnDef<MockRegistry>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Business Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center text-zinc-500">
              <Store size={14} />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-zinc-900 text-xs">{row.original.name}</span>
              <span className="text-[10px] text-zinc-500 font-medium">{row.original.contactEmail}</span>
            </div>
          </div>
        )
      },
      {
        accessorKey: 'businessType',
        header: 'Category',
        cell: ({ row }) => (
          <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded uppercase tracking-wide">
            {row.original.businessType}
          </span>
        )
      },
      {
        accessorKey: 'registeredAt',
        header: 'Registration Date',
        cell: ({ row }) => {
          const date = new Date(row.original.registeredAt);
          return (
            <span className="font-mono text-xs text-zinc-500">
              {date.toLocaleDateString()}
            </span>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Verification Status',
        cell: ({ row }) => {
          const status = row.original.status;
          if (status === 'VERIFIED') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle size={10} /> Verified
              </span>
            );
          }
          if (status === 'PENDING') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                <Clock size={10} /> Pending Review
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
              Rejected
            </span>
          );
        }
      }
    ],
    []
  );

  return (
    <div className="space-y-6 text-zinc-650">
      <PageHeader
        title="Merchant Registry"
      />

      <DataTable 
        columns={columns} 
        data={MOCK_REGISTRY_DATA} 
        searchKey="name" 
        searchPlaceholder="Search prospective merchants..." 
      />
    </div>
  );
}
