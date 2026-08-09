import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { defaultSemanticTheme, getThemeCssVariables } from '@carchief/theme';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarChief | Japanese Used Vehicles',
  description: 'Find quality Japanese used vehicles with CarChief.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const themeVariables = getThemeCssVariables(defaultSemanticTheme) as CSSProperties;
  return <html lang="en" data-theme="carchief"><body style={themeVariables}>{children}</body></html>;
}
