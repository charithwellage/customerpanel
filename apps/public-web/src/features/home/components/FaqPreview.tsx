'use client';

import React, { useState } from 'react';

export const FaqPreview: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'IS CARCHIEF AN AUTHORIZED VEHICLE DEALERSHIP OR AN EXPORT AGENCY?',
      a: 'CarChief operates as a licensed Japanese vehicle exporter and international maritime logistics coordinator, procuring directly from premier auto auctions with certified inspections.',
    },
    {
      q: 'WILL I RECEIVE A CLEAN TITLE TO REGISTER THE VEHICLE IN MY HOME COUNTRY?',
      a: 'Yes. All vehicles are delivered with an official Export Certificate, Bill of Lading, and commercial invoice authenticated for local registration.',
    },
    {
      q: 'WHAT IS INCLUDED IN THE SHOWN VEHICLE PRICE?',
      a: 'FOB prices include vehicle acquisition, export preparation, and terminal documentation. CIF adds ocean freight and marine insurance calculated for your selected destination port.',
    },
  ];

  return (
    <section aria-labelledby="faq-logs-heading" className="cc-faq-logs-section">
      <div className="cc-faq-logs-container">
        {/* Left Column: Heading & Description */}
        <div className="cc-faq-logs-left">
          <span className="cc-faq-eyebrow-pill">HELP DESK</span>
          <h2 id="faq-logs-heading" className="cc-faq-logs-title">
            FREQUENTLY<br />
            ASKED LOGS
          </h2>
          <p className="cc-faq-logs-desc">
            Review standard operating procedures regarding customs compliance, clean titles, and vehicle
            specifications.
          </p>
          <div className="cc-faq-logs-action">
            <a href="/faq" className="cc-faq-archive-link">
              <span>EXPLORE FULL FAQ ARCHIVE</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Right Column: Accordion List */}
        <div className="cc-faq-accordion-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`cc-faq-accordion-card ${isOpen ? 'cc-faq-accordion-card--open' : ''}`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="cc-faq-accordion-trigger"
                >
                  <span className="cc-faq-question-text">{faq.q}</span>
                  <svg
                    className={`cc-faq-chevron-icon ${isOpen ? 'cc-faq-chevron-icon--open' : ''}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isOpen && <div className="cc-faq-accordion-content">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
