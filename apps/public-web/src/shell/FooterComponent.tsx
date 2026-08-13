import React from 'react';

export const FooterComponent: React.FC = () => {
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
            CarChief is a high-end showcase portal providing direct ocean-cargo logistics, certified pre-owned inspections, and custom spec tracking.
          </p>
        </div>

        <div className="footer-links-col">
          <h4>LOGISTICS CORE PORTALS</h4>
          <ul>
            <li><a href="#showroom">Showroom Catalog</a></li>
            <li><a href="/how-to-buy">How to Buy</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/testimonials">Testimonials</a></li>
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </div>

        <div className="footer-security-col">
          <h4>SECURE VERIFICATION</h4>
          <p className="footer-security-text">
            CarChief utilizes highly secure cloud-replicated server architectures for real-time transaction records and client logs.
          </p>
          <div className="footer-envelope-badge">
            <span className="lock-icon">🔒</span> SECURED CLOUD ENVELOPE
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 CARCHIEF AUTO GROUP. ALL RIGHTS RESERVED.</p>
        <p className="footer-protocol">CLOUDRUN ENVIRONMENT · REGISTRY SECURITY PROTOCOL SHIELD-V2</p>
      </div>
    </footer>
  );
};
