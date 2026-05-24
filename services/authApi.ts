import { apiRequest } from '@/lib/api-client';
import type { AdminLoginResponse, MerchantLoginResponse } from '@/types/api';

export const authApi = {
  adminLogin(email: string, password: string) {
    return apiRequest<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  merchantLogin(email: string, password: string) {
    return apiRequest<MerchantLoginResponse>('/auth/merchant/login', {
      method: 'POST',
      body: { email, password }
    });
  }
};
