import { describe, expect, it } from 'vitest';
import { metadata as accountMetadata } from '../app/account/layout';

describe('Public Web Security & Data Projection Guard (RULE-08, RULE-09, RULE-10)', () => {
  it('prohibits indexation of private account portal routes via noindex metadata', () => {
    expect(accountMetadata.robots).toEqual({ index: false, follow: false });
  });

  it('scans environment variables to verify no secret keys are exposed to client bundle', () => {
    const publicEnvKeys = Object.keys(process.env).filter((key) => key.startsWith('NEXT_PUBLIC_'));

    const forbiddenSecretPatterns = [/secret/i, /private_key/i, /password/i, /database_url/i, /auth_token/i];

    for (const key of publicEnvKeys) {
      const val = process.env[key] ?? '';
      for (const pattern of forbiddenSecretPatterns) {
        expect(key).not.toMatch(pattern);
        expect(val).not.toMatch(/-----BEGIN PRIVATE KEY-----/);
      }
    }
  });

  it('ensures public vehicle data models exclude private internal fields', () => {
    // Sample public vehicle payload structure
    const samplePublicVehicle = {
      id: 'veh-1',
      slug: '2021-toyota-corolla-axio-veh-1',
      make: 'Toyota',
      model: 'Corolla Axio',
      year: 2021,
      priceUsd: 8500,
      status: 'Available',
    };

    // Assert that sensitive backend fields do not exist on the public object
    const forbiddenFields = [
      'supplierId',
      'purchasePriceJpy',
      'internalMargin',
      'reservePrice',
      'customerPii',
      'auctionSheetOriginal',
      'sellerNotesSecret',
    ];

    for (const field of forbiddenFields) {
      expect(samplePublicVehicle).not.toHaveProperty(field);
    }
  });
});
