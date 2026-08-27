import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.js';
import './app/globals.css';
import { applyCustomerTheme } from './theme.js';

const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('carchief_theme_mode') === 'midnight') ? 'midnight' : 'daylight';
applyCustomerTheme(document.documentElement, import.meta.env.VITE_THEME_ID, savedMode);

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
