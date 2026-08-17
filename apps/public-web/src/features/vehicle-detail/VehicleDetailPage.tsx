'use client';

import React from 'react';
import Link from 'next/link';
import type { VehicleDetail } from '@carchief/domain';
import {
  VehicleGalleryPrimitive,
  formatVehicleTitle,
  getEffectivePrice,
  getVisibleGalleryImages,
  isVehicleAvailable,
  serializeJsonLd,
} from '@carchief/vehicle-detail';
import { ReservationSection } from '../reservation';

const TOAST_DISMISS_MS = 3000;

interface DestinationCountry {
  country: string;
  ports: {
    name: string;
    duration: string;
    costUsd: number;
    cityDelivery?: boolean;
  }[];
}

const DESTINATIONS: DestinationCountry[] = [
  {
    country: 'Kenya',
    ports: [
      { name: 'Mombasa', duration: '18-28 Days', costUsd: 1656 },
      { name: 'Nairobi', duration: '5 Days', costUsd: 1822, cityDelivery: true },
    ],
  },
  {
    country: 'Tanzania',
    ports: [
      { name: 'Dar es Salaam', duration: '20-30 Days', costUsd: 1550 },
      { name: 'Dodoma', duration: '4 Days', costUsd: 1750, cityDelivery: true },
    ],
  },
  {
    country: 'Uganda',
    ports: [
      { name: 'Mombasa → Kampala', duration: '25-35 Days', costUsd: 2100, cityDelivery: true },
    ],
  },
  {
    country: 'DR Congo',
    ports: [
      { name: 'Mombasa → Goma', duration: '30-40 Days', costUsd: 2600, cityDelivery: true },
    ],
  },
  {
    country: 'South Sudan',
    ports: [
      { name: 'Mombasa → Juba', duration: '30-40 Days', costUsd: 2800, cityDelivery: true },
    ],
  },
  {
    country: 'Rwanda',
    ports: [
      { name: 'Dar es Salaam → Kigali', duration: '28-35 Days', costUsd: 2300, cityDelivery: true },
    ],
  },
  {
    country: 'Burundi',
    ports: [
      { name: 'Dar es Salaam → Bujumbura', duration: '30-38 Days', costUsd: 2400, cityDelivery: true },
    ],
  },
  {
    country: 'Zambia',
    ports: [
      { name: 'Dar es Salaam → Lusaka', duration: '28-38 Days', costUsd: 2500, cityDelivery: true },
    ],
  },
  {
    country: 'Zimbabwe',
    ports: [
      { name: 'Durban → Harare', duration: '25-35 Days', costUsd: 2450, cityDelivery: true },
    ],
  },
  {
    country: 'Mozambique',
    ports: [
      { name: 'Maputo', duration: '22-30 Days', costUsd: 1700 },
    ],
  },
  {
    country: 'Malawi',
    ports: [
      { name: 'Dar es Salaam → Lilongwe', duration: '28-35 Days', costUsd: 2350, cityDelivery: true },
    ],
  },
];

export interface VehicleDetailPageProps {
  vehicle: VehicleDetail;
}

