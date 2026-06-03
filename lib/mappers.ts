import type {
  DLQListItem,
  LifecycleEntry,
  LogListItem,
  TransactionDetailResponse,
  TransactionListItem
} from '@/types/api';
import type { Transaction, TransactionHistoryEntry, TransactionLog, TransactionStatus } from '@/types';

const INTERNAL_STATUS_MAP: Record<string, TransactionStatus> = {
  RECEIVED: 'RECEIVED',
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  ACCEPT_SUBMITTING: 'ACCEPT_SUBMITTING',
  COMPLETED: 'COMPLETED',
  QRIS_EXPIRED: 'QRIS_EXPIRED',
  ACCEPT_FAILED: 'ACCEPT_FAILED',
  MANUAL_REVIEW: 'MANUAL_REVIEW',
  FAILED: 'FAILED'
};

const SETTLEMENT_STATUS_MAP: Record<string, TransactionStatus> = {
  completed: 'COMPLETED',
  awaiting: 'AWAITING_PAYMENT',
  failed: 'FAILED'
};

export function mapInternalStatus(
  internalStatus?: string,
  settlementStatus?: string
): TransactionStatus {
  if (internalStatus) {
    const normalized = internalStatus.toUpperCase().replace(/ /g, '_');
    if (INTERNAL_STATUS_MAP[normalized]) {
      return INTERNAL_STATUS_MAP[normalized];
    }
  }
  if (settlementStatus) {
    const mapped = SETTLEMENT_STATUS_MAP[settlementStatus.toLowerCase()];
    if (mapped) return mapped;
  }
  return 'RECEIVED';
}

function severityFromApi(severity: string): TransactionLog['severity'] {
  const s = severity.toUpperCase();
  if (s === 'ERROR') return 'error';
  if (s === 'WARN' || s === 'WARNING') return 'warning';
  if (s === 'CRITICAL') return 'critical';
  return 'info';
}

export function mapListItemToTransaction(item: TransactionListItem): Transaction {
  const status = mapInternalStatus(undefined, item.settlement_status);
  return {
    id: item.reference_id,
    referenceId: item.reference_id,
    amount: item.amount,
    currency: 'IDR',
    status,
    merchantId: '',
    merchantName: item.merchant_client,
    paymentMethod: item.method,
    createdAt: item.timestamp,
    updatedAt: item.timestamp,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    payload: '{}',
    history: [],
    logs: []
  };
}

export function mapDetailToTransaction(
  detail: TransactionDetailResponse,
  extras?: {
    lifecycle?: LifecycleEntry[];
    errorMessage?: string;
    logs?: LogListItem[];
    webhookPayload?: number[];
  }
): Transaction {
  const status = mapInternalStatus(detail.internal_status, detail.settlement_status);
  const history: TransactionHistoryEntry[] =
    extras?.lifecycle?.map((entry) => ({
      status: mapInternalStatus(entry.status),
      timestamp: entry.timestamp,
      message: entry.message
    })) ?? [];

  const logs: TransactionLog[] =
    extras?.logs?.map((log) => ({
      timestamp: log.created_at,
      severity: severityFromApi(log.severity),
      message: log.message,
      component: log.component,
      traceId: log.id
    })) ?? [];

  const payload =
    extras?.webhookPayload && extras.webhookPayload.length > 0
      ? JSON.stringify({ raw: extras.webhookPayload })
      : '{}';

  return {
    id: detail.reference_id,
    referenceId: detail.reference_id,
    amount: detail.amount,
    currency: 'IDR',
    status,
    merchantId: '',
    merchantName: detail.merchant_client,
    paymentMethod: detail.method,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    errorMessage: extras?.errorMessage ?? null,
    retryCount: detail.retry_count,
    maxRetries: 3,
    payload,
    history,
    logs,
    cashinReferenceNo: detail.cashin_reference_no
  };
}

export function mapDlqItemToTransaction(item: DLQListItem): Transaction {
  const status = mapInternalStatus(item.queue_status);
  return {
    id: item.reference_id,
    referenceId: item.reference_id,
    amount: 0,
    currency: 'IDR',
    status,
    merchantId: '',
    merchantName: item.merchant_client,
    paymentMethod: 'QRIS',
    createdAt: item.created_at,
    updatedAt: item.created_at,
    errorMessage: item.error_reason,
    retryCount: 0,
    maxRetries: 3,
    payload: '{}',
    history: [],
    logs: [],
    retryProgress: item.retry_progress
  };
}
