'use client';

import React, { Suspense } from 'react';
import { AccountEntrySection } from '../../features/account-entry';

export function AccountPageClient() {
  return (
    <Suspense fallback={<div className="cc-account-entry__intro">Loading account access&hellip;</div>}>
      <AccountEntrySection />
    </Suspense>
  );
}
