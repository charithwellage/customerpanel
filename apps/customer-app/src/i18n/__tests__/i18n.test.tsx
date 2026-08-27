import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider, useTranslation } from '../I18nContext.js';
import { CustomerLanguageSwitcher } from '../LanguageSwitcher.js';

const TestCustomerConsumer: React.FC = () => {
  const { language, t } = useTranslation();
  return (
    <div>
      <span data-testid="cust-lang">{language}</span>
      <span data-testid="dashboard-label">{t('customer.dashboard')}</span>
      <span data-testid="inventory-label">{t('customer.inventory')}</span>
    </div>
  );
};

describe('Customer App i18n & Language Switcher', () => {
  it('renders English strings by default', () => {
    const html = renderToString(
      <I18nProvider initialLanguage="en">
        <TestCustomerConsumer />
        <CustomerLanguageSwitcher />
      </I18nProvider>
    );

    expect(html).toContain('en');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Search Stock');
    expect(html).toContain('data-testid="customer-language-switcher"');
    expect(html).not.toContain('google_translate');
  });

  it('renders Spanish strings when initialLanguage is es', () => {
    const html = renderToString(
      <I18nProvider initialLanguage="es">
        <TestCustomerConsumer />
      </I18nProvider>
    );

    expect(html).toContain('es');
    expect(html).toContain('Panel');
    expect(html).toContain('Buscar stock');
  });

  it('renders Swahili strings when initialLanguage is sw', () => {
    const html = renderToString(
      <I18nProvider initialLanguage="sw">
        <TestCustomerConsumer />
      </I18nProvider>
    );

    expect(html).toContain('sw');
    expect(html).toContain('Dashibodi');
    expect(html).toContain('Tafuta stoku');
  });
});
