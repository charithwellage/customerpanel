import { describe, it, expect } from 'vitest';
import { renderLayoutShellConfig, PUBLIC_NAV_ITEMS } from '../index.js';

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
    expect(labels).toContain('Home');
    expect(labels).toContain('Inventory');
    expect(labels).toContain('How to Buy');
    expect(labels).toContain('About Us');
    expect(labels).toContain('Contact Us');
  });

  it('configures navigation drawer accessible modal properties when open', () => {
    const config = renderLayoutShellConfig({ isMobileDrawerOpen: true });
    expect(config.landmarks.drawer.isOpen).toBe(true);
    expect(config.landmarks.drawer.role).toBe('dialog');
    expect(config.landmarks.drawer.ariaModal).toBe(true);
  });
});
