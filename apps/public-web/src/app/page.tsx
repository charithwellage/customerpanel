import type { VehicleDomainSummary } from '@carchief/domain';
import { HomeShowroom } from '../features/home';

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
    <main id="main-content">
      <Hero />
      <HomeShowroom initialVehicles={initialVehicles} />
    </main>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', textTransform: 'uppercase', color: '#ffb703' }}>
          Japanese Used Vehicles • Direct Export Logistics
        </p>
        <h1>Find your next vehicle with confidence.</h1>
        <p>Browse our current stock and connect with the CarChief team for a quotation.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <a className="button primary" href="#showroom">
            Browse stock
          </a>
          <a className="button secondary" href="/inventory?category=premium" style={{ textDecoration: 'none' }}>
            Explore Premium Stock
          </a>
        </div>
      </div>
    </section>
  );
}
