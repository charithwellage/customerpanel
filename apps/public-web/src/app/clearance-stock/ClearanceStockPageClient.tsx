'use client';

import React, { Suspense } from 'react';
import { SearchShowroom } from '../../features/vehicle-search';

export function ClearanceStockPageClient() {
  return (
    <main className="min-h-screen py-8">
      <Suspense fallback={<div className="cc-vehicle-collection__state">Loading clearance stock search...</div>}>
        <SearchShowroom
          title="CLEARANCE STOCK"
          description="Search and filter exclusive clearance vehicles available for immediate global export."
          lockedCollection="clearance"
        />
      </Suspense>
    </main>
  );
}
