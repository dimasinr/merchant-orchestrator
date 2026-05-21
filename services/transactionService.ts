import { TransactionStatus } from '@/types';

export const transactionService = (set: any, get: any) => ({
  setSelectedTransactionId: (id: string | null) => set({ selectedTransactionId: id }),

  updateTransactionStatus: (id: string, status: TransactionStatus, message?: string) => {
    set((state: any) => {
      const txs = state.transactions.map((t: any) => {
        if (t.id === id) {
          const nowStr = new Date().toISOString();
          const newHistory = [...t.history, { status, timestamp: nowStr, message: message || `Updated to ${status}` }];
          const newLogs = [
            ...t.logs,
            {
              timestamp: nowStr,
              severity: (status.includes('FAIL') || status === 'FAILED') ? 'error' : status === 'MANUAL_REVIEW' ? 'critical' : 'info',
              message: message || `Status transition: ${t.status} -> ${status}`,
              component: 'OPERATOR_ACTION',
              traceId: `tr-${t.id.substring(3)}`
            }
          ];
          return {
            ...t,
            status,
            updatedAt: nowStr,
            errorMessage: message || null,
            history: newHistory,
            logs: newLogs
          };
        }
        return t;
      });
      return { transactions: txs };
    });
    get().updateMetrics();
  },

  retryTransaction: (id: string) => {
    const tx = get().transactions.find((t: any) => t.id === id);
    if (!tx) return;

    set((state: any) => {
      const txs = state.transactions.map((t: any) => {
        if (t.id === id) {
          const nowStr = new Date().toISOString();
          const newHistory = [...t.history, { status: 'ACCEPT_SUBMITTING' as TransactionStatus, timestamp: nowStr, message: 'Operator manually triggered adapter retry.' }];
          const newLogs = [
            ...t.logs,
            {
              timestamp: nowStr,
              severity: 'info',
              message: 'Manual retry initiated. Re-submitting payment verification request to adapter.',
              component: 'CORE_ORCHESTRATOR',
              traceId: `tr-${t.id.substring(3)}`
            }
          ];
          return {
            ...t,
            status: 'ACCEPT_SUBMITTING' as TransactionStatus,
            retryCount: t.retryCount + 1,
            updatedAt: nowStr,
            errorMessage: null,
            history: newHistory,
            logs: newLogs
          };
        }
        return t;
      });
      return { transactions: txs };
    });

    get().addAuditLog('RETRY_TRANSACTION', `Manually triggered adapter retry for transaction ${tx.referenceId}`);
    get().updateMetrics();

    // After 2.5 seconds, auto-complete this transaction for positive demo feedback!
    setTimeout(() => {
      const currentTx = get().transactions.find((t: any) => t.id === id);
      if (currentTx && currentTx.status === 'ACCEPT_SUBMITTING') {
        get().updateTransactionStatus(id, 'COMPLETED', 'Transaction completed successfully after operator retry.');
        get().addAuditLog('AUTO_RESOLVE', `Transaction ${tx.referenceId} completed successfully after retry simulation`);
      }
    }, 2500);
  },

  forceCompleteTransaction: (id: string) => {
    const tx = get().transactions.find((t: any) => t.id === id);
    if (!tx) return;

    get().updateTransactionStatus(id, 'COMPLETED', 'Operator force-completed this transaction (Bypassed adapter confirmation)');
    get().addAuditLog('FORCE_COMPLETE', `Force-completed transaction ${tx.referenceId}`);
  },

  forceFailTransaction: (id: string) => {
    const tx = get().transactions.find((t: any) => t.id === id);
    if (!tx) return;

    get().updateTransactionStatus(id, 'FAILED', 'Operator force-failed this transaction. Flow terminated.');
    get().addAuditLog('FORCE_FAIL', `Force-failed transaction ${tx.referenceId}`);
  },

  sendToManualReview: (id: string) => {
    const tx = get().transactions.find((t: any) => t.id === id);
    if (!tx) return;

    get().updateTransactionStatus(id, 'MANUAL_REVIEW', 'Sent to manual review queue for human auditor check.');
    get().addAuditLog('SEND_TO_REVIEW', `Escalated transaction ${tx.referenceId} to manual review`);
  },

  createTransaction: async (merchantId: string, amount: number, paymentMethod: string) => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, amount, paymentMethod })
    });

    if (!response.ok) throw new Error('Failed to create transaction');
    const newTx = await response.json();

    set((state: any) => ({
      transactions: [newTx, ...state.transactions].slice(0, 100)
    }));

    get().addAuditLog('CREATE_TRANSACTION', `Created simulated transaction ${newTx.referenceId} for amount IDR ${amount}`);
    get().updateMetrics();

    return newTx;
  }
});
