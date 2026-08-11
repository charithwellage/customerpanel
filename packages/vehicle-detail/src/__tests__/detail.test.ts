import { describe, it, expect } from 'vitest';
import { formatVehicleTitle, isVehicleAvailable, getEffectivePrice, type VehicleDetail } from '../index.js';

describe('Vehicle Detail Package Unit Tests', () => {
  it('formats vehicle title correctly', () => {
    expect(formatVehicleTitle({ year: 2021, make: 'Toyota', model: 'Corolla' })).toBe('2021 Toyota Corolla');
  });

  it('checks vehicle availability status', () => {
    expect(isVehicleAvailable('Available')).toBe(true);
    expect(isVehicleAvailable('Sold')).toBe(false);
    expect(isVehicleAvailable('Reserved')).toBe(false);
  });

  it('formats effective price for priced vs price-request vehicles', () => {
    const pricedVehicle: VehicleDetail = {
      id: 'v1',
      chassisNumber: 'CH123',
      slug: '2021-toyota-corolla-v1',
      make: 'Toyota',
      model: 'Corolla',
      year: 2021,
      status: 'Available',
      priceState: 'priced',
      priceUsd: 10000,
      requestPrice: false,
      discountedPriceUsd: 9500,
      media: { gallery: [], totalPicturesCount: 0 },
    };
    expect(getEffectivePrice(pricedVehicle)).toEqual({ priceText: '$9,500', isRequestPrice: false });

    const requestPriceVehicle: VehicleDetail = {
      id: 'v2',
      chassisNumber: 'CH456',
      slug: '2022-lexus-rx-v2',
      make: 'Lexus',
      model: 'RX',
      year: 2022,
      status: 'Available',
      priceState: 'request_price',
      requestPrice: true,
      media: { gallery: [], totalPicturesCount: 0 },
    };
    expect(getEffectivePrice(requestPriceVehicle)).toEqual({ priceText: 'Request Price', isRequestPrice: true });
  });
});
