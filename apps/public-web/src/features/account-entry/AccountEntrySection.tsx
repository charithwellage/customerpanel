'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { HttpClient, ConfigService } from '@carchief/api-client';
import { DemoSignInPanel } from './components/DemoSignInPanel';
import { SessionStatusPanel } from './components/SessionStatusPanel';
import { ReservationSignInGuidance } from './components/ReservationSignInGuidance';
import { useSession } from './hooks/useSession';
import { extractVehicleSlug, resolveReturnTarget } from './session-storage';

function resolveBaseUrl(): string {
  return typeof window !== 'undefined' ? '' : process.env.API_BASE_URL || 'http://127.0.0.1:4000';
}

/**
 * Account entry route composition (PUB-22, PUB-23, PUB-27,
 * DEC-PUB-AUTH-BOUNDARY, D01-P06-T003). Reached directly, from the header's
 * sign-in entry point, or from a `ReservationSignInGuidance` link elsewhere
 * carrying `?returnTo=`. Behaviour by session status:
 * - `anonymous` — sign-in/create-account entry point.
 * - `expired` — honest re-authentication guidance (the mock does not itself
 *   enforce JWT expiry; this hook is the session's actual lifetime boundary).
 * - `active` — demo identity summary, sign-out, and the account-gated Live
 *   Auction entry when an approved destination is configured.
 * A successful demo sign-in returns the visitor to `returnTo` (validated
 * against an open-redirect) — most commonly the vehicle they were viewing.
 */
export function AccountEntrySection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const [liveAuctionUrl, setLiveAuctionUrl] = useState<string | undefined>(undefined);
  const [justSignedIn, setJustSignedIn] = useState(false);

  const configService = useMemo(() => new ConfigService(new HttpClient({ baseUrl: resolveBaseUrl() })), []);
  const returnTarget = resolveReturnTarget(searchParams.get('returnTo'));
  const vehicleSlug = extractVehicleSlug(returnTarget);
  const vehicleLabel = vehicleSlug ? `the vehicle you were viewing (${vehicleSlug})` : undefined;
  const signInHref = `/account?returnTo=${encodeURIComponent(returnTarget)}`;

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

  useEffect(() => {
    if (justSignedIn && session.status === 'active' && returnTarget !== '/account') {
      router.push(returnTarget);
    }
  }, [justSignedIn, session.status, returnTarget, router]);

  async function handleSignIn() {
    await session.signInDemo();
    setJustSignedIn(true);
  }

  return (
    <section className="cc-account-entry" aria-label="Account access">
      {session.status === 'active' && session.claims ? (
        <SessionStatusPanel claims={session.claims} onSignOut={session.signOut} liveAuctionUrl={liveAuctionUrl} />
      ) : (
        <DemoSignInPanel
          variant={session.status === 'expired' ? 'expired' : 'anonymous'}
          onSignIn={handleSignIn}
          isSigningIn={session.isSigningIn}
          error={session.signInError}
          vehicleLabel={vehicleLabel}
        />
      )}

      {vehicleSlug && (
        <ReservationSignInGuidance status={session.status} signInHref={signInHref} vehicleLabel={vehicleLabel} />
      )}
    </section>
  );
}
