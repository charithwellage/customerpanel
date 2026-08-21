'use client';

import React from 'react';
import { EnterpriseLoginModal } from '../../account-entry';

export interface SocialAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleSlug: string;
  vehicleTitle: string;
  onSuccessAuth: () => void;
}

export function SocialAuthModal({
  isOpen,
  onClose,
  vehicleSlug,
  vehicleTitle,
  onSuccessAuth,
}: SocialAuthModalProps) {
  return (
    <EnterpriseLoginModal
      isOpen={isOpen}
      onClose={onClose}
      vehicleSlug={vehicleSlug}
      title="Sign In to Get Your Free Quote"
      subtitle={`Instant C&F shipping calculations, port clearance rates, and official export Proforma Invoices for ${vehicleTitle}.`}
      badgeText="⚡ INSTANT EXPORT INVOICING"
      onSuccessAuth={() => onSuccessAuth()}
    />
  );
}
