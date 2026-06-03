import { merchantApi, MerchantCreateRequest } from '@/services/merchantApi';
import { AdapterType, Merchant } from '@/types';

export const merchantService = (set: any, get: any) => ({
  merchantsLoading: false,
  merchantsError: null as string | null,

  fetchMerchants: async () => {
    const { token } = get();
    if (!token) return;

    set({ merchantsLoading: true, merchantsError: null });
    try {
      const data = await merchantApi.list(token);
      
      const merchants: Merchant[] = data.map((m: any) => ({
        id: m.merchant_id,
        name: m.merchant_name,
        email: 'unknown@example.com', // API doesn't return email based on swagger
        status: 'ACTIVE',
        adapterType: (m.adapter_type || 'REST_API') as AdapterType,
        health: 'HEALTHY',
        tps: 0,
        successRate: 100,
        createdAt: new Date().toISOString(),
        config: m.adapter_type === 'REST_API' 
          ? (m.push_config ? JSON.parse(m.push_config) : {}) 
          : (m.pull_config ? JSON.parse(m.pull_config) : {})
      }));

      set({ merchants, merchantsLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load merchants';
      set({ merchantsLoading: false, merchantsError: message });
    }
  },

  updateMerchantConfig: async (id: string, _adapterType: AdapterType, config: any) => {
    const { token } = get();
    if (!token) return false;

    try {
      const data: MerchantCreateRequest = {
        merchant_id: config.merchant_id || id,
        merchant_name: config.merchant_name || 'Unknown',
        adapter_type: config.adapter_type || _adapterType,
        credentials: config.credentials || '',
        pull_config: config.pull_config || '{}',
        push_config: config.push_config || '{}',
      };
      await merchantApi.update(token, id, data);
      await get().fetchMerchants();
      return true;
    } catch (err) {
      console.error('Failed to update merchant config:', err);
      return false;
    }
  },

  updateMerchantStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    // Current swagger does not have a status field for merchants, just adapter config.
    // So we might not be able to actually suspend via this API unless it's added later.
    // For now we will just log a warning or simulate it.
    console.warn('updateMerchantStatus: Not fully supported by current API');
  },

  createMerchant: async (_name: string, _adapterType: AdapterType, requestData?: any) => {
    const { token } = get();
    if (!token) return false;

    try {
      const data: MerchantCreateRequest = requestData ? {
        merchant_id: requestData.merchant_id || `mer-${Date.now()}`,
        merchant_name: requestData.merchant_name || _name,
        adapter_type: requestData.adapter_type || _adapterType,
        credentials: requestData.credentials || '',
        pull_config: requestData.pull_config || '{}',
        push_config: requestData.push_config || '{}'
      } : {
        merchant_id: `mer-${Date.now()}`,
        merchant_name: _name,
        adapter_type: _adapterType,
        credentials: '',
        pull_config: '{}',
        push_config: '{}'
      };
      await merchantApi.create(token, data);
      await get().fetchMerchants();
      return true;
    } catch (err) {
      console.error('Failed to create merchant:', err);
      return false;
    }
  },

  deleteMerchant: async (id: string) => {
    const { token } = get();
    if (!token) return false;

    try {
      await merchantApi.delete(token, id);
      await get().fetchMerchants();
      return true;
    } catch (err) {
      console.error('Failed to delete merchant:', err);
      return false;
    }
  }
});
