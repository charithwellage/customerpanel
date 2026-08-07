import { Buffer } from 'node:buffer';

export type UserRole =
  | 'PublicVisitor'
  | 'CustomerBuyer'
  | 'Salesperson'
  | 'StockController'
  | 'FinanceManager'
  | 'SystemAdmin';

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  exp: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  PublicVisitor: ['read:public'],
  CustomerBuyer: ['read:public', 'create:inquiry', 'create:reservation'],
  Salesperson: ['read:public', 'read:leads', 'update:leads', 'create:inquiry'],
  StockController: ['read:public', 'update:vehicles', 'create:vehicles'],
  FinanceManager: ['read:public', 'read:finance', 'approve:pi'],
  SystemAdmin: ['read:public', 'read:all', 'write:all', 'reset:data'],
};

export function createDemoJwtToken(role: UserRole, sub = 'user-123', email = 'user@carchief.com'): string {
  const claims: JwtClaims = {
    sub,
    email,
    role,
    permissions: ROLE_PERMISSIONS[role] || [],
    exp: Math.floor(Date.now() / 1000) + 3600,
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
