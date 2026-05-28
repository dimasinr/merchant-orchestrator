'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Merchant, AdapterType } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import {
  Settings,
  Heart,
  Mail,
  Plus,
  X,
  Save,
  AlertCircle,
  Trash2
} from 'lucide-react';

export default function MerchantRegistryPage() {
  const { merchants, user, deleteMerchant, updateMerchantConfig, createMerchant, fetchMerchants } = useStore();
  
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);
  
  // ── Create Modal State ──
  const [isCreating, setIsCreating] = useState(false);
  const [newMerchantId, setNewMerchantId] = useState('');
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newAdapterType, setNewAdapterType] = useState('REST_API');
  const [newCredentials, setNewCredentials] = useState('');
  const [newPullConfig, setNewPullConfig] = useState('');
  const [newPushConfig, setNewPushConfig] = useState('');

  // ── Edit Modal State ──
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [editMerchantId, setEditMerchantId] = useState('');
  const [editMerchantName, setEditMerchantName] = useState('');
  const [editAdapterType, setEditAdapterType] = useState('REST_API');
  const [editCredentials, setEditCredentials] = useState('');
  const [editPullConfig, setEditPullConfig] = useState('');
  const [editPushConfig, setEditPushConfig] = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    confirmLabel?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    desc: '',
    confirmLabel: 'Confirm Action',
    type: 'warning',
    onConfirm: () => {}
  });

  // ── Open Edit Modal ──
  const handleOpenEdit = (m: Merchant) => {
    setEditingMerchant(m);
    setEditMerchantId(m.id);
    setEditMerchantName(m.name);
    setEditAdapterType(m.adapterType || 'REST_API');
    setEditCredentials('');
    setEditPullConfig(
      (m.adapterType === 'UI_AUTOMATION' || m.adapterType === 'UI_BOT') && m.config
        ? JSON.stringify(m.config, null, 2)
        : ''
    );
    setEditPushConfig(
      m.adapterType === 'REST_API' && m.config
        ? JSON.stringify(m.config, null, 2)
        : ''
    );
    setErrorMsg('');
  };

  // ── Save Edit ──
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;
    setErrorMsg('');

    // Validate JSON fields if provided
    try {
      if (editPullConfig.trim()) JSON.parse(editPullConfig);
    } catch {
      setErrorMsg('Pull Config must be valid JSON.');
      return;
    }
    try {
      if (editPushConfig.trim()) JSON.parse(editPushConfig);
    } catch {
      setErrorMsg('Push Config must be valid JSON.');
      return;
    }

    try {
      await updateMerchantConfig(editingMerchant.id, editAdapterType as AdapterType, {
        merchant_id: editMerchantId,
        merchant_name: editMerchantName,
        adapter_type: editAdapterType,
        credentials: editCredentials,
        pull_config: editPullConfig || '{}',
        push_config: editPushConfig || '{}'
      });
      setEditingMerchant(null);
    } catch (err: any) {
      setErrorMsg(`Failed to update merchant: ${err.message || 'Unknown error'}`);
    }
  };

  const getHealthBadge = (health: Merchant['health']) => {
    let color = '';
    switch (health) {
      case 'HEALTHY':
        color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'DEGRADED':
        color = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'UNHEALTHY':
        color = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
        break;
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${color}`}>
        <Heart size={10} className="fill-current" />
        {health}
      </span>
    );
  };
  // Define column definitions
  const columns = useMemo<ColumnDef<Merchant>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Merchant Name',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-extrabold text-zinc-900 text-xs select-all">{row.original.name}</span>
            <span className="text-[10px] text-zinc-400 font-semibold font-mono flex items-center gap-1 mt-0.5">
              <Mail size={10} className="text-zinc-400" />
              {row.original.id}
            </span>
          </div>
        )
      },
      {
        accessorKey: 'adapterType',
        header: 'Active Adapter',
        cell: ({ row }) => (
          <span className="font-mono text-[9px] font-extrabold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded uppercase tracking-wide">
            {row.original.adapterType}
          </span>
        )
      },
      {
        id: 'actions',
        header: 'Management Ops',
        cell: ({ row }) => {
          const m = row.original;
          if (user?.role === 'VIEWER') return null;

          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Edit Merchant */}
              <button
                onClick={() => handleOpenEdit(m)}
                className="p-1 rounded bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer shadow-3xs"
                title="Edit merchant"
              >
                <Settings size={13} />
              </button>
              {/* Delete Merchant */}
              <button
                onClick={() =>
                  setDialogConfig({
                    isOpen: true,
                    title: 'Delete Merchant?',
                    desc: `WARNING: This will permanently delete ${m.name} and remove its integration config.`,
                    confirmLabel: 'Delete Merchant',
                    type: 'danger',
                    onConfirm: () => deleteMerchant(m.id)
                  })
                }
                className="p-1 rounded bg-white border border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer shadow-3xs"
                title="Delete merchant"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        }
      }
    ],
    [user, deleteMerchant]
  );

  return (
    <div className="space-y-6 text-zinc-650">
      <PageHeader
        title="Merchant Management"
        description="Monitor status, traffic rates, success analytics, and system adapters of active merchant connections."
      >
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
          onClick={() => {
            setIsCreating(true);
            setNewMerchantId('');
            setNewMerchantName('');
            setNewAdapterType('REST_API');
            setNewCredentials('');
            setNewPullConfig('');
            setNewPushConfig('');
            setErrorMsg('');
          }}
        >
          <Plus size={14} />
          <span>Register Merchant</span>
        </button>
      </PageHeader>

      <DataTable columns={columns} data={merchants} searchKey="name" searchPlaceholder="Search merchants by name..." />

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL CREATE MERCHANT                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-600">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50/50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Register Merchant</h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase">Add a new merchant integration</p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="px-6 pt-4">
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMsg('');

                // Validate JSON fields if provided
                try {
                  if (newPullConfig.trim()) JSON.parse(newPullConfig);
                } catch {
                  setErrorMsg('Pull Config must be valid JSON.');
                  return;
                }
                try {
                  if (newPushConfig.trim()) JSON.parse(newPushConfig);
                } catch {
                  setErrorMsg('Push Config must be valid JSON.');
                  return;
                }

                const success = await createMerchant(newMerchantName, newAdapterType as AdapterType, {
                  merchant_id: newMerchantId,
                  merchant_name: newMerchantName,
                  adapter_type: newAdapterType,
                  credentials: newCredentials,
                  pull_config: newPullConfig || '{}',
                  push_config: newPushConfig || '{}'
                });
                if (success) {
                  setIsCreating(false);
                } else {
                  setErrorMsg('Failed to create merchant. Please try again.');
                }
              }}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Merchant ID */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Merchant ID</label>
                <input
                  type="text"
                  required
                  value={newMerchantId}
                  onChange={(e) => setNewMerchantId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                  placeholder="e.g. mer-tokopedia-001"
                />
              </div>

              {/* Merchant Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Merchant Name</label>
                <input
                  type="text"
                  required
                  value={newMerchantName}
                  onChange={(e) => setNewMerchantName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  placeholder="e.g. Tokopedia E-Commerce"
                />
              </div>

              {/* Adapter Type */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Adapter Type</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAdapterType('REST_API')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      newAdapterType === 'REST_API'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    REST API
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAdapterType('UI_BOT')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      newAdapterType === 'UI_BOT'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    UI_BOT
                  </button>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Credentials</label>
                <textarea
                  rows={3}
                  value={newCredentials}
                  onChange={(e) => setNewCredentials(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                  placeholder="API key, token, or credentials string"
                />
              </div>

              {/* Pull Config & Push Config */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Pull Config (JSON)</label>
                  <textarea
                    rows={4}
                    value={newPullConfig}
                    onChange={(e) => setNewPullConfig(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                    placeholder='{"url": "...", "interval": 30}'
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Push Config (JSON)</label>
                  <textarea
                    rows={4}
                    value={newPushConfig}
                    onChange={(e) => setNewPushConfig(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                    placeholder='{"callback_url": "...", "method": "POST"}'
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-all cursor-pointer shadow-3xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL EDIT MERCHANT                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-600">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50/50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Edit {editingMerchant.name}</h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase">Modify merchant configuration</p>
              </div>
              <button
                onClick={() => setEditingMerchant(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="px-6 pt-4">
                <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Merchant ID (read-only in edit mode) */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Merchant ID</label>
                <input
                  type="text"
                  required
                  readOnly
                  value={editMerchantId}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs text-zinc-500 focus:outline-none font-semibold font-mono cursor-not-allowed"
                />
              </div>

              {/* Merchant Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Merchant Name</label>
                <input
                  type="text"
                  required
                  value={editMerchantName}
                  onChange={(e) => setEditMerchantName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  placeholder="e.g. Tokopedia E-Commerce"
                />
              </div>

              {/* Adapter Type */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Adapter Type</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditAdapterType('REST_API')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      editAdapterType === 'REST_API'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    REST API
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditAdapterType('UI_BOT')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      editAdapterType === 'UI_BOT'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    UI_BOT
                  </button>
                </div>
              </div>

              {/* Credentials */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Credentials</label>
                <textarea
                  rows={3}
                  value={editCredentials}
                  onChange={(e) => setEditCredentials(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                  placeholder="API key, token, or credentials string"
                />
              </div>

              {/* Pull Config & Push Config */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Pull Config (JSON)</label>
                  <textarea
                    rows={4}
                    value={editPullConfig}
                    onChange={(e) => setEditPullConfig(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                    placeholder='{"url": "...", "interval": 30}'
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Push Config (JSON)</label>
                  <textarea
                    rows={4}
                    value={editPushConfig}
                    onChange={(e) => setEditPushConfig(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                    placeholder='{"callback_url": "...", "method": "POST"}'
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-150">
                <button
                  type="button"
                  onClick={() => setEditingMerchant(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-all cursor-pointer shadow-3xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION STATUS POPUP */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        description={dialogConfig.desc}
        type={dialogConfig.type || 'warning'}
        confirmLabel={dialogConfig.confirmLabel || 'Confirm Action'}
      />
    </div>
  );
}
