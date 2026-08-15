import React from 'react';

export interface PasswordRecoveryCardProps {
  onBackToLogin?: () => void;
}

export const PasswordRecoveryCard: React.FC<PasswordRecoveryCardProps> = ({ onBackToLogin }) => {
  return (
    <div className="cc-acc-recovery-card">
      <div className="cc-acc-recovery-card__header">
        <span className="cc-acc-recovery-card__badge">🔒 KEYCLOAK IDENTITY BOUNDARY</span>
        <h2 className="cc-acc-recovery-card__title">Password Recovery &amp; MFA Handoff</h2>
        <p className="cc-acc-recovery-card__desc">
          Production identity, password resets, and multi-factor authentication are managed centrally via Keycloak / AutoPulse IAM Services.
        </p>
      </div>

      <div className="cc-acc-recovery-card__notice" role="region" aria-label="Identity Notice">
        <strong>AutoPulse Production Boundary Notice (DEC-CUST-IDENTITY-RECOVERY)</strong>
        <p>
          Demo mode provides compatible session presentation. Password resets for registered business accounts require standard enterprise verification.
        </p>
      </div>

      <div className="cc-acc-recovery-card__actions">
        {onBackToLogin && (
          <button type="button" className="cc-cust-shell-btn cc-cust-shell-btn--secondary" onClick={onBackToLogin}>
            &larr; Back to Customer Login
          </button>
        )}
        <a
          href="mailto:support@carchief.com?subject=Account%20Recovery%20Request"
          className="cc-cust-shell-btn cc-cust-shell-btn--primary"
        >
          Contact Identity Operations
        </a>
      </div>
    </div>
  );
};
