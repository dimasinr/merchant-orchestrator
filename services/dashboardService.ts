import { AuditLog, Role, Transaction, TransactionStatus } from '@/types';

export const dashboardService = (set: any, get: any) => ({
  addAuditLog: (action: string, details: string) => {
    // Currently, there is no audit log API in swagger.
    // This function can be kept empty or log to console.
    console.log(`[AUDIT LOG] ${action}: ${details}`);
  },

  updateMetrics: () => {
    // Metrics can only be minimally derived from currently loaded transactions
    const txs = get().transactions || [];
    const completed = txs.filter((t: any) => t.status === 'COMPLETED').length;
    const failed = txs.filter((t: any) => t.status === 'FAILED' || t.status === 'ACCEPT_FAILED' || t.status === 'QRIS_EXPIRED').length;
    const total = completed + failed;
    const successRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 100;

    const dlqFailed = txs.filter((t: any) => t.status === 'ACCEPT_FAILED' || t.status === 'FAILED').length;
    const dlqRetrying = txs.filter((t: any) => t.status === 'ACCEPT_SUBMITTING' && t.retryCount > 0).length;
    
    // We update the queue active but we don't have historical timelines anymore without a backend
    set((state: any) => ({
      metrics: {
        ...state.metrics,
        successRate24h: successRate,
        queueFailed: dlqFailed,
        queueRetrying: dlqRetrying,
        queueActive: txs.filter((t: any) => t.status === 'RECEIVED' || t.status === 'AWAITING_PAYMENT' || t.status === 'PAYMENT_CONFIRMED' || t.status === 'ACCEPT_SUBMITTING').length
      }
    }));
  },

  setRealtimeEnabled: (enabled: boolean) => {
    set({ realtimeEnabled: enabled });
  },

  simulateStep: () => {
    // Removed because we are using real APIs now. 
    // We could potentially poll the refreshTransactions here instead, but that should be handled by a proper effect in the UI.
  }
});
