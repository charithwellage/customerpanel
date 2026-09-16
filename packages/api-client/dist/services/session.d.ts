import type { JwtClaims } from '@carchief/domain';
import type { HttpClient } from '../http.js';
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
export declare class SessionService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    getCurrentSession(): Promise<JwtClaims | null>;
}
//# sourceMappingURL=session.d.ts.map