'use client';

import React, { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { EnquirySection } from './EnquirySection';
import type { EnquiryContext, UseEnquiryFormOptions } from './hooks/useEnquiryForm';
import type { EnquiryType } from '@carchief/domain';

export interface ContactEnquirySectionProps {
  searchParams?: {
    vehicle?: string;
    vehicleSlug?: string;
    destinationCode?: string;
    portCode?: string;
    message?: string;
    enquiryType?: string;
  };
  serviceOptions?: UseEnquiryFormOptions;
}

function resolveParam(
  key: string,
  hookParams: ReturnType<typeof useSearchParams>,
  propParams?: Record<string, string | undefined>
): string | undefined {
  if (typeof window !== 'undefined') {
    const fromUrl = new URLSearchParams(window.location.search).get(key);
    if (fromUrl) return fromUrl;
  }

  const fromHook = hookParams?.get(key);
  if (fromHook) return fromHook;

  const fromProp = propParams?.[key];
  if (fromProp) return fromProp;

  return undefined;
}

export function ContactEnquirySection({ searchParams: propSearchParams, serviceOptions }: ContactEnquirySectionProps) {
  const hookSearchParams = useSearchParams();

  const vehicleSlug =
    resolveParam('vehicle', hookSearchParams, propSearchParams) ||
    resolveParam('vehicleSlug', hookSearchParams, propSearchParams);

  const destinationCode = resolveParam('destinationCode', hookSearchParams, propSearchParams);
  const portCode = resolveParam('portCode', hookSearchParams, propSearchParams);
  const message = resolveParam('message', hookSearchParams, propSearchParams);
  const rawEnquiryType = resolveParam('enquiryType', hookSearchParams, propSearchParams);

  const enquiryType = (
    rawEnquiryType && ['general', 'vehicle', 'premium-vehicle', 'quotation'].includes(rawEnquiryType)
      ? rawEnquiryType
      : undefined
  ) as EnquiryType | undefined;

  const context = useMemo<EnquiryContext>(
    () => ({
      vehicleSlug,
      destinationCode,
      portCode,
      message,
      enquiryType,
    }),
    [vehicleSlug, destinationCode, portCode, message, enquiryType]
  );

  return <EnquirySection context={context} headingLevel="h2" serviceOptions={serviceOptions} />;
}
