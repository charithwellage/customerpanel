import React, { useState } from 'react';
import { VehicleGalleryPrimitive, formatVehicleTitle, getVisibleGalleryImages } from '@carchief/vehicle-detail';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerProfile } from '../profile/index.js';
import { useCustomerVehicleDetail } from './useCustomerVehicleDetail.js';
import { CustomerInquiryModal } from './CustomerInquiryModal.js';
import { useCustomerTierBenefits } from './useCustomerTierBenefits.js';
import { CustomerVehicleSpecifications } from '../../components/CustomerVehicleSpecifications.js';

export interface CustomerVehicleDetailPageProps {
  slug: string;
  apiBaseUrl?: string;
  token?: string;
  onBack?: () => void;
}

export const CustomerVehicleDetailPage: React.FC<CustomerVehicleDetailPageProps> = ({
  slug,
  apiBaseUrl = '',
  token,
  onBack,
}) => {
  const { user } = useCustomerShell();
  const { data: profile } = useCustomerProfile();
  const { data: tierBenefits } = useCustomerTierBenefits();
  const destinationCountry = profile?.deliveryAddress || user?.company || 'Kenya';

  const { state, refetch, reserveVehicle, requestPriceInquiry, toggleWishlist } = useCustomerVehicleDetail({
    idOrSlug: slug,
    apiBaseUrl,
    token,
    destinationCountry,
  });

  const { vehicle, loading, error, reserving, reserveSuccess, reserveError, holdExpiresAt } = state;
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryNotice, setInquiryNotice] = useState<string | null>(null);
  const [tierInfoOpen, setTierInfoOpen] = useState(false);

  if (loading) {
    return (
      <div className="cc-cust-detail-state" role="status" aria-live="polite">
        <div className="cc-cust-shell-spinner" aria-hidden="true" />
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="cc-cust-detail-state cc-cust-detail-state--error" role="alert">
        <h2>Unable to load vehicle</h2>
        <p>{error || 'Vehicle not found'}</p>
        <div className="cc-cust-detail-state__actions">
          {onBack && (
            <button type="button" className="cc-cust-btn cc-cust-btn--secondary" onClick={onBack}>
              &larr; Back to Inventory
            </button>
          )}
          <button type="button" className="cc-cust-btn cc-cust-btn--primary" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const title = formatVehicleTitle(vehicle);
  const customerName = profile?.name || user?.name || '';
  const customerEmail = profile?.email || user?.email || '';
  const images = vehicle.media ? getVisibleGalleryImages(vehicle.media) : [];
  const tierPricing = vehicle.tierPricing;
  const isRequestPrice = Boolean(vehicle.requestPrice || vehicle.priceState === 'request_price' || !vehicle.priceUsd);
  const eligibility = vehicle.reservationEligibility;
  const inquiryEligibility = vehicle.inquiryEligibility;
  const inquiryBlockedForAllocation = inquiryEligibility?.reason === 'allocated_to_another_customer';
  const inquiryBlockedForInvoiced = vehicle.status === 'Invoiced';
  const inquiryDisabled = state.inquirySubmitting || inquiryBlockedForAllocation || inquiryBlockedForInvoiced;
  const inquiryDisabledMessage = inquiryBlockedForInvoiced
    ? 'You cannot submit an inquiry because this vehicle has already been invoiced.'
    : inquiryBlockedForAllocation
      ? 'You cannot submit an inquiry because this vehicle has already been allocated to another customer.'
      : undefined;

  const originalPrice = tierPricing ? tierPricing.originalPriceUsd : (vehicle.priceUsd ?? 0);
  const hasTierDiscount = Boolean(tierPricing && tierPricing.tierDiscountPercent > 0);
  const hasVehicleDiscount = Boolean(
    !isRequestPrice &&
    vehicle.discountedPriceUsd !== undefined &&
    vehicle.priceUsd !== undefined &&
    vehicle.discountedPriceUsd < vehicle.priceUsd,
  );
  const hasApplicableDiscount = hasTierDiscount || hasVehicleDiscount;
  const finalPrice = hasTierDiscount
    ? tierPricing!.tierPriceUsd
    : (vehicle.discountedPriceUsd ?? vehicle.priceUsd ?? 0);

  const displayExpiry = holdExpiresAt || eligibility?.holdExpiresAt;
  const formattedExpiry = displayExpiry ? new Date(displayExpiry).toLocaleString() : '';

  const handleOpenInquiry = () => {
    if (state.inquiryAlreadySubmitted) {
      setInquiryNotice('You have already submitted an inquiry for this vehicle.');
      return;
    }
    setInquiryNotice(null);
    setInquiryModalOpen(true);
  };

  const handleSubmitInquiry = async (message: string) => {
    const response = await requestPriceInquiry(message);
    if (!response) return;
    setInquiryModalOpen(false);
    setInquiryNotice(response.duplicate ? 'You have already submitted an inquiry for this vehicle.' : null);
  };

  return (
    <div className="cc-cust-detail-page" data-testid="customer-vehicle-detail-page">
      {/* Back Button */}
      {onBack && (
        <div className="cc-cust-detail-nav">
          <button
            type="button"
            className="cc-cust-back-btn"
            onClick={onBack}
            aria-label="Return to inventory"
            data-testid="back-to-inventory-btn"
          >
            &larr; Back to Inventory
          </button>
        </div>
      )}

      <div className="cc-cust-detail-grid">
        {/* Gallery Section */}
        <div className="cc-cust-detail-gallery-col">
          <VehicleGalleryPrimitive
            images={images}
            title={title}
            badges={[{ label: vehicle.statusLabel || '', tone: vehicle.status === 'Available' ? ('success' as const) : ('warning' as const) }]}
          />
          <CustomerVehicleSpecifications vehicle={vehicle} />
        </div>

        {/* Info & Action Section */}
        <div className="cc-cust-detail-info-col">
          <header className="cc-cust-detail-header">
            <span className="cc-cust-detail-eyebrow">
              {vehicle.year} {vehicle.make}
            </span>
            <h1 className="cc-cust-detail-title">{vehicle.model}</h1>
            <div className="cc-cust-detail-meta-tags">
              <span className="cc-cust-tag cc-cust-tag--chassis">{vehicle.chassisNumber}</span>
              {vehicle.locationStatus && (
                <span className="cc-cust-tag cc-cust-tag--location">{vehicle.locationStatus}</span>
              )}
              {vehicle.destinationPort && (
                <span className="cc-cust-tag cc-cust-tag--port">Port: {vehicle.destinationPort}</span>
              )}
            </div>
          </header>

          {/* Import Compliance Card (D02-P14-T005) */}
          {vehicle.compliance && (
            <div className="cc-cust-compliance-detail-card" role="region" aria-label="Import compliance evaluation" data-testid="vehicle-compliance-card">
              <div className="cc-cust-compliance-detail-card__header">
                <span className="cc-cust-compliance-detail-card__icon">
                  {vehicle.compliance.isCompliant ? '✅' : '⚠️'}
                </span>
                <div>
                  <h3 className="cc-cust-compliance-detail-card__title">
                    {vehicle.compliance.isCompliant
                      ? `Import Compliant for ${vehicle.compliance.countryName}`
                      : `Import Restriction for ${vehicle.compliance.countryName}`}
                  </h3>
                  <p className="cc-cust-compliance-detail-card__summary">{vehicle.compliance.ruleSummary}</p>
                </div>
              </div>
              <div className="cc-cust-compliance-detail-card__criteria">
                {vehicle.compliance.passedCriteria.map((c, i) => (
                  <div key={i} className="cc-cust-compliance-criterion cc-cust-compliance-criterion--pass">
                    <span className="cc-cust-compliance-criterion__dot">✓</span> {c}
                  </div>
                ))}
                {vehicle.compliance.failedCriteria.map((c, i) => (
                  <div key={i} className="cc-cust-compliance-criterion cc-cust-compliance-criterion--fail">
                    <span className="cc-cust-compliance-criterion__dot">✕</span> {c}
                  </div>
                ))}
                {vehicle.compliance.requiredInspections && vehicle.compliance.requiredInspections.length > 0 && (
                  <div className="cc-cust-compliance-inspections">
                    <strong>Required Inspections:</strong> {vehicle.compliance.requiredInspections.join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing Card */}
          <div className="cc-cust-price-card" data-testid="vehicle-pricing-card">
            <h2 className="cc-cust-price-card__heading">Export Pricing</h2>
            {isRequestPrice ? (
              <div className="cc-cust-price-card__request">
                <span className="cc-cust-price-card__amount">Request Price</span>
                <p className="cc-cust-price-card__note">
                  Price is provided upon enquiry tailored to your destination port.
                </p>
              </div>
            ) : (
              <div className="cc-cust-price-card__breakdown">
                {hasApplicableDiscount && (
                  <div className="cc-cust-price-card__tier-info">
                    {hasTierDiscount && (
                      <div
                        className="cc-cust-tier-benefit-badge"
                        onMouseEnter={() => setTierInfoOpen(true)}
                        onMouseLeave={() => setTierInfoOpen(false)}
                      >
                        <span className="cc-cust-tier-badge">
                          ⭐️ {tierPricing!.tier} Tier Member (-{tierPricing!.tierDiscountPercent}%)
                        </span>
                        <button
                          type="button"
                          className="cc-cust-tier-benefit-badge__info"
                          aria-label="Show customer tier benefits"
                          aria-expanded={tierInfoOpen}
                          onClick={() => setTierInfoOpen((open) => !open)}
                        >
                          i
                        </button>
                        {tierInfoOpen && tierBenefits && (
                          <span className="cc-cust-tier-benefit-badge__tooltip" role="tooltip">
                            {tierBenefits.description} Discount: {tierBenefits.discountPercent}%. Reservation capacity: {tierBenefits.remainingReservations} of {tierBenefits.maxActiveReservations} remaining.
                          </span>
                        )}
                      </div>
                    )}
                    <span className="cc-cust-price-card__original">
                      Original Price: ${originalPrice.toLocaleString()} USD
                    </span>
                  </div>
                )}
                <div className="cc-cust-price-card__final-row">
                  <span className="cc-cust-price-card__label">Your Account Price:</span>
                  <span className="cc-cust-price-card__final-price" data-testid="vehicle-final-price">
                    ${finalPrice.toLocaleString()} <span className="cc-cust-price-card__currency">USD</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reservation Card (RULE-05, RULE-08, RULE-10, PUB-23) */}
          <div className="cc-cust-reservation-card" data-testid="vehicle-reservation-card">
            <h2 className="cc-cust-reservation-card__heading">Vehicle Allocation & Reservation</h2>
            {tierBenefits && (
              <p className="cc-cust-reservation-capacity" data-testid="reservation-capacity">
                {tierBenefits.remainingReservations} of {tierBenefits.maxActiveReservations} reservation holds remaining for your {tierBenefits.tier} tier account.
              </p>
            )}

            {reserveSuccess || eligibility?.isOwnHold ? (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--own-hold" role="status">
                <div className="cc-cust-status-banner cc-cust-status-banner--success">
                  <span className="cc-cust-status-banner__icon">✓</span>
                  <div>
                    <strong>You have an active 48-hour reservation hold</strong>
                    <p>Hold expires at: <strong>{formattedExpiry}</strong></p>
                    <p className="cc-cust-status-banner__sub">
                      Our export desk is preparing your pro-forma invoice.
                    </p>
                  </div>
                </div>
              </div>
            ) : eligibility?.reason === 'reserved_by_other' ? (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--held" role="status">
                <div className="cc-cust-status-banner cc-cust-status-banner--warning">
                  <span className="cc-cust-status-banner__icon">⏳</span>
                  <div>
                    <strong>Vehicle Currently Reserved</strong>
                    <p>
                      Another customer has an active 48-hour hold on this vehicle expiring at{' '}
                      <strong>{formattedExpiry}</strong>. If not finalized, stock will automatically return to sale.
                    </p>
                  </div>
                </div>
              </div>
            ) : isRequestPrice ? (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--info" role="status">
                <div className="cc-cust-status-banner cc-cust-status-banner--info">
                  <span className="cc-cust-status-banner__icon">ℹ️</span>
                  <div>
                    <strong>Price Upon Request</strong>
                    <p>Pricing is prepared upon enquiry tailored to your destination port and shipping requirements.</p>
                  </div>
                </div>

                {state.inquirySuccess ? (
                  <div className="cc-cust-status-banner cc-cust-status-banner--success cc-cust-status-banner--margin-top">
                    <span className="cc-cust-status-banner__icon">✓</span>
                    <div>
                      <strong>Quotation Request Submitted</strong>
                      <p>Reference ID: {state.inquiryId}. Our export desk will contact you shortly with confirmed pricing.</p>
                    </div>
                  </div>
                ) : (
                  <div className="cc-cust-inquiry-box">
                    {state.inquiryError && (
                      <div className="cc-cust-reservation-error" role="alert">
                        <p>{state.inquiryError}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="cc-cust-btn cc-cust-btn--primary cc-cust-btn--large"
                      onClick={() => requestPriceInquiry()}
                      disabled={state.inquirySubmitting}
                      data-testid="request-price-btn"
                    >
                      {state.inquirySubmitting ? 'Submitting Request...' : 'Request Price Quotation'}
                    </button>
                  </div>
                )}
              </div>
            ) : eligibility?.eligible ? (
              <div className="cc-cust-reservation-action">
                <p className="cc-cust-reservation-terms">
                  Placing a reservation locks this vehicle exclusively for your account for{' '}
                  <strong>48 hours</strong> with zero upfront payment commitment.
                </p>
                {reserveError && (
                  <div className="cc-cust-reservation-error" role="alert">
                    <p>{reserveError}</p>
                  </div>
                )}
                <button
                  type="button"
                  className="cc-cust-btn cc-cust-btn--primary cc-cust-btn--large cc-cust-reserve-btn"
                  onClick={reserveVehicle}
                  disabled={reserving}
                  data-testid="reserve-vehicle-btn"
                >
                  {reserving ? 'Placing 48h Hold...' : 'Reserve Vehicle (48h Hold)'}
                </button>
              </div>
            ) : (
              <div className="cc-cust-reservation-status cc-cust-reservation-status--unavailable" role="status">
                <p>This vehicle is currently not available for reservation.</p>
              </div>
            )}
          </div>

          {/* Customer App Actions: Inquiry and Wishlist (D02-P13-T005) */}
          <div className="cc-cust-actions-card" data-testid="customer-actions-card">
            <h2 className="cc-cust-actions-card__heading">Customer Actions</h2>
            <div className="cc-cust-actions-grid">
              {/* Vehicle Inquiry */}
              <div className="cc-cust-action-item">
                {inquiryBlockedForAllocation && (
                  <div className="cc-cust-status-banner cc-cust-status-banner--info" role="status" data-testid="allocated-vehicle-notice">
                    <span className="cc-cust-status-banner__icon">ℹ️</span>
                    <div><strong>Vehicle Already Allocated</strong><p>This vehicle has already been allocated to another customer.</p></div>
                  </div>
                )}
                {inquiryNotice && (
                  <div className="cc-cust-status-banner cc-cust-status-banner--success" role="status">
                    <span className="cc-cust-status-banner__icon">✓</span>
                    <div>
                      <strong>Inquiry Already Submitted</strong>
                      <p>{inquiryNotice}</p>
                    </div>
                  </div>
                )}
                {!inquiryNotice && state.inquiryDuplicate && (
                  <div className="cc-cust-status-banner cc-cust-status-banner--success" role="status">
                    <span className="cc-cust-status-banner__icon">✓</span>
                    <div><strong>Inquiry Already Submitted</strong><p>You have already submitted an inquiry for this vehicle.</p></div>
                  </div>
                )}
                {!inquiryNotice && !state.inquiryDuplicate && state.inquirySuccess && (
                  <div className="cc-cust-status-banner cc-cust-status-banner--success" role="status">
                    <span className="cc-cust-status-banner__icon">✓</span>
                    <div><strong>Inquiry Submitted</strong><p>Your inquiry has been submitted successfully.</p></div>
                  </div>
                )}
                {state.inquiryError && (
                  <div className="cc-cust-reservation-error" role="alert"><p>{state.inquiryError}</p></div>
                )}
                <span
                  className={`cc-cust-disabled-action${inquiryDisabledMessage ? ' cc-cust-disabled-action--disabled' : ''}`}
                  title={inquiryDisabledMessage}
                >
                  <button
                    type="button"
                    className="cc-cust-btn cc-cust-btn--primary cc-cust-btn--large"
                    onClick={handleOpenInquiry}
                    disabled={inquiryDisabled}
                    data-testid="submit-inquiry-btn"
                    aria-label={state.inquirySubmitting ? 'Submitting inquiry...' : 'Submit an inquiry'}
                  >
                    {state.inquirySubmitting ? 'Submitting Inquiry...' : 'Submit an Inquiry'}
                  </button>
                </span>
              </div>

              {/* Wishlist Toggle Button */}
              <div className="cc-cust-action-item">
                {state.wishlistError && (
                  <div className="cc-cust-reservation-error" role="alert">
                    <p>{state.wishlistError}</p>
                  </div>
                )}
                <button
                  type="button"
                  className={`cc-cust-btn cc-cust-btn--large ${state.isWishlisted ? 'cc-cust-btn--secondary' : 'cc-cust-btn--primary'}`}
                  onClick={toggleWishlist}
                  disabled={state.wishlistLoading}
                  data-testid="wishlist-toggle-btn"
                  aria-label={state.isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {state.wishlistLoading
                    ? 'Updating Wishlist...'
                    : state.isWishlisted
                      ? '♥ Remove from Wishlist'
                      : '♡ Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <CustomerInquiryModal
        isOpen={inquiryModalOpen}
        vehicleTitle={title}
        customerName={customerName}
        customerEmail={customerEmail}
        submitting={state.inquirySubmitting}
        error={state.inquiryError}
        onClose={() => setInquiryModalOpen(false)}
        onSubmit={handleSubmitInquiry}
      />
    </div>
  );
};
