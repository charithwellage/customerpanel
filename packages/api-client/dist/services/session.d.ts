import type { DemoSessionResponse, JwtClaims } from '@carchief/domain';
import type { HttpClient } from '../http.js';
/**
 * Stand-in demo session service (DEC-PUB-AUTH-BOUNDARY, PUB-22,
 * D01-P06-T003). `startDemoSession` never accepts a role argument — the
 * public entry point can only ever mint the `CustomerBuyer` stand-in
 * identity, server-authoritatively (RULE-10, CODE_REVIEW_RULES #6).
 * `getCurrentSession` mirrors `VehicleService.getVehicleDetail`'s
 * null-on-absence convention: `null` for an unauthenticated/invalid bearer
 * token (401), any other failure still throws.
 */
export declare class SessionService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    startDemoSession(): Promise<DemoSessionResponse>;
    getCurrentSession(): Promise<JwtClaims | null>;
}
//# sourceMappingURL=session.d.ts.map