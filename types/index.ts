export type Role = 'SUPER_ADMIN' | 'OPERATOR' | 'VIEWER' | 'MERCHANT_ADMIN';

export type AccountType = 'admin' | 'merchant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  merchantId?: string;
  merchantName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export type TransactionStatus =
  | 'RECEIVED'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'ACCEPT_SUBMITTING'
  | 'COMPLETED'
  | 'QRIS_EXPIRED'
  | 'ACCEPT_FAILED'
  | 'MANUAL_REVIEW'
  | 'FAILED';

export interface TransactionHistoryEntry {
  status: TransactionStatus;
  timestamp: string;
  message: string;
}

export interface TransactionLog {
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  component: string;
  traceId?: string;
}

export interface Transaction {
  id: string;
  referenceId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  merchantId: string;
  merchantName: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  payload: string; // JSON string
  history: TransactionHistoryEntry[];
  logs: TransactionLog[];
  cashinReferenceNo?: string;
  retryProgress?: string;
}

export type AdapterType = 'REST_API' | 'UI_AUTOMATION' | 'UI_BOT';

export interface RestApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  poll_interval_seconds: number;
  params: Record<string, string>;
  headers: Record<string, string>;
}

export interface UiAutomationConfig {
  login_url: string;
  dashboard_url: string;
  selectors: {
    username_input: string;
    password_input: string;
    submit_button: string;
    balance_element: string;
    transaction_row: string;
  };
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  adapterType: AdapterType;
  config: RestApiConfig | UiAutomationConfig;
  health: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED';
  tps: number;
  successRate: number;
  createdAt: string;
}

export interface Worker {
  id: string;
  name: string;
  status: 'ACTIVE' | 'IDLE' | 'DEAD';
  processedCount: number;
  errorCount: number;
  currentTaskId?: string;
  cpuUsage: number;
  memoryUsage: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  action: string;
  details: string;
  ipAddress: string;
}

export interface SystemMetrics {
  activeWorkers: number;
  queueActive: number;
  queueFailed: number;
  queueRetrying: number;
  averageLatencyMs: number;
  currentTps: number;
  successRate24h: number;
  tpsTimeline: { time: string; tps: number; errorRate: number }[];
  latencyTimeline: { time: string; latency: number }[];
}
