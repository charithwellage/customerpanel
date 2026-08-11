'use client';

import React from 'react';

export interface SearchEmptyStateProps {
  onResetFilters: () => void;
  message?: string;
}

export function SearchEmptyState({
  onResetFilters,
  message = 'No vehicles match your search criteria. Try adjusting your filters or resetting search parameters.',
}: SearchEmptyStateProps) {
  return (
    <div className="cc-empty-state-panel" role="region" aria-label="No vehicles found">
      <svg
        className="cc-empty-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 4h.01"
        />
      </svg>
      <h3 className="cc-empty-title">No Vehicles Found</h3>
      <p className="cc-empty-desc">{message}</p>
      <button
        type="button"
        id="empty-reset-btn"
        className="cc-search-action-btn"
        onClick={onResetFilters}
      >
        Reset Filters & Show All
      </button>
    </div>
  );
}
