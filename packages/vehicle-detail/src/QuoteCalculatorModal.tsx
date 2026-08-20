'use client';

import React, { useState, useId, useEffect } from 'react';

export interface PortPricingOption {
  portCode: string;
  portName: string;
  baseFreightRoro: number;
  baseFreightContainer: number;
}

export interface CountryDestinationOption {
  countryCode: string;
  countryName: string;
  ports: PortPricingOption[];
}

export const DEFAULT_DESTINATION_OPTIONS: CountryDestinationOption[] = [
  {
    countryCode: 'LK',
    countryName: 'Sri Lanka',
    ports: [
      { portCode: 'LKCMB', portName: 'Colombo Port', baseFreightRoro: 1100, baseFreightContainer: 2100 },
      { portCode: 'LKHRI', portName: 'Hambantota Port', baseFreightRoro: 1150, baseFreightContainer: 2150 },
    ],
  },
  {
    countryCode: 'UG',
    countryName: 'Uganda',
    ports: [
      { portCode: 'UGMBA', portName: 'Mombasa / Kampala CFS', baseFreightRoro: 1350, baseFreightContainer: 2450 },
    ],
  },
  {
    countryCode: 'KE',
    countryName: 'Kenya',
    ports: [
      { portCode: 'KEMBA', portName: 'Mombasa Port', baseFreightRoro: 1300, baseFreightContainer: 2400 },
    ],
  },
  {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    ports: [
      { portCode: 'TZDAR', portName: 'Dar es Salaam Port', baseFreightRoro: 1400, baseFreightContainer: 2500 },
    ],
  },
  {
    countryCode: 'ZA',
    countryName: 'South Africa',
    ports: [
      { portCode: 'ZADUR', portName: 'Durban Port', baseFreightRoro: 1250, baseFreightContainer: 2300 },
    ],
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    ports: [
      { portCode: 'AUSYD', portName: 'Sydney / Port Botany', baseFreightRoro: 1500, baseFreightContainer: 2800 },
      { portCode: 'AUBNE', portName: 'Brisbane Port', baseFreightRoro: 1550, baseFreightContainer: 2850 },
    ],
  },
  {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    ports: [
      { portCode: 'NZAKL', portName: 'Auckland Port', baseFreightRoro: 1450, baseFreightContainer: 2700 },
    ],
  },
];

export interface CalculatedQuoteBreakdown {
  vehicleId: string;
  vehicleTitle: string;
  vehiclePriceFob: number;
  countryCode: string;
  countryName: string;
  portCode: string;
  portName: string;
  shippingMethod: 'roro' | 'container';
  freightCost: number;
  includeInsurance: boolean;
  insuranceCost: number;
  includeWarranty: boolean;
  warrantyCost: number;
  includeInspection: boolean;
  inspectionCost: number;
  couponCode?: string;
  couponDiscount: number;
  totalCandFPrice: number;
}

export interface QuoteCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
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
  initialDestinationCountry?: string;
  onSubmitQuote?: (quote: CalculatedQuoteBreakdown) => Promise<void> | void;
}

const VALID_COUPONS: Record<string, number> = {
  CARCHIEF50: 50,
  PROMO100: 100,
  VIP2026: 200,
  CAR50: 50,
};

