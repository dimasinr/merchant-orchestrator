import { AuditLog, Role, Transaction, TransactionStatus } from '@/types';

export const dashboardService = (set: any, get: any) => ({
  addAuditLog: (action: string, details: string) => {
    const userObj = get().user || { id: 'sys', name: 'SYSTEM', role: 'OPERATOR' as Role };
    const newLog: AuditLog = {
      id: `aud-${Math.floor(Math.random() * 900000) + 100000}`,
      timestamp: new Date().toISOString(),
      userId: userObj.id,
      userName: userObj.name,
      userRole: userObj.role,
      action,
      details,
      ipAddress: '192.168.1.100'
    };
    set((state: any) => ({ auditLogs: [newLog, ...state.auditLogs].slice(0, 100) }));
  },

  updateMetrics: () => {
    const txs = get().transactions;
    const completed = txs.filter((t: any) => t.status === 'COMPLETED').length;
    const failed = txs.filter((t: any) => t.status === 'FAILED' || t.status === 'ACCEPT_FAILED' || t.status === 'QRIS_EXPIRED').length;
    const total = completed + failed;
    const successRate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 96.5;

    const dlqFailed = txs.filter((t: any) => t.status === 'ACCEPT_FAILED' || t.status === 'FAILED').length;
    const dlqRetrying = txs.filter((t: any) => t.status === 'ACCEPT_SUBMITTING' && t.retryCount > 0).length;

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

  setRealtimeEnabled: (enabled: boolean) => set({ realtimeEnabled: enabled }),

  simulateStep: () => {
    // 1. Progressing some transactions in the system
    set((state: any) => {
      let isChanged = false;
      const updated = state.transactions.map((t: any) => {
        // RECEIVED -> AWAITING_PAYMENT
        if (t.status === 'RECEIVED' && Math.random() > 0.4) {
          isChanged = true;
          const nowStr = new Date().toISOString();
          return {
            ...t,
            status: 'AWAITING_PAYMENT' as const,
            updatedAt: nowStr,
            history: [...t.history, { status: 'AWAITING_PAYMENT' as const, timestamp: nowStr, message: 'QRIS code generated. Awaiting user scan.' }],
            logs: [...t.logs, { timestamp: nowStr, severity: 'info' as const, message: 'Status transition: RECEIVED -> AWAITING_PAYMENT', component: 'CORE_ORCHESTRATOR', traceId: `tr-${t.id.substring(3)}` }]
          };
        }
        // AWAITING_PAYMENT -> PAYMENT_CONFIRMED
        if (t.status === 'AWAITING_PAYMENT' && Math.random() > 0.6) {
          isChanged = true;
          const nowStr = new Date().toISOString();
          return {
            ...t,
            status: 'PAYMENT_CONFIRMED' as const,
            updatedAt: nowStr,
            history: [...t.history, { status: 'PAYMENT_CONFIRMED' as const, timestamp: nowStr, message: 'Payment cleared by Bank clearing engine.' }],
            logs: [...t.logs, { timestamp: nowStr, severity: 'info' as const, message: 'Status transition: AWAITING_PAYMENT -> PAYMENT_CONFIRMED', component: 'BANK_CLEANING_SERVICE', traceId: `tr-${t.id.substring(3)}` }]
          };
        }
        // PAYMENT_CONFIRMED -> ACCEPT_SUBMITTING
        if (t.status === 'PAYMENT_CONFIRMED' && Math.random() > 0.4) {
          isChanged = true;
          const nowStr = new Date().toISOString();
          return {
            ...t,
            status: 'ACCEPT_SUBMITTING' as const,
            updatedAt: nowStr,
            history: [...t.history, { status: 'ACCEPT_SUBMITTING' as const, timestamp: nowStr, message: 'Sending request to merchant partner adapter.' }],
            logs: [...t.logs, { timestamp: nowStr, severity: 'info' as const, message: 'Invoked Merchant HTTP Adapter POST confirm endpoint', component: 'ADAPTER_RUNNER', traceId: `tr-${t.id.substring(3)}` }]
          };
        }
        // ACCEPT_SUBMITTING -> COMPLETED (or error!)
        if (t.status === 'ACCEPT_SUBMITTING' && t.retryCount === 0 && Math.random() > 0.4) {
          isChanged = true;
          const nowStr = new Date().toISOString();
          const roll = Math.random();

          if (roll > 0.85) {
            // Failure! Let's put in DLQ (ACCEPT_FAILED)
            const errMsg = t.paymentMethod === 'QRIS' && t.id.charCodeAt(0) % 2 === 0
              ? 'Merchant host webhook delivery endpoint timed out (504)'
              : 'UI Automation Scraper Blocked: Captcha request detected';
            const nextStatus = roll > 0.95 ? ('MANUAL_REVIEW' as const) : ('ACCEPT_FAILED' as const);

            return {
              ...t,
              status: nextStatus,
              updatedAt: nowStr,
              errorMessage: errMsg,
              history: [...t.history, { status: nextStatus, timestamp: nowStr, message: errMsg }],
              logs: [...t.logs, { timestamp: nowStr, severity: nextStatus === 'MANUAL_REVIEW' ? 'critical' : 'error' as any, message: `Adapter Error: ${errMsg}`, component: 'ADAPTER_RUNNER', traceId: `tr-${t.id.substring(3)}` }]
            };
          } else {
            // Success
            return {
              ...t,
              status: 'COMPLETED' as const,
              updatedAt: nowStr,
              history: [...t.history, { status: 'COMPLETED' as const, timestamp: nowStr, message: 'Successfully verified and completed.' }],
              logs: [...t.logs, { timestamp: nowStr, severity: 'info' as const, message: 'Adapter execution successful. Order confirmation saved.', component: 'ADAPTER_RUNNER', traceId: `tr-${t.id.substring(3)}` }]
            };
          }
        }

        return t;
      });

      return isChanged ? { transactions: updated } : {};
    });

    // 2. Generate a new transaction occasionally
    if (Math.random() > 0.75) {
      const activeMerchants = get().merchants.filter((m: any) => m.status === 'ACTIVE');
      if (activeMerchants.length > 0) {
        const m = activeMerchants[Math.floor(Math.random() * activeMerchants.length)];
        const paymentMethods = ['QRIS'];
        const pm = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const amt = Math.floor(Math.random() * 50) * 10000 + 20000;
        const newId = `tx-${Math.floor(Math.random() * 90000) + 10000}`;
        const refId = `REF-20260518-${Math.floor(Math.random() * 9000) + 1000}`;
        const nowStr = new Date().toISOString();

        const newTx: Transaction = {
          id: newId,
          referenceId: refId,
          amount: amt,
          currency: 'IDR',
          status: 'RECEIVED',
          merchantId: m.id,
          merchantName: m.name,
          paymentMethod: pm,
          createdAt: nowStr,
          updatedAt: nowStr,
          errorMessage: null,
          retryCount: 0,
          maxRetries: 3,
          payload: JSON.stringify({ amount: amt, customer: { name: 'Customer Test', email: 'cust@test.orchestrator.io' } }),
          history: [{ status: 'RECEIVED' as const, timestamp: nowStr, message: 'Gateway accepted transaction' }],
          logs: [
            { timestamp: nowStr, severity: 'info', message: `Incoming API transaction accepted from origin. Reference: ${refId}`, component: 'API_GATEWAY', traceId: `tr-${newId.substring(3)}` }
          ]
        };

        set((state: any) => ({
          transactions: [newTx, ...state.transactions].slice(0, 100) // keep last 100
        }));
      }
    }

    // 3. Fluctuating metrics slightly for live visualization feeling
    set((state: any) => {
      const timeline = [...state.metrics.tpsTimeline];
      const latencyTimeline = [...state.metrics.latencyTimeline];

      // Add fresh live point if necessary, or just update the last one
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      timeline.push({ time: timeStr, tps: parseFloat((Math.random() * 10 + 10).toFixed(1)), errorRate: parseFloat((Math.random() * 2).toFixed(2)) });
      latencyTimeline.push({ time: timeStr, latency: Math.floor(Math.random() * 40) + 210 });

      if (timeline.length > 15) timeline.shift();
      if (latencyTimeline.length > 15) latencyTimeline.shift();

      const activeWorkersCount = state.workers.filter((w: any) => w.status === 'ACTIVE').length;
      const totalTps = timeline.reduce((acc, t) => acc + t.tps, 0) / timeline.length;
      const avgLatency = Math.floor(latencyTimeline.reduce((acc, l) => acc + l.latency, 0) / latencyTimeline.length);

      // Randomly bump worker processed counts
      const updatedWorkers = state.workers.map((w: any) => {
        if (w.status === 'ACTIVE') {
          return {
            ...w,
            processedCount: w.processedCount + Math.floor(Math.random() * 3),
            cpuUsage: Math.floor(Math.random() * 15) + (w.id.includes('Scraper') ? 50 : 20),
            memoryUsage: Math.floor(Math.random() * 5) + (w.id.includes('Scraper') ? 65 : 40)
          };
        }
        return w;
      });

      return {
        workers: updatedWorkers,
        metrics: {
          ...state.metrics,
          activeWorkers: activeWorkersCount,
          currentTps: parseFloat(totalTps.toFixed(1)),
          averageLatencyMs: avgLatency,
          tpsTimeline: timeline,
          latencyTimeline
        }
      };
    });

    get().updateMetrics();
  }
});
