'use client';

import React from 'react';
import { useTranslation } from '../i18n';

export const FooterComponent: React.FC = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer-shell" id="site-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <div className="footer-logo">
            <span className="brand-icon">CC</span>
            <span className="brand-name">CARCHIEF</span>
          </div>
          <p className="footer-tagline">PREMIUM GLOBAL VEHICLE EXPORTERS</p>
          <p className="footer-description">
            {t('footer.tagline', undefined, 'Premium Japanese used vehicles exported globally with guaranteed quality.')}
          </p>
        </div>

        <div className="footer-links-col">
          <h4>{t('footer.quickLinks', undefined, 'LOGISTICS CORE PORTALS')}</h4>
          <ul>
            <li><a href="/allstock">{t('nav.inventory', undefined, 'Showroom Catalog')}</a></li>
            <li><a href="/how-to-buy">{t('nav.howToBuy', undefined, 'How to Buy')}</a></li>
            <li><a href="/services">{t('nav.services', undefined, 'Services')}</a></li>
            <li><a href="/about">{t('nav.about', undefined, 'About Us')}</a></li>
            <li><a href="/testimonials">{t('nav.testimonials', undefined, 'Testimonials')}</a></li>
            <li><a href="/faq">{t('nav.faq', undefined, 'FAQ')}</a></li>
            <li><a href="/contact">{t('nav.contact', undefined, 'Contact Us')}</a></li>
          </ul>
        </div>

        <div className="footer-security-col">
          <h4>{t('footer.legal', undefined, 'SECURE VERIFICATION')}</h4>
          <p className="footer-security-text">
            CarChief utilizes highly secure cloud-replicated server architectures for real-time transaction records and client logs.
          </p>
          <div className="footer-envelope-badge">
            <span className="lock-icon">🔒</span> SECURED CLOUD ENVELOPE
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t('footer.copyright', undefined, '© 2026 CARCHIEF AUTO GROUP. ALL RIGHTS RESERVED.')}</p>
        <p className="footer-protocol">CLOUDRUN ENVIRONMENT · REGISTRY SECURITY PROTOCOL SHIELD-V2</p>
      </div>
    </footer>
  );
};
