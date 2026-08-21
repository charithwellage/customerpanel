import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ServicesExperience, BORDER_LOGISTICS_DATA } from '../features/public-content/components/ServicesExperience';
import { PUBLIC_NAV_ITEMS } from '../shell/Header';

describe('Public Web Services Page & Navigation Integration (D02-P14-T004)', () => {
  it('includes the prominent SERVICES navigation item in global header items', () => {
    const servicesItem = PUBLIC_NAV_ITEMS.find((item) => item.label === 'SERVICES');
    expect(servicesItem).toBeDefined();
    expect(servicesItem?.href).toBe('/services');
  });

  it('renders the ServicesExperience hero section and fast-track shipping highlights', () => {
    const html = renderToStaticMarkup(React.createElement(ServicesExperience));

    expect(html).toContain('Global Vehicle Services');
    expect(html).toContain('Direct Buyer Solutions');
    expect(html).toContain('~2 Weeks');
    expect(html).toContain('Fast-Track Shipment (vs. 3-4 weeks normal)');
    expect(html).toContain('CarChief Warranty for Direct Buyers');
  });

  it('renders all four core service pillars with marketing copy', () => {
    const html = renderToStaticMarkup(React.createElement(ServicesExperience));

    // Pillar 1: Vehicle Fast-Track Shipment
    expect(html).toContain('Vehicle Shipment &amp; Fast-Track Logistics');
    expect(html).toContain('approximately two weeks, significantly faster than the normal 3 to 4 weeks');
    expect(html).toContain('major Japanese maritime carriers');

    // Pillar 2: Additional Services & Warranty
    expect(html).toContain('Additional Services &amp; CarChief Warranty');
    expect(html).toContain('Exclusive CarChief Warranty');
    expect(html).toContain('JAVIC, QISJ, EAA, and Veritas certification');
    expect(html).toContain('100% Marine Insurance');

    // Pillar 3: Destination Port Clearing Services
    expect(html).toContain('Destination Port Clearing Services');
    expect(html).toContain('Single Point of Contact');
    expect(html).toContain('certified local agents at destination ports');

    // Pillar 4: Border Delivery Logistics Network
    expect(html).toContain('Border Delivery Logistics &amp; Inland Partnerships');
    expect(html).toContain('Zimbabwe');
    expect(html).toContain('Zambia');
    expect(html).toContain('Botswana');
    expect(html).toContain('DR Congo');
  });

  it('verifies all required border logistics destination hubs for each target country', () => {
    const zimbabwe = BORDER_LOGISTICS_DATA.find((c) => c.country === 'Zimbabwe');
    expect(zimbabwe).toBeDefined();
    expect(zimbabwe?.destinations).toEqual(
      expect.arrayContaining(['Beitbridge', 'Chirundu', 'Harare', 'Nakonde', 'Plumtree', 'Tunduma'])
    );

    const zambia = BORDER_LOGISTICS_DATA.find((c) => c.country === 'Zambia');
    expect(zambia).toBeDefined();
    expect(zambia?.destinations).toEqual(
      expect.arrayContaining(['Chirundu', 'Lusaka', 'Ndola', 'Kabwe', 'Kitwe', 'Nakonde', 'Tunduma', 'Songwe', 'Kasumulu'])
    );

    const botswana = BORDER_LOGISTICS_DATA.find((c) => c.country === 'Botswana');
    expect(botswana).toBeDefined();
    expect(botswana?.destinations).toEqual(expect.arrayContaining(['Gaborone']));

    const drCongo = BORDER_LOGISTICS_DATA.find((c) => c.country === 'DR Congo');
    expect(drCongo).toBeDefined();
    expect(drCongo?.destinations).toEqual(
      expect.arrayContaining(['Chirundu', 'Kasumbalesa', 'Mokambo', 'Sakania'])
    );
  });
});
