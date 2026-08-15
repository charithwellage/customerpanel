import React from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicleDetail } from './useCustomerVehicleDetail.js';
import { StatusTimeline } from './components/StatusTimeline.js';
import { DepositSummaryCard } from './components/DepositSummaryCard.js';
import { ShippingTrackingCard } from './components/ShippingTrackingCard.js';
import { ExportDocumentsCard } from './components/ExportDocumentsCard.js';

export interface CustomerFleetDetailPageProps {
  vehicleId: string;
  onBack: () => void;
}

export const CustomerFleetDetailPage: React.FC<CustomerFleetDetailPageProps> = ({
  vehicleId,
  onBack,
}) => {
  const { setActiveRoute } = useCustomerShell();
  const { data: vehicle, isLoading, error, refetch } = useCustomerVehicleDetail(vehicleId);

  React.useEffect(() => {
    setActiveRoute(`/vehicles/${vehicleId}`);
  }, [setActiveRoute, vehicleId]);

  if (isLoading) {
    return (
      <div className="cc-cust-fleet-detail cc-cust-fleet-detail--loading" role="status" aria-live="polite">
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="cc-cust-fleet-detail cc-cust-fleet-detail--error" role="alert">
        <h2 className="cc-cust-fleet-detail__error-title">Vehicle Not Found</h2>
        <p className="cc-cust-fleet-detail__error-text">
          {error ? error.message : 'The requested vehicle is not in your transaction fleet or is inaccessible.'}
        </p>
        <div className="cc-cust-fleet-detail__error-actions">
          <button type="button" className="cc-cust-fleet-btn cc-cust-fleet-btn--primary" onClick={onBack}>
            ← Back to My Vehicles
          </button>
          {error && (
            <button type="button" className="cc-cust-fleet-btn cc-cust-fleet-btn--secondary" onClick={() => refetch()}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const statusSlug = vehicle.status.toLowerCase().replace(/\s+/g, '-');
  const fallbackImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400';
  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [vehicle.primaryImage || fallbackImage];

  return (
    <div className="cc-cust-fleet-detail" data-testid="customer-fleet-detail-page">
      <nav className="cc-cust-fleet-detail__nav" aria-label="Breadcrumb">
        <button
          type="button"
          data-testid="back-to-fleet-btn"
          className="cc-cust-fleet-btn cc-cust-fleet-btn--link"
          onClick={onBack}
          aria-label="Return to vehicle fleet list"
        >
          ← Back to My Vehicles
        </button>
      </nav>

      <header className="cc-cust-fleet-detail__header">
        <div className="cc-cust-fleet-detail__title-wrap">
          <h1 className="cc-cust-fleet-detail__title">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h1>
          <span className="cc-cust-fleet-detail__chassis">Chassis: {vehicle.chassisNumber}</span>
        </div>
        <span className={`cc-cust-fleet-badge cc-cust-fleet-badge--status cc-cust-fleet-badge--${statusSlug}`}>
          {vehicle.status}
        </span>
      </header>

      <div className="cc-cust-fleet-detail__layout">
        {/* Main Column */}
        <div className="cc-cust-fleet-detail__main">
          {/* Gallery */}
          <section className="cc-cust-fleet-card cc-cust-fleet-gallery" aria-label="Vehicle Images">
            <div className="cc-cust-fleet-gallery__primary-wrap">
              <img
                src={images[0]}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                className="cc-cust-fleet-gallery__primary"
              />
            </div>
            {images.length > 1 && (
              <div className="cc-cust-fleet-gallery__thumbs">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${vehicle.make} ${vehicle.model} view ${idx + 1}`}
                    className="cc-cust-fleet-gallery__thumb"
                  />
                ))}
              </div>
            )}
          </section>

          {/* Specifications */}
          <section className="cc-cust-fleet-card cc-cust-fleet-specs" aria-label="Vehicle Specifications">
            <h3 className="cc-cust-fleet-section-title">Vehicle Specifications</h3>
            <dl className="cc-cust-fleet-specs__list">
              <div className="cc-cust-fleet-specs__item">
                <dt>Year</dt>
                <dd>{vehicle.year}</dd>
              </div>
              <div className="cc-cust-fleet-specs__item">
                <dt>Make</dt>
                <dd>{vehicle.make}</dd>
              </div>
              <div className="cc-cust-fleet-specs__item">
                <dt>Model</dt>
                <dd>{vehicle.model}</dd>
              </div>
              <div className="cc-cust-fleet-specs__item">
                <dt>Chassis No.</dt>
                <dd>{vehicle.chassisNumber}</dd>
              </div>
              {vehicle.bodyStyle && (
                <div className="cc-cust-fleet-specs__item">
                  <dt>Body Style</dt>
                  <dd>{vehicle.bodyStyle}</dd>
                </div>
              )}
              {vehicle.fuelType && (
                <div className="cc-cust-fleet-specs__item">
                  <dt>Fuel Type</dt>
                  <dd>{vehicle.fuelType}</dd>
                </div>
              )}
              {vehicle.transmission && (
                <div className="cc-cust-fleet-specs__item">
                  <dt>Transmission</dt>
                  <dd>{vehicle.transmission}</dd>
                </div>
              )}
              {vehicle.driveTrain && (
                <div className="cc-cust-fleet-specs__item">
                  <dt>Drive Train</dt>
                  <dd>{vehicle.driveTrain}</dd>
                </div>
              )}
              {vehicle.mileage !== undefined && (
                <div className="cc-cust-fleet-specs__item">
                  <dt>Mileage</dt>
                  <dd>{vehicle.mileage.toLocaleString()} km</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Transaction Milestones Timeline */}
          <section className="cc-cust-fleet-card">
            <StatusTimeline history={vehicle.statusHistory} currentStatus={vehicle.status} />
          </section>
        </div>

        {/* Sidebar Column */}
        <aside className="cc-cust-fleet-detail__sidebar">
          {/* Financial & Deposit Summary */}
          <DepositSummaryCard
            totalAmountUsd={vehicle.totalAmountUsd}
            deposit={vehicle.deposit}
            invoiceId={vehicle.invoiceId}
            proformaInvoiceId={vehicle.proformaInvoiceId}
            paymentDeadline={vehicle.paymentDeadline}
          />

          {/* Shipping & Tracking */}
          <ShippingTrackingCard
            locationStatus={vehicle.locationStatus}
            destinationPort={vehicle.destinationPort}
            vesselName={vehicle.vesselName}
            billOfLadingNo={vehicle.billOfLadingNo}
            etd={vehicle.etd}
            eta={vehicle.eta}
          />

          {/* Export Documents */}
          <ExportDocumentsCard documents={vehicle.documents} />
        </aside>
      </div>
    </div>
  );
};
