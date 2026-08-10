'use client';

import React, { useState } from 'react';

export const FaqPreview: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is CarChief an authorized exporter of Japanese used vehicles?',
      a: 'CarChief functions as a curated exporter and logistics coordinator, acquiring vehicles from certified Japanese auctions and networks with 150-point pre-export diagnostics.',
    },
    {
      q: 'What shipping title documents are provided upon vessel departure?',
      a: 'Every export shipment includes the Export Certificate (De-registration), Commercial Bill of Sale, Inspection Certificate, and Bill of Lading.',
    },
    {
      q: 'How are freight costs calculated for Mombasa and Dar es Salaam ports?',
      a: 'Freight costs are calculated based on vehicle volume (m³), port destination fees, and ocean freight carrier rates.',
    },
  ];

  return (
    <section aria-labelledby="faq-title" style={{ margin: '3rem 0' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            color: 'var(--color-primary, #dc2626)',
            textTransform: 'uppercase',
          }}
        >
          Help & Information
        </span>
        <h2
          id="faq-title"
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0.25rem 0 0 0',
          }}
        >
          Frequently Asked Questions
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #e5e5e5)',
                borderRadius: 'var(--radius-md, 0.5rem)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '1rem 1.25rem',
                  minHeight: 'var(--min-touch-target, 44px)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontFamily: 'var(--font-display, sans-serif)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary, #171717)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{faq.q}</span>
                <span>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: '0 1.25rem 1rem 1.25rem',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-secondary, #525252)',
                    lineHeight: 1.5,
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
