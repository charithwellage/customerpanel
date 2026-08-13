import React from 'react';
import type { Metadata } from 'next';
import { HowToBuyExperience } from '../../features/public-content/components/HowToBuyExperience';
import '../../features/public-content/how-to-buy.css';

export const metadata: Metadata = {
  title: 'How to Buy | 5 Easy Steps to Buy Vehicles & Machinery',
  description:
    'Excellent Quality & Well Inspected Cars, Vans, Trucks, Buses & Construction Machinery available in stock ready to Export. 5 Easy Steps Guide.',
};

export default function HowToBuyPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <HowToBuyExperience />
    </main>
  );
}
