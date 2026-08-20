function base64Encode(str: string): string {
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(str, 'utf8').toString('base64');
  }
  return typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(str))) : '';
}

function base64Decode(str: string): string {
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).Buffer !== 'undefined') {
    return (globalThis as any).Buffer.from(str, 'base64').toString('utf8');
  }
  return typeof atob !== 'undefined' ? decodeURIComponent(escape(atob(str))) : '';
}

export type UserRole =
  | 'PublicVisitor'
  | 'CustomerBuyer'
  | 'Salesperson'
  | 'StockController'
  | 'FinanceManager'
  | 'SystemAdmin';

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

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  PublicVisitor: ['read:public'],
  CustomerBuyer: ['read:public', 'read:customer', 'create:inquiry', 'create:reservation', 'create:payment'],
  Salesperson: ['read:public', 'read:leads', 'update:leads', 'create:inquiry'],
  StockController: ['read:public', 'update:vehicles', 'create:vehicles'],
  FinanceManager: ['read:public', 'read:finance', 'approve:pi'],
  SystemAdmin: ['read:public', 'read:all', 'write:all', 'reset:data'],
};

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
export function issueSessionToken(
  role: UserRole,
  sub = 'user-123',
  email = 'user@carchief.com',
  tier: CustomerTier = 'Standard'
): string {
  const claims: JwtClaims = {
    sub,
    email,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    exp: Math.floor(Date.now() / 1000) + 3600,
    tier: role === 'CustomerBuyer' ? tier : undefined,
  };
  const json = JSON.stringify(claims);
  const payload = base64Encode(json);
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.demo-signature`;
}

/**
 * Decodes the claims carried by a token minted with `issueSessionToken`.
 * Renamed from `parseDemoJwtToken` (D02-P12-T002, CUST-30) — same decode-only
 * behaviour, no signature verification claim either way.
 */
export function parseSessionToken(token: string): JwtClaims | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const json = base64Decode(parts[1]);
      return JSON.parse(json) as JwtClaims;
    }
    if (
      token.startsWith('mock_jwt_sso_') ||
      token.startsWith('mock_jwt_google') ||
      token.startsWith('mock_jwt_apple') ||
      token.startsWith('mock_jwt_microsoft') ||
      token.startsWith('mock_jwt_credentials')
    ) {
      return {
        sub: 'cust-123',
        email: 'demo.customer@carchief.com',
        role: 'CustomerBuyer',
        permissions: ROLE_PERMISSIONS.CustomerBuyer,
        exp: Math.floor(Date.now() / 1000) + 86400 * 30,
        tier: 'Standard',
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission) || perms.includes('write:all');
}

/**
 * True once `claims.exp` (Unix seconds) has passed `nowSeconds`. The mock's
 * `parseSessionToken` only decodes. API auth middleware must apply this
 * predicate before authorizing a request; browser session state also uses it
 * to present an honest expired-session state.
 */
export function isJwtExpired(claims: Pick<JwtClaims, 'exp'>, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  return claims.exp <= nowSeconds;
}
