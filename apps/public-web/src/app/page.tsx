import type { Metadata } from 'next';
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

export default async function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <HomeShowroom />
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

      </div>
    </section>
  );
}
