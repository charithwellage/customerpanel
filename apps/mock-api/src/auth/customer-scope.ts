/**
 * Resolves the server-owned customer scope for a signed demo identity.
 *
 * The demo token deliberately uses a stable subject (`user-123`) while the
 * deterministic fixture store uses its canonical customer id (`cust-123`).
 * This mapping is mock-only and never accepts a customer id from the browser.
 */
export function resolveDemoCustomerScope(subject: string): string {
  return subject === 'user-123' ? 'cust-123' : subject;
}
