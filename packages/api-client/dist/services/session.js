"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
/**
 * Stand-in demo session service (DEC-PUB-AUTH-BOUNDARY, PUB-22,
 * D01-P06-T003). `startDemoSession` never accepts a role argument — the
 * public entry point can only ever mint the `CustomerBuyer` stand-in
 * identity, server-authoritatively (RULE-10, CODE_REVIEW_RULES #6).
 * `getCurrentSession` mirrors `VehicleService.getVehicleDetail`'s
 * null-on-absence convention: `null` for an unauthenticated/invalid bearer
 * token (401), any other failure still throws.
 */
class SessionService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async startDemoSession() {
        if (!this.httpClient) {
            throw new Error('SessionService.startDemoSession requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/auth/demo-session', { method: 'POST' });
    }
    async getCurrentSession() {
        if (!this.httpClient) {
            throw new Error('SessionService.getCurrentSession requires an HttpClient');
        }
        try {
            return await this.httpClient.request('/api/v1/auth/me');
        }
        catch (err) {
            if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 401) {
                return null;
            }
            throw err;
        }
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session.js.map