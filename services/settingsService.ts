import { Role } from '@/types';

export const settingsService = (set: any, get: any) => ({
  login: async (email: string, role: Role, name?: string) => {
    set({
      user: {
        id: `usr-${Math.floor(Math.random() * 900) + 100}`,
        name: name || email.split('@')[0].toUpperCase(),
        email,
        role
      },
      token: 'mock-jwt-token-xyz-' + Date.now(),
      isAuthenticated: true
    });
    get().addAuditLog('USER_LOGIN', `User ${email} successfully logged in as ${role}`);
    return true;
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  }
});
