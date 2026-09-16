export type UserRole = 'PublicVisitor' | 'CustomerBuyer' | 'Salesperson' | 'StockController' | 'FinanceManager' | 'SystemAdmin';
export type CustomerTier = 'Platinum' | 'Gold' | 'Silver' | 'Standard';
export interface JwtClaims {
    sub: string;
    email: string;
    role: UserRole;
    permissions: string[];
    exp: number;
    tier?: CustomerTier;
    country?: string;
    countryCode?: string;
}
export declare const ROLE_PERMISSIONS: Record<UserRole, string[]>;
/**
 * Mints a signed-shape session token carrying the supplied role/claims
 * (`Phase 2.12`, `DEC-CUST-IDENTITY-RECOVERY`). This is the Mock API's own
 * token minting primitive — the only production identity provider is
 * AutoPulse/Keycloak, which this repo never claims to be. Renamed from
 * `createDemoJwtToken` (D02-P12-T002, CUST-30): the mock no longer exposes a
 * no-input demo identity, but every session — including the one seeded
 * fixture credential kept for existing Delivery 02 suites — is still minted
 * through this one helper.
 */
export declare function issueSessionToken(role: UserRole, sub?: string, email?: string, tier?: CustomerTier): string;
/**
 * Decodes the claims carried by a token minted with `issueSessionToken`.
 * Renamed from `parseDemoJwtToken` (D02-P12-T002, CUST-30) — same decode-only
 * behaviour, no signature verification claim either way.
 */
export declare function parseSessionToken(token: string): JwtClaims | null;
export declare function hasPermission(role: UserRole, permission: string): boolean;
/**
 * True once `claims.exp` (Unix seconds) has passed `nowSeconds`. The mock's
 * `parseSessionToken` only decodes. API auth middleware must apply this
 * predicate before authorizing a request; browser session state also uses it
 * to present an honest expired-session state.
 */
export declare function isJwtExpired(claims: Pick<JwtClaims, 'exp'>, nowSeconds?: number): boolean;
//# sourceMappingURL=auth.d.ts.map