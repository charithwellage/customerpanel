'use client';

import React, { useState, useEffect } from 'react';

export interface BuyingStep {
  id: number;
  stepNumber: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  description: string;
}

export const BUYING_STEPS: BuyingStep[] = [
  {
    id: 1,
    stepNumber: '01',
    tabLabel: 'SELECT A CAR',
    title: 'SELECT A CAR & GET FREE QUOTE',
    subtitle: 'Search and find your desired vehicle in our stock catalog.',
    description:
      'Search for your required car from high-quality Japanese used vehicles stock ready to export at fair prices in our stock list. Send us your inquiry by clicking on the Get Free Quote button and submitting the inquiry form.',
  },
  {
    id: 2,
    stepNumber: '02',
    tabLabel: 'CONFIRM ORDER',
    title: 'CONFIRM ORDER & PROFORMA INVOICE',
    subtitle: 'Finalize vehicle specifications and destination port details.',
    description:
      'Confirm proforma invoice, vehicle specifications, total C&F freight charges, and shipping destination details with our dedicated sales executive.',
  },
  {
    id: 3,
    stepNumber: '03',
    tabLabel: 'MAKE PAYMENT',
    title: 'MAKE PAYMENT VIA TELEGRAPHIC TRANSFER',
    subtitle: 'Secure your order via official bank wire transfer.',
    description:
      'Make telegraphic transfer (T/T) payment to our designated bank account as specified on your official Proforma Invoice within 48 hours of reservation.',
  },
  {
    id: 4,
    stepNumber: '04',
    tabLabel: 'SHIPMENT',
    title: 'SHIPMENT & OCEAN FREIGHT TRACKING',
    subtitle: 'Vessel booking, inspection clearing, and maritime dispatch.',
    description:
      'Our logistics team arranges booking, inspection, export customs clearing, and maritime shipment with full live vessel tracking and DHL document dispatch.',
  },
  {
    id: 5,
    stepNumber: '05',
    tabLabel: 'RECEIVE YOUR VEHICLE',
    title: 'RECEIVE YOUR VEHICLE AT DESTINATION PORT',
    subtitle: 'Port clearance and vehicle key handover.',
    description:
      'Receive original bill of lading, inspection certificates, and pick up your vehicle smoothly at your local port destination with full clearing support.',
  },
];

export const HowToBuyExperience: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % BUYING_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentStep = BUYING_STEPS[activeStepIndex];

  return (
    <div className="htb-container">
      {/* 1. Dark Hero Banner */}
      <div className="htb-hero-banner">
        <div className="htb-hero-inner">
          <div className="htb-hero-content">
            <div className="htb-hero-eyebrow">
              <span>AUTOMOTIVE TRADE SOURCING GUIDE</span>
            </div>
            <h1 className="htb-hero-title">
              5 EASY STEPS TO BUY VEHICLES & MACHINERY FROM OUR STOCK
            </h1>
            <p className="htb-hero-subtitle">
              Excellent Quality & Well Inspected Cars, Vans, Trucks, Buses & Construction Machinery available in stock ready to Export.
            </p>
          </div>
          <div className="htb-hero-action">
            <a href="/allstock" className="htb-hero-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>BUY NOW JAPAN USED CARS STOCK</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="htb-body-wrap">
        {/* 2. Slideshow Control Strip */}
        <div className="htb-slideshow-bar">
          <div className="htb-slideshow-status">
            <button
              type="button"
              className="htb-play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <div className="htb-slideshow-text">
              <span className="htb-slideshow-label">SLIDE SHOW MODE</span>
              <span className="htb-slideshow-state">{isPlaying ? 'SLIDESHOW RUNNING' : 'SLIDESHOW PAUSED'}</span>
            </div>
          </div>

          <div className="htb-slideshow-progress">
            <div className="htb-progress-bar">
              <div className="htb-progress-fill" style={{ width: `${((activeStepIndex + 1) / BUYING_STEPS.length) * 100}%` }} />
            </div>
            <div className="htb-dots">
              {BUYING_STEPS.map((step, idx) => (
                <button
                  key={step.id}
                  type="button"
                  className={`htb-dot ${idx === activeStepIndex ? 'htb-dot-active' : ''}`}
                  onClick={() => setActiveStepIndex(idx)}
                  aria-label={`Jump to Step ${step.id}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. 5-Step Tab Selector Strip */}
        <div className="htb-step-tabs">
          {BUYING_STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            return (
              <button
                key={step.id}
                type="button"
                className={`htb-step-tab ${isActive ? 'htb-step-tab-active' : ''}`}
                onClick={() => setActiveStepIndex(idx)}
              >
                <span className="htb-tab-step-num">STEP {step.stepNumber}</span>
                <span className="htb-tab-label">{step.tabLabel}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Active Step Detail Card with Nav Arrows */}
        <div className="htb-step-card-wrapper">
          <button
            type="button"
            className="htb-nav-arrow htb-nav-arrow-left"
            onClick={() => setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : BUYING_STEPS.length - 1))}
            aria-label="Previous Step"
          >
            ‹
          </button>

          <div className="htb-step-card">
            <div className="htb-step-card-header">
              <div className="htb-card-header-left">
                <span className="htb-registry-eyebrow">MILESTONE REGISTRY</span>
                <h2 className="htb-step-card-title">{currentStep.title}</h2>
              </div>
              <a href="/allstock" className="htb-card-search-icon-btn" aria-label="Search stock for quote">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </a>
            </div>

            <div className="htb-step-card-body">
              <div className="htb-watermark-num" aria-hidden="true">
                {currentStep.stepNumber}
              </div>
              <p className="htb-step-description">{currentStep.description}</p>
            </div>

            <div className="htb-step-card-footer">
              <div className="htb-jump-bar">
                <span className="htb-jump-label">JUMP TO:</span>
                <div className="htb-jump-btns">
                  {BUYING_STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`htb-jump-btn ${i === activeStepIndex ? 'htb-jump-btn-active' : ''}`}
                      onClick={() => setActiveStepIndex(i)}
                    >
                      Step {s.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="htb-action-pair">
                <a href="/allstock" className="htb-btn-secondary">
                  BROWSE STOCK
                </a>
                <a href="/contact" className="htb-btn-primary">
                  INQUIRE FORM
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="htb-nav-arrow htb-nav-arrow-right"
            onClick={() => setActiveStepIndex((prev) => (prev < BUYING_STEPS.length - 1 ? prev + 1 : 0))}
            aria-label="Next Step"
          >
            ›
          </button>
        </div>

        {/* 5. 2-Column Quality & Export Banner */}
        <div className="htb-info-banner">
          <div className="htb-info-col">
            <span className="htb-info-eyebrow">EXCELLENT QUALITY ENSURED</span>
            <p className="htb-info-text">
              Every car, van, truck, bus, and construction machinery goes through deep operational checks, including complete engine compression checks, mileage checks, and dynamic road tests prior to export.
            </p>
          </div>

          <div className="htb-info-col">
            <span className="htb-info-eyebrow">GLOBAL EXPORT DELIVERY</span>
            <p className="htb-info-text">
              We arrange quick shipment from Japan & Rotterdam harbors utilizing reliable carrier vessels. All original compliance documents, custom clearances, and titles are couriered express so they reach you well in time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
