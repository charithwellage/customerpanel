
export interface SearchPaginationProps { page: number; totalPages: number; total: number; limit: number; hasNextPage: boolean; hasPrevPage: boolean; onPageChange: (page: number) => void; }

export function SearchPagination({ page, totalPages, total, limit, hasNextPage, hasPrevPage, onPageChange }: SearchPaginationProps) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return <nav className="cc-pagination-bar" aria-label="Search pagination navigation"><div className="cc-pagination-info">Showing items {start}–{end} of {total}</div><div className="cc-pagination-controls"><button type="button" className="cc-pagination-btn" disabled={!hasPrevPage} onClick={() => onPageChange(page - 1)} aria-label="Previous Page">← Prev</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={`cc-pagination-btn ${number === page ? 'cc-pagination-btn--active' : ''}`} onClick={() => onPageChange(number)} aria-current={number === page ? 'page' : undefined}>{number}</button>)}<button type="button" className="cc-pagination-btn" disabled={!hasNextPage} onClick={() => onPageChange(page + 1)} aria-label="Next Page">Next →</button></div></nav>;
}
