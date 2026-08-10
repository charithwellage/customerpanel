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
    <section aria-labelledby="testimonials-title" className="home-section">
      <div className="home-section-header">
        <span className="home-section-eyebrow">Customer Feedback</span>
        <h2 id="testimonials-title" className="home-section-title">
          Buyer Endorsements
        </h2>
      </div>

      <div className="testimonials-grid">
        {testimonials.map((t, idx) => (
          <blockquote key={idx} className="testimonial-card">
            <p className="testimonial-quote">"{t.quote}"</p>
            <footer>
              <strong className="testimonial-author">{t.name}</strong>
              <span className="testimonial-meta">
                {t.location} • {t.vehicle}
              </span>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
};
