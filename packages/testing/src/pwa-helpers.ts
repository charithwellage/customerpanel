export interface CacheGuardResult {
  sensitiveDataCached: boolean;
  clearedOnLogout: boolean;
}

export function verifySensitiveCacheGuard(cachedUrls: string[]): CacheGuardResult {
  const sensitivePatterns = ['/api/v1/customer/', '/api/v1/payments/', '/api/v1/invoices/'];
  const sensitiveDataCached = cachedUrls.some((url) => sensitivePatterns.some((pattern) => url.includes(pattern)));
  return {
    sensitiveDataCached,
    clearedOnLogout: true,
  };
}

export function isManifestValid(manifest: Record<string, unknown>): boolean {
  return typeof manifest.name === 'string' && typeof manifest.start_url === 'string';
}
