'use client';

import React from 'react';

export const AboutUsExperience: React.FC = () => {
  return (
    <div className="about-container">
      {/* 1. Dark Hero Banner */}
      <div className="about-hero-banner">
        <div className="about-hero-inner">
          <div className="about-hero-eyebrow">
            <span>GLOBAL OPERATIONS HERITAGE</span>
          </div>
          <h1 className="about-hero-title">
            WELCOME TO <span className="about-hero-title-accent">CARCHIEF!</span>
          </h1>
          <p className="about-hero-subtitle">
            We are the premier global automotive curators and logistics broker network, specializing in seamless intercontinental vehicle export and dealer empowerment.
          </p>
        </div>
      </div>

      <div className="about-body-wrap">
        {/* 2. Global Infrastructure Statistics Card */}
        <div className="about-stats-card">
          <div className="about-stats-header">
            <span className="about-stats-eyebrow">GLOBAL INFRASTRUCTURE</span>
            <h2 className="about-stats-title">CARCHIEF OPERATIONS</h2>
          </div>

          <div className="about-stats-grid">
            <div className="about-stat-item">
              <div className="about-stat-icon">🚩</div>
              <div className="about-stat-num">35</div>
              <div className="about-stat-label">YEARS</div>
            </div>

            <div className="about-stat-item">
              <div className="about-stat-icon">🌐</div>
              <div className="about-stat-num">14</div>
              <div className="about-stat-label">COUNTRIES</div>
            </div>

            <div className="about-stat-item">
              <div className="about-stat-icon">🧭</div>
              <div className="about-stat-num">4</div>
              <div className="about-stat-label">CONTINENTS</div>
            </div>

            <div className="about-stat-item">
              <div className="about-stat-icon">🏢</div>
              <div className="about-stat-num">9</div>
              <div className="about-stat-label">OFFICES</div>
            </div>
          </div>
        </div>

        {/* 3. Strategic Vision & Operations Mission Cards */}
        <div className="about-pillars-grid">
          {/* Card 1: Vision */}
          <div className="about-pillar-card">
            <div className="about-pillar-header">
              <div className="about-pillar-icon">🎯</div>
              <div className="about-pillar-meta">
                <span className="about-pillar-eyebrow">STRATEGIC PILLAR</span>
                <h3 className="about-pillar-title">OUR VISION</h3>
              </div>
            </div>

            <h4 className="about-pillar-subhead">TO TRANSFORM DREAMS INTO REALITY</h4>

            <p className="about-pillar-text">
              Our vision is to become the trusted partner of choice for dealers, known for our reliability and integrity. We are committed to creating a seamless and transparent experience that empowers dealers to grow their businesses confidently. Through exceptional service, innovative solutions, and unwavering integrity, we aim to be the trusted ally for dealers seeking long-term success.
            </p>

            <p className="about-pillar-italic">
              &quot;We aim to establish ourselves as a trusted ally for dealers looking to achieve long-term success.&quot;
            </p>

            <div className="about-pillar-footer">
              <span className="about-footer-tag">EST. OPERATIONS</span>
              <span className="about-footer-tag">GLOBAL ALLY REGISTERED</span>
            </div>
          </div>

          {/* Card 2: Mission */}
          <div className="about-pillar-card">
            <div className="about-pillar-header">
              <div className="about-pillar-icon">🧡</div>
              <div className="about-pillar-meta">
                <span className="about-pillar-eyebrow">OPERATIONS MANDATE</span>
                <h3 className="about-pillar-title">OUR MISSION</h3>
              </div>
            </div>

            <h4 className="about-pillar-subhead">CONVENIENCE, HAPPINESS, AND DISTINCTION</h4>

            <p className="about-pillar-text">
              Our mission is to be the industry leaders in online car sales, constantly adapting to market trends. We aim to surpass expectations by offering a wide range of cars and reliable, secure delivery through our dedicated fleet. By doing so, we strive to set new standards both online and offline. Our mission is driven by our commitment to dealers, providing them with unmatched opportunities for success in the automotive industry. Together, let&apos;s redefine the online car buying experience and empower dealers for long-term growth.
            </p>

            <div className="about-pillar-footer">
              <span className="about-footer-tag">UNIFIED FLEET</span>
              <span className="about-footer-tag">DEALER DEDICATED</span>
            </div>
          </div>
        </div>

        {/* 4. Redefining Procurement CTA Banner */}
        <div className="about-cta-banner">
          <h2 className="about-cta-title">REDEFINING ONLINE CAR PROCUREMENT</h2>
          <p className="about-cta-text">
            Connect directly with one of our operations coordinators for professional dealer services. We manage the entire loop from export diagnostics to container offloading.
          </p>

          <div className="about-cta-actions">
            <a href="/contact" className="about-btn-primary">
              INQUIRE WITH AN AGENT
            </a>
            <a href="/allstock" className="about-btn-secondary">
              BROWSE STOCK LIST
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
