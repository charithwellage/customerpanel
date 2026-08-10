import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { getThemeCssVariables, getThemeDefinition, resolveThemeId } from '@carchief/theme';
import { ThemeSwitcher } from '../theme-switcher';
import { HeaderComponent, FooterComponent } from '../shell';
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

  return (
    <html lang="en" data-theme={themeId}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={themeVariables}>
        {isDevelopment ? <ThemeSwitcher initialThemeId={themeId} /> : null}
        <HeaderComponent />
        {children}
        <FooterComponent />
      </body>
    </html>
  );
}
