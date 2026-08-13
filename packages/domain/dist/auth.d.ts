export type UserRole = 'PublicVisitor' | 'CustomerBuyer' | 'Salesperson' | 'StockController' | 'FinanceManager' | 'SystemAdmin';
export interface JwtClaims {
    sub: string;
    email: string;
    role: UserRole;
    permissions: string[];
    exp: number;
}
export declare const ROLE_PERMISSIONS: Record<UserRole, string[]>;
export declare function createDemoJwtToken(role: UserRole, sub?: string, email?: string): string;
export declare function parseDemoJwtToken(token: string): JwtClaims | null;
export declare function hasPermission(role: UserRole, permission: string): boolean;
/**
 * Response shape for the mock's demo sign-in endpoint (DEC-PUB-AUTH-BOUNDARY,
 * PUB-22, D01-P06-T003). `nonProduction` is always `true` so a caller can
 * render an honest "demo mode" label without inferring it from anything
 * else (RULE-10) — there is no production identity path in this repo.
 */
export interface DemoSessionResponse {
    token: string;
    claims: JwtClaims;
    nonProduction: true;
}
/**
 * True once `claims.exp` (Unix seconds) has passed `nowSeconds`. The mock's
 * `parseDemoJwtToken`/auth middleware does not itself enforce expiry (it
 * only decodes), so a stand-in session's lifetime is enforced by the caller
 * — see `apps/public-web/src/features/account-entry` (D01-P06-T003).
 */
export declare function isJwtExpired(claims: Pick<JwtClaims, 'exp'>, nowSeconds?: number): boolean;
//# sourceMappingURL=auth.d.ts.map