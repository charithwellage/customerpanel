/**
 * Resolves the server-owned customer scope for an authenticated identity.
 *
 * A registered customer account's session subject (`JwtClaims.sub`) is
 * always minted as that account's own canonical customer id, so it is
 * already its own scope. The one legacy exception is the long-standing
 * seeded fixture subject `user-123`, kept mapped to `cust-123` so every
 * existing Delivery 02 customer suite built against that fixture keeps a
 * working identity. This mapping is mock-only and never accepts a customer
 * id supplied directly by the browser.
 */
export function resolveCustomerScope(subject: string): string {
  return subject === 'user-123' ? 'cust-123' : subject;
}
