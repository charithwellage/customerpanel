'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuoteRequest } from './hooks/useQuoteRequest';
import { QuoteRequestAction } from './components/QuoteRequestAction';
import { useSession } from '../account-entry';
import { QuoteCalculatorModal } from '@carchief/vehicle-detail';
import type { QuoteRequestFormSchemaValues } from '@carchief/validation';

export interface QuoteRequestSectionProps {
  vehicleSlug: string;
  vehicleLabel: string;
  vehicle?: {
    id: string;
    slug?: string;
    make: string;
    model: string;
    year: number;
    priceUsd?: number;
    discountedPriceUsd?: number;
    stockNumber?: string;
    chassisNumber?: string;
  };
}

function QuoteRequestSectionInner({ vehicleSlug, vehicleLabel, vehicle }: QuoteRequestSectionProps) {
  const searchParams = useSearchParams();
  const session = useSession();
  const isSignedIn = session.status === 'active';
  const { state, errorMessage, submitQuoteRequest, isSubmitted } = useQuoteRequest();
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Auto-open calculator if user returns from sign in with ?openQuote=true
  useEffect(() => {
    if (searchParams?.get('openQuote') === 'true' && isSignedIn) {
      setIsCalculatorOpen(true);
    }
  }, [searchParams, isSignedIn]);

  const handleSubmit = async (data: QuoteRequestFormSchemaValues) => {
    await submitQuoteRequest(data, vehicleSlug);
  };

  const returnTarget = `/allstock/${encodeURIComponent(vehicleSlug)}?openQuote=true`;
  const signInHref = `/account?returnTo=${encodeURIComponent(returnTarget)}`;

  const fallbackVehicle = vehicle || {
    id: vehicleSlug,
    slug: vehicleSlug,
    make: vehicleLabel.split(' ')[1] || 'Vehicle',
    model: vehicleLabel.split(' ').slice(2).join(' ') || 'Model',
    year: parseInt(vehicleLabel.split(' ')[0], 10) || 2022,
    priceUsd: 8500,
  };

  return (
    <div className="cc-quote-request-wrapper">
      <QuoteRequestAction
        state={state}
        vehicleLabel={vehicleLabel}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        isSubmitted={isSubmitted}
        isSignedIn={isSignedIn}
        signInHref={signInHref}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
      />

      <QuoteCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        vehicle={fallbackVehicle}
        onSubmitQuote={async () => {
          if (isSignedIn && session.claims) {
            await submitQuoteRequest(
              {
                name: session.claims.email.split('@')[0] || 'Valued Customer',
                email: session.claims.email || 'customer@example.com',
                phone: '+81-70-9210-1426',
              },
              vehicleSlug
            );
          }
        }}
      />
    </div>
  );
}

export function QuoteRequestSection(props: QuoteRequestSectionProps) {
  return (
    <Suspense fallback={null}>
      <QuoteRequestSectionInner {...props} />
    </Suspense>
  );
}
