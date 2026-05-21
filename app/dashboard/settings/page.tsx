'use client';

import React, { useState } from 'react';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Settings,
  Key,
  Save,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useStore();

  const [timeout, setTimeoutVal] = useState(30);
  const [retries, setRetries] = useState(3);
  const [multiplier, setMultiplier] = useState(2.0);
  const [alertLimit, setAlertLimit] = useState(50);

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const mockApiKey = 'orc_live_7a8f9c0b1d2e3f4a5b6c7d8e9f0a1b2c3d4e';

  const handleCopy = () => {
    navigator.clipboard.writeText(mockApiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmOpen(true);
  };

  const confirmSave = () => {
    setSuccessMsg('Global system settings compiled and pushed to configurations server!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl select-none text-zinc-650">
      <PageHeader
        title="Gateway Orchestrator Settings"
        description="Manage global timeout thresholds, API security tokens, retry backoff engines, and credentials."
      />

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-lg text-xs font-semibold">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: API Keys & Credentials */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Key size={16} />
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Gateway Access Tokens</h3>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase leading-relaxed">
              Active API bearer tokens for client authentication requests.
            </p>

            <div className="space-y-2 font-mono">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Default Live Key</span>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  readOnly
                  value={mockApiKey}
                  className="w-full pl-3 pr-20 py-1.5 rounded-lg border border-zinc-200 bg-white text-[10px] text-zinc-700 focus:outline-none select-all font-mono"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white pl-2">
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all cursor-pointer"
                    title="Copy token"
                  >
                    {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Form Settings */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-indigo-600 border-b border-zinc-100 pb-3">
              <Settings size={16} />
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Engine Configurations</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Global Gateway Timeout (Sec)</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={timeout}
                  onChange={(e) => setTimeoutVal(Number(e.target.value))}
                  className="w-full pl-3 pr-4 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Max Automated Retries</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={retries}
                  onChange={(e) => setRetries(Number(e.target.value))}
                  className="w-full pl-3 pr-4 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Exponential Multiplier</label>
                <input
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  required
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="w-full pl-3 pr-4 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Queue Alert Threshold (Jobs)</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  required
                  value={alertLimit}
                  onChange={(e) => setAlertLimit(Number(e.target.value))}
                  className="w-full pl-3 pr-4 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs text-zinc-800 focus:outline-none focus:border-indigo-500 font-bold font-mono"
                />
              </div>
            </div>

            {/* SAVE BUTTON */}
            {user?.role === 'SUPER_ADMIN' ? (
              <div className="flex justify-end pt-3 border-t border-zinc-100">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  <Save size={14} />
                  <span>Update Global Configurations</span>
                </button>
              </div>
            ) : (
              <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={14} className="text-zinc-400" />
                <span>SUPER ADMIN credentials required to alter system parameters</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* CONFIRMATION POPUP DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmSave}
        title="Deploy System Parameters?"
        description="WARNING: Applying these changes shifts the queue timings and retry backoffs globally for all API callback queues."
        type="warning"
        confirmLabel="Pushed Config changes"
      />
    </div>
  );
}
