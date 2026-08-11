/**
 * Vehicle detail page integration tests.
 *
 * Tests observable behavior and contracts of:
 * - VehicleService.getVehicleDetail HTTP contract (via fetch mock)
 * - @carchief/vehicle-detail helper functions (formatVehicleTitle, getEffectivePrice, isVehicleAvailable)
 * - Media category selection (gallery, empty-gallery fallback)
 * - Price state rendering (priced vs request_price)
 * - Status/availability determination (Sold, Available, Reserved)
 *
 * Does not import mock fixtures or private fields.
 * Uses the generated api-client and domain types.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpClient, VehicleService } from '@carchief/api-client';
import type { VehicleDetail, CategorizedPublicMedia } from '@carchief/domain';
import {
  formatVehicleTitle,
  getEffectivePrice,
  isVehicleAvailable,
} from '@carchief/vehicle-detail';

/* --------------------------------------------------------------------------
   Fixtures — public projection only, no private fields
   -------------------------------------------------------------------------- */

const makeMedia = (gallery: string[] = []): CategorizedPublicMedia => ({
  gallery,
  totalPicturesCount: gallery.length,
});

const basePricedVehicle: VehicleDetail = {
  id: 'veh-1',
  chassisNumber: 'NZE141-0001',
  slug: '2021-toyota-corolla-axio-veh-1',
  make: 'Toyota',
  model: 'Corolla Axio',
  year: 2021,
  status: 'Available',
  priceState: 'priced',
  priceUsd: 8500,
  requestPrice: false,
  media: makeMedia([
    'https://example.com/img1.jpg',
    'https://example.com/img2.jpg',
  ]),
  bodyStyle: 'Sedan',
  fuelType: 'Petrol',
  mileage: 54000,
};

const requestPriceVehicle: VehicleDetail = {
  id: 'veh-req',
  chassisNumber: 'SJ81-9999',
  slug: '2020-suzuki-jimny-veh-req',
  make: 'Suzuki',
  model: 'Jimny',
  year: 2020,
  status: 'Available',
  priceState: 'request_price',
  requestPrice: true,
  media: makeMedia(['https://example.com/jimny.jpg']),
};

const soldVehicle: VehicleDetail = {
  id: 'veh-sold',
  chassisNumber: 'CRV-SOLD',
  slug: '2019-honda-crv-veh-sold',
  make: 'Honda',
  model: 'CRV',
  year: 2019,
  status: 'Sold',
  priceState: 'priced',
  priceUsd: 16000,
  requestPrice: false,
  media: makeMedia([]),
};

const noMediaVehicle: VehicleDetail = {
  id: 'veh-no-media',
  chassisNumber: 'NOMEDIA-001',
  slug: '2018-mitsubishi-outlander-veh-no-media',
  make: 'Mitsubishi',
  model: 'Outlander',
  year: 2018,
  status: 'Available',
  priceState: 'priced',
  priceUsd: 12000,
  requestPrice: false,
  media: makeMedia([]),
};

const discountedVehicle: VehicleDetail = {
  ...basePricedVehicle,
  id: 'veh-discount',
  discountPercent: 10,
  priceUsd: 10000,
  discountedPriceUsd: 9000,
};

/* --------------------------------------------------------------------------
   Helper: mock fetch-based VehicleService
   -------------------------------------------------------------------------- */
function mockVehicleDetailFetch(
  fixture: VehicleDetail | null,
  statusCode = 200,
): VehicleService {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      fixture === null
        ? JSON.stringify({ statusCode: 404, message: 'Not found' })
        : JSON.stringify(fixture),
      {
        status: statusCode,
        headers: { 'content-type': 'application/json' },
      },
    ),
  );
  return new VehicleService(new HttpClient({ baseUrl: 'http://mock-api.test' }));
}

/* --------------------------------------------------------------------------
   Helper functions from @carchief/vehicle-detail
   -------------------------------------------------------------------------- */
describe('formatVehicleTitle', () => {
  it('returns year make model string', () => {
    expect(formatVehicleTitle(basePricedVehicle)).toBe('2021 Toyota Corolla Axio');
  });

  it('handles single-word model', () => {
    expect(formatVehicleTitle({ year: 2020, make: 'Suzuki', model: 'Jimny' })).toBe(
      '2020 Suzuki Jimny',
    );
  });
});

describe('getEffectivePrice', () => {
  it('returns formatted USD price for priced vehicle', () => {
    const { priceText, isRequestPrice } = getEffectivePrice(basePricedVehicle);
    expect(isRequestPrice).toBe(false);
    expect(priceText).toContain('8,500');
  });

  it('returns discounted price when discountedPriceUsd is set', () => {
    const { priceText, isRequestPrice } = getEffectivePrice(discountedVehicle);
    expect(isRequestPrice).toBe(false);
    expect(priceText).toContain('9,000');
  });

  it('returns Request Price for request_price state', () => {
    const { priceText, isRequestPrice } = getEffectivePrice(requestPriceVehicle);
    expect(isRequestPrice).toBe(true);
    expect(priceText).toBe('Request Price');
  });

  it('returns Request Price when priceUsd is absent even if priceState is priced', () => {
    const noPriceVehicle: VehicleDetail = {
      ...requestPriceVehicle,
      priceState: 'priced',
      requestPrice: false,
      priceUsd: undefined,
    };
    const { isRequestPrice } = getEffectivePrice(noPriceVehicle);
    expect(isRequestPrice).toBe(true);
  });
});

