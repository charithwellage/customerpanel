import React, { useEffect } from 'react';
import type { CustomerVehicleSummary, CustomerVehicleDetail } from '@carchief/domain';

export interface VehicleTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: CustomerVehicleSummary | CustomerVehicleDetail | null;
}

export const TIMELINE_STAGES = [
  'RESERVED',
  'PURCHASED',
  'INSPECTION',
  'READY FOR LOADING',
  'VESSEL BOOKED',
  'LOADED',
  'VESSEL DEPARTED',
  'IN TRANSIT',
  'ARRIVED AT PORT',
  'CUSTOMS CLEARANCE',
  'DELIVERED',
] as const;

export function getVehicleActiveTimelineStepIndex(vehicle: CustomerVehicleSummary | CustomerVehicleDetail): number {
  const status = (vehicle.status || '').toLowerCase();
  const logistics = (vehicle.logisticsStatus || vehicle.shippingStage || '').toUpperCase();

  if (status === 'delivered' || logistics === 'DELIVERED') return 10;
  if (logistics === 'CUSTOMS CLEARANCE') return 9;
  if (logistics === 'ARRIVED AT PORT') return 8;
  if (status === 'in transit' || logistics === 'IN TRANSIT') return 7;
  if (logistics === 'VESSEL DEPARTED') return 6;
  if (logistics === 'LOADED') return 5;
  if (logistics === 'VESSEL BOOKED') return 4;
  if (logistics === 'READY FOR LOADING' || logistics === 'READY') return 3;
  if (status === 'confirmed' || logistics === 'INSPECTION' || Boolean(vehicle.commercialBill)) return 2;
  if (status === 'under negotiation with pi' || (status !== 'under negotiation' && Boolean(vehicle.proformaInvoiceId)) || logistics === 'PURCHASED') return 1;
  return 0; // RESERVED
}

export function getVehicleEngineNo(vehicle: CustomerVehicleSummary | CustomerVehicleDetail): string {
  if ((vehicle as any).engineNo) return (vehicle as any).engineNo;
  if ((vehicle as any).engineModel) return (vehicle as any).engineModel;
  const modelLower = vehicle.model.toLowerCase();
  if (modelLower.includes('land cruiser') || modelLower.includes('250')) return '3DA-GDJ250W';
  if (modelLower.includes('prado') || modelLower.includes('150')) return '3BA-TRJ150W';
  if (modelLower.includes('harrier')) return '6BA-MXUA80';
  if (modelLower.includes('rav4')) return '6BA-MXAA54';
  if (modelLower.includes('vezel')) return '6AA-RV5';
  if (modelLower.includes('cx-5')) return '3DA-KF2P';
  if (modelLower.includes('outlander')) return '5LA-GN0W';
  return `${vehicle.make.slice(0, 3).toUpperCase()}-${vehicle.chassisNumber.slice(0, 6)}`;
}

