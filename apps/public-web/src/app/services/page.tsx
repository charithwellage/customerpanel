import React from 'react';
import type { Metadata } from 'next';
import { ServicesExperience } from '../../features/public-content/components/ServicesExperience';
import '../../features/public-content/services.css';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Company Services, Fast-Track Shipping & Border Clearing | CarChief',
  description:
    'Explore CarChief auto export services: 2-week fast-track shipment, certified pre-shipment inspections, exclusive direct buyer warranty, destination port clearance, and inland border delivery.',
};

export default function ServicesPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <ServicesExperience />
    </main>
  );
}

