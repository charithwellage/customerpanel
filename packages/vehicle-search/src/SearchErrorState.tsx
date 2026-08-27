
export function SearchErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div className="cc-vehicle-collection__state cc-vehicle-collection__state--error" role="alert" aria-live="assertive"><h3>Search Temporarily Unavailable</h3><p>{error}</p><button type="button" className="cc-vehicle-collection__retry" onClick={onRetry}>Retry Search</button></div>;
}
