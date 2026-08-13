import React from 'react';
import type { Metadata } from 'next';
import { AboutUsExperience } from '../../features/public-content/components/AboutUsExperience';
import '../../features/public-content/about-us.css';

export const metadata: Metadata = {
  title: 'About CarChief | Welcome to CarChief',
  description:
    'Premier global automotive curators and logistics broker network, specializing in seamless intercontinental vehicle export and dealer empowerment.',
};

export default function AboutPage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <AboutUsExperience />
    </main>
  );
}
