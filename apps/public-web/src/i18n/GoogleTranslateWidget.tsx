'use client';

import React, { useEffect } from 'react';

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: any;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

export const GoogleTranslateWidget: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set callback
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ja,es,fr,sw,pt,ru,ar',
            autoDisplay: false,
            layout: window.google.translate.TranslateElement?.InlineLayout?.SIMPLE,
          },
          'google_translate_element'
        );
      }
    };

    // Load Google Translate script if not already present
    const existingScript = document.getElementById('google-translate-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        // Script blocked or offline, ignore safely
      };
      document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }} aria-hidden="true" />
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Suppress Google Translate top banner to prevent layout shifts (CLS) */
          .goog-te-banner-frame.skiptranslate,
          .goog-te-banner-frame {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
          }
          body {
            top: 0px !important;
          }
          .goog-te-gadget {
            font-size: 0px !important;
          }
          .goog-te-gadget span {
            display: none !important;
          }
          .goog-tooltip,
          .goog-tooltip:hover {
            display: none !important;
          }
          .goog-text-highlight {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
        `,
      }} />
    </>
  );
};
