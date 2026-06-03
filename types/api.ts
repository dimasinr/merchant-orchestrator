export interface PaginationMeta {
  page: number;
  page_size: number;
  total_pages: number;
  total_records: number;
}

export interface ApiUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface AdminLoginResponse {
  token: string;
  user: ApiUser;
}

export interface MerchantLoginResponse {
  token: string;
  user: ApiUser;
  merchant: {
    id: string;
    name: string;
  };
}

export interface TransactionListItem {
  reference_id: string;
  merchant_client: string;
  method: string;
  amount: number;
  settlement_status: string;
  timestamp: string;
}

export interface TransactionListResponse {
  data: TransactionListItem[];
  pagination: PaginationMeta;
}

export interface TransactionDetailResponse {
  reference_id: string;
  merchant_client: string;
  method: string;
  amount: number;
  settlement_status: string;
  internal_status: string;
  cashin_reference_no?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface LifecycleEntry {
  status: string;
  message: string;
  timestamp: string;
  is_current: boolean;
}

export interface TransactionFullDetailResponse {
  transaction: TransactionDetailResponse;
  lifecycle: LifecycleEntry[];
  webhook_payload?: number[];
  error_message?: string;
}

export interface DLQListItem {
  reference_id: string;
  merchant_client: string;
  error_reason: string;
  queue_status: string;
  retry_progress: string;
  created_at: string;
}

export interface DLQListResponse {
  data: DLQListItem[];
  pagination: PaginationMeta;
}

export interface LogListItem {
  id: string;
  severity: string;
  message: string;
  component: string;
  metadata?: string;
  created_at: string;
}

export interface LogListResponse {
  data: LogListItem[];
  pagination: PaginationMeta;
}

export type GatewayAction = 'retry' | 'force_complete' | 'force_fail' | 'manual_review';

export interface GatewayActionResponse {
  status: string;
  new_status: string;
}
