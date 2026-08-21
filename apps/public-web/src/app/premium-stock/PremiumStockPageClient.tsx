'use client';

import React, { Suspense } from 'react';
import { SearchShowroom } from '../../features/vehicle-search';

export function PremiumStockPageClient() {
  return (
    <main className="min-h-screen py-8">
      <Suspense fallback={<div className="cc-vehicle-collection__state">Loading premium stock search...</div>}>
        <SearchShowroom
          title="PREMIUM STOCK"
          description="Search and filter our premium vehicles, including luxury SUVs, performance cars, and exceptional family vehicles."
          lockedCategory="premium"
        />
      </Suspense>
    </main>
  );
}
