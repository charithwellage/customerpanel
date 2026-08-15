import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.js';
import './app/globals.css';
import { applyCustomerTheme } from './theme.js';

applyCustomerTheme(document.documentElement, import.meta.env.VITE_THEME_ID);

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
