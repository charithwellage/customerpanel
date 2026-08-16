import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * `/register` metadata (CUST-26, D02-P12-T003). Unlike `/account` — a
 * session-status/demo-entry surface that is deliberately `noindex` — this
 * page is a self-service account-creation conversion path with genuine
 * public content (no visitor-specific state, no session material). It is
 * therefore left indexable, matching how every other public marketing route
 * in this app is treated by default; only `/account` opts out.
 */
export const metadata: Metadata = {
  title: 'Create Your CarChief Account | CarChief',
  description: 'Register for a CarChief customer account to request reservations, track orders and manage your export.',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
