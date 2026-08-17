'use client';

import React from 'react';

export const BuyingProcessPreview: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'SELECT CAR & GET QUOTE',
      desc: 'Browse our high-quality stock list ready to export and click Get Free Quote to submit an inquiry.',
    },
    {
      step: '02',
      title: 'CONFIRM ORDER & INVOICE',
      desc: 'Confirm your order details and receive a formal invoice containing our bank details and final payment amounts.',
    },
    {
      step: '03',
      title: 'MAKE PAYMENT & SHARE',
      desc: 'Complete your bank wire transfer and upload/share the receipt so our accounts department can track it fast.',
    },
    {
      step: '04',
      title: 'SHIPMENT & DOCUMENTS',
      desc: 'We book the earliest maritime container shipment and courier original export title papers right after departure.',
    },
    {
      step: '05',
      title: 'RECEIVE YOUR VEHICLE',
      desc: 'Hire a local clearing agent to handle import clearance, settle local taxes, and register your vehicle.',
    },
  ];

  return (
    <section aria-labelledby="blueprint-heading" className="cc-blueprint-section">
      <div className="cc-blueprint-container">
        {/* Left Column: Heading & CTA */}
        <div className="cc-blueprint-left">
          <span className="cc-blueprint-eyebrow-pill">SOURCING GUIDE</span>
          <h2 id="blueprint-heading" className="cc-blueprint-title">
            THE CARCHIEF<br />
            <span className="cc-blueprint-title-highlight">5-STEP BLUEPRINT</span>
          </h2>
          <p className="cc-blueprint-desc">
            Acquiring intercontinental vehicles requires absolute logistics precision. We manage the entire loop from export diagnostics to final driveway offloading.
          </p>
          <div className="cc-blueprint-cta">
            <a href="/how-to-buy" className="cc-btn-blueprint-dark">
              <span>VIEW SOURCING TIMELINE</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        {/* Right Column: 5-Step Cards Grid */}
        <div className="cc-blueprint-steps-grid">
          {steps.map((item) => (
            <div key={item.step} className="cc-blueprint-card">
              <div className="cc-blueprint-card-header">
                <span className="cc-blueprint-step-num">{item.step}</span>
                <h3 className="cc-blueprint-step-title">{item.title}</h3>
              </div>
              <p className="cc-blueprint-step-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
