import React from 'react';
import type { Metadata } from 'next';
import { loadOffices } from '../../features/public-content/loadPublicContent';
import { ContentPageTemplate } from '../../features/public-content/components/ContentPageTemplate';
import '../../features/public-content/public-content.css';

export const metadata: Metadata = {
  title: 'Regional Branch Directory & Offices | CarChief',
  description: 'Explore CarChief regional branch hubs, office locations, opening hours, and dedicated sales teams.',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/branches` : 'http://127.0.0.1:3000/branches',
  },
};

export default async function BranchesDirectoryPage() {
  const officesResponse = await loadOffices();

  return (
    <ContentPageTemplate
      title="Regional Branch Directory"
      subtitle="Explore our international regional hubs, sales offices, and customs dispatch centers."
      badge="Global Network"
      owner="LogisticsTeam"
      updatedAt="2026-08-10T10:00:00.000Z"
      status="approved"
    >
      <div className="cc-branches-grid" style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
        {officesResponse.items.map((office) => {
          const branchCode = (office as any).code || office.id || office.city.toLowerCase();
          return (
            <div key={office.id} className="cc-branch-card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {office.city} ({office.name})
              </h2>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>{office.country}</p>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{office.address}</p>
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
