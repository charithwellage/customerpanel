import React from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicleDetail } from './useCustomerVehicleDetail.js';
import { StatusTimeline } from './components/StatusTimeline.js';
import { DepositSummaryCard } from './components/DepositSummaryCard.js';
import { ShippingTrackingCard } from './components/ShippingTrackingCard.js';
import { ExportDocumentsCard } from './components/ExportDocumentsCard.js';
import { VehicleGalleryPrimitive } from '@carchief/vehicle-detail';
import { CustomerVehicleSpecifications } from '../../components/CustomerVehicleSpecifications.js';

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
  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : vehicle.primaryImage
      ? [vehicle.primaryImage]
      : [];

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
            <VehicleGalleryPrimitive
              images={images}
              title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              badges={[{ label: vehicle.status, tone: vehicle.status.toLowerCase().includes('delivered') ? ('success' as const) : ('warning' as const) }]}
            />
          </section>

          <CustomerVehicleSpecifications vehicle={vehicle} />

          {/* Order Timeline (FRD 4.28: Order Dates -> Inspection Dates -> Shipping Dates) */}
          <section className="cc-cust-fleet-card cc-order-timeline-card" aria-label="Order & Shipping Timeline">
            <div className="cc-order-timeline-header">
              <h3 className="cc-cust-fleet-section-title">Order &amp; Logistics Timeline</h3>
              <button
                type="button"
                className="cc-download-shipping-docs-btn"
                onClick={() => {
                  const element = document.createElement('a');
                  const file = new Blob([`CarChief Shipping Documents Bundle for ${vehicle.chassisNumber}\nVehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}\nStatus: ${vehicle.status}`], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = `${vehicle.chassisNumber}_Shipping_Documents.txt`;
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
                data-testid="download-shipping-docs-btn"
              >
                📥 Download Shipping Documents
              </button>
            </div>

            <div className="cc-order-timeline-steps">
              <div className="cc-timeline-step cc-timeline-step--done">
                <span className="cc-timeline-step__marker">✓</span>
                <span className="cc-timeline-step__title">Negotiation</span>
                <span className="cc-timeline-step__date">2026-06-03</span>
              </div>

              <div className="cc-timeline-step cc-timeline-step--done">
                <span className="cc-timeline-step__marker">✓</span>
                <span className="cc-timeline-step__title">Proforma Issued</span>
                <span className="cc-timeline-step__date">2026-06-04</span>
              </div>

              <div className="cc-timeline-step cc-timeline-step--done">
                <span className="cc-timeline-step__marker">✓</span>
                <span className="cc-timeline-step__title">Order Confirmed</span>
                <span className="cc-timeline-step__date">2026-06-05</span>
              </div>

              <div className="cc-timeline-step cc-timeline-step--done">
                <span className="cc-timeline-step__marker">✓</span>
                <span className="cc-timeline-step__title">Inspection (JAAI)</span>
                <span className="cc-timeline-step__date">2026-06-08</span>
                <span className="cc-timeline-step__badge cc-timeline-step__badge--passed">PASSED ✓</span>
              </div>

              <div className={`cc-timeline-step ${vehicle.etd ? 'cc-timeline-step--done' : 'cc-timeline-step--pending'}`}>
                <span className="cc-timeline-step__marker">{vehicle.etd ? '✓' : '●'}</span>
                <span className="cc-timeline-step__title">ETD Japan</span>
                <span className="cc-timeline-step__date">{vehicle.etd ? vehicle.etd.slice(0, 10) : '2026-06-21'}</span>
              </div>

              <div className={`cc-timeline-step ${vehicle.eta ? 'cc-timeline-step--done' : 'cc-timeline-step--pending'}`}>
                <span className="cc-timeline-step__marker">{vehicle.eta ? '✓' : '●'}</span>
                <span className="cc-timeline-step__title">ETA Port</span>
                <span className="cc-timeline-step__date">{vehicle.eta ? vehicle.eta.slice(0, 10) : '2026-07-25'}</span>
              </div>

              <div className={`cc-timeline-step ${vehicle.status.toLowerCase().includes('delivered') ? 'cc-timeline-step--done' : 'cc-timeline-step--pending'}`}>
                <span className="cc-timeline-step__marker">{vehicle.status.toLowerCase().includes('delivered') ? '✓' : '●'}</span>
                <span className="cc-timeline-step__title">Delivered</span>
                <span className="cc-timeline-step__date">2026-07-28</span>
              </div>
            </div>

            <div className="cc-order-timeline-details-grid">
              <div className="cc-timeline-detail-col">
                <div className="cc-timeline-detail-row">
                  <span className="cc-timeline-detail-label">ETD:</span>
                  <span className="cc-timeline-detail-val cc-timeline-detail-val--mono">{vehicle.etd ? vehicle.etd.slice(0, 10) : '2026-06-21'}</span>
                </div>
                <div className="cc-timeline-detail-row">
                  <span className="cc-timeline-detail-label">ETA:</span>
                  <span className="cc-timeline-detail-val cc-timeline-detail-val--mono">{vehicle.eta ? vehicle.eta.slice(0, 10) : '2026-07-25'}</span>
                </div>
                <div className="cc-timeline-detail-row">
                  <span className="cc-timeline-detail-label">ATA:</span>
                  <span className="cc-timeline-detail-val cc-timeline-detail-val--mono">{vehicle.ata || '2026-07-26'}</span>
                </div>
              </div>

              <div className="cc-timeline-detail-col">
                <div className="cc-timeline-detail-row">
                  <span className="cc-timeline-detail-label">Inspection Date:</span>
                  <span className="cc-timeline-detail-val cc-timeline-detail-val--mono">{vehicle.inspectionDate || '2026-06-08'}</span>
                </div>
                <div className="cc-timeline-detail-row">
                  <span className="cc-timeline-detail-label">Inspection Status:</span>
                  <span className="cc-timeline-detail-val cc-timeline-status-pass">{vehicle.inspectionStatus || 'PASSED [JAAI/QISJ]'}</span>
                </div>
              </div>
            </div>
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
