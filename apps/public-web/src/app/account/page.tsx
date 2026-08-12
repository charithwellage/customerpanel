'use client';

import React, { Suspense } from 'react';
import { AccountEntrySection } from '../../features/account-entry';

/**
 * Account entry route (PUB-22, PUB-23, DEC-PUB-AUTH-BOUNDARY, D01-P06-T003).
 * Reached from the header's sign-in entry point or from a
 * `?returnTo=/vehicles/{slug}` reservation-guidance link.
 */
export default function AccountPage() {
  return (
    <Suspense fallback={<div className="cc-account-entry__intro">Loading account access&hellip;</div>}>
      <AccountEntrySection />
    </Suspense>
  );
}
