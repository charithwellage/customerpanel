'use client';

import React from 'react';

export const GlobalLogisticsSection: React.FC = () => {
  return (
    <div className="cc-global-logistics-wrapper">
      {/* SECTION 1: Intercontinental Freight Pipeline */}
      <section className="cc-logistics-pipeline-card" aria-labelledby="export-pipeline-heading">
        <div className="cc-logistics-pipeline-content">
          <div className="cc-pipeline-eyebrow-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>INTERCONTINENTAL FREIGHT PIPELINE</span>
          </div>

          <h2 id="export-pipeline-heading" className="cc-pipeline-title">
            EXPORTING WORLDWIDE<br />
            <span className="cc-pipeline-title-highlight">MADE EFFORTLESS</span>
          </h2>

          <p className="cc-pipeline-description">
            CarChief integrates direct maritime deep-sea container lines, custom documentation handoffs, and door-to-port routing. Sourcing and delivering luxury vehicles from any hub straight to your local harbor with unmatched reliability.
          </p>

          <div className="cc-pipeline-features-grid">
            <div className="cc-pipeline-feature-item">
              <div className="cc-pipeline-feature-icon-wrapper" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
                  <path d="M12 17a5 5 0 0 0 10 0c0-2.76-2.5-5-5-3-2.5-2-5 .24-5 3Z" />
                  <path d="m4 14 8-8 8 8" />
                </svg>
              </div>
              <div className="cc-pipeline-feature-text">
                <h3 className="cc-pipeline-feature-name">FAST SHIPPING</h3>
                <p className="cc-pipeline-feature-desc">Priority slot booking with premier carrier lines.</p>
              </div>
            </div>

            <div className="cc-pipeline-feature-item">
              <div className="cc-pipeline-feature-icon-wrapper" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="cc-pipeline-feature-text">
                <h3 className="cc-pipeline-feature-name">CUSTOMS CLEARED</h3>
                <p className="cc-pipeline-feature-desc">Full pre-clearing &amp; bilateral transit tariff filings.</p>
              </div>
            </div>

            <div className="cc-pipeline-feature-item">
              <div className="cc-pipeline-feature-icon-wrapper" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div className="cc-pipeline-feature-text">
                <h3 className="cc-pipeline-feature-name">DOOR-TO-PORT DELIVERY</h3>
                <p className="cc-pipeline-feature-desc">Direct transport coordination from source to docks.</p>
              </div>
            </div>

            <div className="cc-pipeline-feature-item">
              <div className="cc-pipeline-feature-icon-wrapper" aria-hidden="true">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="cc-pipeline-feature-text">
                <h3 className="cc-pipeline-feature-name">REAL-TIME TRACKING</h3>
                <p className="cc-pipeline-feature-desc">Maritime vessel tracking with automated ETA updates.</p>
              </div>
            </div>
          </div>

          <div className="cc-pipeline-cta-group">
            <a href="/shipping-schedule" className="cc-btn-pipeline-primary">
              <span>LEARN ABOUT SHIPPING</span>
              <span aria-hidden="true">→</span>
            </a>
            <a href="/freight-calculator" className="cc-btn-pipeline-outline">
              <span>ESTIMATE SHIPPING RATES</span>
            </a>
          </div>
        </div>

        <div className="cc-logistics-pipeline-media">
          <img
            src="/images/maritime_shipping_vessel.jpg"
            alt="Commercial maritime container shipping vessel and cranes"
            className="cc-pipeline-image"
            loading="lazy"
          />
          <div className="cc-pipeline-media-tag">
            <span className="cc-media-tag-label">VESSEL DEPARTURE</span>
            <span className="cc-media-tag-title">ACTIVE MARITIME REGISTRY</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Tailored Export Solutions & Secured Global Operations */}
      <div className="cc-logistics-duo-row">
        {/* Left: Tailored Export Solutions */}
        <section className="cc-solutions-card" aria-labelledby="tailored-solutions-heading">
          <div className="cc-solutions-badge">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>CUSTOMIZED TRANSIT PIPELINES</span>
          </div>

          <h3 id="tailored-solutions-heading" className="cc-solutions-title">
            TAILORED EXPORT<br />
            <span className="cc-solutions-title-highlight">SOLUTIONS</span>
          </h3>

          <p className="cc-solutions-desc">
            Choose from high-efficiency transit options optimized for your port&apos;s infrastructure and volume requirement. We secure premium freight schedules for single or bulk dealer consignments.
          </p>

          <div className="cc-solutions-checklist">
            <div className="cc-checklist-item">
              <span className="cc-check-icon" aria-hidden="true">✓</span>
              <span>Roll-on/Roll-off (RoRo)</span>
            </div>
            <div className="cc-checklist-item">
              <span className="cc-check-icon" aria-hidden="true">✓</span>
              <span>Dedicated Containerized Loading</span>
            </div>
            <div className="cc-checklist-item">
              <span className="cc-check-icon" aria-hidden="true">✓</span>
              <span>Consolidated Multi-Unit Freight</span>
            </div>
            <div className="cc-checklist-item">
              <span className="cc-check-icon" aria-hidden="true">✓</span>
              <span>Pre-Shipment Port Inspections</span>
            </div>
          </div>

          <div className="cc-solutions-cta-group">
            <a href="/contact?enquiryType=shipping" className="cc-btn-solutions-primary">
              <span>GET EXPORT QUOTE</span>
              <span aria-hidden="true">→</span>
            </a>
            <a href="/how-to-buy" className="cc-btn-solutions-outline">
              <span>LEARN SHIPPING BLUEPRINT</span>
            </a>
          </div>
        </section>

        {/* Right: Secured Global Operations */}
        <section className="cc-operations-card" aria-labelledby="secured-operations-heading">
          <div className="cc-operations-badge">
            <span className="cc-live-pulse-dot" aria-hidden="true">●</span>
            <span>LIVE REGISTRY STATISTICS</span>
          </div>

          <h3 id="secured-operations-heading" className="cc-operations-title">
            SECURED GLOBAL<br />
            <span className="cc-operations-title-highlight">OPERATIONS</span>
          </h3>

          <p className="cc-operations-desc">
            We monitor vessel transit vectors, custom duties, escrow balances, and legal documentation in real-time.
          </p>

          <div className="cc-operations-stats-grid">
            <div className="cc-stat-box">
              <span className="cc-stat-label">GLOBAL ESCROW</span>
              <span className="cc-stat-value">$42.8M+</span>
            </div>
            <div className="cc-stat-box">
              <span className="cc-stat-label">TOTAL SOURCED</span>
              <span className="cc-stat-value">14,200+ Units</span>
            </div>
          </div>

          <div className="cc-operations-footer">
            <span className="cc-operations-compliance">LOGISTICS DECK COMPLIANT</span>
          </div>
        </section>
      </div>
    </div>
  );
};
