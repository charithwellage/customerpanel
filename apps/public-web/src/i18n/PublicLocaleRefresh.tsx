'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Refreshes server-rendered public content after the offline locale changes. */
export function PublicLocaleRefresh(): null {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener('carchief:locale-changed', refresh);
    return () => window.removeEventListener('carchief:locale-changed', refresh);
  }, [router]);
  return null;
}
