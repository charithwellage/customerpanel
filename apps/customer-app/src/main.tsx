import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App.js';
import './app/globals.css';
import { applyCustomerTheme } from './theme.js';

// Polyfill crypto.randomUUID for non-secure HTTP contexts (e.g. LAN access via IP)
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (typeof window.crypto.randomUUID !== 'function') {
    window.crypto.randomUUID = function () {
      return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (
          Number(c) ^
          ((window.crypto && typeof window.crypto.getRandomValues === 'function'
            ? window.crypto.getRandomValues(new Uint8Array(1))[0]
            : Math.floor(Math.random() * 256)) &
            (15 >> (Number(c) / 4)))
        ).toString(16)
      ) as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}

const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('carchief_theme_mode') === 'midnight') ? 'midnight' : 'daylight';
applyCustomerTheme(document.documentElement, import.meta.env.VITE_THEME_ID, savedMode);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Ignore registration errors during local sandboxed testing
    });
  });
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
