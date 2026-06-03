import type { AccountType, User } from '@/types';

const TOKEN_KEY = 'mo_token';
const USER_KEY = 'mo_user';
const ACCOUNT_TYPE_KEY = 'mo_account_type';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getStoredAccountType(): AccountType | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(ACCOUNT_TYPE_KEY);
  if (value === 'admin' || value === 'merchant') return value;
  return null;
}

function setCookie(name: string, value: string, maxAgeDays = 7) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function persistAuth(token: string, user: User, accountType: AccountType) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(ACCOUNT_TYPE_KEY, accountType);
  setCookie('mo_token', token);
  setCookie('mo_account_type', accountType);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCOUNT_TYPE_KEY);
  clearCookie('mo_token');
  clearCookie('mo_account_type');
}
