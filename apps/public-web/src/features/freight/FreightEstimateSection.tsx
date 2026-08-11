'use client';

import React, { useId } from 'react';
import { FreightEstimateForm } from './components/FreightEstimateForm';
import { FreightEstimatePanel } from './components/FreightEstimatePanel';
import { useFreightEstimate, type UseFreightEstimateOptions } from './hooks/useFreightEstimate';

export interface FreightEstimateSectionProps {
  /** Vehicle slug for the "Request a formal quotation" enquiry link, when this section is shown on a vehicle detail page. */
  vehicleSlug?: string;
  /** Injectable for tests; production callers omit this and let the hook construct its own service. */
  serviceOptions?: UseFreightEstimateOptions;
}

/**
 * Freight estimate selection, submission and explanation composition
 * (PUB-12). Wires `useFreightEstimate` to the presentational form and result
 * panel. This is the section embedded on the vehicle detail page
 * ("vehicle detail freight integration", D01-P05-T003 owned scope).
 */
export function FreightEstimateSection({ vehicleSlug, serviceOptions }: FreightEstimateSectionProps) {
  const headingId = useId();
  const freight = useFreightEstimate(serviceOptions);

  const enquiryHref = vehicleSlug
    ? `/contact?vehicle=${encodeURIComponent(vehicleSlug)}&topic=freight-estimate`
    : '/contact?topic=freight-estimate';

  return (
    <section className="cc-freight-estimate" aria-labelledby={headingId}>
      <h2 id={headingId} className="cc-freight-estimate__heading">
        Estimate Shipping Cost
      </h2>
      <p className="cc-freight-estimate__intro">
        Select where you would like this vehicle shipped to see what shipping information is currently available for
        that route.
      </p>

      <div className="cc-freight-estimate__body">
        <FreightEstimateForm
          destinations={freight.destinations}
          ports={freight.ports}
          catalogLoading={freight.catalogLoading}
          catalogError={freight.catalogError}
          onRetryCatalog={freight.reloadCatalog}
          values={freight.values}
          onFieldChange={freight.setField}
          fieldErrors={freight.fieldErrors}
          isSubmitting={freight.isSubmitting}
          onSubmit={freight.submit}
        />
        <FreightEstimatePanel
          isSubmitting={freight.isSubmitting}
          submitError={freight.submitError}
          onRetrySubmit={freight.submit}
          result={freight.result}
          enquiryHref={enquiryHref}
        />
      </div>
    </section>
  );
}
