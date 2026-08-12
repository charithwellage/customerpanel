'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { FaqCategory, FaqItem, FaqQueryResponse } from '@carchief/domain';
import { loadFaq } from '../loadFaq';

export interface FaqBrowserPrimitiveProps {
  initialCategories: FaqCategory[];
  initialItems: FaqItem[];
  initialTotal: number;
  initialGroundedNoAnswer?: boolean;
}

export const FaqBrowserPrimitive: React.FC<FaqBrowserPrimitiveProps> = ({
  initialCategories,
  initialItems,
  initialTotal,
  initialGroundedNoAnswer = false,
}) => {
  const [categories] = useState<FaqCategory[]>(initialCategories);
  const [items, setItems] = useState<FaqItem[]>(initialItems);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeQueryText, setActiveQueryText] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(initialItems[0]?.id || null);
  const [isPending, startTransition] = useTransition();
  const [isGroundedNoAnswer, setIsGroundedNoAnswer] = useState<boolean>(initialGroundedNoAnswer);

  const executeFilter = (category: string, qText: string) => {
    startTransition(async () => {
      try {
        const queryParams: { category?: string; q?: string } = {};
        if (category !== 'all') queryParams.category = category;
        if (qText.trim()) queryParams.q = qText.trim();

        const res: FaqQueryResponse = await loadFaq(queryParams);
        setItems(res.items || []);
        setIsGroundedNoAnswer(res.groundedNoAnswer || (res.items || []).length === 0);
        if (res.items && res.items.length > 0) {
          setExpandedId(res.items[0].id);
        } else {
          setExpandedId(null);
        }
      } catch {
        setItems([]);
        setIsGroundedNoAnswer(true);
      }
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    executeFilter(categoryId, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQueryText(searchQuery);
    executeFilter(selectedCategory, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveQueryText('');
    executeFilter(selectedCategory, '');
  };

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const featuredQuestions = items.filter((item) => item.featured);

  return (
    <section className="cc-faq-browser" aria-labelledby="faq-page-heading">
      <header className="cc-faq-header">
        <span className="cc-faq-badge">Grounded Help Center</span>
        <h1 id="faq-page-heading" className="cc-faq-title">
          Frequently Asked Questions
        </h1>
        <p className="cc-faq-subtitle">
          Browse verified guidance organized into 12 categories across Japanese vehicle sourcing, shipping, customs, and auction bidding.
        </p>
      </header>

      {/* Search Bar */}
      <form className="cc-faq-search-form" onSubmit={handleSearchSubmit} role="search">
        <div className="cc-faq-search-wrapper">
          <label htmlFor="faq-search-input" className="sr-only">
            Search verified FAQ database
          </label>
          <input
            id="faq-search-input"
            type="search"
            className="cc-faq-search-input"
            placeholder="Search by keywords (e.g. Mombasa, auction, Bill of Lading, payment...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cc-faq-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
          <button type="submit" className="cc-faq-search-button" disabled={isPending}>
            {isPending ? 'Searching...' : 'Search FAQ'}
          </button>
        </div>
      </form>

      {/* 12-Category Filter Bar */}
      <div className="cc-faq-categories" role="region" aria-label="FAQ Categories">
        <div className="cc-faq-categories-count-badge">
          Category Count: {categories.length} Categories
        </div>
        <div className="cc-faq-categories-list" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            className={`cc-faq-category-chip ${selectedCategory === 'all' ? 'cc-faq-category-chip--active' : ''}`}
            onClick={() => handleCategorySelect('all')}
          >
            All Categories ({initialTotal})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.id}
              className={`cc-faq-category-chip ${selectedCategory === cat.id ? 'cc-faq-category-chip--active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Live Region for Screen Readers & Status */}
      <div role="status" aria-live="polite" className="sr-only">
        {isPending
          ? 'Updating FAQ results...'
          : `Showing ${items.length} questions for ${
              selectedCategory === 'all' ? 'all categories' : 'selected category'
            }${activeQueryText ? ` matching "${activeQueryText}"` : ''}`}
      </div>

      {/* Suggested / Featured Questions (rendered if available and no query active) */}
      {!activeQueryText && selectedCategory === 'all' && featuredQuestions.length > 0 && (
        <div className="cc-faq-suggested">
          <h2 className="cc-faq-suggested__title">Suggested Questions</h2>
          <div className="cc-faq-suggested__grid">
            {featuredQuestions.slice(0, 3).map((fq) => (
              <button
                key={fq.id}
                type="button"
                className="cc-faq-suggested__card"
                onClick={() => {
                  setSelectedCategory(fq.categoryId);
                  executeFilter(fq.categoryId, '');
                  setExpandedId(fq.id);
                }}
              >
                <span className="cc-faq-suggested__category">{fq.categoryName}</span>
                <strong className="cc-faq-suggested__question">{fq.question}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main FAQ Accordion List */}
      <div className="cc-faq-results">
        {items.length > 0 && !isGroundedNoAnswer ? (
          <div className="cc-faq-accordion-list">
            {items.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <article key={item.id} className="cc-faq-item">
                  <h3 className="cc-faq-item__heading">
                    <button
                      type="button"
                      id={`faq-btn-${item.id}`}
                      aria-expanded={isExpanded}
                      aria-controls={`faq-panel-${item.id}`}
                      className="cc-faq-item__trigger"
                      onClick={() => toggleAccordion(item.id)}
                    >
                      <span className="cc-faq-item__question">{item.question}</span>
                      <span className="cc-faq-item__meta">
                        <span className="cc-faq-item__category-tag">{item.categoryName}</span>
                        <span className="cc-faq-item__icon" aria-hidden="true">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </span>
                    </button>
                  </h3>
                  {isExpanded && (
                    <div
                      id={`faq-panel-${item.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${item.id}`}
                      className="cc-faq-item__panel"
                    >
                      <div className="cc-faq-item__answer">{item.answer}</div>
                      <div className="cc-faq-item__footer">
                        <span>Owner: {item.owner}</span>
                        <span>
                          Updated:{' '}
                          {new Date(item.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'UTC',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          /* Grounded No-Answer State & Contact Escalation */
          <div className="cc-faq-no-answer" role="region" aria-labelledby="no-answer-heading">
            <div className="cc-faq-no-answer__icon">ℹ</div>
            <h2 id="no-answer-heading" className="cc-faq-no-answer__title">
              No Matching Verified Answer Found
            </h2>
            <p className="cc-faq-no-answer__description">
              Our help database stays strictly grounded in verified operational rules. We do not generate unverified answers.
            </p>
            <div className="cc-faq-no-answer__escalation">
              <p>Need personalized assistance from our vehicle export team?</p>
              <Link href="/contact" className="cc-faq-no-answer__button">
                Contact Operations & Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
