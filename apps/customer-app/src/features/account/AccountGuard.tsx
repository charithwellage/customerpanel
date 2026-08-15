import React, { useState, ReactNode } from 'react';
import { CustomerSession, clearCustomerSession, loadCustomerSession, saveCustomerSession } from './accountState.js';
import { LoginForm } from './LoginForm.js';
import { PasswordRecoveryCard } from './PasswordRecoveryCard.js';
import { AccountStateBanner } from './AccountStateBanner.js';
import { clearCustomerSensitiveCachesOnLogout } from '../pwa/pwaConfig.js';

/**
 * Protected content, either as plain nodes or as a function of the verified
 * session. The function form lets the shell display the identity the Mock API
 * actually returned instead of a placeholder chosen before sign-in.
 */
export type AccountGuardChildren = ReactNode | ((session: CustomerSession) => ReactNode);

export interface AccountGuardProps {
  children: AccountGuardChildren;
  initialSession?: CustomerSession | null;
  apiBaseUrl?: string;
}

export const AccountGuard: React.FC<AccountGuardProps> = ({
  children,
  initialSession,
  apiBaseUrl = '',
}) => {
  const [session, setSession] = useState<CustomerSession | null>(() => initialSession || loadCustomerSession());
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLoginSuccess = (newSession: CustomerSession) => {
    saveCustomerSession(newSession);
    setSession(newSession);
    setShowRecovery(false);
  };

  if (showRecovery) {
    // Same centring surface as the other two states; without it the recovery
    // card rendered flush to the viewport edge.
    return (
      <div className="cc-acc-guard-surface">
        <PasswordRecoveryCard onBackToLogin={() => setShowRecovery(false)} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="cc-acc-guard-surface">
        <LoginForm
          onLoginSuccess={handleLoginSuccess}
          onRequestRecovery={() => setShowRecovery(true)}
          apiBaseUrl={apiBaseUrl}
        />
      </div>
    );
  }

  if (session.status !== 'ACTIVE') {
    return (
      <div className="cc-acc-guard-surface">
        <AccountStateBanner
          status={session.status}
          onAction={() => {
            clearCustomerSession();
            void clearCustomerSensitiveCachesOnLogout();
            setSession(null);
            setShowRecovery(false);
          }}
          actionLabel="Return to Sign In"
        />
      </div>
    );
  }

  return <>{typeof children === 'function' ? children(session) : children}</>;
};
