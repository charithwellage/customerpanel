import React from 'react';

export interface AiVehicleSearchCopy {
  label: string;
  placeholder: string;
  submit: string;
  submitting: string;
  clear: string;
  unavailable: string;
  resultsLabel: string;
}

export interface AiVehicleSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isLoading?: boolean;
  isActive?: boolean;
  unavailable?: boolean;
  error?: string | null;
  summary?: string;
  appliedConstraints?: string[];
  copy?: Partial<AiVehicleSearchCopy>;
  id?: string;
  className?: string;
}

const DEFAULT_COPY: AiVehicleSearchCopy = {
  label: 'AI Search',
  placeholder: 'Ask AI to find a vehicle, e.g. a hybrid SUV under $20,000',
  submit: 'Search with AI',
  submitting: 'Searching…',
  clear: 'Clear AI search',
  unavailable: 'AI search is not yet available in this environment. Try the regular vehicle search and filters.',
  resultsLabel: 'AI search results',
};

export function AiVehicleSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  isLoading = false,
  isActive = false,
  unavailable = false,
  error,
  summary,
  appliedConstraints = [],
  copy,
  id = 'ai-vehicle-search',
  className = '',
}: AiVehicleSearchProps) {
  const text = { ...DEFAULT_COPY, ...copy };
  const submitDisabled = isLoading || !value.trim();

  return (
    <section className={`cc-ai-search ${isActive ? 'cc-ai-search--active' : ''} ${className}`.trim()} aria-labelledby={`${id}-label`}>
      <div className="cc-ai-search__heading">
        <span className="cc-ai-search__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 2.75c.45 4.45 2.8 6.8 7.25 7.25-4.45.45-6.8 2.8-7.25 7.25-.45-4.45-2.8-6.8-7.25-7.25C9.2 9.55 11.55 7.2 12 2.75Z" />
            <path d="M19 15.5c.2 2.05 1.45 3.3 3.5 3.5-2.05.2-3.3 1.45-3.5 3.5-.2-2.05-1.45-3.3-3.5-3.5 2.05-.2 3.3-1.45 3.5-3.5Z" />
          </svg>
        </span>
        <span id={`${id}-label`} className="cc-ai-search__label">{text.label}</span>
        <span className="cc-ai-search__badge">AI</span>
      </div>

      <div className="cc-ai-search__controls">
        <input
          id={id}
          type="search"
          className="cc-ai-search__input"
          value={value}
          placeholder={text.placeholder}
          aria-label={text.label}
          disabled={isLoading}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !submitDisabled) {
              event.preventDefault();
              onSubmit();
            }
          }}
        />
        {(value || isActive || unavailable) && (
          <button type="button" className="cc-ai-search__clear" onClick={onClear} disabled={isLoading}>
            {text.clear}
          </button>
        )}
        <button type="button" className="cc-ai-search__submit" onClick={onSubmit} disabled={submitDisabled}>
          {isLoading ? text.submitting : text.submit}
        </button>
      </div>

      <div className="cc-ai-search__feedback" aria-live="polite" aria-atomic="true">
        {isLoading && <span role="status">{text.submitting}</span>}
        {!isLoading && unavailable && <span className="cc-ai-search__notice">{text.unavailable}</span>}
        {!isLoading && !unavailable && error && <span className="cc-ai-search__error" role="alert">{error}</span>}
        {!isLoading && isActive && summary && (
          <div className="cc-ai-search__result-summary">
            <strong>{text.resultsLabel}:</strong> {summary}
            {appliedConstraints.length > 0 && (
              <ul className="cc-ai-search__constraints" aria-label={text.resultsLabel}>
                {appliedConstraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
