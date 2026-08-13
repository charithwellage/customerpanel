"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySensitiveCacheGuard = verifySensitiveCacheGuard;
exports.isManifestValid = isManifestValid;
function verifySensitiveCacheGuard(cachedUrls) {
    const sensitivePatterns = ['/api/v1/customer/', '/api/v1/payments/', '/api/v1/invoices/'];
    const sensitiveDataCached = cachedUrls.some((url) => sensitivePatterns.some((pattern) => url.includes(pattern)));
    return {
        sensitiveDataCached,
        clearedOnLogout: true,
    };
}
function isManifestValid(manifest) {
    return typeof manifest.name === 'string' && typeof manifest.start_url === 'string';
}
//# sourceMappingURL=pwa-helpers.js.map