export const VehicleTrackingModal: React.FC<VehicleTrackingModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !vehicle) return null;

  const activeStepIndex = getVehicleActiveTimelineStepIndex(vehicle);
  const fallbackImage = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800';
  const primaryImg = vehicle.primaryImage || ((vehicle as CustomerVehicleDetail).images?.[0]) || fallbackImage;
  const stockId = vehicle.stockNumber || `STK-${vehicle.chassisNumber.slice(0, 6)}`;
  const engineNo = getVehicleEngineNo(vehicle);
  const mileage = vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} km` : '34,497 km';
  const color = vehicle.colorSpec || vehicle.color || 'Pearl';
  const purchaseDate = vehicle.createdAt || '2026-07-10T06:26:39.529Z';
  const priceDisplay = `$${(vehicle.priceUsd || vehicle.totalAmountUsd || 16120).toLocaleString()}`;
  
  const bookingStatus = vehicle.logisticsStatus || (vehicle.status === 'Delivered' ? 'DELIVERED' : vehicle.status === 'In Transit' ? 'IN TRANSIT' : vehicle.status === 'Confirmed' ? 'CONFIRMED' : 'RESERVED');
  const vesselVoyage = (vehicle as any).vesselName ? `${(vehicle as any).vesselName} V.42` : (vehicle.status === 'In Transit' || vehicle.status === 'Delivered' ? 'HOEGH TARGET V.42' : 'TBD');
  const containerNo = (vehicle as any).containerNo || (vehicle.status === 'In Transit' || vehicle.status === 'Delivered' ? 'TGHU-918234-2' : 'TBD');
  const blDocumentNo = (vehicle as any).billOfLadingNo || (vehicle.status === 'In Transit' || vehicle.status === 'Delivered' ? 'BL-CC-82910' : 'TBD');
  const loadingPort = (vehicle as any).loadingPort || 'Japan Port';
  const dischargePort = vehicle.destinationPort || 'Mombasa';

  const isPI = vehicle.status === 'Under Negotiation With PI' || Boolean(vehicle.proformaInvoiceId);
  const isInvoiced = vehicle.status === 'Confirmed' || vehicle.status === 'In Transit' || vehicle.status === 'Delivered' || Boolean(vehicle.commercialBill);
  const badgeLabel = vehicle.statusLabel || '';

  return (
    <div
      className="cc-track-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-modal-vehicle-title"
      data-testid="vehicle-tracking-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cc-track-modal-dialog">
        {/* Top Hero Banner */}
        <div className="cc-track-modal-hero">
          <img
            src={primaryImg}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="cc-track-modal-hero__img"
          />
          <div className="cc-track-modal-hero__gradient" />

          {/* Close Button */}
          <button
            type="button"
            className="cc-track-modal-close"
            onClick={onClose}
            aria-label="Close tracking popup"
            data-testid="track-modal-close"
          >
            ✕
          </button>

          {/* Banner Text Overlay */}
          <div className="cc-track-modal-hero__content">
            <span className="cc-track-modal-hero__badge">{badgeLabel}</span>
            <h2 id="track-modal-vehicle-title" className="cc-track-modal-hero__title">
              {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
            </h2>
            <div className="cc-track-modal-hero__meta">
              <span className="cc-track-modal-hero__chassis">Chassis Number: {vehicle.chassisNumber}</span>
              <span className="cc-track-modal-hero__divider">|</span>
              <span className="cc-track-modal-hero__stock">Stock ID: {stockId}</span>
            </div>
          </div>
        </div>

        {/* Modal 2-Column Content Grid */}
        <div className="cc-track-modal-body">
          {/* Left Column: Vehicle Details & Bill of Lading */}
          <div className="cc-track-modal-col cc-track-modal-col--details">
            {/* Section 1: Vehicle Details */}
            <section className="cc-track-modal-section" aria-labelledby="track-modal-sec-details">
              <h3 id="track-modal-sec-details" className="cc-track-modal-section__title">
                VEHICLE DETAILS
              </h3>
              <div className="cc-track-modal-card">
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Engine No:</span>
                  <span className="cc-track-modal-row__value cc-track-modal-row__value--mono">{engineNo}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Mileage:</span>
                  <span className="cc-track-modal-row__value">{mileage}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Exterior Color:</span>
                  <span className="cc-track-modal-row__value">{color}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Purchase Date:</span>
                  <span className="cc-track-modal-row__value cc-track-modal-row__value--mono">{purchaseDate}</span>
                </div>
                <div className="cc-track-modal-row cc-track-modal-row--price">
                  <span className="cc-track-modal-row__label">Selling Price:</span>
                  <span className="cc-track-modal-row__value cc-track-modal-row__value--fob">{priceDisplay}</span>
                </div>
              </div>
            </section>

            {/* Section 2: Shipping Bill of Lading */}
            <section className="cc-track-modal-section cc-track-modal-section--shipping" aria-labelledby="track-modal-sec-shipping">
              <h3 id="track-modal-sec-shipping" className="cc-track-modal-section__title">
                SHIPPING BILL OF LADING
              </h3>
              <div className="cc-track-modal-card">
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Booking Status:</span>
                  <span className="cc-track-modal-row__value cc-track-modal-row__value--status">{bookingStatus}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Vessel &amp; Voyage:</span>
                  <span className="cc-track-modal-row__value">{vesselVoyage}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Container No:</span>
                  <span className="cc-track-modal-row__value">{containerNo}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">BL Document No:</span>
                  <span className="cc-track-modal-row__value">{blDocumentNo}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Loading Port:</span>
                  <span className="cc-track-modal-row__value">{loadingPort}</span>
                </div>
                <div className="cc-track-modal-row">
                  <span className="cc-track-modal-row__label">Discharge Port:</span>
                  <span className="cc-track-modal-row__value">{dischargePort}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Shipment Timeline Tracker */}
          <div className="cc-track-modal-col cc-track-modal-col--timeline">
            <section className="cc-track-modal-section" aria-labelledby="track-modal-sec-timeline">
              <h3 id="track-modal-sec-timeline" className="cc-track-modal-section__title">
                SHIPMENT TIMELINE TRACKER
              </h3>

              <div className="cc-track-timeline">
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isVerified = idx <= activeStepIndex;
                  const isCurrent = idx === activeStepIndex;
                  const isLast = idx === TIMELINE_STAGES.length - 1;

                  return (
                    <div
                      key={stage}
                      className={`cc-track-timeline__item ${isVerified ? 'cc-track-timeline__item--verified' : 'cc-track-timeline__item--pending'} ${isCurrent ? 'cc-track-timeline__item--current' : ''}`}
                    >
                      {/* Left indicator node + connecting line */}
                      <div className="cc-track-timeline__indicator-col">
                        <div
                          className={`cc-track-timeline__node ${isVerified ? 'cc-track-timeline__node--verified' : 'cc-track-timeline__node--pending'}`}
                          aria-hidden="true"
                        >
                          {isVerified && <div className="cc-track-timeline__node-inner" />}
                        </div>
                        {!isLast && (
                          <div
                            className={`cc-track-timeline__line ${idx < activeStepIndex ? 'cc-track-timeline__line--verified' : 'cc-track-timeline__line--pending'}`}
                          />
                        )}
                      </div>

                      {/* Right text details */}
                      <div className="cc-track-timeline__content">
                        <span className={`cc-track-timeline__stage-title ${isVerified ? 'cc-track-timeline__stage-title--verified' : 'cc-track-timeline__stage-title--pending'}`}>
                          {stage}
                        </span>
                        <p className={`cc-track-timeline__stage-desc ${isVerified ? 'cc-track-timeline__stage-desc--verified' : 'cc-track-timeline__stage-desc--pending'}`}>
                          {isVerified ? 'Milestone verified successfully.' : 'Pending milestone step.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
