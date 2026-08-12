import React from 'react';
import type { Metadata } from 'next';
import type { VehicleDomainSummary } from '@carchief/domain';
import { loadBranchById, loadBranchVehicles } from '../../../features/public-content/loadPublicContent';
import { BranchPageContent } from '../../../features/public-content/components/BranchPageContent';
import '../../../features/public-content/public-content.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ branch: string }>;
}): Promise<Metadata> {
  const { branch: branchParam } = await params;
  const branch = await loadBranchById(branchParam);

  if (!branch) {
    return {
      title: 'Branch Hub Not Found | CarChief',
      description: 'The requested regional branch hub could not be found.',
    };
  }

  return {
    title: `${branch.name} (${branch.code}) | CarChief Regional Hub`,
    description: branch.introduction,
  };
}

export default async function BranchPage({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch: branchParam } = await params;
  const branch = await loadBranchById(branchParam);

  let latestArrivals: VehicleDomainSummary[] = [];
  let recentlyDiscounted: VehicleDomainSummary[] = [];

  if (branch) {
    const collections = await loadBranchVehicles(branch);
    latestArrivals = collections.latestArrivals;
    recentlyDiscounted = collections.recentlyDiscounted;
  }

  return (
    <main className="cc-public-content-page">
      <div className="cc-public-content-page__content-wrap">
        <div className="cc-public-content-page__container">
          <BranchPageContent
            branch={branch}
            latestArrivals={latestArrivals}
            recentlyDiscounted={recentlyDiscounted}
            isUnavailable={!branch}
          />
        </div>
      </div>
    </main>
  );
}