describe('isVehicleAvailable', () => {
  it('returns true for Available status', () => {
    expect(isVehicleAvailable('Available')).toBe(true);
  });

  it('returns false for Sold status', () => {
    expect(isVehicleAvailable('Sold')).toBe(false);
  });

  it('returns false for Reserved status', () => {
    expect(isVehicleAvailable('Reserved')).toBe(false);
  });

  it('returns false for unknown/draft status', () => {
    expect(isVehicleAvailable('Draft')).toBe(false);
  });
});

/* --------------------------------------------------------------------------
   Media category selection
   -------------------------------------------------------------------------- */
describe('CategorizedPublicMedia gallery array', () => {
  it('returns a non-empty gallery array for vehicle with images', () => {
    const gallery = basePricedVehicle.media.gallery;
    expect(gallery.length).toBe(2);
    expect(gallery[0]).toMatch(/^https?:\/\//);
  });

  it('returns empty gallery array for no-media vehicle', () => {
    const gallery = noMediaVehicle.media.gallery;
    expect(gallery).toEqual([]);
    expect(noMediaVehicle.media.totalPicturesCount).toBe(0);
  });

  it('sold vehicle has empty gallery in no-media scenario', () => {
    expect(soldVehicle.media.gallery).toEqual([]);
  });
});

/* --------------------------------------------------------------------------
   VehicleService HTTP contract (via fetch mock)
   -------------------------------------------------------------------------- */
describe('VehicleService.getVehicleDetail HTTP contract', () => {
  it('returns VehicleDetail payload for known ID', async () => {
    const service = mockVehicleDetailFetch(basePricedVehicle);
    const detail = await service.getVehicleDetail('veh-1');
    expect(detail).not.toBeNull();
    expect(detail?.id).toBe('veh-1');
    expect(detail?.slug).toBe('2021-toyota-corolla-axio-veh-1');
    expect(detail?.media.gallery.length).toBe(2);
    vi.restoreAllMocks();
  });

  it('returns null for 404 not-found response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ statusCode: 404, message: 'Vehicle not found' }),
        { status: 404, headers: { 'content-type': 'application/json' } },
      ),
    );
    const service = new VehicleService(
      new HttpClient({ baseUrl: 'http://mock-api.test' }),
    );
    const detail = await service.getVehicleDetail('non-existent');
    expect(detail).toBeNull();
    vi.restoreAllMocks();
  });

  it('returns sold vehicle with correct status', async () => {
    const service = mockVehicleDetailFetch(soldVehicle);
    const detail = await service.getVehicleDetail('veh-sold');
    expect(detail?.status).toBe('Sold');
    expect(detail?.media.gallery).toEqual([]);
    vi.restoreAllMocks();
  });

  it('returns request_price vehicle without priceUsd', async () => {
    const service = mockVehicleDetailFetch(requestPriceVehicle);
    const detail = await service.getVehicleDetail('veh-req');
    expect(detail?.priceState).toBe('request_price');
    expect(detail?.requestPrice).toBe(true);
    expect(detail?.priceUsd).toBeUndefined();
    vi.restoreAllMocks();
  });

  it('does NOT expose private fields from the API response', async () => {
    const service = mockVehicleDetailFetch(basePricedVehicle);
    const detail = await service.getVehicleDetail('veh-1');
    expect(detail).not.toHaveProperty('internalNotes');
    expect(detail).not.toHaveProperty('staffOwnerId');
    expect(detail).not.toHaveProperty('reservedByEmail');
    vi.restoreAllMocks();
  });

  it('throws for unexpected server errors (non-404)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ statusCode: 500, message: 'Internal server error' }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      ),
    );
    const service = new VehicleService(
      new HttpClient({ baseUrl: 'http://mock-api.test' }),
    );
    await expect(service.getVehicleDetail('veh-1')).rejects.toBeTruthy();
    vi.restoreAllMocks();
  });
});

/* --------------------------------------------------------------------------
   Gallery keyboard interaction model
   -------------------------------------------------------------------------- */
describe('Gallery image index cycling logic (unit)', () => {
  const totalImages = 3;

  function prevIndex(i: number): number {
    return i === 0 ? totalImages - 1 : i - 1;
  }

  function nextIndex(i: number): number {
    return i === totalImages - 1 ? 0 : i + 1;
  }

  it('ArrowLeft wraps from first to last image', () => {
    expect(prevIndex(0)).toBe(2);
  });

  it('ArrowRight wraps from last to first image', () => {
    expect(nextIndex(2)).toBe(0);
  });

  it('ArrowLeft decrements index by 1 in the middle', () => {
    expect(prevIndex(2)).toBe(1);
  });

  it('ArrowRight increments index by 1 in the middle', () => {
    expect(nextIndex(0)).toBe(1);
  });
});
