import React from 'react';
import type { ContentApprovalStatus } from '@carchief/domain';

export interface ContentPageSection {
  title: string;
  content: string;
}

export interface ContentPageTemplateProps {
  title: string;
  subtitle?: string;
  badge?: string;
  owner?: string;
  updatedAt?: string;
  status?: ContentApprovalStatus;
  body?: string;
  sections?: ContentPageSection[];
  heroActions?: React.ReactNode;
  children?: React.ReactNode;
  isLoading?: boolean;
  isUnavailable?: boolean;
  unavailableMessage?: string;
}

export const ContentPageTemplate: React.FC<ContentPageTemplateProps> = ({
  title,
  subtitle,
  badge = 'Official Information',
  owner,
  updatedAt,
  status = 'approved',
  body,
  sections,
  heroActions,
  children,
  isLoading = false,
  isUnavailable = false,
  unavailableMessage = 'This content is currently unavailable or pending official management publication.',
}) => {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : undefined;

  return (
    <main className="cc-public-content-page">
      <header className="cc-public-content-page__hero">
        <div className="cc-public-content-page__container">
          {badge && <span className="cc-public-content-page__badge">{badge}</span>}
          <h1 className="cc-public-content-page__title">{title}</h1>
          {subtitle && <p className="cc-public-content-page__subtitle">{subtitle}</p>}

          {(owner || formattedDate || status) && (
            <div className="cc-public-content-page__meta" aria-label="Page metadata">
              {owner && <span className="cc-public-content-page__meta-item">Owner: {owner}</span>}
              {formattedDate && <span className="cc-public-content-page__meta-item">Updated: {formattedDate}</span>}
              <span
                className={`cc-public-content-page__status cc-public-content-page__status--${status}`}
              >
                Status: {status}
              </span>
            </div>
          )}

          {heroActions && <div className="cc-public-content-page__actions">{heroActions}</div>}
        </div>
      </header>

      <section className="cc-public-content-page__content-wrap">
        <div className="cc-public-content-page__container">
          {isLoading && (
            <div
              role="status"
              aria-live="polite"
              className="cc-public-content-page__state cc-public-content-page__state--loading"
            >
              <div className="cc-spinner" aria-hidden="true" />
              <span>Loading content...</span>
            </div>
          )}

          {!isLoading && isUnavailable && (
            <div
              role="alert"
              className="cc-public-content-page__state cc-public-content-page__state--unavailable"
            >
              <h2 className="cc-public-content-page__state-title">Content Unavailable</h2>
              <p className="cc-public-content-page__state-desc">{unavailableMessage}</p>
              <a href="/contact" className="cc-btn cc-btn--primary">
                Contact Customer Support
              </a>
            </div>
          )}

          {!isLoading && !isUnavailable && (
            <article className="cc-public-content-page__article">
              {body && <div className="cc-public-content-page__body">{body}</div>}

              {sections && sections.length > 0 && (
                <div className="cc-public-content-page__sections">
                  {sections.map((sec, idx) => (
                    <section key={idx} className="cc-public-content-page__section-card">
                      <h2 className="cc-public-content-page__section-title">{sec.title}</h2>
                      <p className="cc-public-content-page__section-content">{sec.content}</p>
                    </section>
                  ))}
                </div>
              )}

              {children}
            </article>
          )}
        </div>
      </section>
    </main>
  );
};
