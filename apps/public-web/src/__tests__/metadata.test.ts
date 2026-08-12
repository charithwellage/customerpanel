import { describe, expect, it, vi } from 'vitest';
import { metadata as homeMetadata } from '../app/page';
import { metadata as vehiclesMetadata } from '../app/vehicles/layout';
import { metadata as contactMetadata } from '../app/contact/page';
import { metadata as aboutMetadata } from '../app/about/page';
import { metadata as freightMetadata } from '../app/freight-calculator/page';
import { metadata as accountMetadata } from '../app/account/layout';
import { generateMetadata as generateVehicleDetailMetadata } from '../app/vehicles/[slug]/page';
import * as loadVehicleDetailModule from '../features/vehicle-detail/loadVehicleDetail';

describe('Public Route Metadata (PUB-11, DEC-PUB-SEO-SCOPE)', () => {
  it('exports valid metadata for the Home page', () => {
    expect(homeMetadata.title).toContain('CarChief');
    expect(homeMetadata.description).toBeDefined();
    expect(homeMetadata.openGraph?.title).toContain('CarChief');
    expect(homeMetadata.twitter?.card).toBe('summary_large_image');
  });

  it('exports valid metadata for the Vehicles search showroom', () => {
    expect(vehiclesMetadata.title).toContain('Inventory Search');
    expect(vehiclesMetadata.description).toContain('Japanese used vehicles');
    expect(vehiclesMetadata.alternates?.canonical).toBeDefined();
  });

  it('exports valid metadata for Contact and About content pages', () => {
    expect(contactMetadata.title).toContain('Contact Us');
    expect(aboutMetadata.title).toContain('About CarChief');
  });

  it('exports valid metadata for Freight Calculator', () => {
    expect(freightMetadata.title).toContain('Ocean Freight');
    expect(freightMetadata.description).toContain('freight shipping costs');
  });

  it('exports noindex metadata for private Account portal routes', () => {
    expect(accountMetadata.robots).toEqual({ index: false, follow: false });
  });

  it('generates dynamic metadata for vehicle detail pages', async () => {
    vi.spyOn(loadVehicleDetailModule, 'loadVehicleDetail').mockResolvedValueOnce({
      id: 'veh-1',
      chassisNumber: 'RAV4-001',
      slug: '2020-toyota-rav4-g-edition-trd-offroad',
      make: 'Toyota',
      model: 'RAV4',
      year: 2020,
      status: 'Available',
      priceState: 'priced',
      priceUsd: 28500,
      media: { gallery: ['https://example.com/rav4.jpg'], totalPicturesCount: 1 },
      locationStatus: 'In Japan',
      bodyStyle: 'SUV',
    });

    const meta = await generateVehicleDetailMetadata({
      params: Promise.resolve({ slug: '2020-toyota-rav4-g-edition-trd-offroad' }),
    });

    expect(meta.title).toContain('Toyota RAV4');
    expect(meta.description).toContain('Stock ID: 2020-toyota-rav4-g-edition-trd-offroad');
    expect(meta.alternates?.canonical).toContain('/vehicles/2020-toyota-rav4-g-edition-trd-offroad');
    expect(meta.openGraph?.title).toContain('Toyota RAV4');
  });

  it('returns fallback metadata for non-existent vehicle detail slugs', async () => {
    vi.spyOn(loadVehicleDetailModule, 'loadVehicleDetail').mockResolvedValueOnce(null);

    const meta = await generateVehicleDetailMetadata({
      params: Promise.resolve({ slug: 'non-existent-vehicle-slug' }),
    });

    expect(meta.title).toBe('Vehicle Not Found | CarChief');
    expect(meta.description).toContain('could not be found');
  });
});
