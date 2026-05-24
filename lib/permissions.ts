import type { AccountType, Role } from '@/types';

export function isAdminAccount(accountType: AccountType | null | undefined): boolean {
  return accountType === 'admin';
}

export function isMerchantAccount(accountType: AccountType | null | undefined): boolean {
  return accountType === 'merchant';
}

export function canExecuteGatewayActions(role: Role | undefined): boolean {
  return role === 'SUPER_ADMIN' || role === 'OPERATOR';
}

export function canViewAdminFeatures(accountType: AccountType | null | undefined): boolean {
  return isAdminAccount(accountType);
}

export function mapApiRoleToAppRole(apiRole: string, accountType: AccountType): Role {
  const normalized = apiRole.toLowerCase().replace(/[\s-]/g, '_');

  if (accountType === 'merchant') {
    return 'MERCHANT_ADMIN';
  }

  if (normalized.includes('super') || normalized === 'admin') {
    return 'SUPER_ADMIN';
  }
  if (normalized.includes('operator')) {
    return 'OPERATOR';
  }
  if (normalized.includes('viewer') || normalized.includes('auditor')) {
    return 'VIEWER';
  }

  return 'OPERATOR';
}

export function getDefaultRoute(accountType: AccountType): string {
  return accountType === 'merchant' ? '/merchant' : '/dashboard';
}
