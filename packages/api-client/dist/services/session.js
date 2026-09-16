/**
 * Session lookup for the currently bearer-authenticated identity
 * (DEC-PUB-AUTH-BOUNDARY, PUB-22, D01-P06-T003). `startDemoSession` was
 * removed (D02-P12-T002, CUST-30): the Mock API no longer mints a no-input
 * demo `CustomerBuyer` session — a real credential goes through
 * `AuthService.login` instead (`packages/api-client/src/services/auth.ts`).
 * `getCurrentSession` mirrors `VehicleService.getVehicleDetail`'s
 * null-on-absence convention: `null` for an unauthenticated/invalid bearer
 * token (401), any other failure still throws.
 */
export class SessionService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
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
//# sourceMappingURL=session.js.map