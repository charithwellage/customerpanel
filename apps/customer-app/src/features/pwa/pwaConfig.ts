import { isOnline, PwaConfig } from '@carchief/pwa';
import { defaultTheme } from '@carchief/theme';

export const CUSTOMER_PWA_CONFIG: PwaConfig = {
  appName: 'CarChief Customer Portal',
  shortName: 'CarChief',
  startUrl: '/dashboard',
};

export interface WebManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: 'standalone' | 'browser' | 'minimal-ui';
  background_color: string;
  theme_color: string;
  icons: Array<{ src: string; sizes: string; type: string }>;
}

export function getCustomerWebManifest(): WebManifest {
  return {
    name: CUSTOMER_PWA_CONFIG.appName,
    short_name: CUSTOMER_PWA_CONFIG.shortName,
    start_url: CUSTOMER_PWA_CONFIG.startUrl,
    display: 'standalone',
    background_color: defaultTheme.colors.background,
    theme_color: defaultTheme.colors.primary,
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

export function isMutationBlockedOffline(): boolean {
  return !isOnline();
}

export async function clearCustomerSensitiveCachesOnLogout(): Promise<void> {
  if (typeof window === 'undefined') return;

  // Clear sensitive storage items
  try {
    sessionStorage.clear();
    localStorage.removeItem('carchief_customer_token');
    localStorage.removeItem('carchief_customer_session');
  } catch {
    // Ignore storage clear errors
  }

  // Clear CacheStorage if available
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch {
      // Ignore cache deletion errors
    }
  }
}
