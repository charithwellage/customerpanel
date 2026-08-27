'use client';

/** Public-web compatibility boundary for the shared offline i18n package. */
export {
  I18nProvider,
  useTranslation,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercentage,
} from '@carchief/i18n';
export type { CarChiefI18nContextValue as I18nContextValue, I18nProviderProps } from '@carchief/i18n';
