import { SearchShowroom } from './search-showroom';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: string;
}

async function getVehicles(): Promise<Vehicle[]> {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
  try {
    const response = await fetch(`${baseUrl}/api/v1/vehicles`, { cache: 'no-store' });
    return response.ok ? await response.json() as Vehicle[] : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  return <main><Hero /><SearchShowroom vehicles={await getVehicles()} /></main>;
}

function Hero() {
  return <section className="hero"><div className="hero-inner"><p>Japanese vehicles, made simple.</p><h1>Find your next vehicle with confidence.</h1><p>Browse our current stock and connect with the CarChief team for a quotation.</p><a className="button primary" href="#showroom">Browse stock</a></div></section>;
}
