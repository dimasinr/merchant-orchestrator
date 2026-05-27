'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Merchant, AdapterType, RestApiConfig, UiAutomationConfig } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import {
  Settings,
  Heart,
  Ban,
  Play,
  Mail,
  Plus,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

export default function MerchantRegistryPage() {
  const { merchants, user, updateMerchantStatus, updateMerchantConfig, createMerchant, fetchMerchants } = useStore();
  
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newAdapterType, setNewAdapterType] = useState<AdapterType>('REST_API');

  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    desc: '',
    onConfirm: () => {}
  });

  // State for Editing Config Modal
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [adapterType, setAdapterType] = useState<AdapterType>('REST_API');
  const [restUrl, setRestUrl] = useState('');
  const [restMethod, setRestMethod] = useState<'GET' | 'POST' | 'PUT'>('POST');
  const [restPoll, setRestPoll] = useState(3);
  const [restParamsJson, setRestParamsJson] = useState('{}');
  const [restHeadersJson, setRestHeadersJson] = useState('{}');
  const [uiLoginUrl, setUiLoginUrl] = useState('');
  const [uiDashboardUrl, setUiDashboardUrl] = useState('');
  const [uiSelectorsJson, setUiSelectorsJson] = useState('{}');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenConfig = (m: Merchant) => {
    setEditingMerchant(m);
    setAdapterType(m.adapterType);
    setErrorMsg('');

    if (m.adapterType === 'REST_API') {
      const cfg = m.config as RestApiConfig;
      setRestUrl(cfg.url || '');
      setRestMethod(cfg.method || 'POST');
      setRestPoll(cfg.poll_interval_seconds || 3);
      setRestParamsJson(JSON.stringify(cfg.params || {}, null, 2));
      setRestHeadersJson(JSON.stringify(cfg.headers || {}, null, 2));
    } else {
      const cfg = m.config as UiAutomationConfig;
      setUiLoginUrl(cfg.login_url || '');
      setUiDashboardUrl(cfg.dashboard_url || '');
      setUiSelectorsJson(JSON.stringify(cfg.selectors || {}, null, 2));
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;
    setErrorMsg('');

    try {
      let finalConfig: any = {};
      if (adapterType === 'REST_API') {
        JSON.parse(restParamsJson);
        JSON.parse(restHeadersJson);
        finalConfig = {
          url: restUrl,
          method: restMethod,
          poll_interval_seconds: Number(restPoll),
          params: JSON.parse(restParamsJson),
          headers: JSON.parse(restHeadersJson)
        };
      } else {
        const parsed = JSON.parse(uiSelectorsJson);
        const required = ['username_input', 'password_input', 'submit_button', 'balance_element', 'transaction_row'];
        for (const req of required) {
          if (!parsed[req]) {
            throw new Error(`Automation selectors must contain "${req}" key.`);
          }
        }
        finalConfig = {
          login_url: uiLoginUrl,
          dashboard_url: uiDashboardUrl,
          selectors: parsed
        };
      }

      updateMerchantConfig(editingMerchant.id, adapterType, finalConfig);
      setEditingMerchant(null);
    } catch (err: any) {
      setErrorMsg(`JSON Validation Error: ${err.message || 'Malformed JSON format detected.'}`);
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

  const getStatusBadge = (status: Merchant['status']) => {
    let color = '';
    switch (status) {
      case 'ACTIVE':
        color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'INACTIVE':
        color = 'bg-zinc-50 text-zinc-500 border-zinc-200';
        break;
      case 'SUSPENDED':
        color = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${color}`}>
        {status}
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
        accessorKey: 'health',
        header: 'Telemetry Health',
        cell: ({ row }) => getHealthBadge(row.original.health)
      },
      {
        accessorKey: 'tps',
        header: 'Clearing TPS',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-zinc-800">
            {row.original.tps.toFixed(1)} <span className="text-[9px] text-zinc-400 uppercase font-bold">TPS</span>
          </span>
        )
      },
      {
        accessorKey: 'successRate',
        header: 'Clearing Success %',
        cell: ({ row }) => {
          const rate = row.original.successRate;
          const color = rate > 95 ? 'text-emerald-600' : rate > 80 ? 'text-amber-600' : 'text-rose-600';
          return (
            <span className={`font-mono text-xs font-extrabold ${color}`}>
              {rate}%
            </span>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Routing Status',
        cell: ({ row }) => getStatusBadge(row.original.status)
      },
      {
        id: 'actions',
        header: 'Management Ops',
        cell: ({ row }) => {
          const m = row.original;
          if (user?.role === 'VIEWER') return null;

          return (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Suspend or Activate */}
              {m.status === 'ACTIVE' ? (
                <button
                  onClick={() =>
                    setDialogConfig({
                      isOpen: true,
                      title: 'Suspend Merchant Routing?',
                      desc: `WARNING: This will suspend routing calls for ${m.name} adapter and reject subsequent requests.`,
                      onConfirm: () => updateMerchantStatus(m.id, 'SUSPENDED')
                    })
                  }
                  className="p-1 rounded bg-white border border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all cursor-pointer shadow-3xs"
                  title="Suspend routing"
                >
                  <Ban size={13} />
                </button>
              ) : (
                <button
                  onClick={() =>
                    setDialogConfig({
                      isOpen: true,
                      title: 'Activate Merchant Routing?',
                      desc: `This will resume orchestrating live transactions through ${m.name} adapters.`,
                      onConfirm: () => updateMerchantStatus(m.id, 'ACTIVE')
                    })
                  }
                  className="p-1 rounded bg-white border border-zinc-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer shadow-3xs"
                  title="Activate routing"
                >
                  <Play size={13} />
                </button>
              )}

              {/* Configure Link (Inline Modal Trigger) */}
              <button
                onClick={() => handleOpenConfig(m)}
                className="p-1 rounded bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all cursor-pointer shadow-3xs"
                title="Configure adapter"
              >
                <Settings size={13} />
              </button>
            </div>
          );
        }
      }
    ],
    [user, updateMerchantStatus]
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
            setNewMerchantName('');
            setNewAdapterType('REST_API');
            setErrorMsg('');
          }}
        >
          <Plus size={14} />
          <span>Register Merchant</span>
        </button>
      </PageHeader>

      <DataTable columns={columns} data={merchants} searchKey="name" searchPlaceholder="Search merchants by name..." />

      {/* MODAL CREATE MERCHANT */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-600">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50/50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Register Merchant</h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase">Add a new integration adapter</p>
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
                const success = await createMerchant(newMerchantName, newAdapterType);
                if (success) {
                  setIsCreating(false);
                } else {
                  setErrorMsg('Failed to create merchant. Please try again.');
                }
              }}
              className="p-6 space-y-4"
            >
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

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Initial Adapter Protocol</span>
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
                    onClick={() => setNewAdapterType('UI_AUTOMATION')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      newAdapterType === 'UI_AUTOMATION'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    UI Scraper Bot
                  </button>
                </div>
              </div>

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

      {/* MODAL EDIT CONFIG */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-600">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-150 bg-zinc-50/50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Configure {editingMerchant.name}</h3>
                <p className="text-[10px] text-zinc-400 font-semibold uppercase">Modify Active Integration Gateway Adapter</p>
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
            <form onSubmit={handleSaveConfig} className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* ADAPTER PROTOCOL */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Protocol Integration</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdapterType('REST_API')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      adapterType === 'REST_API'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    REST API Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdapterType('UI_AUTOMATION')}
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                      adapterType === 'UI_AUTOMATION'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    UI Scraper Bot
                  </button>
                </div>
              </div>

              {adapterType === 'REST_API' ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Callback URL</label>
                      <input
                        type="url"
                        required
                        value={restUrl}
                        onChange={(e) => setRestUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Method</label>
                      <select
                        value={restMethod}
                        onChange={(e) => setRestMethod(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="GET">GET</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Static Query Params (JSON)</label>
                      <textarea
                        rows={4}
                        value={restParamsJson}
                        onChange={(e) => setRestParamsJson(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">HTTP Headers (JSON)</label>
                      <textarea
                        rows={4}
                        value={restHeadersJson}
                        onChange={(e) => setRestHeadersJson(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Bot Login URL</label>
                      <input
                        type="url"
                        required
                        value={uiLoginUrl}
                        onChange={(e) => setUiLoginUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Target Dashboard URL</label>
                      <input
                        type="url"
                        required
                        value={uiDashboardUrl}
                        onChange={(e) => setUiDashboardUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Automation Web Selectors (JSON)</label>
                    <textarea
                      rows={5}
                      value={uiSelectorsJson}
                      onChange={(e) => setUiSelectorsJson(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-zinc-200 bg-white text-[11px] text-zinc-800 font-mono leading-normal focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

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
                  <span>Apply Config Changes</span>
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
        type="warning"
        confirmLabel="Confirm Status Change"
      />
    </div>
  );
}
