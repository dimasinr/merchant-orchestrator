import { AdapterType } from '@/types';

export const merchantService = (set: any, get: any) => ({
  updateMerchantConfig: (id: string, adapterType: AdapterType, config: any) => {
    set((state: any) => {
      const merts = state.merchants.map((m: any) => {
        if (m.id === id) {
          return {
            ...m,
            adapterType,
            config,
            health: 'HEALTHY' // reset unhealthy/degraded states on config update
          };
        }
        return m;
      });
      return { merchants: merts };
    });

    const m = get().merchants.find((mer: any) => mer.id === id);
    get().addAuditLog('UPDATE_ADAPTER_CONFIG', `Updated ${m?.name || id} adapter configuration (${adapterType})`);
  },

  updateMerchantStatus: (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    set((state: any) => {
      const merts = state.merchants.map((m: any) => {
        if (m.id === id) {
          return { ...m, status };
        }
        return m;
      });
      return { merchants: merts };
    });

    const m = get().merchants.find((mer: any) => mer.id === id);
    get().addAuditLog('MERCHANT_STATUS_CHANGE', `Changed merchant ${m?.name} status to ${status}`);
  }
});
