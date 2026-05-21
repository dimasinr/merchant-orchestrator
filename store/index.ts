import { create } from 'zustand';
import {
  User,
  Role,
  Transaction,
  TransactionStatus,
  Merchant,
  Worker,
  AuditLog,
  SystemMetrics,
  AdapterType,
  RestApiConfig,
  UiAutomationConfig,
  TransactionHistoryEntry,
  TransactionLog
} from '../types';

import { settingsService } from '../services/settingsService';
import { transactionService } from '../services/transactionService';
import { merchantService } from '../services/merchantService';
import { monitoringService } from '../services/monitoringService';
import { dashboardService } from '../services/dashboardService';

interface StoreState {
  // Auth State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, role: Role, name?: string) => Promise<boolean>;
  logout: () => void;

  // Transactions State
  transactions: Transaction[];
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus, message?: string) => void;
  retryTransaction: (id: string) => void;
  forceCompleteTransaction: (id: string) => void;
  forceFailTransaction: (id: string) => void;
  sendToManualReview: (id: string) => void;

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

// Initial Mock Data
const INITIAL_USER: User = {
  id: 'usr-001',
  name: 'Alex Rivera',
  email: 'alex.rivera@orchestrator.io',
  role: 'SUPER_ADMIN'
};

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

const generateHistory = (status: TransactionStatus, dateStr: string, text?: string): TransactionHistoryEntry[] => {
  const baseTime = new Date(dateStr);
  const steps: { status: TransactionStatus; delayMin: number; msg: string }[] = [
    { status: 'RECEIVED', delayMin: 0, msg: 'Transaction received in Gateway' },
    { status: 'AWAITING_PAYMENT', delayMin: 1, msg: 'Payment credentials generated (QRIS)' },
    { status: 'PAYMENT_CONFIRMED', delayMin: 5, msg: 'Customer payment detected' },
    { status: 'ACCEPT_SUBMITTING', delayMin: 6, msg: 'Submitting transaction to Merchant partner adapter' },
    { status: 'COMPLETED', delayMin: 7, msg: 'Merchant partner acknowledged payment. Ticket generated.' }
  ];

  const result: TransactionHistoryEntry[] = [];
  for (const step of steps) {
    const stepTime = new Date(baseTime.getTime() + step.delayMin * 60 * 1000);
    result.push({
      status: step.status,
      timestamp: stepTime.toISOString(),
      message: step.msg
    });

    if (step.status === status) break;
  }

  // Handle specific terminal states
  if (status === 'QRIS_EXPIRED') {
    const expTime = new Date(baseTime.getTime() + 15 * 60 * 1000);
    result.push({
      status: 'QRIS_EXPIRED',
      timestamp: expTime.toISOString(),
      message: 'Transaction expired. Customer failed to pay within 15 minutes.'
    });
  } else if (status === 'ACCEPT_FAILED') {
    const failTime = new Date(baseTime.getTime() + 7 * 60 * 1000);
    result.push({
      status: 'ACCEPT_FAILED',
      timestamp: failTime.toISOString(),
      message: text || 'Merchant partner API returned 502 Bad Gateway.'
    });
  } else if (status === 'MANUAL_REVIEW') {
    const reviewTime = new Date(baseTime.getTime() + 8 * 60 * 1000);
    result.push({
      status: 'MANUAL_REVIEW',
      timestamp: reviewTime.toISOString(),
      message: text || 'Discrepancy detected. Held for operator verification.'
    });
  } else if (status === 'FAILED') {
    const failTime = new Date(baseTime.getTime() + 9 * 60 * 1000);
    result.push({
      status: 'FAILED',
      timestamp: failTime.toISOString(),
      message: text || 'Transaction permanently aborted. Max retries exceeded.'
    });
  }

  return result;
};

