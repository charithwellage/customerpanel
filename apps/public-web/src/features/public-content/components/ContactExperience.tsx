'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ContactEnquirySection } from '../../enquiry';

export interface ContactExperienceProps {
  searchParams?: {
    vehicle?: string;
    vehicleSlug?: string;
    destinationCode?: string;
    portCode?: string;
    message?: string;
    enquiryType?: string;
  };
}

export const ContactExperience: React.FC<ContactExperienceProps> = ({ searchParams }) => {
  return (
    <div className="cnt-page-wrap">
      {/* 1. Dark Hero Banner */}
      <section className="cnt-hero-banner">
        <div className="cnt-hero-inner">
          <div className="cnt-hero-eyebrow">
            <span>GLOBAL COMMUNICATIONS</span>
          </div>
          <h1 className="cnt-hero-title">
            CONNECT WITH OUR <span className="cnt-hero-title-accent">OPERATIONS AGENTS</span>
          </h1>
          <p className="cnt-hero-subtitle">
            Have questions regarding deep-sea shipping, custom container locks, currency conversions, or certified pre-sealing? Submit an inquiry below.
          </p>
        </div>
      </section>

      {/* 2. Main 2-Column Section */}
      <div className="cnt-body-container">
        {/* Left Column - Contact Directory & International Offices */}
        <aside className="cnt-left-col">
          <div className="cnt-directory-header">
            <span className="cnt-directory-eyebrow">CONTACT DIRECTORY</span>
            <h2 className="cnt-directory-title">INTERNATIONAL OFFICES</h2>
            <p className="cnt-directory-subtitle">
              Direct communication links to our regional hubs. Visited strictly by pre-scheduled custom consultations.
            </p>
          </div>

          <div className="cnt-offices-stack">
            {/* Munich Headquarters */}
            <article className="cnt-office-card">
              <header className="cnt-office-card-header">
                <h3 className="cnt-office-name">MUNICH HEADQUARTERS</h3>
                <span className="cnt-office-icon" aria-hidden="true">📍</span>
              </header>
              <div className="cnt-office-details">
                <p className="cnt-office-row">
                  <span className="cnt-detail-icon">📍</span>
                  <span>Maximilianstraße 45, 80539 München, Germany</span>
                </p>
                <p className="cnt-office-row">
                  <span className="cnt-detail-icon">📞</span>
                  <span>+49 89 2424 990</span>
                </p>
                <p className="cnt-office-row">
                  <span className="cnt-detail-icon">✉</span>
                  <a href="mailto:munich@carchief.com" className="cnt-office-link">
                    munich@carchief.com
                  </a>
                </p>
              </div>
            </article>

            {/* Rotterdam Logistics Gate */}
            <article className="cnt-office-card">
              <header className="cnt-office-card-header">
                <h3 className="cnt-office-name">ROTTERDAM LOGISTICS GATE</h3>
                <span className="cnt-office-icon" aria-hidden="true">📍</span>
              </header>
              <div className="cnt-office-details">
                <p className="cnt-office-row">
                  <span className="cnt-detail-icon">📍</span>
                  <span>Boompjes 40, 3011 XB Rotterdam, Netherlands</span>
                </p>
                <p className="cnt-office-row">
                  <span className="cnt-detail-icon">📞</span>
                  <span>+31 10 440 2201</span>
                </p>
                <p className="cnt-office-row">
                  <span className="cnt-detail-icon">✉</span>
                  <a href="mailto:rotterdam@carchief.com" className="cnt-office-link">
                    rotterdam@carchief.com
                  </a>
                </p>
              </div>
            </article>

            {/* Operating Hours Card (Dark Black) */}
            <article className="cnt-hours-card">
              <header className="cnt-hours-header">
                <span className="cnt-hours-icon">⏰</span>
                <span className="cnt-hours-title">OPERATING HOURS</span>
              </header>
              <div className="cnt-hours-rows">
                <div className="cnt-hours-row">
                  <span className="cnt-hours-day">Monday – Friday</span>
                  <span className="cnt-hours-time">08:00 – 18:00 CET</span>
                </div>
                <div className="cnt-hours-row">
                  <span className="cnt-hours-day">Saturday</span>
                  <span className="cnt-hours-time">09:00 – 14:00 CET</span>
                </div>
                <div className="cnt-hours-row cnt-hours-row--closed">
                  <span className="cnt-hours-day">Sunday</span>
                  <span className="cnt-hours-closed-badge">PORT OPERATIONS CLOSED</span>
                </div>
              </div>
            </article>
          </div>
        </aside>

        {/* Right Column - Direct Lead Submission Form Container */}
        <main className="cnt-right-col">
          <div className="cnt-form-card">
            <header className="cnt-form-header">
              <h2 className="cnt-form-title">DIRECT LEAD SUBMISSION</h2>
              <p className="cnt-form-subtitle">
                Submitting this form dispatches a real operational record straight to our logistics backend ledger.
              </p>
            </header>

            <Suspense fallback={<div className="cnt-form-loading">Loading submission form...</div>}>
              <ContactEnquirySection searchParams={searchParams} />
            </Suspense>

            <div className="cnt-form-faq-footer">
              <span className="cnt-faq-help-icon">❓</span>
              <span>Have standard logistics questions? </span>
              <Link href="/faq" className="cnt-faq-link">
                Read our full FAQ portal
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
