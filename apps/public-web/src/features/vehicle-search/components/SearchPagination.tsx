'use client';

import React from 'react';

export interface SearchPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

export function SearchPagination({
  page,
  totalPages,
  total,
  limit,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers array
  const pages: number[] = [];
  for (let p = 1; p <= totalPages; p++) {
    pages.push(p);
  }

  return (
    <nav className="cc-pagination-bar" aria-label="Search pagination navigation">
      <div className="cc-pagination-info">
        Showing items {startItem}–{endItem} of {total}
      </div>

      <div className="cc-pagination-controls">
        <button
          type="button"
          id="pagination-prev-btn"
          className="cc-pagination-btn"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous Page"
        >
          ← Prev
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`cc-pagination-btn ${p === page ? 'cc-pagination-btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          id="pagination-next-btn"
          className="cc-pagination-btn"
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next Page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}