export default function VehicleDetailPage({ vehicle }: VehicleDetailPageProps) {
  const [copiedToast, setCopiedToast] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<string>('Kenya');
  const [selectedPortIndex, setSelectedPortIndex] = React.useState<number>(0);
  const [includeInsurance, setIncludeInsurance] = React.useState<boolean>(false);

  // Inquiry form states
  const [inquiryName, setInquiryName] = React.useState('');
  const [inquiryEmail, setInquiryEmail] = React.useState('');
  const [inquiryPhone, setInquiryPhone] = React.useState('');
  const [inquiryMessage, setInquiryMessage] = React.useState(
    `Hello, I am interested in purchasing the ${vehicle.year} ${vehicle.make} ${vehicle.model}. Please let me know its availability and the next steps.`
  );
  const [inquirySubmitted, setInquirySubmitted] = React.useState(false);

  const titleId = React.useId();
  const countrySelectId = React.useId();

  const title = formatVehicleTitle(vehicle);
  const { priceText, isRequestPrice } = getEffectivePrice(vehicle);
  const available = isVehicleAvailable(vehicle.status);
  const isSold = vehicle.status === 'Sold';
  const galleryImages = getVisibleGalleryImages(vehicle.media);

  const carPriceUsd = vehicle.discountedPriceUsd ?? vehicle.priceUsd ?? 0;
  const depositUsd = Math.round(carPriceUsd * 0.1);

  const selectedCountryData = DESTINATIONS.find((d) => d.country === selectedCountry);
  const selectedPort = selectedCountryData?.ports[selectedPortIndex] ?? selectedCountryData?.ports[0];
  const freightCostUsd = selectedPort?.costUsd ?? 0;
  const insuranceCostUsd = includeInsurance ? 150 : 0;
  const calculatedGrandTotal = carPriceUsd + freightCostUsd + insuranceCostUsd;

  const engineDisplay = (vehicle.engineSize || '4.4L Twin-Turbo V8 MHEV').toUpperCase();
  const mileageDisplay = vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} KM` : '80 KM';
  const fuelDisplay = (vehicle.fuelType || 'Petrol').toUpperCase();
  const transmissionDisplay = (vehicle.transmission || 'Automatic').toUpperCase();
  const colorDisplay = (vehicle.color || 'Firenze Red Metallic').toUpperCase();

  const overviewText = `The highest luxury paired with ultimate performance. The ${vehicle.model} offers ${vehicle.color || 'Firenze Red metallic'} exterior with black gloss highlights, 23-inch carbon fibre wheels, custom sports seats with body-and-soul sensors, and a supreme ${vehicle.engineSize || '635-horsepower mild hybrid'} powertrain.`;

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: `Check out this ${title} on CarChief!`, url });
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), TOAST_DISMISS_MS);
      } catch (error) {
        console.error('Clipboard copy failed', error);
      }
    }
  }

  function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setInquirySubmitted(true);
  }

  const availabilityLabel = isSold ? 'Sold' : available ? 'Available' : vehicle.status;
  const availabilityVariant = isSold ? 'cc-badge--error' : available ? 'cc-badge--success' : 'cc-badge--warning';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Vehicle',
    name: title,
    description: `Buy ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.bodyStyle ?? 'Vehicle'}). Mileage: ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : 'N/A'}. Location: ${vehicle.locationStatus ?? 'In Stock'}. Stock ID: ${vehicle.slug}.`,
    vehicleModelDate: vehicle.year,
    brand: { '@type': 'Brand', name: vehicle.make },
    model: vehicle.model,
    bodyType: vehicle.bodyStyle,
    fuelType: vehicle.fuelType,
    vehicleEngine: vehicle.engineSize
      ? { '@type': 'EngineSpecification', engineDisplacement: vehicle.engineSize }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: vehicle.discountedPriceUsd ?? vehicle.priceUsd,
      availability: available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/UsedCondition',
    },
  };

  return (
    <article className="cc-vehicle-detail-wrapper" aria-labelledby={titleId}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />

      {/* Top Header / Bar */}
      <div className="cc-detail-topbar">
        <Link href="/allstock" className="cc-detail-back-link">
          <span className="cc-detail-back-arrow">←</span> BACK TO CATALOG
        </Link>
        <div className="cc-detail-topbar__actions">
          <button type="button" className="cc-detail-icon-btn" onClick={handleShare} aria-label="Share">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button type="button" className="cc-detail-icon-btn" onClick={() => typeof window !== 'undefined' && window.print()} aria-label="Print spec sheet">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </button>
          <span className="cc-detail-brand-logo">CAR<span className="cc-text-red">CHIEF</span></span>
          {copiedToast && (
            <span className="cc-toast" role="status" aria-live="polite">
              Link copied to clipboard!
            </span>
          )}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="cc-detail-grid">
        {/* LEFT COLUMN */}
        <div className="cc-detail-col-main">
          {/* Gallery Showcase */}
          <section className="cc-detail-gallery-card" aria-label="Vehicle media gallery">
            <h2 className="sr-only">Media Gallery</h2>
            <VehicleGalleryPrimitive
              images={galleryImages}
              title={title}
              badges={[
                { label: 'NEW', tone: 'neutral' },
                { label: availabilityLabel, tone: (isSold ? 'error' : available ? 'success' : 'warning') },
              ]}
            />
          </section>

          {/* Condition Assessment & Overview */}
          <div className="cc-detail-card cc-detail-overview-card">
            <div className="cc-detail-card__dot-header">
              <span className="cc-dot-bullet">●</span> CONDITION ASSESSMENT &amp; OVERVIEW
            </div>
            <p className="cc-detail-overview-text">
              {overviewText}
            </p>
            <div className="cc-detail-guarantee-box">
              <span className="cc-detail-guarantee-icon">ⓘ</span>
              <div className="cc-detail-guarantee-content">
                <strong>CARCHIEF SECURED INVENTORY GUARANTEE:</strong> This vehicle is backed by our pre-purchase inspection certification program. All specifications are certified by certified auto engineers prior to entering dynamic freight cargo export channels.
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="cc-detail-card cc-detail-specs-card">
            <h2 className="cc-detail-section-heading">
              SPECIFICATIONS
            </h2>

            {/* Quick 5 Icon Highlights */}
            <div className="cc-detail-quick-specs">
              <div className="cc-quick-spec-item">
                <span className="cc-quick-spec-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="cc-quick-spec-val">{engineDisplay}</span>
              </div>
              <div className="cc-quick-spec-item">
                <span className="cc-quick-spec-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 14l3.5-3.5" />
                    <path d="M3.34 17a10 10 0 1 1 17.32 0" />
                    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                  </svg>
                </span>
                <span className="cc-quick-spec-val">{mileageDisplay}</span>
              </div>
              <div className="cc-quick-spec-item">
                <span className="cc-quick-spec-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 22h12" />
                    <path d="M4 9h10" />
                    <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
                    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L19.5 6.5" />
                  </svg>
                </span>
                <span className="cc-quick-spec-val">{fuelDisplay}</span>
              </div>
              <div className="cc-quick-spec-item">
                <span className="cc-quick-spec-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="cc-quick-spec-val">{transmissionDisplay}</span>
              </div>
              <div className="cc-quick-spec-item">
                <span className="cc-quick-spec-icon" aria-hidden="true">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.97-4.48-9-10-9z" />
                    <circle cx="7.5" cy="11.5" r="1.1" fill="currentColor" />
                    <circle cx="10.5" cy="7.5" r="1.1" fill="currentColor" />
                    <circle cx="14.5" cy="7.5" r="1.1" fill="currentColor" />
                    <circle cx="17.5" cy="11.5" r="1.1" fill="currentColor" />
                  </svg>
                </span>
                <span className="cc-quick-spec-val">{colorDisplay}</span>
              </div>
            </div>

            {/* Full 2-Column Specification Table */}
            <table className="cc-specs-grid-table">
              <tbody>
                <tr>
                  <th>Stock No.</th>
                  <td>{`STK${vehicle.id.replace(/\D/g, '') || '611773'}`}</td>
                  <th>Make</th>
                  <td>{(vehicle.make || 'LAND ROVER').toUpperCase()}</td>
                </tr>
                <tr>
                  <th>Model</th>
                  <td>{(vehicle.model || '').toUpperCase()}</td>
                  <th>Model Code</th>
                  <td>{vehicle.modelCode || '—'}</td>
                </tr>
                <tr>
                  <th>Chassis No</th>
                  <td>{vehicle.chassisNumber || '—'}</td>
                  <th>Version/Class</th>
                  <td>{vehicle.versionClass || '—'}</td>
                </tr>
                <tr>
                  <th>REG Year/Mon</th>
                  <td>{vehicle.registerYear || '—'}</td>
                  <th>MFG Year/Mon</th>
                  <td>{vehicle.mfgYear || `${vehicle.year}/01`}</td>
                </tr>
                <tr>
                  <th>Mileage</th>
                  <td>{mileageDisplay}</td>
                  <th>Fuel</th>
                  <td>{fuelDisplay}</td>
                </tr>
                <tr>
                  <th>Transmission</th>
                  <td>{transmissionDisplay}</td>
                  <th>Engine</th>
                  <td>{engineDisplay}</td>
                </tr>
                <tr>
                  <th>2WD/4WD</th>
                  <td>{(vehicle.driveTrain || '—').toUpperCase()}</td>
                  <th>Exterior Color</th>
                  <td>{colorDisplay}</td>
                </tr>
                <tr>
                  <th>Doors</th>
                  <td>5</td>
                  <th>Steering</th>
                  <td>RIGHT HAND</td>
                </tr>
                <tr>
                  <th>Seats</th>
                  <td>5</td>
                  <th>Gross Weight</th>
                  <td>—</td>
                </tr>
                <tr>
                  <th>LxWxH</th>
                  <td>{vehicle.dimensions ? `${vehicle.dimensions.lengthMm}x${vehicle.dimensions.widthMm}x${vehicle.dimensions.heightMm} mm` : '—'}</td>
                  <th>M3 Size</th>
                  <td>{vehicle.dimensions?.m3 ? `${vehicle.dimensions.m3} m³` : '16.56 m³'}</td>
                </tr>
                <tr>
                  <th>Type</th>
                  <td>{(vehicle.bodyStyle || 'SUV').toUpperCase()}</td>
                  <th></th>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="cc-detail-col-side">
          {/* Vehicle Info & Price Card */}
          <div className="cc-detail-card cc-detail-hero-card">
            <span className="cc-detail-eyebrow">
              {(vehicle.make || '').toUpperCase()} INVENTORY ID
            </span>
            <h1 id={titleId} className="cc-detail-vehicle-title">
              {vehicle.model.toUpperCase()}
            </h1>
            <div className="cc-detail-tag-row">
              <span className="cc-detail-pill-tag">MODEL YEAR: {vehicle.year}</span>
              <span className="cc-detail-pill-tag">{mileageDisplay}</span>
            </div>

            <div className="cc-detail-fob-box">
              <div className="cc-fob-col">
                <span className="cc-fob-label">FOB PRICE</span>
                <span className="cc-fob-val">
                  {priceText} {isRequestPrice ? '' : 'USD'}
                </span>
              </div>
              {!isRequestPrice && (
                <div className="cc-fob-col cc-fob-col--deposit">
                  <span className="cc-fob-label">EST. DEPOSIT</span>
                  <span className="cc-fob-val cc-fob-val--deposit">
                    ${depositUsd.toLocaleString()} USD
                  </span>
                </div>
              )}
            </div>

            {isRequestPrice && (
              <p className="cc-detail-request-price-text">
                Contact us to get the best price for this vehicle.
              </p>
            )}

            <div className="cc-detail-database-ref">
              DATABASE REF ID: <span>{vehicle.id}</span>
            </div>
          </div>

          {/* Ocean Freight Estimator (CIF Calculator) */}
          <div className="cc-detail-card cc-detail-cif-card">
            <div className="cc-cif-header">
              <span className="cc-cif-header-icon">⚓</span>
              <div>
                <h3 className="cc-cif-header-title">OCEAN FREIGHT ESTIMATOR (CIF)</h3>
                <p className="cc-cif-header-sub">
                  Calculate global logistics ocean cargo fees and marine insurance for exporting this {vehicle.make}.
                </p>
              </div>
            </div>

            <div className="cc-cif-body">
              <h4 className="cc-cif-calculator-heading">CIF CALCULATOR</h4>

              <div className="cc-cif-field">
                <label htmlFor={countrySelectId} className="cc-cif-label">
                  Choose Final Country<span className="cc-red-star">*</span>
                </label>
                <select
                  id={countrySelectId}
                  className="cc-cif-select"
                  value={selectedCountry}
                  onChange={(e) => {
                    setSelectedCountry(e.target.value);
                    setSelectedPortIndex(0);
                  }}
                >
                  <option value="">-- Select Destination --</option>
                  {DESTINATIONS.map((d) => (
                    <option key={d.country} value={d.country}>
                      {d.country}
                    </option>
                  ))}
                </select>
                {!selectedCountry && (
                  <p className="cc-cif-prompt-text">
                    Please select the country where your vehicle(s) will be shipped.
                  </p>
                )}
              </div>

              {selectedCountryData && (
                <div className="cc-cif-ports-section">
                  <div className="cc-cif-m3-label">
                    M3 Size (LxWxH) : <strong>16.56 m³</strong>
                  </div>

                  <table className="cc-cif-ports-table">
                    <thead>
                      <tr>
                        <th>ARRIVAL PORT</th>
                        <th>SHIPMENT DURATION AFTER DEPARTURE</th>
                        <th>TOTAL PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCountryData.ports.map((port, idx) => {
                        const portCost = port.costUsd;
                        const totalWithVehicle = carPriceUsd + portCost;
                        const isChecked = selectedPortIndex === idx;

                        return (
                          <tr
                            key={port.name}
                            className={`cc-cif-port-row ${isChecked ? 'cc-cif-port-row--selected' : ''}`}
                            onClick={() => setSelectedPortIndex(idx)}
                          >
                            <td>
                              <label className="cc-port-radio-label">
                                <input
                                  type="radio"
                                  name="arrivalPortOption"
                                  checked={isChecked}
                                  onChange={() => setSelectedPortIndex(idx)}
                                />
                                <span className="cc-port-name-text">
                                  {port.cityDelivery ? `↳ ${port.name}` : port.name}
                                </span>
                                {port.cityDelivery && (
                                  <span className="cc-city-delivery-badge">CITY DELIVERY</span>
                                )}
                              </label>
                            </td>
                            <td className="cc-port-duration-cell">{port.duration}</td>
                            <td className="cc-port-price-cell">
                              <div className="cc-port-price-num">{portCost.toLocaleString()} USD</div>
                              <div className="cc-port-price-total">
                                Total: ${totalWithVehicle.toLocaleString()} USD
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="cc-cif-options-group">
                    <span className="cc-cif-options-title">ADDITIONAL OPTIONS</span>
                    <label className="cc-cif-checkbox">
                      <input
                        type="checkbox"
                        checked={includeInsurance}
                        onChange={(e) => setIncludeInsurance(e.target.checked)}
                      />
                      <span>Insurance</span>
                    </label>
                  </div>

                  <div className="cc-cif-footer-actions">
                    <button
                      type="button"
                      className="cc-paypal-action-btn"
                      onClick={() => alert('Proceeding to PayPal Checkout...')}
                    >
                      PAY WITH PAYPAL
                    </button>
                    <div className="cc-cif-total-display">
                      <span className="cc-cf-label">{includeInsurance ? 'CIF:' : 'C&F:'}</span>
                      <span className="cc-cf-amount">{calculatedGrandTotal.toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Specs Inquiry & Booking Form */}
          <div className="cc-detail-card cc-detail-inquiry-card">
            <div className="cc-inquiry-header">
              <span className="cc-inquiry-icon">✉️</span>
              <div>
                <h3 className="cc-inquiry-title">SPECS INQUIRY &amp; BOOKING FORM</h3>
                <p className="cc-inquiry-sub">
                  Send a secure sales inquiry regarding this {vehicle.year} {vehicle.make}. Our customer representatives will provide customized export estimates.
                </p>
              </div>
            </div>

            <form className="cc-inquiry-form-body" onSubmit={handleInquirySubmit}>
              <div className="cc-form-group">
                <label className="cc-form-label">FULL NAME</label>
                <input
                  type="text"
                  className="cc-form-input"
                  placeholder="John Doe"
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  required
                />
              </div>

              <div className="cc-form-row">
                <div className="cc-form-group">
                  <label className="cc-form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="cc-form-input"
                    placeholder="john@example.com"
                    value={inquiryEmail}
                    onChange={(e) => setInquiryEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="cc-form-group">
                  <label className="cc-form-label">PHONE (OPTIONAL)</label>
                  <input
                    type="tel"
                    className="cc-form-input"
                    placeholder="+1 555-0199"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="cc-form-group">
                <label className="cc-form-label">INQUIRY MESSAGE</label>
                <textarea
                  className="cc-form-textarea"
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  required
                />
              </div>

              {inquirySubmitted ? (
                <div className="cc-inquiry-success-banner">
                  ✓ Thank you! Your inquiry regarding the {vehicle.year} {vehicle.make} {vehicle.model} has been submitted. Our sales specialist will contact you shortly.
                </div>
              ) : (
                <button type="submit" className="cc-inquiry-submit-button">
                  SUBMIT INQUIRY SPEC FILE
                </button>
              )}
            </form>

            <div className="cc-vehicle-detail__actions">
              <Link
                href={`/contact?vehicle=${encodeURIComponent(vehicle.slug)}&enquiryType=${encodeURIComponent(
                  vehicle.category === 'premium' ? 'premium-vehicle' : isRequestPrice ? 'price-request' : 'vehicle'
                )}`}
                className="cc-btn cc-btn--primary cc-btn--sm"
                aria-label={isRequestPrice ? 'Request Price' : 'General Enquiry'}
              >
                {isRequestPrice ? 'Request Price' : 'General Enquiry'}
              </Link>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Enquiry about ${title} (${vehicle.slug})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-btn cc-btn--secondary cc-btn--sm"
                aria-label="WhatsApp Intent"
              >
                WhatsApp Intent
              </a>
              <a
                href={`mailto:info@carchief.example?subject=${encodeURIComponent(`Enquiry: ${title}`)}`}
                className="cc-btn cc-btn--secondary cc-btn--sm"
                aria-label="Email Intent"
              >
                Email Intent
              </a>
            </div>

            <div className="cc-detail-reservation-box">
              <ReservationSection vehicleSlug={vehicle.slug} vehicleStatus={vehicle.status} vehicleLabel={title} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
