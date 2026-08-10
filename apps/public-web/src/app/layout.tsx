import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { getThemeCssVariables, getThemeDefinition, resolveThemeId } from '@carchief/theme';
import { ThemeSwitcher } from '../theme-switcher';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarChief | Japanese Used Vehicles',
  description: 'Find quality Japanese used vehicles with CarChief.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const themeId = resolveThemeId(process.env.NEXT_PUBLIC_THEME_ID);
  const themeVariables = getThemeCssVariables(getThemeDefinition(themeId).tokens) as CSSProperties;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  return <html lang="en" data-theme={themeId}><body style={themeVariables}>{isDevelopment ? <ThemeSwitcher initialThemeId={themeId} /> : null}{children}</body></html>;
}
