import type { Metadata } from 'next';
import type { VehicleDomainSummary } from '@carchief/domain';
import { HomeShowroom } from '../features/home';

export const metadata: Metadata = {
  title: 'CarChief | Premium Japanese Used Vehicles & Direct Global Export',
  description: 'Browse curated, hand-picked Japanese used vehicles. Verified inspections, digital logs, and worldwide container freight.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}` : 'http://127.0.0.1:3000',
  },
  openGraph: {
    title: 'CarChief | Premium Japanese Used Vehicles',
    description: 'Browse curated, hand-picked Japanese used vehicles with verified inspections and global export.',
    url: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}` : 'http://127.0.0.1:3000',
    siteName: 'CarChief',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarChief | Premium Japanese Used Vehicles',
    description: 'Browse curated, hand-picked Japanese used vehicles with verified inspections and global export.',
  },
};

async function getInitialVehicles(): Promise<VehicleDomainSummary[]> {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const response = await fetch(`${baseUrl}/api/v1/vehicles?collection=browse`, { cache: 'no-store' });
    return response.ok ? ((await response.json()) as VehicleDomainSummary[]) : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const initialVehicles = await getInitialVehicles();

  return (
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <HomeShowroom initialVehicles={initialVehicles} />
    </main>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-eyebrow">
          <span>CURATED GLOBAL ACQUISITIONS</span>
        </div>

        <h1 className="hero-title">
          CHECK OUR SELECTION OF{' '}
          <span className="hero-title-accent">PREMIUM VEHICLES</span>
        </h1>

        <p className="hero-subtitle">
          Browse our hand-picked, premium global acquisitions of hypercars, custom performance coupes, and bespoke luxury SUVs. Every vehicle is thoroughly inspected, complete with detailed digital logs, and delivered via premium secure ocean transit.
        </p>

        <div className="hero-actions">
          <a className="button primary hero-btn-primary" href="#showroom">
            CHECK PREMIUM VEHICLES →
          </a>
          <a className="button secondary hero-btn-secondary" href="/how-to-buy">
            HOW TO PURCHASE
          </a>
        </div>

        {/* 3-Column Value Proposition Strip */}
        <div className="hero-value-strip">
          <div className="value-strip-item">
            <div className="value-strip-icon">🛡️</div>
            <div>
              <div className="value-strip-title">ELITE QUALITY SOURCING</div>
              <div className="value-strip-text">Strict inspection & technical logs for every chassis.</div>
            </div>
          </div>

          <div className="value-strip-item">
            <div className="value-strip-icon">🚢</div>
            <div>
              <div className="value-strip-title">CONTAINER OCEAN FREIGHT</div>
              <div className="value-strip-text">Secure maritime container pipelines & customs clearing.</div>
            </div>
          </div>

          <div className="value-strip-item">
            <div className="value-strip-icon">🔒</div>
            <div>
              <div className="value-strip-title">DEDICATED SECURE PORTAL</div>
              <div className="value-strip-text">Track order pipelines, invoices & documents live.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
