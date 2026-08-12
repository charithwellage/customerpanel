import React from 'react';
import type { Metadata } from 'next';
import { loadOffices } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

// Office data is fetched from the mock API at request time (PUB-20); without
// this directive Next.js would statically prerender the page at build time,
// when no backend is reachable, permanently baking in an empty grid.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Regional Branch Directory & Offices | CarChief',
  description: 'Explore CarChief regional branch hubs, office locations, opening hours, and dedicated sales teams.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/branches` : 'http://127.0.0.1:3000/branches',
  },
};

export default async function BranchesDirectoryPage() {
  const officesResponse = await loadOffices();
  const hasOffices = officesResponse.items.length > 0;

  return (
    <ContentPageTemplate
      title="Regional Branch Directory"
      subtitle="Explore our international regional hubs, sales offices, and customs dispatch centers."
      badge="Global Network"
      owner="LogisticsTeam"
      updatedAt="2026-08-10T10:00:00.000Z"
      status="approved"
      isUnavailable={!hasOffices}
      unavailableMessage="No regional branch offices are published yet. Check back soon or contact our support team for the office nearest you."
    >
      <div className="cc-branches-grid">
        {officesResponse.items.map((office) => {
          const branchCode = office.id || office.city.toLowerCase();
          return (
            <div key={office.id} className="cc-branch-card">
              <h2 className="cc-branch-card__title">
                {office.city} ({office.name})
              </h2>
              <p className="cc-branch-card__country">{office.country}</p>
              <p className="cc-branch-card__address">{office.address}</p>
              <a href={`/branches/${String(branchCode).toLowerCase()}-hub`} className="cc-btn cc-btn--secondary cc-btn--sm">
                View Regional Branch Hub &rarr;
              </a>
            </div>
          );
        })}
      </div>
    </ContentPageTemplate>
  );
}
