import { Buffer } from 'node:buffer';

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
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  PublicVisitor: ['read:public'],
  CustomerBuyer: ['read:public', 'read:customer', 'create:inquiry', 'create:reservation', 'create:payment'],
  Salesperson: ['read:public', 'read:leads', 'update:leads', 'create:inquiry'],
  StockController: ['read:public', 'update:vehicles', 'create:vehicles'],
  FinanceManager: ['read:public', 'read:finance', 'approve:pi'],
  SystemAdmin: ['read:public', 'read:all', 'write:all', 'reset:data'],
};

export function createDemoJwtToken(
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
  const payload = Buffer.from(json, 'utf8').toString('base64');
  return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.demo-signature`;
}

export function parseDemoJwtToken(token: string): JwtClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission) || perms.includes('write:all');
}

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
 * `parseDemoJwtToken` only decodes. API auth middleware must apply this
 * predicate before authorizing a request; browser session state also uses it
 * to present an honest expired-session state.
 */
export function isJwtExpired(claims: Pick<JwtClaims, 'exp'>, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
  return claims.exp <= nowSeconds;
}
