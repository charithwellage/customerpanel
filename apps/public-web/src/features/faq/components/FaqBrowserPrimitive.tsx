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

  return (
    <section className="faq-page-wrap" aria-labelledby="faq-page-heading">
      {/* 1. Dark Hero Banner */}
      <div className="faq-hero-banner">
        <div className="faq-hero-inner">
          <div className="faq-hero-eyebrow">
            <span>INTELLIGENT VERIFIED ARCHIVE</span>
          </div>
          <h1 id="faq-page-heading" className="faq-hero-title">
            AI-POWERED LOGISTICS <span className="faq-hero-title-accent">KNOWLEDGE BASE</span>
          </h1>
          <p className="faq-hero-subtitle">
            Ask questions in plain English. Our grounded AI assistant answers questions strictly using our approved logistical guidelines, preventing false statements or hallucinations.
          </p>
        </div>
      </div>

      {/* 2. Floating AI Search Bar */}
      <div className="faq-floating-search-card">
        <form className="faq-ai-search-form" onSubmit={handleSearchSubmit} role="search">
          <div className="faq-ai-search-input-wrap">
            <span className="faq-search-icon">🔍</span>
            <label htmlFor="faq-search-input" className="sr-only">
              Search verified FAQ database
            </label>
            <input
              id="faq-search-input"
              type="search"
              className="faq-ai-search-input"
              placeholder="Ask our AI: 'What is CIF shipping?' or 'How long does container delivery take?'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="faq-search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}
            <button type="submit" className="faq-ai-submit-btn" disabled={isPending}>
              <span>✨ ASK CARCHIEF AI</span>
            </button>
          </div>
        </form>

        <div className="faq-suggested-row">
          <span className="faq-suggested-label">SUGGESTED:</span>
          <div className="faq-suggested-chips">
            {[
              'How long does container shipping take?',
              'What is CIF?',
              'Will I receive a clean title?',
              'What documents are supplied?',
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="faq-suggested-chip"
                onClick={() => {
                  setSearchQuery(chip);
                  setActiveQueryText(chip);
                  executeFilter(selectedCategory, chip);
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Section */}
      <div className="faq-body-container">
        {/* Left Sidebar Filters */}
        <aside className="faq-sidebar">
          {/* Keyword Filter Card */}
          <div className="faq-sidebar-card">
            <h3 className="faq-sidebar-header">KEYWORD FILTER</h3>
            <div className="faq-keyword-input-wrap">
              <span className="faq-kw-icon">🔍</span>
              <input
                type="text"
                className="faq-keyword-input"
                placeholder="e.g. Title, Rotterdam, Escrow..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveQueryText(e.target.value);
                  executeFilter(selectedCategory, e.target.value);
                }}
              />
            </div>
          </div>

          {/* Operation Categories Card */}
          <div className="faq-sidebar-card">
            <div className="faq-sidebar-header-row">
              <h3 className="faq-sidebar-header">OPERATION CATEGORIES</h3>
              <span className="sr-only">Category Count: {categories.length} Categories</span>
            </div>
            <nav className="faq-categories-nav" aria-label="FAQ Categories">
              <button
                type="button"
                aria-selected={selectedCategory === 'all'}
                className={`faq-category-btn ${selectedCategory === 'all' ? 'faq-category-btn--active' : ''}`}
                onClick={() => handleCategorySelect('all')}
              >
                <span>All Questions</span>
                <span className="faq-cat-badge">{initialTotal}</span>
              </button>
              {categories.map((cat) => {
                const catCount = initialItems.filter((i) => i.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-selected={selectedCategory === cat.id}
                    className={`faq-category-btn ${selectedCategory === cat.id ? 'faq-category-btn--active' : ''}`}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    <span>{cat.name}</span>
                    <span className="faq-cat-badge">{catCount || 1}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="faq-main-content">
          {/* Accessible Live Region */}
          <div role="status" aria-live="polite" className="sr-only">
            {isPending
              ? 'Updating FAQ results...'
              : `Showing ${items.length} questions for ${
                  selectedCategory === 'all' ? 'all categories' : 'selected category'
                }${activeQueryText ? ` matching "${activeQueryText}"` : ''}`}
          </div>

          <h2 className="sr-only">Frequently Asked Questions</h2>

          {/* Accordion Stack */}
          {items.length > 0 && !isGroundedNoAnswer ? (
            <div className="faq-accordion-stack">
              {items.map((item) => {
                const isExpanded = expandedId === item.id;
                return (
                  <article key={item.id} className="faq-accordion-item">
                    <h3 className="faq-accordion-heading">
                      <button
                        type="button"
                        id={`faq-btn-${item.id}`}
                        aria-expanded={isExpanded}
                        aria-controls={`faq-panel-${item.id}`}
                        className="faq-accordion-trigger"
                        onClick={() => toggleAccordion(item.id)}
                      >
                        <div className="faq-accordion-title-wrap">
                          <span className="faq-category-pill">{item.categoryName || 'BUYING VEHICLES'}</span>
                          <span className="faq-accordion-question">{item.question}</span>
                        </div>
                        <span className="faq-accordion-chevron" aria-hidden="true">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>
                    </h3>
                    {isExpanded && (
                      <div
                        id={`faq-panel-${item.id}`}
                        role="region"
                        aria-labelledby={`faq-btn-${item.id}`}
                        className="faq-accordion-panel"
                      >
                        <div className="faq-accordion-answer">{item.answer}</div>
                        <div className="faq-accordion-footer">
                          <span>Verified Owner: {item.owner}</span>
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
            <div className="faq-no-answer" role="region" aria-labelledby="no-answer-heading">
              <div className="faq-no-answer-icon">ℹ</div>
              <h2 id="no-answer-heading" className="faq-no-answer-title">
                No Matching Verified Answer Found
              </h2>
              <p className="faq-no-answer-desc">
                Our help database stays strictly grounded in verified operational rules. We do not generate unverified answers.
              </p>
              <div className="faq-no-answer-escalation">
                <p>Need personalized assistance from our vehicle export team?</p>
                <Link href="/contact" className="faq-contact-btn">
                  Contact Operations &amp; Support
                </Link>
              </div>
            </div>
          )}

          {/* Unanswered Queries Banner */}
          <div className="faq-unanswered-banner">
            <div className="faq-unanswered-info">
              <h3 className="faq-unanswered-title">STILL HAVE UNANSWERED QUERIES?</h3>
              <p className="faq-unanswered-desc">
                Our direct desk agents are available 6 days a week to clear up any deep-sea shipping uncertainties.
              </p>
            </div>
            <Link href="/contact" className="faq-contact-advisor-btn">
              📞 CONTACT ADVISOR
            </Link>
          </div>
        </main>
      </div>
    </section>
  );
};
