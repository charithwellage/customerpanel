'use client';

import React from 'react';

export const CorporateTrustShowcase: React.FC = () => {
  return (
    <div className="cc-trust-showcase-wrapper">
      {/* SECTION 1: Explore Our Premium Stock Banner with 5-Pillar Bottom Strip */}
      <section className="cc-trust-banner-card" aria-labelledby="premium-trust-heading">
        <div className="cc-trust-banner-hero">
          <div className="cc-trust-banner-content">
            <span className="cc-trust-eyebrow">ULTIMATE SOURCING TRUST</span>
            <h2 id="premium-trust-heading" className="cc-trust-banner-title">
              EXPLORE OUR <span className="cc-trust-title-highlight">PREMIUM STOCK</span>
            </h2>
            <p className="cc-trust-banner-desc">
              Discover an exquisite collection of luxury SUVs, high-performance supercars, and premium family
              vehicles. Sourced directly from elite Japanese networks and meticulously pre-vetted.
            </p>
            <div className="cc-trust-banner-cta">
              <a href="/allstock?category=premium" className="cc-btn-trust-primary">
                BROWSE PREMIUM STOCK
              </a>
            </div>
          </div>

          <div className="cc-trust-banner-media">
            <img
              src="/images/luxury_premium_supercar.jpg"
              alt="High-performance luxury supercar coupe"
              className="cc-trust-car-img"
              loading="lazy"
            />
            <div className="cc-trust-media-gradient" aria-hidden="true" />
          </div>
        </div>

        {/* 5 Feature Pillars Row */}
        <div className="cc-trust-pillars-strip">
          <div className="cc-pillar-item">
            <div className="cc-pillar-icon-wrapper" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            </div>
            <h3 className="cc-pillar-title">HAND-PICKED GRADES</h3>
            <p className="cc-pillar-desc">
              Sourced strictly from premium auction grades 4.5+ or S-grade with flawless condition reports.
            </p>
          </div>

          <div className="cc-pillar-item">
            <div className="cc-pillar-icon-wrapper" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="cc-pillar-title">CERTIFIED INSPECTION</h3>
            <p className="cc-pillar-desc">
              Rigorous 150-point diagnostics, paint gauge verification, and mechanical evaluation.
            </p>
          </div>

          <div className="cc-pillar-item">
            <div className="cc-pillar-icon-wrapper" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 7 3 3" />
                <circle cx="10" cy="14" r="6" />
                <path d="m14 10 7-7" />
                <path d="m17 3 4 4" />
              </svg>
            </div>
            <h3 className="cc-pillar-title">VIP CONCIERGE</h3>
            <p className="cc-pillar-desc">
              Can&apos;t find a specific spec? Our bespoke agents tap into private dealer circles globally.
            </p>
          </div>

          <div className="cc-pillar-item">
            <div className="cc-pillar-icon-wrapper" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="cc-pillar-title">DOCUMENT INTEGRITY</h3>
            <p className="cc-pillar-desc">
              Direct delivery of original export certificates, certified auction sheets, and history logs.
            </p>
          </div>

          <div className="cc-pillar-item">
            <div className="cc-pillar-icon-wrapper" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="cc-pillar-title">CLIMATE-SAFE TRANSIT</h3>
            <p className="cc-pillar-desc">
              Premium containerized and lash-secured logistics to safeguard luxury automotive paint.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Corporate Statement (Dark) & Global Operations Footprint (Light) */}
      <div className="cc-trust-duo-row">
        {/* Left: Corporate Statement */}
        <section className="cc-statement-card" aria-labelledby="corporate-statement-heading">
          <div className="cc-statement-content">
            <span className="cc-statement-eyebrow">CORPORATE STATEMENT</span>
            <h3 id="corporate-statement-heading" className="cc-statement-title">
              WELCOME TO<br />
              <span className="cc-statement-title-highlight">CARCHIEF!</span>
            </h3>

            <p className="cc-statement-desc">
              We are premium curators and global maritime logistics brokers. Together with our dealer partners, we redefine the online car buying experience, turning dreams into reality.
            </p>

            <div className="cc-statement-vision-mission">
              <div className="cc-vision-block">
                <span className="cc-vm-label">OUR VISION</span>
                <p className="cc-vm-value">To Transform Dreams Into Reality</p>
              </div>
              <div className="cc-mission-block">
                <span className="cc-vm-label">OUR MISSION</span>
                <p className="cc-vm-value">Convenience, Happiness, And Distinction</p>
              </div>
            </div>

            <div className="cc-statement-action">
              <a href="/about" className="cc-btn-trust-primary">
                EXPLORE OUR FULL VISION
              </a>
            </div>
          </div>
        </section>

        {/* Right: Global Footprint / Operations */}
        <section className="cc-footprint-card" aria-labelledby="global-footprint-heading">
          <span className="cc-footprint-eyebrow">GLOBAL FOOTPRINT</span>
          <h3 id="global-footprint-heading" className="cc-footprint-title">
            CARCHIEF OPERATIONS
          </h3>

          <p className="cc-footprint-desc">
            Serving the automotive dealership sector worldwide with high-quality stock lists, expert diagnostics, and secure container shipping.
          </p>

          <div className="cc-footprint-stats-grid">
            <div className="cc-footprint-stat-item">
              <span className="cc-stat-num">35</span>
              <span className="cc-stat-name">YEARS</span>
            </div>
            <div className="cc-footprint-stat-item">
              <span className="cc-stat-num">14</span>
              <span className="cc-stat-name">COUNTRIES</span>
            </div>
            <div className="cc-footprint-stat-item">
              <span className="cc-stat-num">4</span>
              <span className="cc-stat-name">CONTINENTS</span>
            </div>
            <div className="cc-footprint-stat-item">
              <span className="cc-stat-num">9</span>
              <span className="cc-stat-name">OFFICES</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
