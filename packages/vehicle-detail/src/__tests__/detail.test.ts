import { describe, it, expect } from 'vitest';
import {
  formatVehicleTitle,
  isVehicleAvailable,
  getEffectivePrice,
  getVisibleGalleryImages,
  serializeJsonLd,
  type VehicleDetail,
  type CategorizedPublicMedia,
} from '../index.js';

describe('serializeJsonLd', () => {
  it('escapes a </script> breakout attempt in vehicle-supplied text', () => {
    const payload = { name: 'Toyota</script><script>alert(1)</script>' };
    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toContain('</script>');
    expect(serialized).not.toContain('<script>');
    expect(serialized).toContain('\\u003c');
  });

  it('escapes angle brackets and ampersands without changing the parsed value', () => {
    const payload = { name: 'A & B <tag>', nested: { note: '5 > 3' } };
    const serialized = serializeJsonLd(payload);

    expect(serialized).not.toMatch(/[<>&]/);
    expect(JSON.parse(serialized)).toEqual(payload);
  });

  it('round-trips an ordinary payload unchanged', () => {
    const payload = { '@type': 'Vehicle', name: '2021 Toyota Corolla Axio', price: 8500 };
    expect(JSON.parse(serializeJsonLd(payload))).toEqual(payload);
  });
});

describe('Vehicle Detail Package Unit Tests', () => {
  it('formats vehicle title correctly', () => {
    expect(formatVehicleTitle({ year: 2021, make: 'Toyota', model: 'Corolla' })).toBe('2021 Toyota Corolla');
  });

  it('selects gallery images from public media fallback categories when gallery is empty', () => {
    const media: CategorizedPublicMedia = {
      gallery: [],
      auctionPictures: ['https://example.com/auction1.jpg'],
      japanPictures: ['https://example.com/japan1.jpg'],
      durbanPictures: ['https://example.com/durban1.jpg'],
      showAuctionPictures: false,
      showJapanPictures: true,
      showDurbanPictures: true,
      totalPicturesCount: 3,
    };

    expect(getVisibleGalleryImages(media)).toEqual(['https://example.com/japan1.jpg']);
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

  it('selects gallery images from allowed media categories when gallery is empty', () => {
    const media: CategorizedPublicMedia = {
      gallery: [],
      auctionPictures: ['https://example.com/auction1.jpg'],
      auctionSheet: [],
      japanPictures: ['https://example.com/japan1.jpg'],
      durbanPictures: ['https://example.com/durban1.jpg'],
      showAuctionPictures: false,
      showJapanPictures: true,
      showDurbanPictures: true,
      totalPicturesCount: 3,
    };

    expect(getVisibleGalleryImages(media)).toEqual(['https://example.com/japan1.jpg']);
  });
});
