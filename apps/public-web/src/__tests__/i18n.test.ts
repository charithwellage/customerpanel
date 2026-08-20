import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider, useTranslation } from '../i18n/I18nContext';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { GoogleTranslateWidget } from '../i18n/GoogleTranslateWidget';

const TestConsumer: React.FC = () => {
  const { language, t, isRTL } = useTranslation();
  return React.createElement(
    'div',
    null,
    React.createElement('span', { 'data-testid': 'lang-display' }, language),
    React.createElement('span', { 'data-testid': 'home-label' }, t('nav.home')),
    React.createElement('span', { 'data-testid': 'rtl-display' }, isRTL ? 'RTL' : 'LTR')
  );
};

describe('Public Web i18n Provider & LanguageSwitcher', () => {
  it('renders default English translation in SSR', () => {
    const html = renderToString(
      React.createElement(
        I18nProvider,
        { initialLanguage: 'en' },
        React.createElement(TestConsumer, null),
        React.createElement(LanguageSwitcher, null),
        React.createElement(GoogleTranslateWidget, null)
      )
    );

    expect(html).toContain('en');
    expect(html).toContain('Home');
    expect(html).toContain('LTR');
    expect(html).toContain('data-testid="language-switcher"');
    expect(html).toContain('google_translate_element');
  });

  it('renders Japanese translation when initialLanguage is ja', () => {
    const html = renderToString(
      React.createElement(
        I18nProvider,
        { initialLanguage: 'ja' },
        React.createElement(TestConsumer, null)
      )
    );

    expect(html).toContain('ja');
    expect(html).toContain('ホーム');
    expect(html).toContain('LTR');
  });

  it('renders Arabic with RTL flag when initialLanguage is ar', () => {
    const html = renderToString(
      React.createElement(
        I18nProvider,
        { initialLanguage: 'ar' },
        React.createElement(TestConsumer, null)
      )
    );

    expect(html).toContain('ar');
    expect(html).toContain('الرئيسية');
    expect(html).toContain('RTL');
  });
});
