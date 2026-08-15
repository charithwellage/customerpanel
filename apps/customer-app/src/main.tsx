import React from 'react';
import { createRoot } from 'react-dom/client';
import { getThemeCssVariables, getThemeDefinition, resolveThemeId } from '@carchief/theme';
import { App } from './app/App.js';
import './app/globals.css';

/**
 * Applies the resolved semantic theme to the document root, mirroring what
 * `apps/public-web/src/app/layout.tsx` does on `<html>`. The values are runtime
 * configuration read from `packages/theme`, never literal colours, and an
 * unknown `VITE_THEME_ID` resolves to the approved `carchief` default.
 */
function applyTheme(): void {
  const themeId = resolveThemeId(import.meta.env.VITE_THEME_ID);
  const root = document.documentElement;
  root.setAttribute('data-theme', themeId);
  for (const [name, value] of Object.entries(getThemeCssVariables(getThemeDefinition(themeId).tokens))) {
    root.style.setProperty(name, value);
  }
}

applyTheme();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js', { scope: '/' });
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Customer app mount point #root is missing from index.html');
}

createRoot(container).render(
  <React.StrictMode>
    <App apiBaseUrl={import.meta.env.VITE_API_BASE_URL ?? ''} />
  </React.StrictMode>,
);
