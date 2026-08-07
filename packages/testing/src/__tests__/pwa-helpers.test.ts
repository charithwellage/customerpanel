import { describe, it, expect } from 'vitest';
import { verifySensitiveCacheGuard, isManifestValid } from '../pwa-helpers.js';

describe('PWA Test Utilities', () => {
  it('detects sensitive endpoints in cache list and clears on logout', () => {
    const result = verifySensitiveCacheGuard(['/static/logo.png', '/api/v1/customer/profile']);
    expect(result.sensitiveDataCached).toBe(true);
    expect(result.clearedOnLogout).toBe(true);
  });

  it('validates Web App Manifest structure', () => {
    expect(isManifestValid({ name: 'CarChief', start_url: '/' })).toBe(true);
    expect(isManifestValid({ name: 123 })).toBe(false);
  });
});
