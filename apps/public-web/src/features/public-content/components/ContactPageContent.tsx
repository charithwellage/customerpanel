import React from 'react';
import type { OfficeLocation } from '@carchief/domain';

export interface ContactPageContentProps {
  offices: OfficeLocation[];
  isLoading?: boolean;
}

export const ContactPageContent: React.FC<ContactPageContentProps> = ({
  offices,
  isLoading = false,
}) => {
  return (
    <div className="cc-contact-page">
      <div className="cc-contact-page__grid">
        <section className="cc-contact-page__card cc-contact-page__card--support">
          <h2 className="cc-contact-page__card-title">Global Customer Support</h2>
          <p className="cc-contact-page__card-text">
            Our international sales specialists and logistics advisors are available Monday through Friday.
          </p>

          <dl className="cc-contact-page__details">
            <div className="cc-contact-page__detail-group">
              <dt className="cc-contact-page__dt">Email Assistance</dt>
              <dd className="cc-contact-page__dd">
                <a href="mailto:support@carchief.com" className="cc-contact-page__link">
                  support@carchief.com
                </a>
              </dd>
            </div>

            <div className="cc-contact-page__detail-group">
              <dt className="cc-contact-page__dt">Hotline & WhatsApp</dt>
              <dd className="cc-contact-page__dd">
                <a href="tel:+256700000000" className="cc-contact-page__link">
                  +256 700 000 000
                </a>
              </dd>
            </div>

            <div className="cc-contact-page__detail-group">
              <dt className="cc-contact-page__dt">Business Hours</dt>
              <dd className="cc-contact-page__dd">Monday – Friday: 08:00 – 18:00 (Local Time)</dd>
            </div>
          </dl>

          <div className="cc-contact-page__actions">
            <a
              href="https://wa.me/256700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="cc-btn cc-btn--whatsapp"
            >
              Contact via WhatsApp
            </a>
            <a href="/how-to-buy" className="cc-btn cc-btn--secondary">
              How to Buy Guide
            </a>
          </div>
        </section>

        <section className="cc-contact-page__offices-wrap" aria-labelledby="offices-heading">
          <h2 id="offices-heading" className="cc-contact-page__offices-title">
            Regional Office Locations
          </h2>

          {isLoading && (
            <div role="status" className="cc-contact-page__loading">
              Loading office locations...
            </div>
          )}

          {!isLoading && offices.length === 0 && (
            <div className="cc-contact-page__empty">
              <p>No regional office locations currently listed.</p>
            </div>
          )}

          {!isLoading && offices.length > 0 && (
            <div className="cc-contact-page__offices-list">
              {offices.map((office) => (
                <article key={office.id} className="cc-office-card">
                  <header className="cc-office-card__header">
                    <h3 className="cc-office-card__name">{office.name}</h3>
                    {office.isPrimary && (
                      <span className="cc-office-card__badge">Headquarters</span>
                    )}
                  </header>

                  <div className="cc-office-card__body">
                    <p className="cc-office-card__location">
                      <strong>Location:</strong> {office.city}, {office.country}
                    </p>
                    <p className="cc-office-card__address">
                      <strong>Address:</strong> {office.address}
                    </p>
                    <p className="cc-office-card__phone">
                      <strong>Phone:</strong> {office.phone}
                    </p>
                    <p className="cc-office-card__email">
                      <strong>Email:</strong> {office.email}
                    </p>
                    <p className="cc-office-card__hours">
                      <strong>Operating Hours:</strong> {office.operatingHours}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