export function QuoteCalculatorModal({
  isOpen,
  onClose,
  vehicle,
  initialDestinationCountry = 'LK',
  onSubmitQuote,
}: QuoteCalculatorModalProps) {
  const dialogId = useId();
  const [countryCode, setCountryCode] = useState(initialDestinationCountry);
  const [selectedPortCode, setSelectedPortCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'roro' | 'container'>('roro');
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [includeWarranty, setIncludeWarranty] = useState(false);
  const [includeInspection, setIncludeInspection] = useState(true);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const selectedCountry =
    DEFAULT_DESTINATION_OPTIONS.find((c) => c.countryCode === countryCode) ||
    DEFAULT_DESTINATION_OPTIONS[0];

  // Sync selected port when country changes
  useEffect(() => {
    if (selectedCountry.ports.length > 0) {
      const portExists = selectedCountry.ports.some((p) => p.portCode === selectedPortCode);
      if (!portExists) {
        setSelectedPortCode(selectedCountry.ports[0].portCode);
      }
    }
  }, [countryCode, selectedCountry, selectedPortCode]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPort =
    selectedCountry.ports.find((p) => p.portCode === selectedPortCode) ||
    selectedCountry.ports[0];

  const vehicleFobPrice = vehicle.discountedPriceUsd ?? vehicle.priceUsd ?? 8500;
  const freightCost =
    shippingMethod === 'roro'
      ? currentPort?.baseFreightRoro || 1200
      : currentPort?.baseFreightContainer || 2400;

  const insuranceCost = includeInsurance ? 150 : 0;
  const warrantyCost = includeWarranty ? 350 : 0;
  const inspectionCost = includeInspection ? 200 : 0;
  const couponDiscount = appliedCoupon && VALID_COUPONS[appliedCoupon] ? VALID_COUPONS[appliedCoupon] : 0;

  const totalCandFPrice = Math.max(
    0,
    vehicleFobPrice + freightCost + insuranceCost + warrantyCost + inspectionCost - couponDiscount
  );

  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (VALID_COUPONS[code]) {
      setAppliedCoupon(code);
      setCouponError(null);
    } else {
      setCouponError('Invalid coupon code. Try CARCHIEF50 or PROMO100.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const breakdown: CalculatedQuoteBreakdown = {
      vehicleId: vehicle.id,
      vehicleTitle,
      vehiclePriceFob: vehicleFobPrice,
      countryCode: selectedCountry.countryCode,
      countryName: selectedCountry.countryName,
      portCode: currentPort?.portCode || '',
      portName: currentPort?.portName || '',
      shippingMethod,
      freightCost,
      includeInsurance,
      insuranceCost,
      includeWarranty,
      warrantyCost,
      includeInspection,
      inspectionCost,
      couponCode: appliedCoupon || undefined,
      couponDiscount,
      totalCandFPrice,
    };

    if (onSubmitQuote) {
      await onSubmitQuote(breakdown);
    }
    setIsSubmitting(false);
    setSubmittedSuccess(true);
  };

  return (
    <div className="cc-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="cc-quote-calculator-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-desc`}
      >
        {/* Modal Header */}
        <div className="cc-qc-header">
          <div className="cc-qc-header-info">
            <span className="cc-qc-badge">⚡ INSTANT C&F QUOTE CALCULATOR</span>
            <h2 id={`${dialogId}-title`} className="cc-qc-title">
              {vehicleTitle}
            </h2>
            <p id={`${dialogId}-desc`} className="cc-qc-subtitle">
              Calculate transparent shipping rates, marine insurance, and warranty options directly to your destination port.
            </p>
          </div>
          <button
            type="button"
            className="cc-qc-close-btn"
            onClick={onClose}
            aria-label="Close quote calculator"
          >
            ✕
          </button>
        </div>

        {submittedSuccess ? (
          <div className="cc-qc-success-state" role="status" aria-live="polite">
            <div className="cc-qc-success-icon">✓</div>
            <h3>Quote Request Registered</h3>
            <p>
              Your customized quote breakdown of <strong>${totalCandFPrice.toLocaleString()} USD</strong> (C&F to {currentPort?.portName}) has been sent to our logistics team. Our dedicated sales specialist will review your freight schedule and issue your official Proforma Invoice.
            </p>
            <button type="button" className="cc-btn cc-btn--primary" onClick={onClose}>
              Done / Return to Vehicle
            </button>
          </div>
        ) : (
          <div className="cc-qc-body">
            {/* Left Column: Configuration Controls */}
            <div className="cc-qc-config-col">
              {/* Destination Country & Port */}
              <div className="cc-qc-section">
                <h4 className="cc-qc-section-title">1. Shipping Destination & Port</h4>
                <div className="cc-qc-fields-row">
                  <div className="cc-qc-field">
                    <label htmlFor={`${dialogId}-country`} className="cc-qc-label">
                      Destination Country
                    </label>
                    <select
                      id={`${dialogId}-country`}
                      className="cc-qc-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {DEFAULT_DESTINATION_OPTIONS.map((c) => (
                        <option key={c.countryCode} value={c.countryCode}>
                          {c.countryName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cc-qc-field">
                    <label htmlFor={`${dialogId}-port`} className="cc-qc-label">
                      Discharge Port
                    </label>
                    <select
                      id={`${dialogId}-port`}
                      className="cc-qc-select"
                      value={selectedPortCode}
                      onChange={(e) => setSelectedPortCode(e.target.value)}
                    >
                      {selectedCountry.ports.map((p) => (
                        <option key={p.portCode} value={p.portCode}>
                          {p.portName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Shipping Method */}
              <div className="cc-qc-section">
                <h4 className="cc-qc-section-title">2. Maritime Shipping Method</h4>
                <div className="cc-qc-method-grid">
                  <label
                    className={`cc-qc-method-card ${
                      shippingMethod === 'roro' ? 'cc-qc-method-card--active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="roro"
                      checked={shippingMethod === 'roro'}
                      onChange={() => setShippingMethod('roro')}
                      className="cc-qc-radio"
                    />
                    <div className="cc-qc-method-content">
                      <div className="cc-qc-method-head">
                        <span className="cc-qc-method-name">RORO (Roll-on / Roll-off)</span>
                        <span className="cc-qc-method-price">
                          ${(currentPort?.baseFreightRoro || 1200).toLocaleString()} USD
                        </span>
                      </div>
                      <span className="cc-qc-method-desc">
                        Standard specialized ocean carrier transport. Economical and fastest turnaround.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`cc-qc-method-card ${
                      shippingMethod === 'container' ? 'cc-qc-method-card--active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="container"
                      checked={shippingMethod === 'container'}
                      onChange={() => setShippingMethod('container')}
                      className="cc-qc-radio"
                    />
                    <div className="cc-qc-method-content">
                      <div className="cc-qc-method-head">
                        <span className="cc-qc-method-name">Dedicated Marine Container</span>
                        <span className="cc-qc-method-price">
                          ${(currentPort?.baseFreightContainer || 2400).toLocaleString()} USD
                        </span>
                      </div>
                      <span className="cc-qc-method-desc">
                        Fully enclosed steel intermodal container. Maximum weather and transit protection.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Protection & Additional Options */}
              <div className="cc-qc-section">
                <h4 className="cc-qc-section-title">3. Protection & Warranties</h4>
                <div className="cc-qc-options-list">
                  <label className="cc-qc-checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeInsurance}
                      onChange={(e) => setIncludeInsurance(e.target.checked)}
                      className="cc-qc-checkbox"
                    />
                    <div className="cc-qc-opt-text">
                      <span className="cc-qc-opt-title">Marine Ocean Transit Insurance (All Risks)</span>
                      <span className="cc-qc-opt-desc">Comprehensive coverage against maritime loss or transport damage</span>
                    </div>
                    <span className="cc-qc-opt-amount">+$150</span>
                  </label>

                  <label className="cc-qc-checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeWarranty}
                      onChange={(e) => setIncludeWarranty(e.target.checked)}
                      className="cc-qc-checkbox"
                    />
                    <div className="cc-qc-opt-text">
                      <span className="cc-qc-opt-title">1-Year Mechanical & Powertrain Warranty</span>
                      <span className="cc-qc-opt-desc">Covers engine, transmission, hybrid battery and drive components</span>
                    </div>
                    <span className="cc-qc-opt-amount">+$350</span>
                  </label>

                  <label className="cc-qc-checkbox-row">
                    <input
                      type="checkbox"
                      checked={includeInspection}
                      onChange={(e) => setIncludeInspection(e.target.checked)}
                      className="cc-qc-checkbox"
                    />
                    <div className="cc-qc-opt-text">
                      <span className="cc-qc-opt-title">Pre-Export JEVIC / Quality Inspection Certification</span>
                      <span className="cc-qc-opt-desc">Official radiation check, odometer verification & roadworthiness audit</span>
                    </div>
                    <span className="cc-qc-opt-amount">+$200</span>
                  </label>
                </div>
              </div>

              {/* Coupon / Promo Code */}
              <div className="cc-qc-section cc-qc-section--coupon">
                <h4 className="cc-qc-section-title">4. Promotional Discount Code</h4>
                {appliedCoupon ? (
                  <div className="cc-qc-coupon-applied">
                    <span>
                      Coupon <strong>{appliedCoupon}</strong> applied (-${couponDiscount} USD)
                    </span>
                    <button type="button" className="cc-qc-coupon-remove" onClick={handleRemoveCoupon}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="cc-qc-coupon-form">
                    <input
                      type="text"
                      className="cc-qc-coupon-input"
                      placeholder="e.g. CARCHIEF50"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCoupon()}
                      className="cc-qc-coupon-btn"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="cc-qc-coupon-error">{couponError}</p>}
              </div>
            </div>

            {/* Right Column: Live Calculated Breakdown */}
            <div className="cc-qc-summary-col">
              <div className="cc-qc-summary-card">
                <h3 className="cc-qc-summary-title">Live Cost Breakdown</h3>

                <div className="cc-qc-summary-lines">
                  <div className="cc-qc-line">
                    <span className="cc-qc-line-label">Vehicle FOB Price:</span>
                    <span className="cc-qc-line-val" data-testid="qc-fob-price">${vehicleFobPrice.toLocaleString()} USD</span>
                  </div>

                  <div className="cc-qc-line">
                    <span className="cc-qc-line-label">
                      Ocean Freight ({shippingMethod === 'roro' ? 'RORO' : 'Container'}):
                    </span>
                    <span className="cc-qc-line-val" data-testid="qc-freight-price">${freightCost.toLocaleString()} USD</span>
                  </div>

                  {includeInsurance && (
                    <div className="cc-qc-line">
                      <span className="cc-qc-line-label">Marine Insurance:</span>
                      <span className="cc-qc-line-val" data-testid="qc-insurance-price">+$150 USD</span>
                    </div>
                  )}

                  {includeWarranty && (
                    <div className="cc-qc-line">
                      <span className="cc-qc-line-label">1-Year Warranty:</span>
                      <span className="cc-qc-line-val" data-testid="qc-warranty-price">+$350 USD</span>
                    </div>
                  )}

                  {includeInspection && (
                    <div className="cc-qc-line">
                      <span className="cc-qc-line-label">JEVIC Inspection:</span>
                      <span className="cc-qc-line-val" data-testid="qc-inspection-price">+$200 USD</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="cc-qc-line cc-qc-line--discount">
                      <span className="cc-qc-line-label">Coupon Discount:</span>
                      <span className="cc-qc-line-val" data-testid="qc-discount-price">-${couponDiscount.toLocaleString()} USD</span>
                    </div>
                  )}
                </div>

                <div className="cc-qc-total-box">
                  <div className="cc-qc-total-label">
                    <span>Estimated Total C&F Price:</span>
                    <small>Port of {currentPort?.portName || 'Discharge'}</small>
                  </div>
                  <div className="cc-qc-total-amount" data-testid="qc-total-price">
                    ${totalCandFPrice.toLocaleString()} <span className="cc-qc-total-currency">USD</span>
                  </div>
                </div>

                <div className="cc-qc-actions">
                  <button
                    type="button"
                    className="cc-btn cc-btn--primary cc-qc-submit-btn"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering Quote...' : 'Request Formal Proforma Invoice'}
                  </button>
                  <button
                    type="button"
                    className="cc-btn cc-btn--secondary cc-qc-print-btn"
                    onClick={() => window.print()}
                  >
                    Print / Save Breakdown
                  </button>
                </div>

                <p className="cc-qc-disclaimer">
                  🔒 Locked-in rates valid for 5 business days upon reservation. All maritime customs documentation handled directly by CarChief logistics.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
