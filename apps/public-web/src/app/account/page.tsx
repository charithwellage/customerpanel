import React from 'react';
import { AccountPageClient } from './AccountPageClient';

export const dynamic = 'force-dynamic';

/**
 * Account entry route (PUB-22, PUB-23, DEC-PUB-AUTH-BOUNDARY, D01-P06-T003).
 * Reached from the header's sign-in entry point or from a
 * `?returnTo=/vehicles/{slug}` reservation-guidance link.
 */
export default function AccountPage() {
  return <AccountPageClient />;
}
