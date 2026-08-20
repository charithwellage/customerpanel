'use client';

import React, { useState } from 'react';
import '../services.css';

export interface BorderCountryLogistics {
  country: string;
  code: string;
  flag: string;
  portsServed: string[];
  destinations: string[];
}

export const BORDER_LOGISTICS_DATA: BorderCountryLogistics[] = [
  {
    country: 'Zimbabwe',
    code: 'ZWE',
    flag: '🇿🇼',
    portsServed: ['Durban (South Africa)', 'Beira (Mozambique)', 'Maputo (Mozambique)'],
    destinations: ['Beitbridge', 'Chirundu', 'Harare', 'Nakonde', 'Plumtree', 'Tunduma'],
  },
  {
    country: 'Zambia',
    code: 'ZMB',
    flag: '🇿🇲',
    portsServed: ['Dar es Salaam (Tanzania)', 'Walvis Bay (Namibia)', 'Durban (South Africa)'],
    destinations: ['Chirundu', 'Lusaka', 'Ndola', 'Kabwe', 'Kitwe', 'Nakonde', 'Tunduma', 'Songwe', 'Kasumulu'],
  },
  {
    country: 'Botswana',
    code: 'BWA',
    flag: '🇧🇼',
    portsServed: ['Durban (South Africa)', 'Walvis Bay (Namibia)'],
    destinations: ['Gaborone'],
  },
  {
    country: 'DR Congo',
    code: 'COD',
    flag: '🇨🇩',
    portsServed: ['Dar es Salaam (Tanzania)', 'Mombasa (Kenya)', 'Walvis Bay (Namibia)'],
    destinations: ['Chirundu', 'Kasumbalesa', 'Mokambo', 'Sakania'],
  },
];

