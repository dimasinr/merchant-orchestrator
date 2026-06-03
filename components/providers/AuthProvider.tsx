'use client';

import { useEffect } from 'react';
import { useStore } from '@/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hydrateAuth = useStore((s) => s.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return <>{children}</>;
}
