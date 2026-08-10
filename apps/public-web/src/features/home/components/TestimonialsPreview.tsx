import React from 'react';

export const TestimonialsPreview: React.FC = () => {
  const testimonials = [
    {
      name: 'Julian Vance',
      location: 'Geneva, Switzerland',
      vehicle: 'Porsche 911 GT3 RS',
      quote: 'The pre-shipment diagnostic report and video inspections were thorough. Smooth delivery to port.',
    },
    {
      name: 'Sophia Chen',
      location: 'Kampala, Uganda',
      vehicle: 'Toyota Land Cruiser Prado',
      quote: 'Clear communication throughout maritime transit and exact document dispatch upon vessel departure.',
    },
    {
      name: 'Marcus Sterling',
      location: 'Mombasa, Kenya',
      vehicle: 'Toyota HiAce Van',
      quote: 'Vehicle arrived in exact accordance with the auction sheet and inspection checklist.',
    },
  ];

  return (
    <section aria-labelledby="testimonials-title" style={{ margin: '3rem 0' }}>
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
          Customer Feedback
        </span>
        <h2
          id="testimonials-title"
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0.25rem 0 0 0',
          }}
        >
          Buyer Endorsements
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {testimonials.map((t, idx) => (
          <blockquote
            key={idx}
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface, #ffffff)',
              borderRadius: 'var(--radius-md, 0.5rem)',
              border: '1px solid var(--color-border, #e5e5e5)',
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: '0.875rem', fontStyle: 'italic', margin: '0 0 1rem 0', color: 'var(--color-text-primary, #171717)' }}>
              "{t.quote}"
            </p>
            <footer>
              <strong style={{ display: 'block', fontSize: '0.85rem' }}>{t.name}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #525252)' }}>
                {t.location} • {t.vehicle}
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
};
