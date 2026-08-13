import React, { useState, ReactNode } from 'react';
import { CustomerSession, loadCustomerSession, saveCustomerSession } from './accountState.js';
import { LoginForm } from './LoginForm.js';
import { PasswordRecoveryCard } from './PasswordRecoveryCard.js';
import { AccountStateBanner } from './AccountStateBanner.js';

export interface AccountGuardProps {
  children: ReactNode;
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
    return <PasswordRecoveryCard onBackToLogin={() => setShowRecovery(false)} />;
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
            setSession(null);
            setShowRecovery(false);
          }}
          actionLabel="Return to Sign In"
        />
      </div>
    );
  }

  return <>{children}</>;
};