export const ServicesExperience: React.FC = () => {
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(0);
  const activeLogistics = BORDER_LOGISTICS_DATA[selectedCountryIndex] || BORDER_LOGISTICS_DATA[0];

  return (
    <div className="services-page-wrap" data-testid="services-experience">
      {/* 1. Hero Banner (matching How-To-Buy dark hero) */}
      <div className="services-hero">
        <div className="services-hero-inner">
          <div className="services-hero-content">
            <div className="services-badge">
              <span>COMPREHENSIVE AUTO EXPORT &amp; LOGISTICS</span>
            </div>
            <h1 className="services-title">
              Global Vehicle Services &amp; <span className="services-title-highlight">Direct Buyer Solutions</span>
            </h1>
            <p className="services-subtitle">
              From priority 2-week fast-track ocean shipments to single-point-of-contact customs clearance, certified pre-shipment inspections, and direct border delivery across Southern &amp; Central Africa.
            </p>
          </div>
          <div className="services-hero-action">
            <a href="/allstock" className="services-hero-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>BROWSE ALL STOCK</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Body Wrap */}
      <div className="services-body-wrap">
        {/* Key Value KPIs Strip */}
        <div className="services-stats-strip" aria-label="Key Service Highlights">
          <div className="services-stat-card">
            <div className="services-stat-value">~2 Weeks</div>
            <div className="services-stat-label">Fast-Track Shipment (vs. 3-4 weeks normal)</div>
          </div>
          <div className="services-stat-card">
            <div className="services-stat-value">100%</div>
            <div className="services-stat-label">Pre-Shipment Inspection &amp; Marine Transit Cover</div>
          </div>
          <div className="services-stat-card">
            <div className="services-stat-value">Exclusive</div>
            <div className="services-stat-label">CarChief Warranty for Direct Buyers</div>
          </div>
          <div className="services-stat-card">
            <div className="services-stat-value">18+ Hubs</div>
            <div className="services-stat-label">Direct Inland Border Deliveries</div>
          </div>
        </div>

        {/* Section: Core Offerings */}
        <div className="services-section-header">
          <h2 className="services-section-title">Core Service Offerings</h2>
          <p className="services-section-desc">
            End-to-end transparent vehicle sourcing, maritime freight management, customs clearing, and overland logistics.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="services-pillars-grid">
          {/* Pillar 1: Vehicle Fast-Track Shipment */}
          <article className="service-pillar-card" aria-labelledby="service-shipment-title">
            <div className="service-icon-box" aria-hidden="true">
              🚢
            </div>
            <h3 id="service-shipment-title" className="service-pillar-title">
              Vehicle Shipment &amp; Fast-Track Logistics
            </h3>
            <p className="service-pillar-desc">
              CarChief processes cars for shipment to local agents in approximately two weeks, significantly faster than the normal 3 to 4 weeks. We achieve this through direct high-volume tie-ups and priority vessel allocations with major Japanese maritime carriers.
            </p>
            <ul className="service-pillar-features" aria-label="Vehicle Shipment Features">
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>~2 Weeks Processing:</strong> Significantly cuts standard maritime lead times.</span>
              </li>
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Major Carrier Tie-Ups:</strong> Direct alliances with Japan's top shipping lines.</span>
              </li>
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Live Tracking:</strong> Real-time vessel monitoring &amp; express DHL B/L dispatch.</span>
              </li>
            </ul>
          </article>

          {/* Pillar 2: Additional Services & Warranty */}
          <article className="service-pillar-card service-pillar-card--featured" aria-labelledby="service-warranty-title">
            <span className="service-pillar-badge">EXCLUSIVE</span>
            <div className="service-icon-box" aria-hidden="true">
              🛡️
            </div>
            <h3 id="service-warranty-title" className="service-pillar-title">
              Additional Services &amp; CarChief Warranty
            </h3>
            <p className="service-pillar-desc">
              CarChief provides comprehensive marine insurance, rigorous multi-point roadworthiness inspections, and the exclusive CarChief Warranty designed to give direct vehicle buyers total peace of mind on engine, gearbox, and drivetrain components.
            </p>
            <ul className="service-pillar-features" aria-label="Additional Services and Warranty Features">
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Exclusive CarChief Warranty:</strong> Peace of mind warranty for direct buyers.</span>
              </li>
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Certified Inspections:</strong> JAVIC, QISJ, EAA, and Veritas certification.</span>
              </li>
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>100% Marine Insurance:</strong> Complete coverage against loss or transit damage.</span>
              </li>
            </ul>
          </article>

          {/* Pillar 3: Destination Port Clearing Services */}
          <article className="service-pillar-card" aria-labelledby="service-clearing-title">
            <div className="service-icon-box" aria-hidden="true">
              📑
            </div>
            <h3 id="service-clearing-title" className="service-pillar-title">
              Destination Port Clearing Services
            </h3>
            <p className="service-pillar-desc">
              Enjoy a hassle-free import experience with our single-point-of-contact clearing solution. CarChief manages the entire customs and port clearance workflow through certified local agents at destination ports, handling duties, taxes, and terminal formalities.
            </p>
            <ul className="service-pillar-features" aria-label="Clearing Services Features">
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Single Point of Contact:</strong> Full clearing handled from Japan to destination port.</span>
              </li>
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Local Agent Network:</strong> Trusted partners stationed at all major African ports.</span>
              </li>
              <li className="service-pillar-feature-item">
                <span className="service-check-icon">✓</span>
                <span><strong>Zero Hidden Costs:</strong> Accurate customs valuation and duty calculation.</span>
              </li>
            </ul>
          </article>
        </div>

        {/* Section: Border Delivery Logistics Network */}
        <section className="border-logistics-section" aria-labelledby="border-logistics-title">
          <div className="services-section-header" style={{ marginBottom: '1.5rem' }}>
            <h2 id="border-logistics-title" className="services-section-title">
              Border Delivery Logistics &amp; Inland Partnerships
            </h2>
            <p className="services-section-desc">
              CarChief maintains dedicated logistical partnerships for delivering vehicles directly to key border posts and regional inland cities.
            </p>
          </div>

          {/* Country Selection Tabs */}
          <div className="border-tabs-bar" role="tablist" aria-label="Select Delivery Country">
            {BORDER_LOGISTICS_DATA.map((item, index) => {
              const isActive = index === selectedCountryIndex;
              return (
                <button
                  key={item.code}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`border-tab-btn ${isActive ? 'border-tab-btn--active' : ''}`}
                  onClick={() => setSelectedCountryIndex(index)}
                >
                  <span aria-hidden="true">{item.flag}</span>
                  <span>{item.country}</span>
                </button>
              );
            })}
          </div>

          {/* Active Country Detail Card */}
          <div className="border-country-card" role="tabpanel" aria-label={`Delivery details for ${activeLogistics.country}`}>
            <div className="border-country-header">
              <h3 className="border-country-title">
                <span>{activeLogistics.flag}</span>
                <span>{activeLogistics.country} Border Delivery Network</span>
              </h3>
              <span className="border-country-badge">
                {activeLogistics.destinations.length} Active Border Hubs
              </span>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              <strong style={{ color: '#0f172a' }}>Primary Ocean Ports:</strong> {activeLogistics.portsServed.join(' • ')}
            </p>

            <div className="border-towns-grid" aria-label={`Border posts in ${activeLogistics.country}`}>
              {activeLogistics.destinations.map((town) => (
                <div key={town} className="border-town-pill">
                  <span className="border-town-icon" aria-hidden="true">📍</span>
                  <span>{town}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Call to Action Banner */}
        <section className="services-cta-banner" aria-labelledby="services-cta-title">
          <h2 id="services-cta-title" className="services-cta-title">
            Ready to Export Your Next Vehicle?
          </h2>
          <p className="services-cta-desc">
            Browse thousands of certified Japanese used vehicles in our showroom, calculate instant CIF and border freight rates, or speak with our sales advisors today.
          </p>
          <div className="services-cta-actions">
            <a href="/allstock" className="services-cta-btn services-cta-btn--primary">
              Browse All Stock
            </a>
            <a href="/freight-calculator" className="services-cta-btn services-cta-btn--secondary">
              Freight Calculator
            </a>
            <a href="/contact" className="services-cta-btn services-cta-btn--secondary">
              Contact Sales Support
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
