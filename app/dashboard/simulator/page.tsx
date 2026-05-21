'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  ShoppingBag,
  CreditCard,
  Smartphone,
  HelpCircle,
  ExternalLink,
  Code,
  CheckCircle2,
  Layers,
  X,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageColor: string;
}

const PRODUCTS: Product[] = [
  { id: 'prod-01', name: 'Caramel Macchiato Nitro', price: 55000, category: 'Beverage', imageColor: 'bg-amber-100 text-amber-800' },
  { id: 'prod-02', name: 'Double Almond Croissant', price: 42000, category: 'Bakery', imageColor: 'bg-orange-100 text-orange-800' },
  { id: 'prod-03', name: 'Avocado Toast Sourdough', price: 68000, category: 'Food', imageColor: 'bg-emerald-100 text-emerald-800' },
  { id: 'prod-04', name: 'Cascara Cherry Cold Brew', price: 38000, category: 'Beverage', imageColor: 'bg-rose-100 text-rose-800' },
];

export default function SimulatorPage() {
  const { merchants, createTransaction, transactions } = useStore();

  // Selection States
  const [selectedMerchantId, setSelectedMerchantId] = useState('mer-001');
  const [integrationMode, setIntegrationMode] = useState<'REDIRECT' | 'IFRAME'>('IFRAME');
  const [cart, setCart] = useState<Record<string, number>>({ 'prod-01': 1, 'prod-02': 1 });

  // Checkout States
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'REDIRECTING' | 'PAYING' | 'SUCCESS'>('CART');
  const [iframeUrl, setIframeUrl] = useState<string>('');

  const activeTx = transactions.find((t) => t.id === activeTxId);

  // Monitor transaction status changes in the global store to handle payment completion
  useEffect(() => {
    if (!activeTxId || !activeTx) return;

    if (activeTx.status === 'COMPLETED') {
      setTimeout(() => {
        setCheckoutStep('SUCCESS');
        // Clear active transaction ID after showing success, but keep details
      }, 1000);
    } else if (activeTx.status === 'QRIS_EXPIRED' || activeTx.status === 'FAILED') {
      setCheckoutStep('CART');
      setActiveTxId(null);
      alert('Simulation Payment Expired / Aborted.');
    }
  }, [transactions, activeTxId, activeTx]);

  // Cart operations
  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) => {
      const copy = { ...prev };
      const current = copy[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        delete copy[id];
      } else {
        copy[id] = next;
      }
      return copy;
    });
  };

  const getCartTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const prod = PRODUCTS.find((p) => p.id === id);
      return total + (prod ? prod.price * qty : 0);
    }, 0);
  };

  const handleCheckout = async () => {
    const totalAmount = getCartTotal();
    if (totalAmount <= 0) return;

    // Create simulated transaction in Zustand store
    const created = await createTransaction(selectedMerchantId, totalAmount, 'QRIS');
    setActiveTxId(created.id);

    if (integrationMode === 'REDIRECT') {
      setCheckoutStep('REDIRECTING');
      setTimeout(() => {
        // Use referenceId if available, fallback to id
        const txIdToUse = created.referenceId || created.id;
        window.open(`/pay/${txIdToUse}`, '_blank');
        setCheckoutStep('PAYING');
      }, 1800);
    } else {
      // Use referenceId for iframe src as well
      const txIdToUse = created.referenceId || created.id;
      setIframeUrl(`/pay/${txIdToUse}`);
      setCheckoutStep('PAYING');
    }
  };

  const handleCloseModal = () => {
    setCheckoutStep('CART');
    setActiveTxId(null);
  };

  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);

  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(getCartTotal());

  const integrationCodeSnippet = integrationMode === 'IFRAME' ?
    `<!-- Option B: Embedded Iframe Widget implementation -->
<div class="iframe-container" style="position: relative; max-width: 400px; height: 600px;">
  <iframe src="https://sdk.paymentorchestrator.com/pay/${activeTxId || 'tx-1006'}" 
          style="width: 100%; height: 100%; border: none; border-radius: 16px;" 
          allow="payment"></iframe>
</div>` :
    `<!-- Option A: Hosted Payment Redirect implementation -->
<a href="https://sdk.paymentorchestrator.com/pay/${activeTxId || 'tx-1006'}" 
   target="_blank" 
   class="checkout-btn">
   Proceed to Hosted Payment Gateway
</a>`;

  return (
    <div className="space-y-6 select-none text-zinc-600">
      <PageHeader
        title="Developer Integration Sandbox"
        description="Simulate real-world merchant checkout workflows. Test redirect page transitions and embedded iframe modal popups."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side: Mock Merchant Website Sandbox (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[620px] relative">

          {/* E-Commerce Brand Navbar */}
          <div className="h-14 bg-zinc-900 px-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500 flex items-center justify-center text-zinc-950 font-black text-xs">
                ☕
              </div>
              <span className="text-xs font-black uppercase tracking-wider">BrewCraft Café</span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wide">
              Simulated Storefront
            </span>
          </div>

          {/* Sandbox settings controls */}
          <div className="bg-zinc-50 border-b border-zinc-200/60 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs shrink-0">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Select Client Merchant</label>
              <select
                value={selectedMerchantId}
                onChange={(e) => setSelectedMerchantId(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 font-semibold text-zinc-700 focus:outline-none cursor-pointer"
              >
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide block">Integration Method</label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/40">
                <button
                  onClick={() => setIntegrationMode('REDIRECT')}
                  className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${integrationMode === 'REDIRECT' ? 'bg-white text-zinc-900 shadow-3xs' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                >
                  Hosted Redirect
                </button>
                <button
                  onClick={() => setIntegrationMode('IFRAME')}
                  className={`py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${integrationMode === 'IFRAME' ? 'bg-white text-zinc-900 shadow-3xs' : 'text-zinc-400 hover:text-zinc-700'
                    }`}
                >
                  Iframe Widget
                </button>
              </div>
            </div>
          </div>

          {/* Main Store Workspace */}
          <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 flex flex-col justify-between">
            {checkoutStep === 'CART' && (
              <div className="space-y-6">

                {/* Product List Grid */}
                <div>
                  <h3 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-3">Today's Menu Selection</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {PRODUCTS.map((prod) => {
                      const qty = cart[prod.id] || 0;
                      return (
                        <div key={prod.id} className="bg-white border border-zinc-200 rounded-xl p-3.5 flex items-center justify-between shadow-3xs hover:border-zinc-350 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${prod.imageColor} flex items-center justify-center font-bold text-base shadow-2xs`}>
                              {prod.category === 'Beverage' ? '☕' : prod.category === 'Food' ? '🥑' : '🥐'}
                            </div>
                            <div>
                              <h4 className="text-[11px] font-extrabold text-zinc-800 leading-snug">{prod.name}</h4>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(prod.price)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                            <button
                              onClick={() => updateCartQty(prod.id, -1)}
                              className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="text-[10px] font-extrabold text-zinc-800 w-4 text-center font-mono">{qty}</span>
                            <button
                              onClick={() => updateCartQty(prod.id, 1)}
                              className="w-5 h-5 rounded hover:bg-white flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all cursor-pointer"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Checkout Summary Box */}
                {getCartTotal() > 0 ? (
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-3xs space-y-3.5">
                    <div className="flex justify-between items-center text-xs border-b border-zinc-100 pb-2.5">
                      <span className="font-bold text-zinc-700">Subtotal Amount</span>
                      <span className="font-extrabold text-zinc-950 font-mono text-sm">{formattedTotal}</span>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-extrabold text-xs text-zinc-950 shadow-md shadow-amber-500/15 hover:shadow-amber-500/25 transition-all cursor-pointer"
                    >
                      <CreditCard size={14} />
                      <span>Proceed to Payment ({formattedTotal})</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-400 font-semibold text-xs uppercase tracking-wider space-y-2">
                    <ShoppingBag size={24} className="mx-auto text-zinc-300" />
                    <p>Your shop cart is empty</p>
                  </div>
                )}
              </div>
            )}

            {/* Simulated Redirecting View */}
            {checkoutStep === 'REDIRECTING' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Redirecting to hosted payment portal</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-1">Connecting client with merchant endpoint...</p>
                </div>
              </div>
            )}

            {/* Waiting for Redirect Payment View */}
            {checkoutStep === 'PAYING' && integrationMode === 'REDIRECT' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-16">
                <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600">
                  <Smartphone size={24} className="animate-pulse" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Awaiting Scan on Hosted Page</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold max-w-xs leading-relaxed">
                    We opened the secure Hosted Payment Page in a new tab. Please complete the simulator scan there.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Link
                    href={`/pay/${activeTxId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider shadow-3xs cursor-pointer"
                  >
                    <span>Re-open Hosted Window</span>
                    <ExternalLink size={11} />
                  </Link>
                  <button
                    onClick={handleCloseModal}
                    className="text-[9px] font-bold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider underline cursor-pointer"
                  >
                    Abort and return to cart
                  </button>
                </div>
              </div>
            )}

            {/* Sandbox Success View */}
            {checkoutStep === 'SUCCESS' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-16 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <CheckCircle2 size={32} className="animate-bounce" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Payment Received!</h4>
                  <p className="text-[10px] text-zinc-400 font-semibold max-w-xs leading-relaxed">
                    Order confirmation callback verified with token. Your Caramel Latte is brewing!
                  </p>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="px-4 py-1.5 bg-zinc-900 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:bg-zinc-850 cursor-pointer shadow-sm"
                >
                  Order New Coffee
                </button>
              </div>
            )}
          </div>

          {/* Embedded Iframe Modal Overlay (If Iframe checkout is selected) */}
          {checkoutStep === 'PAYING' && integrationMode === 'IFRAME' && (
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="w-full max-w-[390px] h-[550px] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col relative animate-in slide-in-from-bottom-6 duration-300">

                {/* Iframe modal top header */}
                <div className="h-10 bg-slate-900/80 border-b border-slate-850 px-4 flex items-center justify-between text-slate-350 select-none">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <Layers size={11} className="text-indigo-400" />
                    <span>Secure Iframe Widget</span>
                  </span>

                  <button
                    onClick={handleCloseModal}
                    className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Cancel Checkout"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* The Embedded Sandbox Iframe */}
                <div className="flex-1 bg-slate-950">
                  <iframe
                    src={iframeUrl}
                    className="w-full h-full border-none"
                    allow="payment"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Developer Instructions & Integration Guides (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Integration walkthrough */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Code size={16} />
              <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">Merchant Integration Overview</h3>
            </div>

            <p className="text-[10px] text-zinc-400 font-semibold uppercase leading-relaxed">
              Understand how external clients interact with the payment orchestrator.
            </p>

            <div className="space-y-3.5 text-xs text-zinc-650 font-medium">
              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[10px] text-indigo-700 shrink-0 mt-0.5 font-mono">
                  1
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-800">Create Payment Request</span>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                    Merchant posts payment parameters to `/v1/transactions` with the Bearer API Key to create the session.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[10px] text-indigo-700 shrink-0 mt-0.5 font-mono">
                  2
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-800">Launch Payment UI</span>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                    Embed the secure link `/pay/[id]` as an {"<iframe>"} modal overlay or redirect the browser directly.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[10px] text-indigo-700 shrink-0 mt-0.5 font-mono">
                  3
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-800">Callback & Clearing Hooks</span>
                  <p className="text-[10.5px] text-zinc-500 leading-relaxed">
                    When the customer completes the QRIS scan, the gateway issues a POST webhook back to the merchant host.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Code Viewer */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-2 text-indigo-650">
                <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                  Generated Integration Code
                </h3>
              </div>
              <span className="text-[9px] font-extrabold text-zinc-400 bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded font-mono">
                HTML / JS
              </span>
            </div>

            <div className="rounded-xl overflow-hidden bg-zinc-950 p-4 border border-zinc-900 font-mono text-[10.5px] leading-relaxed text-indigo-300 select-all">
              <pre className="overflow-x-auto whitespace-pre-wrap">{integrationCodeSnippet}</pre>
            </div>

            <div className="flex items-start gap-2 bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 text-[10px] text-indigo-700 leading-relaxed font-semibold">
              <HelpCircle size={14} className="shrink-0 text-indigo-500 mt-0.5" />
              <span>
                Select different integration modes in the storefront panel to dynamically compile and review integration code.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
