'use client';

import React from 'react';

export const TestimonialsPreview: React.FC = () => {
  const testimonials = [
    {
      id: 'log-1',
      rating: 5,
      quote:
        'The paint-thickness meter files and direct suspension video files provided by CarChief were flawless. Delivery inside a vacuum-sealed sea container preserved the paint completely. Simply outstanding.',
      name: 'Julian Vance',
      location: 'Geneva, Switzerland',
      vehicle: 'Porsche 911 GT3 RS',
    },
    {
      id: 'log-2',
      rating: 5,
      quote:
        'Apex Import Corp has imported over fifteen vehicles via CarChief’s Rotterdam logistics gate. Their customs brokerage pre-filing eliminates delays entirely. Unparalleled professional logistics.',
      name: 'Sophia Chen',
      location: 'Kampala, Uganda',
      vehicle: 'Apex Import Corp · Rotterdam',
    },
    {
      id: 'log-3',
      rating: 5,
      quote:
        'Purchasing a classic halo supercar of this caliber across seas is highly stressful. CarChief coordinated escrow lines and arranged special mechanical clearance with extreme care. Trustworthy.',
      name: 'Marcus Sterling',
      location: 'Mombasa, Kenya',
      vehicle: 'Toyota HiAce / Land Cruiser',
    },
  ];

  return (
    <section aria-labelledby="endorsements-heading" className="cc-endorsements-section">
      <div className="cc-endorsements-card">
        {/* Header Row */}
        <div className="cc-endorsements-header">
          <div className="cc-endorsements-title-group">
            <span className="cc-endorsements-eyebrow-pill">CLIENT LOGS</span>
            <h2 id="endorsements-heading" className="cc-endorsements-title">
              COLLECTOR ENDORSEMENTS
            </h2>
            <p className="cc-endorsements-subtitle">
              Read real logs from international automobile collectors, fleet buyers, and prestige dealers who import with us.
            </p>
          </div>

          <div className="cc-endorsements-action">
            <a href="/testimonials" className="cc-btn-endorsements-dark">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>SUBMIT / READ ALL LOGS</span>
            </a>
          </div>
        </div>

        {/* Testimonials 3-Column Grid */}
        <div className="cc-endorsements-grid">
          {testimonials.map((item) => (
            <div key={item.id} className="cc-endorsement-card">
              <div className="cc-endorsement-stars" aria-label={`${item.rating} out of 5 stars`}>
                {'★'.repeat(item.rating)}
              </div>
              <p className="cc-endorsement-quote">&ldquo;{item.quote}&rdquo;</p>
              <div className="cc-endorsement-author-meta">
                <div className="cc-endorsement-avatar-circle" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 1 0-16 0" />
                  </svg>
                </div>
                <div className="cc-endorsement-info">
                  <span className="cc-endorsement-name">{item.name}</span>
                  <span className="cc-endorsement-detail">{item.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
