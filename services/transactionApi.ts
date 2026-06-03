import { apiRequest } from '@/lib/api-client';
import type {
  DLQListResponse,
  GatewayAction,
  GatewayActionResponse,
  LogListResponse,
  TransactionFullDetailResponse,
  TransactionListResponse
} from '@/types/api';

export type TransactionQueryParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
};

export const transactionApi = {
  list(token: string, params?: TransactionQueryParams) {
    return apiRequest<TransactionListResponse>('/transactions', { token, params });
  },

  getDetail(token: string, referenceId: string) {
    return apiRequest<TransactionFullDetailResponse>(`/transactions/${referenceId}/detail`, {
      token
    });
  },

  getLogs(
    token: string,
    referenceId: string,
    params?: { search?: string; severity?: string; component?: string; page?: number; page_size?: number }
  ) {
    return apiRequest<LogListResponse>(`/transactions/${referenceId}/logs`, { token, params });
  },

  listDlq(token: string, params?: TransactionQueryParams) {
    return apiRequest<DLQListResponse>('/transactions/dlq', { token, params });
  },

  listRetryQueue(token: string, params?: TransactionQueryParams) {
    return apiRequest<DLQListResponse>('/transactions/retry-queue', { token, params });
  },

  executeAction(token: string, referenceId: string, action: GatewayAction) {
    return apiRequest<GatewayActionResponse>(`/transactions/${referenceId}/actions`, {
      method: 'POST',
      token,
      body: { action }
    });
  }
};
