import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContentPageTemplate } from '../features/public-content/components/ContentPageTemplate.js';
import { ContactPageContent } from '../features/public-content/components/ContactPageContent.js';
import { BranchPageContent } from '../features/public-content/components/BranchPageContent.js';
import { PrivacyPageContent } from '../features/public-content/components/PrivacyPageContent.js';
import type { BranchContent, OfficeLocation } from '@carchief/domain';

const mockOffice: OfficeLocation = {
  id: 'off-1',
  name: 'Tokyo Head Office',
  city: 'Tokyo',
  country: 'Japan',
  address: 'Chiyoda-ku, Tokyo 100-0001, Japan',
  phone: '+81 3 1234 5678',
  email: 'japan@carchief.com',
  operatingHours: 'Mon-Fri 09:00 - 18:00 JST',
  isPrimary: true,
  status: 'approved',
};

const mockBranch: BranchContent = {
  id: 'harare-hub',
  name: 'Harare Hub',
  code: 'HRE',
  destinationPort: 'Durban',
  introduction: 'CarChief Harare Hub connects buyers in Zimbabwe.',
  welcomeBanner: 'Welcome to CarChief Harare Hub',
  contactBanner: 'Contact our Harare specialists today',
  teamMembers: [
    { name: 'Tendai Mutasa', role: 'Branch Manager', contactEmail: 't.mutasa@carchief.com' },
  ],
  meetAndGreetInfo: 'Visit our office for in-person consultation.',
  contactDetails: {
    phone: '+263 24 2123456',
    email: 'harare@carchief.com',
    address: 'Sam Nujoma St, Harare',
    hours: 'Mon-Fri 08:30 - 16:30 CAT',
  },
  contentOwner: 'BranchTeam',
  status: 'approved',
};

describe('Public Content Pages Component Suite (D01-P07-T002)', () => {
  describe('ContentPageTemplate', () => {
    it('renders title, badge, summary, and sections cleanly', () => {
      const html = renderToStaticMarkup(
        React.createElement(ContentPageTemplate, {
          title: 'About CarChief',
          subtitle: 'Leading Japanese vehicle export specialist.',
          badge: 'Company Info',
          owner: 'ExecutiveTeam',
          sections: [{ title: 'Our Mission', content: 'Delivering transparent vehicle purchasing.' }],
        })
      );

      expect(html).toContain('About CarChief');
      expect(html).toContain('Leading Japanese vehicle export specialist.');
      expect(html).toContain('Company Info');
      expect(html).toContain('Owner: ExecutiveTeam');
      expect(html).toContain('Our Mission');
      expect(html).toContain('Delivering transparent vehicle purchasing.');
    });

    it('renders loading state with polite ARIA live region', () => {
      const html = renderToStaticMarkup(
        React.createElement(ContentPageTemplate, {
          title: 'Loading Test',
          isLoading: true,
        })
      );

      expect(html).toContain('role="status"');
      expect(html).toContain('Loading content...');
    });

    it('renders safe unavailable recovery state with alert role when page is unavailable', () => {
      const html = renderToStaticMarkup(
        React.createElement(ContentPageTemplate, {
          title: 'Shipping Schedule',
          isUnavailable: true,
          unavailableMessage: 'Schedule currently being updated.',
        })
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('Content Unavailable');
      expect(html).toContain('Schedule currently being updated.');
      expect(html).toContain('href="/contact"');
    });
  });

  describe('ContactPageContent', () => {
    it('renders global support info and office locations', () => {
      const html = renderToStaticMarkup(
        React.createElement(ContactPageContent, {
          offices: [mockOffice],
        })
      );

      expect(html).toContain('Global Customer Support');
      expect(html).toContain('Tokyo Head Office');
      expect(html).toContain('Headquarters');
      expect(html).toContain('Chiyoda-ku, Tokyo 100-0001, Japan (placeholder — pending approval)');
      expect(html).toContain('+81 3 1234 5678 (placeholder — pending approval)');
      expect(html).toContain('japan@carchief.com (placeholder — pending approval)');
      expect(html).toContain('support@carchief.com (placeholder — pending approval)');
      expect(html).toContain('Contact via WhatsApp');
    });

    it('renders empty office state when no offices are listed', () => {
      const html = renderToStaticMarkup(
        React.createElement(ContactPageContent, {
          offices: [],
        })
      );

      expect(html).toContain('No regional office locations currently listed.');
    });
  });

  describe('BranchPageContent', () => {
    it('renders branch identity, banners, team members, contact details, and vehicle collection titles', () => {
      const html = renderToStaticMarkup(
        React.createElement(BranchPageContent, {
          branch: mockBranch,
          latestArrivals: [],
          recentlyDiscounted: [],
        })
      );

      expect(html).toContain('Harare Hub');
      expect(html).toContain('Code: HRE');
      expect(html).toContain('Welcome to CarChief Harare Hub');
      expect(html).toContain('Tendai Mutasa');
      expect(html).toContain('Branch Manager');
      expect(html).toContain('Sam Nujoma St, Harare');

      expect(html).toContain('Latest Arrivals for Durban');
      expect(html).toContain('Recently Discounted for Durban');
    });

    it('renders unavailable branch recovery alert when branch is null', () => {
      const html = renderToStaticMarkup(
        React.createElement(BranchPageContent, {
          branch: null,
          isUnavailable: true,
        })
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain('Branch Information Unavailable');
    });
  });

  describe('PrivacyPageContent', () => {
    it('renders cookie preference section and essential/all consent buttons', () => {
      const html = renderToStaticMarkup(
        React.createElement(PrivacyPageContent, {
          title: 'Privacy & Cookie Policy',
        })
      );

      expect(html).toContain('Cookie Preferences &amp; Consent Choice');
      expect(html).toContain('Essential Cookies Only');
      expect(html).toContain('Accept All Cookies');
    });
  });
});
