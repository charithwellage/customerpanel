'use client';

import React, { useState, useEffect } from 'react';

export interface PrivacyPageContentProps {
  title?: string;
  body?: string;
}

export const PrivacyPageContent: React.FC<PrivacyPageContentProps> = ({
  title = 'Privacy & Cookie Policy',
  body = 'We respect your privacy. This page outlines how CarChief collects, uses, and safeguards visitor data in compliance with international privacy standards.',
}) => {
  const [consentChoice, setConsentChoice] = useState<'all' | 'essential' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('carchief_cookie_consent');
      if (stored === 'all' || stored === 'essential') {
        setConsentChoice(stored);
      }
    }
  }, []);

  const handleConsent = (choice: 'all' | 'essential') => {
    setConsentChoice(choice);
    if (typeof window !== 'undefined') {
      localStorage.setItem('carchief_cookie_consent', choice);
    }
  };

  return (
    <div className="cc-privacy-page">
      <div className="cc-privacy-page__intro">{body}</div>

      <section className="cc-privacy-page__consent-card" aria-labelledby="consent-heading">
        <h2 id="consent-heading" className="cc-privacy-page__consent-title">
          Cookie Preferences & Consent Choice
        </h2>
        <p className="cc-privacy-page__consent-desc">
          CarChief uses essential session cookies to enable core site functionality (such as language selection and vehicle search filters). Optional analytics cookies help us improve site performance.
        </p>

        <div role="status" aria-live="polite" className="cc-privacy-page__status-msg">
          {consentChoice ? (
            <>
              Current Choice:{' '}
              <strong>
                {consentChoice === 'all' ? 'All Cookies Accepted' : 'Essential Cookies Only'}
              </strong>
            </>
          ) : (
            'No cookie preferences selected yet.'
          )}
        </div>

        <div className="cc-privacy-page__choice-actions">
          <button
            type="button"
            onClick={() => handleConsent('essential')}
            className={`cc-btn ${consentChoice === 'essential' ? 'cc-btn--primary' : 'cc-btn--secondary'}`}
          >
            Essential Cookies Only
          </button>
          <button
            type="button"
            onClick={() => handleConsent('all')}
            className={`cc-btn ${consentChoice === 'all' ? 'cc-btn--primary' : 'cc-btn--secondary'}`}
          >
            Accept All Cookies
          </button>
        </div>
      </section>

      <section className="cc-privacy-page__details">
        <article className="cc-privacy-page__block">
          <h3>1. Data Collection</h3>
          <p>
            When submitting an enquiry or reservation request, we collect your contact details (name, email, phone number) solely for processing your vehicle quotation or order.
          </p>
        </article>

        <article className="cc-privacy-page__block">
          <h3>2. Data Security</h3>
          <p>
            All data transmissions are encrypted using standard HTTPS transport security. We never sell or share customer contact details with third-party marketers.
          </p>
        </article>

        <article className="cc-privacy-page__block">
          <h3>3. Rights & Access</h3>
          <p>
            You have the right to request access to or deletion of your personal data at any time by contacting support@carchief.com.
          </p>
        </article>
      </section>
    </div>
  );
};