const generateLogs = (id: string, status: TransactionStatus, dateStr: string): TransactionLog[] => {
  const baseTime = new Date(dateStr);
  const trace = `tr-${id.substring(3)}`;
  const logs: TransactionLog[] = [
    { timestamp: baseTime.toISOString(), severity: 'info', message: `POST /v1/transactions - Initiating orchestrator payment flow`, component: 'API_GATEWAY', traceId: trace },
    { timestamp: new Date(baseTime.getTime() + 5000).toISOString(), severity: 'info', message: `Saved transaction state to Redis, generating QRIS payload`, component: 'CORE_ORCHESTRATOR', traceId: trace },
    { timestamp: new Date(baseTime.getTime() + 10000).toISOString(), severity: 'info', message: `QRIS string generated: 00020101021226300024ID...`, component: 'QRIS_ENGINE', traceId: trace }
  ];

  if (status === 'RECEIVED' || status === 'AWAITING_PAYMENT') return logs;

  logs.push({ timestamp: new Date(baseTime.getTime() + 120000).toISOString(), severity: 'info', message: `Webhook callback received from clearing house. Code: 200`, component: 'WEBHOOK_RECEIVER', traceId: trace });
  logs.push({ timestamp: new Date(baseTime.getTime() + 121000).toISOString(), severity: 'info', message: `Payment confirmed for ID: ${id}. Settled amount matches.`, component: 'CORE_ORCHESTRATOR', traceId: trace });

  if (status === 'PAYMENT_CONFIRMED') return logs;

  logs.push({ timestamp: new Date(baseTime.getTime() + 123000).toISOString(), severity: 'info', message: `Invoking merchant adapter - Target URL: shopee-gateway.internal/payment/confirm`, component: 'ADAPTER_RUNNER', traceId: trace });

  if (status === 'ACCEPT_SUBMITTING') return logs;

  if (status === 'COMPLETED') {
    logs.push({ timestamp: new Date(baseTime.getTime() + 125000).toISOString(), severity: 'info', message: `Merchant callback successful. Order created ID: ORD-TOK-9912`, component: 'ADAPTER_RUNNER', traceId: trace });
    logs.push({ timestamp: new Date(baseTime.getTime() + 126000).toISOString(), severity: 'info', message: `Dispatched payment success hook back to customer app`, component: 'WEBHOOK_DISPATCHER', traceId: trace });
    logs.push({ timestamp: new Date(baseTime.getTime() + 127000).toISOString(), severity: 'info', message: `Transaction completed successfully in 127 seconds. Flow closed.`, component: 'CORE_ORCHESTRATOR', traceId: trace });
  } else if (status === 'QRIS_EXPIRED') {
    logs.push({ timestamp: new Date(baseTime.getTime() + 900000).toISOString(), severity: 'warning', message: `QRIS expiry timeout triggered (15 min limit)`, component: 'QRIS_ENGINE', traceId: trace });
    logs.push({ timestamp: new Date(baseTime.getTime() + 901000).toISOString(), severity: 'info', message: `Releasing lock. Transaction status marked as QRIS_EXPIRED`, component: 'CORE_ORCHESTRATOR', traceId: trace });
  } else if (status === 'ACCEPT_FAILED') {
    logs.push({ timestamp: new Date(baseTime.getTime() + 128000).toISOString(), severity: 'error', message: `Merchant API connection timed out. Response HTTP 504 Gateway Timeout.`, component: 'ADAPTER_RUNNER', traceId: trace });
    logs.push({ timestamp: new Date(baseTime.getTime() + 129000).toISOString(), severity: 'warning', message: `Incrementing retry index: 1. Preparing backoff retry.`, component: 'RETRY_MANAGER', traceId: trace });
  } else if (status === 'MANUAL_REVIEW') {
    logs.push({ timestamp: new Date(baseTime.getTime() + 128000).toISOString(), severity: 'warning', message: `Automation Scraper failed to resolve ticket page. Captcha detected.`, component: 'UI_BOT_ADAPTER', traceId: trace });
    logs.push({ timestamp: new Date(baseTime.getTime() + 129000).toISOString(), severity: 'critical', message: `UI Automation Blocked. Pushing to MANUAL_REVIEW queue for operator captcha bypass`, component: 'CORE_ORCHESTRATOR', traceId: trace });
  } else if (status === 'FAILED') {
    logs.push({ timestamp: new Date(baseTime.getTime() + 128000).toISOString(), severity: 'error', message: `Merchant API returned: Invalid signature. Rejecting charge.`, component: 'ADAPTER_RUNNER', traceId: trace });
    logs.push({ timestamp: new Date(baseTime.getTime() + 129000).toISOString(), severity: 'critical', message: `Transaction failed irrevocably. Aborting payment stream.`, component: 'CORE_ORCHESTRATOR', traceId: trace });
  }

  return logs;
};

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1001',
    referenceId: 'REF-20260518-8812',
    amount: 150000,
    currency: 'IDR',
    status: 'COMPLETED',
    merchantId: 'mer-001',
    merchantName: 'Tokopedia E-Commerce',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T04:20:00Z',
    updatedAt: '2026-05-18T04:22:00Z',
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    payload: JSON.stringify({ amount: 150000, items: [{ name: 'Ergonomic Gaming Mouse', qty: 1 }], customer: { email: 'john@example.com' } }),
    history: generateHistory('COMPLETED', '2026-05-18T04:20:00Z'),
    logs: generateLogs('tx-1001', 'COMPLETED', '2026-05-18T04:20:00Z')
  },
  {
    id: 'tx-1002',
    referenceId: 'REF-20260518-9102',
    amount: 850000,
    currency: 'IDR',
    status: 'COMPLETED',
    merchantId: 'mer-002',
    merchantName: 'Shopee Mall Indonesia',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T04:25:00Z',
    updatedAt: '2026-05-18T04:27:00Z',
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    payload: JSON.stringify({ amount: 850000, items: [{ name: 'Mechanical Keyboard TKL', qty: 1 }], customer: { email: 'lisa@example.com' } }),
    history: generateHistory('COMPLETED', '2026-05-18T04:25:00Z'),
    logs: generateLogs('tx-1002', 'COMPLETED', '2026-05-18T04:25:00Z')
  },
  {
    id: 'tx-1003',
    referenceId: 'REF-20260518-1249',
    amount: 45000,
    currency: 'IDR',
    status: 'COMPLETED',
    merchantId: 'mer-003',
    merchantName: 'Gojek Merchant Gateway',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T04:30:00Z',
    updatedAt: '2026-05-18T04:31:00Z',
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    payload: JSON.stringify({ amount: 45000, items: [{ name: 'Kopi Susu Gula Aren x2', qty: 2 }] }),
    history: generateHistory('COMPLETED', '2026-05-18T04:30:00Z'),
    logs: generateLogs('tx-1003', 'COMPLETED', '2026-05-18T04:30:00Z')
  },
  {
    id: 'tx-1004',
    referenceId: 'REF-20260518-8721',
    amount: 120000,
    currency: 'IDR',
    status: 'ACCEPT_FAILED',
    merchantId: 'mer-004',
    merchantName: 'KAI Access Portal',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T04:32:00Z',
    updatedAt: '2026-05-18T04:34:00Z',
    errorMessage: 'UI Automation Adapter timed out waiting for captcha resolve on KAI Access Portal',
    retryCount: 1,
    maxRetries: 3,
    payload: JSON.stringify({ ticket_id: 'KAI-88A2', route: 'Gambir - Bandung', departure: '2026-06-01' }),
    history: generateHistory('ACCEPT_FAILED', '2026-05-18T04:32:00Z', 'UI Automation Adapter timed out waiting for captcha resolve'),
    logs: generateLogs('tx-1004', 'ACCEPT_FAILED', '2026-05-18T04:32:00Z')
  },
  {
    id: 'tx-1005',
    referenceId: 'REF-20260518-2993',
    amount: 3200000,
    currency: 'IDR',
    status: 'MANUAL_REVIEW',
    merchantId: 'mer-005',
    merchantName: 'Bhinneka B2B Procurement',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T04:35:00Z',
    updatedAt: '2026-05-18T04:37:00Z',
    errorMessage: 'UI Automation Element mismatch. Expected balance button not found on partner console.',
    retryCount: 2,
    maxRetries: 3,
    payload: JSON.stringify({ item: 'Thinkpad E14 Gen 4 Refurbished', qty: 1 }),
    history: generateHistory('MANUAL_REVIEW', '2026-05-18T04:35:00Z', 'UI Automation Element mismatch. Required balance button was absent.'),
    logs: generateLogs('tx-1005', 'MANUAL_REVIEW', '2026-05-18T04:35:00Z')
  },
  {
    id: 'tx-1006',
    referenceId: 'REF-20260518-1182',
    amount: 250000,
    currency: 'IDR',
    status: 'AWAITING_PAYMENT',
    merchantId: 'mer-001',
    merchantName: 'Tokopedia E-Commerce',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T04:45:00Z',
    updatedAt: '2026-05-18T04:45:05Z',
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    payload: JSON.stringify({ amount: 250000, items: [{ name: 'Wireless Charger Pad', qty: 1 }] }),
    history: generateHistory('AWAITING_PAYMENT', '2026-05-18T04:45:00Z'),
    logs: generateLogs('tx-1006', 'AWAITING_PAYMENT', '2026-05-18T04:45:00Z')
  },
  {
    id: 'tx-1007',
    referenceId: 'REF-20260518-5002',
    amount: 1200000,
    currency: 'IDR',
    status: 'FAILED',
    merchantId: 'mer-004',
    merchantName: 'KAI Access Portal',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-18T03:10:00Z',
    updatedAt: '2026-05-18T03:22:00Z',
    errorMessage: 'Transaction permanently aborted. Max UI scrape retries exceeded. Credentials blocked.',
    retryCount: 3,
    maxRetries: 3,
    payload: JSON.stringify({ tickets: 4, class: 'Eksekutif' }),
    history: generateHistory('FAILED', '2026-05-18T03:10:00Z', 'Transaction permanently aborted. Scraper bot credentials got blocked.'),
    logs: generateLogs('tx-1007', 'FAILED', '2026-05-18T03:10:00Z')
  },
  {
    id: 'tx-1008',
    referenceId: 'REF-20260518-9021',
    amount: 550000,
    currency: 'IDR',
    status: 'QRIS_EXPIRED',
    merchantId: 'mer-002',
    merchantName: 'Shopee Mall Indonesia',
    paymentMethod: 'QRIS',
    createdAt: '2026-05-17T23:30:00Z',
    updatedAt: '2026-05-17T23:45:00Z',
    errorMessage: 'QRIS payment window expired. No credit notification received.',
    retryCount: 0,
    maxRetries: 3,
    payload: JSON.stringify({ amount: 550000 }),
    history: generateHistory('QRIS_EXPIRED', '2026-05-17T23:30:00Z'),
    logs: generateLogs('tx-1008', 'QRIS_EXPIRED', '2026-05-17T23:30:00Z')
  }
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
  // Auth State
  user: INITIAL_USER,
  token: 'mock-jwt-token-xyz-123',
  isAuthenticated: true,

  // Transactions State
  transactions: MOCK_TRANSACTIONS,
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
