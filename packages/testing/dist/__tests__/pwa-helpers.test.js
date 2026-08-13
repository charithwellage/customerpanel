"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pwa_helpers_js_1 = require("../pwa-helpers.js");
(0, vitest_1.describe)('PWA Test Utilities', () => {
    (0, vitest_1.it)('detects sensitive endpoints in cache list and clears on logout', () => {
        const result = (0, pwa_helpers_js_1.verifySensitiveCacheGuard)(['/static/logo.png', '/api/v1/customer/profile']);
        (0, vitest_1.expect)(result.sensitiveDataCached).toBe(true);
        (0, vitest_1.expect)(result.clearedOnLogout).toBe(true);
    });
    (0, vitest_1.it)('validates Web App Manifest structure', () => {
        (0, vitest_1.expect)((0, pwa_helpers_js_1.isManifestValid)({ name: 'CarChief', start_url: '/' })).toBe(true);
        (0, vitest_1.expect)((0, pwa_helpers_js_1.isManifestValid)({ name: 123 })).toBe(false);
    });
});
//# sourceMappingURL=pwa-helpers.test.js.map