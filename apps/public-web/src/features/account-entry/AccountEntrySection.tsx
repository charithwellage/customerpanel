'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { HttpClient, ConfigService } from '@carchief/api-client';
import { resolveCustomerAppUrl } from '../../shell/Header';
import { AccountAccessPanel } from './components/AccountAccessPanel';
import { SessionStatusPanel } from './components/SessionStatusPanel';
import { ReservationSignInGuidance } from './components/ReservationSignInGuidance';
import { useSession } from './hooks/useSession';
import { extractVehicleSlug, resolveReturnTarget } from './session-storage';

function resolveBaseUrl(): string {
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

/**
 * Account entry route composition (PUB-22, PUB-23, PUB-27,
 * DEC-PUB-AUTH-BOUNDARY, CUST-30). Reached directly, from the header's
 * sign-in entry point, or from a `ReservationSignInGuidance` link elsewhere
 * carrying `?returnTo=`. Behaviour by session status:
 * - `anonymous` — honest account-access entry point: Sign In (Customer app)
 *   or Create an Account (`/register`). No demo identity path remains.
 * - `expired` — honest re-authentication guidance (the mock does not itself
 *   enforce JWT expiry; `useSession` is the session's actual lifetime
 *   boundary).
 * - `active` — session identity summary, sign-out, and the account-gated
 *   Live Auction entry when an approved destination is configured.
 * The public website never mints a token itself, so there is no local
 * sign-in action here to complete — signing in always happens in the
 * Customer application.
 */
export function AccountEntrySection() {
  const searchParams = useSearchParams();
  const session = useSession();
  const [liveAuctionUrl, setLiveAuctionUrl] = useState<string | undefined>(undefined);

  const configService = useMemo(() => new ConfigService(new HttpClient({ baseUrl: resolveBaseUrl() })), []);
  const returnTarget = resolveReturnTarget(searchParams.get('returnTo'));
  const vehicleSlug = extractVehicleSlug(returnTarget);
  const vehicleLabel = vehicleSlug ? `the vehicle you were viewing (${vehicleSlug})` : undefined;
  const signInHref = `/account?returnTo=${encodeURIComponent(returnTarget)}`;
  const customerAppUrl = resolveCustomerAppUrl();

  useEffect(() => {
    let cancelled = false;
    configService
      .getPublicConfig()
      .then((config) => {
        if (!cancelled) setLiveAuctionUrl(config.liveAuctionUrl);
      })
      .catch(() => {
        // Config lookup failure only hides the Live Auction entry — it must
        // never fabricate a destination (RULE-09/RULE-10).
        if (!cancelled) setLiveAuctionUrl(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [configService]);

  return (
    <section className="cc-account-entry" aria-label="Account access">
      {session.status === 'active' && session.claims ? (
        <SessionStatusPanel claims={session.claims} onSignOut={session.signOut} liveAuctionUrl={liveAuctionUrl} />
      ) : (
        <AccountAccessPanel
          variant={session.status === 'expired' ? 'expired' : 'anonymous'}
          customerAppUrl={customerAppUrl}
          vehicleLabel={vehicleLabel}
        />
      )}

      {vehicleSlug && (
        <ReservationSignInGuidance status={session.status} signInHref={signInHref} vehicleLabel={vehicleLabel} />
      )}
    </section>
  );
}
