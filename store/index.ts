import { create } from 'zustand';
import {
  AccountType,
  Merchant,
  Worker,
  AuditLog,
  SystemMetrics,
  AdapterType,
  RestApiConfig,
  UiAutomationConfig
} from '../types';

import { settingsService } from '../services/settingsService';
import { transactionService } from '../services/transactionService';
import { merchantService } from '../services/merchantService';
import { monitoringService } from '../services/monitoringService';
import { dashboardService } from '../services/dashboardService';

interface StoreState {
  // Auth State
  user: import('../types').User | null;
  token: string | null;
  accountType: AccountType | null;
  isAuthenticated: boolean;
  authReady: boolean;
  authError: string | null;
  hydrateAuth: () => void;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  loginMerchant: (email: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Transactions State
  transactions: import('../types').Transaction[];
  transactionsLoading: boolean;
  transactionsError: string | null;
  refreshTransactions: (params?: { search?: string; status?: string; page?: number }) => Promise<void>;
  refreshDlq: (type?: 'dlq' | 'retry', search?: string) => Promise<void>;
  fetchTransactionByReference: (referenceId: string) => Promise<import('../types').Transaction | null>;
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  updateTransactionStatus: (id: string, status: import('../types').TransactionStatus, message?: string) => void;
  retryTransaction: (referenceId: string) => Promise<void>;
  forceCompleteTransaction: (referenceId: string) => Promise<void>;
  forceFailTransaction: (referenceId: string) => Promise<void>;
  sendToManualReview: (referenceId: string) => Promise<void>;
  createTransaction: (merchantId: string, amount: number, paymentMethod: string) => Promise<import('../types').Transaction>;

  // Merchants State
  merchants: Merchant[];
  updateMerchantConfig: (id: string, adapterType: AdapterType, config: any) => void;
  updateMerchantStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => void;

  // Workers State
  workers: Worker[];
  updateWorkerStatus: (id: string, status: 'ACTIVE' | 'IDLE' | 'DEAD') => void;

  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;

  // System Metrics
  metrics: SystemMetrics;
  updateMetrics: () => void;

  // Realtime Simulation State
  realtimeEnabled: boolean;
  setRealtimeEnabled: (enabled: boolean) => void;
  simulateStep: () => void;
}

const MOCK_MERCHANTS: Merchant[] = [
  {
    id: 'mer-001',
    name: 'Tokopedia E-Commerce',
    email: 'integration@tokopedia.com',
    status: 'ACTIVE',
    adapterType: 'REST_API',
    health: 'HEALTHY',
    tps: 4.8,
    successRate: 98.4,
    createdAt: '2025-01-10T08:00:00Z',
    config: {
      url: 'https://api.tokopedia.internal/v2/payments',
      method: 'POST',
      poll_interval_seconds: 3,
      params: { client_id: 'tok-prod-8812', return_url: 'https://tokopedia.com/payment/success' },
      headers: { Authorization: 'Bearer tok_sec_live_99a8b7' }
    } as RestApiConfig
  },
  {
    id: 'mer-002',
    name: 'Shopee Mall Indonesia',
    email: 'api-support@shopee.co.id',
    status: 'ACTIVE',
    adapterType: 'REST_API',
    health: 'HEALTHY',
    tps: 7.2,
    successRate: 96.9,
    createdAt: '2025-01-12T10:30:00Z',
    config: {
      url: 'https://shopee-gateway.internal/payment/confirm',
      method: 'POST',
      poll_interval_seconds: 5,
      params: { partner_id: '8910', sign: 'md5_signature_here' },
      headers: { 'X-Shopee-Signature': '7a8f9c0b1d2e3f4a' }
    } as RestApiConfig
  },
  {
    id: 'mer-003',
    name: 'Gojek Merchant Gateway',
    email: 'merchant.dev@gojek.com',
    status: 'ACTIVE',
    adapterType: 'REST_API',
    health: 'HEALTHY',
    tps: 12.5,
    successRate: 99.1,
    createdAt: '2025-02-01T14:00:00Z',
    config: {
      url: 'https://midtrans-orchestrated.gojek/charge',
      method: 'POST',
      poll_interval_seconds: 2,
      params: { merchant_id: 'go-mid-77', response_type: 'json' },
      headers: { 'Server-Key': 'Mid-server-K37d9jS8f2' }
    } as RestApiConfig
  },
  {
    id: 'mer-004',
    name: 'KAI Access Portal',
    email: 'it.support@kai.id',
    status: 'ACTIVE',
    adapterType: 'UI_AUTOMATION',
    health: 'DEGRADED',
    tps: 1.2,
    successRate: 84.5,
    createdAt: '2025-02-15T09:15:00Z',
    config: {
      login_url: 'https://partner.kai.id/login',
      dashboard_url: 'https://partner.kai.id/dashboard/transactions',
      selectors: {
        username_input: '#txtUsername',
        password_input: '#txtPassword',
        submit_button: '#btnSubmitLogin',
        balance_element: '.balance-value',
        transaction_row: '.tr-data-item'
      }
    } as UiAutomationConfig
  },
  {
    id: 'mer-005',
    name: 'Bhinneka B2B Procurement',
    email: 'billing@bhinneka.com',
    status: 'SUSPENDED',
    adapterType: 'UI_AUTOMATION',
    health: 'UNHEALTHY',
    tps: 0.0,
    successRate: 52.1,
    createdAt: '2025-03-01T11:45:00Z',
    config: {
      login_url: 'https://b2b.bhinneka.com/admin/login',
      dashboard_url: 'https://b2b.bhinneka.com/admin/orders',
      selectors: {
        username_input: 'input[name="email"]',
        password_input: 'input[name="password"]',
        submit_button: 'button[type="submit"]',
        balance_element: '#deposit-amt',
        transaction_row: 'tr.order-row'
      }
    } as UiAutomationConfig
  }
];

const MOCK_WORKERS: Worker[] = [
  { id: 'wrk-001', name: 'Orchestrator-Worker-01 (Jakarta-Primary)', status: 'ACTIVE', processedCount: 15420, errorCount: 42, cpuUsage: 34, memoryUsage: 45 },
  { id: 'wrk-002', name: 'Orchestrator-Worker-02 (Jakarta-Secondary)', status: 'ACTIVE', processedCount: 14980, errorCount: 110, cpuUsage: 28, memoryUsage: 42 },
  { id: 'wrk-003', name: 'Automation-Bot-Worker-01 (KAI-Scraper)', status: 'ACTIVE', processedCount: 1200, errorCount: 185, cpuUsage: 68, memoryUsage: 72 },
  { id: 'wrk-004', name: 'Automation-Bot-Worker-02 (Bhinneka-Scraper)', status: 'IDLE', processedCount: 840, errorCount: 402, cpuUsage: 5, memoryUsage: 38 },
  { id: 'wrk-005', name: 'Dead-Letter-Queue-Processor', status: 'ACTIVE', processedCount: 412, errorCount: 8, cpuUsage: 12, memoryUsage: 25 }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-001', timestamp: '2026-05-18T02:15:00Z', userId: 'usr-001', userName: 'Alex Rivera', userRole: 'SUPER_ADMIN', action: 'UPDATE_ADAPTER_CONFIG', details: 'Updated Tokopedia E-Commerce adapter url to https://api.tokopedia.internal/v2/payments', ipAddress: '192.168.1.45' },
  { id: 'aud-002', timestamp: '2026-05-18T03:00:00Z', userId: 'usr-001', userName: 'Alex Rivera', userRole: 'SUPER_ADMIN', action: 'SUSPEND_MERCHANT', details: 'Suspended Bhinneka B2B Procurement due to adapter success rate dropping below 60%', ipAddress: '192.168.1.45' },
  { id: 'aud-003', timestamp: '2026-05-18T04:00:00Z', userId: 'usr-001', userName: 'Alex Rivera', userRole: 'SUPER_ADMIN', action: 'RETRY_TRANSACTION', details: 'Manually triggered retry for transaction REF-20260518-8721', ipAddress: '192.168.1.45' }
];

const INITIAL_METRICS: SystemMetrics = {
  activeWorkers: 4,
  queueActive: 3,
  queueFailed: 2,
  queueRetrying: 1,
  averageLatencyMs: 245,
  currentTps: 18.2,
  successRate24h: 96.5,
  tpsTimeline: Array.from({ length: 12 }, (_, i) => ({
    time: `${(i * 2 + 6) % 24}:00`,
    tps: Math.floor(Math.random() * 15) + 5,
    errorRate: Math.random() * 4
  })),
  latencyTimeline: Array.from({ length: 12 }, (_, i) => ({
    time: `${(i * 2 + 6) % 24}:00`,
    latency: Math.floor(Math.random() * 100) + 150
  }))
};

export const useStore = create<StoreState>((set, get) => ({
  // Auth State (defaults; settingsService spreads login/hydrate)
  user: null,
  token: null,
  isAuthenticated: false,

  // Transactions State (defaults; transactionService spreads API methods)
  transactions: [],
  selectedTransactionId: null,

  // Merchants State
  merchants: MOCK_MERCHANTS,

  // Workers State
  workers: MOCK_WORKERS,

  // Audit Logs
  auditLogs: INITIAL_AUDIT_LOGS,

  // System Metrics
  metrics: INITIAL_METRICS,

  // Realtime Simulation State
  realtimeEnabled: true,

  // Delegate Functions to Separate Menu Services Slices
  ...settingsService(set, get),
  ...transactionService(set, get),
  ...merchantService(set, get),
  ...monitoringService(set, get),
  ...dashboardService(set, get)
}));
