export interface CacheGuardResult {
    sensitiveDataCached: boolean;
    clearedOnLogout: boolean;
}
export declare function verifySensitiveCacheGuard(cachedUrls: string[]): CacheGuardResult;
export declare function isManifestValid(manifest: Record<string, unknown>): boolean;
//# sourceMappingURL=pwa-helpers.d.ts.map