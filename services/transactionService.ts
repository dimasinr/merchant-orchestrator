import { mapDetailToTransaction, mapDlqItemToTransaction, mapListItemToTransaction } from '@/lib/mappers';
import { canExecuteGatewayActions } from '@/lib/permissions';
import { transactionApi } from '@/services/transactionApi';
import type { GatewayAction } from '@/types/api';
import type { TransactionStatus } from '@/types';

export const transactionService = (set: any, get: any) => ({
  transactionsLoading: false,
  transactionsError: null as string | null,
  transactionPagination: null as {
    page: number;
    page_size: number;
    total_pages: number;
    total_records: number;
  } | null,

  refreshTransactions: async (params?: { search?: string; status?: string; page?: number }) => {
    const { token } = get();
    if (!token) return;

    set({ transactionsLoading: true, transactionsError: null });
    try {
      const response = await transactionApi.list(token, {
        page: params?.page ?? 1,
        page_size: 50,
        search: params?.search,
        status: params?.status
      });
      const transactions = response.data.map(mapListItemToTransaction);
      set({
        transactions,
        transactionPagination: response.pagination,
        transactionsLoading: false
      });
      get().updateMetrics();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load transactions';
      set({ transactionsLoading: false, transactionsError: message });
    }
  },

  fetchTransactionByReference: async (referenceId: string) => {
    const { token } = get();
    if (!token) return null;

    try {
      const detailRes = await transactionApi.getDetail(token, referenceId);
      let logsRes;
      try {
        logsRes = await transactionApi.getLogs(token, referenceId, { page_size: 100 });
      } catch {
        logsRes = { data: [], pagination: { page: 1, page_size: 0, total_pages: 0, total_records: 0 } };
      }

      const mapped = mapDetailToTransaction(detailRes.transaction, {
        lifecycle: detailRes.lifecycle,
        errorMessage: detailRes.error_message,
        logs: logsRes.data,
        webhookPayload: detailRes.webhook_payload
      });

      set((state: { transactions: typeof mapped[] }) => {
        const exists = state.transactions.some((t) => t.referenceId === referenceId);
        const transactions = exists
          ? state.transactions.map((t) => (t.referenceId === referenceId ? mapped : t))
          : [mapped, ...state.transactions];
        return { transactions };
      });

      return mapped;
    } catch {
      return null;
    }
  },

  refreshDlq: async (type: 'dlq' | 'retry' = 'dlq', search?: string) => {
    const { token } = get();
    if (!token) return;

    set({ transactionsLoading: true, transactionsError: null });
    try {
      const response =
        type === 'retry'
          ? await transactionApi.listRetryQueue(token, { page: 1, page_size: 50 })
          : await transactionApi.listDlq(token, { page: 1, page_size: 50, search });

      const transactions = response.data.map(mapDlqItemToTransaction);
      set({ transactions, transactionsLoading: false });
      get().updateMetrics();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load queue';
      set({ transactionsLoading: false, transactionsError: message });
    }
  },

  setSelectedTransactionId: (id: string | null) => set({ selectedTransactionId: id }),

  executeGatewayAction: async (referenceId: string, action: GatewayAction) => {
    const { token, user } = get();
    if (!token || !canExecuteGatewayActions(user?.role)) return false;

    await transactionApi.executeAction(token, referenceId, action);
    await get().fetchTransactionByReference(referenceId);
    await get().refreshTransactions();
    get().addAuditLog('GATEWAY_ACTION', `${action} on ${referenceId}`);
    return true;
  },

  updateTransactionStatus: (id: string, status: TransactionStatus, message?: string) => {
    set((state: any) => {
      const txs = state.transactions.map((t: any) => {
        if (t.id === id || t.referenceId === id) {
          const nowStr = new Date().toISOString();
          const newHistory = [
            ...t.history,
            { status, timestamp: nowStr, message: message || `Updated to ${status}` }
          ];
          return {
            ...t,
            status,
            updatedAt: nowStr,
            errorMessage: message || null,
            history: newHistory
          };
        }
        return t;
      });
      return { transactions: txs };
    });
    get().updateMetrics();
  },

  retryTransaction: async (referenceId: string) => {
    const ok = await get().executeGatewayAction(referenceId, 'retry');
    if (!ok) {
      get().updateTransactionStatus(referenceId, 'ACCEPT_SUBMITTING', 'Retry initiated locally');
    }
  },

  forceCompleteTransaction: async (referenceId: string) => {
    await get().executeGatewayAction(referenceId, 'force_complete');
  },

  forceFailTransaction: async (referenceId: string) => {
    await get().executeGatewayAction(referenceId, 'force_fail');
  },

  sendToManualReview: async (referenceId: string) => {
    await get().executeGatewayAction(referenceId, 'manual_review');
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
