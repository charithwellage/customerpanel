'use client';

import React, { Suspense } from 'react';
import { SearchShowroom } from '../../features/vehicle-search/index.js';

export default function VehiclesPage() {
  return (
    <main className="min-h-screen py-8">
      <Suspense fallback={<div className="cc-vehicle-collection__state">Loading inventory search...</div>}>
        <SearchShowroom title="CarChief Inventory Search" />
      </Suspense>
    </main>
  );
}
