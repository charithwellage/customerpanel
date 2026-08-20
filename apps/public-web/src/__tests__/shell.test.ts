import { describe, it, expect } from 'vitest';
import { renderLayoutShellConfig, PUBLIC_NAV_ITEMS } from '../index.js';
import { renderPublicPage } from '../server.js';

describe('Public Web Shell Layout & Navigation Tests', () => {
  it('renders complete landmark structure with skip link, header, main, and footer', () => {
    const config = renderLayoutShellConfig({ activePath: '/inventory' });
    expect(config.landmarks.skipLink.label).toBe('Skip to main content');
    expect(config.landmarks.header.siteName).toBe('CarChief');
    expect(config.landmarks.main.id).toBe('main-content');
    expect(config.landmarks.footer.copyright).toContain('CarChief');
    expect(config.themeVariables).toHaveProperty('--color-primary');
  });

  it('includes mandatory public route navigation items', () => {
    const labels = PUBLIC_NAV_ITEMS.map((item) => item.label);
    expect(labels).toContain('SHOWROOM');
    expect(labels).toContain('ALL STOCK');
    expect(labels).toContain('Clearance Stock');
    expect(PUBLIC_NAV_ITEMS.find((item) => item.label === 'Clearance Stock')?.href).toBe('/clearance-stock');
    expect(labels).toContain('HOW TO BUY');
    expect(labels).toContain('ABOUT US');
    expect(labels).toContain('TESTIMONIALS');
    expect(labels).toContain('FAQ');
    expect(labels).toContain('CONTACT');
  });

  it('configures navigation drawer accessible modal properties when open', () => {
    const config = renderLayoutShellConfig({ isMobileDrawerOpen: true });
    expect(config.landmarks.drawer.isOpen).toBe(true);
    expect(config.landmarks.drawer.role).toBe('dialog');
    expect(config.landmarks.drawer.ariaModal).toBe(true);
  });

  it('renders a browser-ready public page with vehicle content and responsive search controls', () => {
    const html = renderPublicPage([{ id: 'veh-1', make: 'Toyota', model: 'Corolla', year: 2021, priceUsd: 8500, status: 'Available' }]);
    expect(html).toContain('CarChief');
    expect(html).toContain('Toyota Corolla');
    expect(html).toContain('vehicle-search');
    expect(html).toContain('manifest.webmanifest');
  });
});
