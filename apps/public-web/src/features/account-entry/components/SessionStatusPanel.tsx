'use client';

import React, { useId } from 'react';
import type { JwtClaims } from '@carchief/domain';

export interface SessionStatusPanelProps {
  claims: JwtClaims;
  onSignOut: () => void;
  /** Account-gated Live Auction destination (PUB-27, D01-ASM-002) — rendered only when an approved destination is configured. */
  liveAuctionUrl?: string;
}

/**
 * Authenticated session summary (DEC-PUB-AUTH-BOUNDARY). The Live Auction
 * entry is the one account-gated capability this task exposes, and only
 * when the mock's public config carries an approved `liveAuctionUrl`
 * (RULE-10) — auction bidding/authentication/data integration are
 * explicitly not implemented.
 */
export function SessionStatusPanel({ claims, onSignOut, liveAuctionUrl }: SessionStatusPanelProps) {
  const headingId = useId();

  return (
    <div className="cc-account-entry__panel" aria-labelledby={headingId}>
      <h2 id={headingId} className="cc-account-entry__heading">
        You&rsquo;re signed in
      </h2>
      <dl className="cc-account-entry__identity">
        <div className="cc-account-entry__identity-row">
          <dt>Email</dt>
          <dd>{claims.email}</dd>
        </div>
        <div className="cc-account-entry__identity-row">
          <dt>Role</dt>
          <dd>{claims.role}</dd>
        </div>
      </dl>

      {liveAuctionUrl && (
        <div className="cc-account-entry__live-auction">
          <p className="cc-account-entry__intro">
            Live Auction is available as an account-gated external destination. This link does not sign you in there or place
            any bid on your behalf.
          </p>
          <a
            href={liveAuctionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-btn cc-btn--secondary"
            aria-label="Open Live Auction (opens an external site in a new tab)"
          >
            Go to Live Auction
          </a>
        </div>
      )}

      <button type="button" className="cc-btn cc-btn--secondary" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}
