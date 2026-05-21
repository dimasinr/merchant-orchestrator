'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store';
import {
  QrCode,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';

export default function PublicPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const txId = params.id as string;
  const { transactions, updateTransactionStatus } = useStore();

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (!txId) return;

    const fetchStatus = () => {
      fetch(`/api/transactions/${txId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then((data) => {
          setTransaction(data);
          setLoading(false);
        })
        .catch((err) => {
          // Try store fallback first
          const storeTx = transactions.find((t) => t.id === txId);
          if (storeTx) {
            setTransaction(storeTx);
          } else {
            // Dummy transaction for simulation when none exists
            const dummyTx = {
              id: txId,
              merchantName: 'Demo Merchant (Dummy)',
              amount: 50000,
              currency: 'IDR',
              // referenceId: 'DUMMY-REF-001',
              referenceId : "DUMMY-REF-001-8F3A9C27XKLMN2026ZXCVB998877665544332211ABCDEFFEDCBA1234567890QWERTYUIOPASDFGHJKL",
              status: 'AWAITING_PAYMENT',
              paymentMethod: 'QRIS',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setTransaction(dummyTx);
          }
          setLoading(false);
        });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [txId, transactions]);

  // Expiry Timer (15 minutes countdown)
  useEffect(() => {
    if (!transaction || (transaction.status !== 'RECEIVED' && transaction.status !== 'AWAITING_PAYMENT')) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          updateStatusApi('QRIS_EXPIRED', 'Payment window expired (Simulator timeout)');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transaction]);

  // Post success event to parent window when completed
  useEffect(() => {
    if (transaction && transaction.status === 'COMPLETED') {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'QRIS_PAYMENT_SUCCESS', transactionId: txId }, '*');
      }
    }
  }, [transaction, txId]);

  // Update transaction status helper
  const updateStatusApi = async (status: string, message: string) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message })
      });

      // Update local Zustand store too if the transaction exists there
      if (transactions.some((t) => t.id === txId)) {
        updateTransactionStatus(txId, status as any, message);
      }

      if (res.ok) {
        const data = await res.json();
        setTransaction(data);
      }
    } catch (err) {
      console.error('Failed to update status via API:', err);
      // Fallback to Zustand only
      updateTransactionStatus(txId, status as any, message);
      const storeTx = transactions.find((t) => t.id === txId);
      if (storeTx) {
        setTransaction(storeTx);
      }
    }
  };

  // Format Time: MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSimulatePayment = () => {
    if (!transaction) return;

    // Step 1: Confirmed
    updateStatusApi('PAYMENT_CONFIRMED', 'Customer scanned QRIS and completed payment (Simulation)');

    // Step 2: Auto progress
    setTimeout(() => {
      updateStatusApi('ACCEPT_SUBMITTING', 'Submitting confirmation callback to merchant host');

      setTimeout(() => {
        updateStatusApi('COMPLETED', 'Payment successfully settled with merchant backend adapters.');
      }, 1500);
    }, 2000);
  };

  const handleSimulateExpiry = () => {
    if (!transaction) return;
    updateStatusApi('QRIS_EXPIRED', 'Transaction expired manually by simulator user');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="text-indigo-500 animate-spin" size={32} />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading payment session...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans select-none">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700/60 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <AlertTriangle className="text-amber-500 mx-auto" size={48} />
          <h2 className="text-lg font-bold">Transaction Not Found</h2>
          <p className="text-xs text-slate-400">The requested payment session ID is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(transaction.amount);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans select-none relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Content */}
      <div className="w-full max-w-md bg-slate-900/65 backdrop-blur-md border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between flex-1 max-h-[850px] relative z-10">

        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-850 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-indigo-600/25">
              <QrCode size={16} />
            </div>
            <div>
              <h1 className="text-xs font-black uppercase tracking-wider text-slate-200">QRIS</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold font-mono">
            <Lock size={10} className="text-indigo-400" />
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="my-5 p-4 rounded-2xl bg-slate-850/60 border border-slate-800/40 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{transaction.merchantName}</p>
          <p className="text-3xl font-extrabold text-white tracking-tight font-mono">{formattedAmount}</p>
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-semibold font-mono">
            <span>REF ID: {transaction.referenceId}</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase">{transaction.paymentMethod}</span>
          </div>
        </div>

        {/* Dynamic Payment State UI */}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          {/* STATE 1: Awaiting Payment */}
          {(transaction.status === 'RECEIVED' || transaction.status === 'AWAITING_PAYMENT') && (
            <div className="w-full flex flex-col items-center text-center space-y-5">

              {/* Expiry Timer banner */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono">
                <Clock size={13} className="animate-pulse" />
                <span>Expires in {formatTime(timeLeft)}</span>
              </div>

              {/* QRIS SVG Box */}
              <div className="relative p-5 bg-white rounded-2xl border border-slate-200 shadow-xl max-w-[240px] w-full">

                {/* QRIS Branding Headers */}
                <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-1.5">
                  <span className="text-[9px] font-black text-slate-800 tracking-wider">QRIS</span>
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E52A2C]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1AA9E3]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
                  </div>
                </div>

                {/* QR Grid Pattern */}
                <div className="w-full aspect-square bg-slate-50 rounded flex items-center justify-center relative overflow-hidden p-2">

                  {/* QR Code generated dynamically */}
                  <div className="w-full aspect-square flex items-center justify-center bg-white p-2">
                    <QRCodeSVG value={transaction.referenceId} size={200} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 max-w-[280px]">
                <p className="text-xs font-bold text-slate-350 flex items-center justify-center gap-1.5">
                  <Smartphone size={13} className="text-indigo-400" />
                  <span>Scan with your Payment App</span>
                </p>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  Support ShopeePay, GoPay, OVO, Dana, LinkAja, and Indonesian Mobile Banking Apps.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: Confirming / Clearing */}
          {(transaction.status === 'PAYMENT_CONFIRMED' || transaction.status === 'ACCEPT_SUBMITTING') && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500 flex items-center justify-center relative">
                <RefreshCw size={24} className="text-indigo-400 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verifying clearing data</h3>
                <p className="text-[10px] text-slate-400 font-medium max-w-xs leading-relaxed">
                  Processing transactions with the partner adapters. Do not close this page.
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: Success */}
          {transaction.status === 'COMPLETED' && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment Completed</h3>
                <p className="text-[10px] text-slate-400 font-medium max-w-xs leading-relaxed">
                  Clearance confirmed. The merchant partner has been notified and your order has been updated.
                </p>
              </div>
            </div>
          )}

          {/* STATE 4: Failure/Expired */}
          {(transaction.status === 'FAILED' || transaction.status === 'QRIS_EXPIRED' || transaction.status === 'ACCEPT_FAILED') && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center">
                <AlertTriangle size={32} className="text-rose-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Payment Expired / Terminated</h3>
                <p className="text-[10px] text-slate-400 font-medium max-w-xs leading-relaxed">
                  The payment window elapsed or was aborted. Please go back to the e-commerce store to re-initiate payment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SIMULATOR TOOLBAR CONTAINER */}
        <div className="border-t border-slate-850 pt-4 mt-4 space-y-3 bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
            <ChevronRight size={10} className="animate-pulse" />
            <span>Developer Simulation Sandbox</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSimulatePayment}
              disabled={transaction.status !== 'RECEIVED' && transaction.status !== 'AWAITING_PAYMENT'}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-650 hover:bg-indigo-600 disabled:opacity-30 disabled:hover:bg-indigo-650 text-[10px] font-black text-white transition-all cursor-pointer shadow-md shadow-indigo-650/15"
            >
              <Smartphone size={13} />
              <span>Simulate Pay</span>
            </button>
            <button
              onClick={handleSimulateExpiry}
              disabled={transaction.status !== 'RECEIVED' && transaction.status !== 'AWAITING_PAYMENT'}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-30 disabled:hover:bg-slate-800 border border-slate-700/50 text-[10px] font-black text-slate-350 transition-all cursor-pointer"
            >
              <Clock size={13} />
              <span>Simulate Expiry</span>
            </button>
          </div>
        </div>

        {/* Footer Security */}
        <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase mt-4">
          <ShieldCheck size={12} className="text-slate-500" />
          <span>Orchestrated</span>
        </div>
      </div>
    </div>
  );
}
