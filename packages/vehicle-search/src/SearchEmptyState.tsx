import React from 'react';

export function SearchEmptyState({ onResetFilters, message = 'No vehicles match your search criteria. Try adjusting your filters or resetting search parameters.' }: { onResetFilters: () => void; message?: string }) {
  return <div className="cc-empty-state-panel" role="region" aria-label="No vehicles found"><h3 className="cc-empty-title">No Vehicles Found</h3><p className="cc-empty-desc">{message}</p><button type="button" className="cc-search-action-btn" onClick={onResetFilters}>Reset Filters &amp; Show All</button></div>;
}
