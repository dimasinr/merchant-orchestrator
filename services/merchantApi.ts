import { apiRequest } from '@/lib/api-client';
import type { Merchant } from '@/types';

// Depending on your API, these types might differ slightly, but we use what the swagger expects.
export interface MerchantCreateRequest {
  merchant_name: string;
  merchant_id: string;
  adapter_type: string;
  pull_config: string;
  push_config: string;
  credentials: string;
}

export const merchantApi = {
  list(token: string) {
    return apiRequest<any[]>('/admin/merchants', { token });
  },

  getDetail(token: string, id: string) {
    return apiRequest<any>(`/admin/merchants/${id}`, { token });
  },

  create(token: string, data: MerchantCreateRequest) {
    return apiRequest<any>('/admin/merchants', {
      method: 'POST',
      token,
      body: data
    });
  },

  update(token: string, id: string, data: MerchantCreateRequest) {
    return apiRequest<any>(`/admin/merchants/${id}`, {
      method: 'PUT',
      token,
      body: data
    });
  },

  delete(token: string, id: string) {
    return apiRequest<any>(`/admin/merchants/${id}`, {
      method: 'DELETE',
      token
    });
  }
};
