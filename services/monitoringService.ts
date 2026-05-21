export const monitoringService = (set: any, get: any) => ({
  updateWorkerStatus: (id: string, status: 'ACTIVE' | 'IDLE' | 'DEAD') => {
    set((state: any) => {
      const wrks = state.workers.map((w: any) => {
        if (w.id === id) {
          return { ...w, status };
        }
        return w;
      });
      return { workers: wrks };
    });
    get().addAuditLog('WORKER_STATUS_CHANGE', `Worker ${id} status set to ${status}`);
  }
});
