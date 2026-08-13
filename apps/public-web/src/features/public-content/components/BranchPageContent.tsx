import React from 'react';
import type { BranchContent, VehicleDomainSummary } from '@carchief/domain';
import { generateVehicleSlug } from '@carchief/domain';
import { VehicleCollectionPrimitive } from '@carchief/vehicle-search';

export interface BranchPageContentProps {
  branch: BranchContent | null;
  latestArrivals?: VehicleDomainSummary[];
  recentlyDiscounted?: VehicleDomainSummary[];
  isLoading?: boolean;
  isUnavailable?: boolean;
}

export const BranchPageContent: React.FC<BranchPageContentProps> = ({
  branch,
  latestArrivals = [],
  recentlyDiscounted = [],
  isLoading = false,
  isUnavailable = false,
}) => {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="cc-branch-page__loading">
        <div className="cc-spinner" aria-hidden="true" />
        <span>Loading branch hub information...</span>
      </div>
    );
  }

  if (isUnavailable || !branch) {
    return (
      <div role="alert" className="cc-branch-page__unavailable">
        <h2>Branch Information Unavailable</h2>
        <p>
          The requested regional branch hub is currently unlisted or pending official management setup.
        </p>
        <a href="/contact" className="cc-btn cc-btn--primary">
          View All Contact Hubs
        </a>
      </div>
    );
  }

  return (
    <article className="cc-branch-page">
      <header className="cc-branch-page__header">
        <div className="cc-branch-page__badge">
          Regional Hub • Code: {branch.code} • Port: {branch.destinationPort}
        </div>
        <h1 className="cc-branch-page__title">{branch.name}</h1>
        <p className="cc-branch-page__intro">{branch.introduction}</p>
      </header>

      <section className="cc-branch-page__banners">
        <div className="cc-branch-banner cc-branch-banner--welcome">
          <span className="cc-branch-banner__icon" aria-hidden="true">
            🌍
          </span>
          <p className="cc-branch-banner__text">{branch.welcomeBanner}</p>
        </div>

        <div className="cc-branch-banner cc-branch-banner--contact">
          <span className="cc-branch-banner__icon" aria-hidden="true">
            📞
          </span>
          <p className="cc-branch-banner__text">{branch.contactBanner}</p>
        </div>
      </section>

      {/* Vehicle Collections for this Branch Port */}
      <section className="cc-branch-page__collections" aria-label="Branch vehicle inventory">
        <div className="cc-branch-page__collection-block">
          <VehicleCollectionPrimitive
            title={`Latest Arrivals for ${branch.destinationPort}`}
            description={`Freshly inspected stock bound for ${branch.destinationPort} port.`}
            vehicles={latestArrivals}
            emptyTitle={`No recent arrivals for ${branch.destinationPort}`}
            emptyDescription="There are currently no new stock items assigned to this destination port."
            getVehicleHref={(v) => `/vehicles/${generateVehicleSlug(v.year, v.make, v.model, v.id)}`}
          />
        </div>

        <div className="cc-branch-page__collection-block">
          <VehicleCollectionPrimitive
            title={`Recently Discounted for ${branch.destinationPort}`}
            description={`Special promotional offers available for ${branch.destinationPort} delivery.`}
            vehicles={recentlyDiscounted}
            emptyTitle={`No discounted items for ${branch.destinationPort}`}
            emptyDescription="There are currently no promotional discount items for this port destination."
            getVehicleHref={(v) => `/vehicles/${generateVehicleSlug(v.year, v.make, v.model, v.id)}`}
          />
        </div>
      </section>


      {/* Team & Contact Details */}
      <div className="cc-branch-page__grid">
        <section className="cc-branch-page__team-card" aria-labelledby="team-heading">
          <h2 id="team-heading" className="cc-branch-page__card-title">
            CarChief Team
          </h2>
          <div className="cc-branch-page__team-list">
            {branch.teamMembers.map((member, idx) => (
              <div key={idx} className="cc-team-member">
                <div className="cc-team-member__avatar" aria-hidden="true">
                  {member.name.charAt(0)}
                </div>
                <div className="cc-team-member__info">
                  <h3 className="cc-team-member__name">{member.name}</h3>
                  <p className="cc-team-member__role">{member.role}</p>
                  <a href={`mailto:${member.contactEmail}`} className="cc-team-member__email">
                    {member.contactEmail}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="cc-branch-page__meet">
            <h3>Meet & Greet Service</h3>
            <p>{branch.meetAndGreetInfo}</p>
          </div>
        </section>

        <section className="cc-branch-page__contact-card" aria-labelledby="branch-contact-heading">
          <h2 id="branch-contact-heading" className="cc-branch-page__card-title">
            Branch Contact Details
          </h2>
          <dl className="cc-branch-page__contact-details">
            <div>
              <dt>Address</dt>
              <dd>{branch.contactDetails.address}</dd>
            </div>
            <div>
              <dt>Phone Hotline</dt>
              <dd>{branch.contactDetails.phone}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{branch.contactDetails.email}</dd>
            </div>
            <div>
              <dt>Hours</dt>
              <dd>{branch.contactDetails.hours}</dd>
            </div>
          </dl>

          <div className="cc-branch-page__actions">
            <a href="/vehicles" className="cc-btn cc-btn--primary">
              View All Vehicles
            </a>
            <a href="/contact" className="cc-btn cc-btn--secondary">
              All Offices
            </a>
          </div>
        </section>
      </div>
    </article>
  );
};
