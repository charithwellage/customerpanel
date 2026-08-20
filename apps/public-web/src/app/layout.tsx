import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { getThemeCssVariables, getThemeDefinition, resolveThemeId } from '@carchief/theme';
import { ThemeSwitcher } from '../theme-switcher';
import { HeaderComponent, FooterComponent } from '../shell';
import { I18nProvider, GoogleTranslateWidget } from '../i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'CarChief | Japanese Used Vehicles',
  description: 'Find quality Japanese used vehicles with CarChief.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg',
  },
};

/**
 * The dev-only ThemeSwitcher must never render in a production build
 * (RULE-08, RULE-10). Exported as a plain predicate — rather than left as an
 * inline conditional — so production-guard tests can assert against the
 * real check instead of a hand-rolled literal.
 */
export function isThemeSwitcherEnabled(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv !== 'production';
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const themeId = resolveThemeId(process.env.NEXT_PUBLIC_THEME_ID);
  const themeVariables = getThemeCssVariables(getThemeDefinition(themeId).tokens) as CSSProperties;
  const isDevelopment = isThemeSwitcherEnabled();

  return (
    <html lang="en" data-theme={themeId} style={themeVariables}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>
          {isDevelopment ? <ThemeSwitcher initialThemeId={themeId} /> : null}
          <HeaderComponent />
          {children}
          <FooterComponent />
          <GoogleTranslateWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
