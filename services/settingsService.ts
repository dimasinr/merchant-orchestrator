import { ApiError } from '@/lib/api-client';
import {
  clearAuth,
  getStoredAccountType,
  getStoredToken,
  getStoredUser,
  persistAuth
} from '@/lib/auth-storage';
import { mapApiRoleToAppRole } from '@/lib/permissions';
import { authApi } from '@/services/authApi';
import type { AccountType, User } from '@/types';

export const settingsService = (set: any, get: any) => ({
  accountType: null as AccountType | null,
  authReady: false,
  authError: null as string | null,

  hydrateAuth: () => {
    if (typeof window === 'undefined') return;
    const token = getStoredToken();
    const user = getStoredUser();
    const accountType = getStoredAccountType();

    if (token && user && accountType) {
      set({ user, token, accountType, isAuthenticated: true, authReady: true });
      get().refreshTransactions().catch(() => undefined);
    } else {
      set({ authReady: true });
      // Fetch merchants after authentication is established
      get().fetchMerchants().catch(() => undefined);
    }
  },

  loginAdmin: async (email: string, password: string) => {
    set({ authError: null });
    try {
      const response = await authApi.adminLogin(email, password);
      const user: User = {
        id: response.user.id,
        name: response.user.full_name,
        email: response.user.email,
        role: mapApiRoleToAppRole(response.user.role, 'admin')
      };
      persistAuth(response.token, user, 'admin');
      set({
        user,
        token: response.token,
        accountType: 'admin' as AccountType,
        isAuthenticated: true,
        authError: null
      });
      await get().refreshTransactions();
      get().addAuditLog('USER_LOGIN', `Admin ${email} signed in`);
      // Load merchants after authentication
      get().fetchMerchants().catch(() => undefined);
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      set({ authError: message });
      return false;
    }
  },

  loginMerchant: async (email: string, password: string) => {
    set({ authError: null });
    try {
      const response = await authApi.merchantLogin(email, password);
      const user: User = {
        id: response.user.id,
        name: response.user.full_name,
        email: response.user.email,
        role: mapApiRoleToAppRole(response.user.role, 'merchant'),
        merchantId: response.merchant.id,
        merchantName: response.merchant.name
      };
      persistAuth(response.token, user, 'merchant');
      set({
        user,
        token: response.token,
        accountType: 'merchant' as AccountType,
        isAuthenticated: true,
        authError: null
      });
      await get().refreshTransactions();
      return true;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      set({ authError: message });
      return false;
    }
  },

  logout: () => {
    clearAuth();
    set({
      user: null,
      token: null,
      accountType: null,
      isAuthenticated: false,
      transactions: [],
      authError: null
    });
  }
});
