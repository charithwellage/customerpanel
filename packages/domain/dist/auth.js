"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.createDemoJwtToken = createDemoJwtToken;
exports.parseDemoJwtToken = parseDemoJwtToken;
exports.hasPermission = hasPermission;
exports.isJwtExpired = isJwtExpired;
const node_buffer_1 = require("node:buffer");
exports.ROLE_PERMISSIONS = {
    PublicVisitor: ['read:public'],
    CustomerBuyer: ['read:public', 'create:inquiry', 'create:reservation'],
    Salesperson: ['read:public', 'read:leads', 'update:leads', 'create:inquiry'],
    StockController: ['read:public', 'update:vehicles', 'create:vehicles'],
    FinanceManager: ['read:public', 'read:finance', 'approve:pi'],
    SystemAdmin: ['read:public', 'read:all', 'write:all', 'reset:data'],
};
function createDemoJwtToken(role, sub = 'user-123', email = 'user@carchief.com') {
    const claims = {
        sub,
        email,
        role,
        permissions: exports.ROLE_PERMISSIONS[role] || [],
        exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const json = JSON.stringify(claims);
    const payload = node_buffer_1.Buffer.from(json, 'utf8').toString('base64');
    return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.demo-signature`;
}
function parseDemoJwtToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const json = node_buffer_1.Buffer.from(parts[1], 'base64').toString('utf8');
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
function hasPermission(role, permission) {
    const perms = exports.ROLE_PERMISSIONS[role] || [];
    return perms.includes(permission) || perms.includes('write:all');
}
/**
 * True once `claims.exp` (Unix seconds) has passed `nowSeconds`. The mock's
 * `parseDemoJwtToken`/auth middleware does not itself enforce expiry (it
 * only decodes), so a stand-in session's lifetime is enforced by the caller
 * — see `apps/public-web/src/features/account-entry` (D01-P06-T003).
 */
function isJwtExpired(claims, nowSeconds = Math.floor(Date.now() / 1000)) {
    return claims.exp <= nowSeconds;
}
//# sourceMappingURL=auth.js.map