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
    <section aria-labelledby="faq-title" className="home-section">
      <div className="home-section-header">
        <span className="home-section-eyebrow">Help & Information</span>
        <h2 id="faq-title" className="home-section-title">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="faq-list">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="faq-card">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="faq-trigger"
              >
                <span>{faq.q}</span>
                <span>{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && <div className="faq-content">{faq.a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
};
