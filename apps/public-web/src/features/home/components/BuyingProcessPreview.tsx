import React from 'react';

export const BuyingProcessPreview: React.FC = () => {
  const steps = [
    { step: '01', title: 'Select Vehicle & Get Quote', desc: 'Browse available stock and request a quotation for your destination port.' },
    { step: '02', title: 'Confirm Proforma Invoice', desc: 'Review pricing breakdown and confirm payment terms with bank wire instructions.' },
    { step: '03', title: 'Complete Bank Transfer', desc: 'Transfer funds securely and provide swift confirmation to our billing department.' },
    { step: '04', title: 'Maritime Vessel Shipping', desc: 'Vehicle is loaded onto ocean carrier and shipping title documents dispatched.' },
    { step: '05', title: 'Port Delivery & Clearance', desc: 'Receive vehicle at your local port, settle customs clearance, and take delivery.' },
  ];

  return (
    <section aria-labelledby="buying-process-title" style={{ margin: '3rem 0' }}>
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
          Sourcing Guide
        </span>
        <h2
          id="buying-process-title"
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0.25rem 0 0 0',
          }}
        >
          CarChief 5-Step Sourcing Process
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {steps.map((item) => (
          <div
            key={item.step}
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface, #ffffff)',
              borderRadius: 'var(--radius-md, 0.5rem)',
              border: '1px solid var(--color-border, #e5e5e5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--color-primary, #dc2626)',
                marginBottom: '0.5rem',
              }}
            >
              {item.step}
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontSize: '0.95rem',
                fontWeight: 700,
                margin: '0 0 0.4rem 0',
              }}
            >
              {item.title}
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-text-secondary, #525252)',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
