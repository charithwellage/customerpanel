import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import i18next, { type i18n as I18nInstance } from 'i18next';
import { I18nextProvider, initReactI18next, useTranslation as useReactI18nextTranslation } from 'react-i18next';
import {
  DEFAULT_LANGUAGE,
  getLanguageInfo,
  resolveLanguageCode,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type LanguageInfo,
} from '@carchief/domain';
import { resources } from './resources.js';

export { DEFAULT_LANGUAGE, getLanguageInfo, resolveLanguageCode, SUPPORTED_LANGUAGES } from '@carchief/domain';
export type { LanguageCode, LanguageInfo } from '@carchief/domain';

const STORAGE_KEY = 'carchief_lang';
const COOKIE_KEY = 'carchief_lang';

export interface TranslationParams {
  [key: string]: string | number | undefined;
}

export interface CarChiefI18nContextValue {
  language: LanguageCode;
  languageInfo: LanguageInfo;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, params?: TranslationParams, defaultText?: string) => string;
  isRTL: boolean;
  supportedLanguages: readonly LanguageInfo[];
}

function getStoredLanguage(initialLanguage?: LanguageCode): LanguageCode {
  if (typeof window === 'undefined') return initialLanguage ?? DEFAULT_LANGUAGE;
  try {
    return resolveLanguageCode(window.localStorage.getItem(STORAGE_KEY) ?? initialLanguage);
  } catch {
    return initialLanguage ?? DEFAULT_LANGUAGE;
  }
}

function persistLanguage(language: LanguageCode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.cookie = `${COOKIE_KEY}=${language};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    // Storage may be unavailable in private browsing contexts.
  }
}

function updateDocumentLanguage(language: LanguageCode): void {
  if (typeof document === 'undefined') return;
  const info = getLanguageInfo(language);
  document.documentElement.lang = language;
  document.documentElement.dir = info.direction;
}

export function createI18n(language: LanguageCode = DEFAULT_LANGUAGE): I18nInstance {
  const instance = i18next.createInstance();
  void instance.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: ['common'],
    keySeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
  });
  return instance;
}

export interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: LanguageCode;
  onLanguageChange?: (language: LanguageCode) => void;
}

export function I18nProvider({ children, initialLanguage, onLanguageChange }: I18nProviderProps): React.ReactElement {
  const [language, setLanguageState] = useState<LanguageCode>(() => getStoredLanguage(initialLanguage));
  const instanceRef = useRef<I18nInstance | null>(null);
  if (!instanceRef.current) instanceRef.current = createI18n(language);
  const instance = instanceRef.current;

  useEffect(() => {
    updateDocumentLanguage(language);
    void instance.changeLanguage(language);
  }, [instance, language]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) setLanguageState(resolveLanguageCode(event.newValue));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    const resolved = resolveLanguageCode(nextLanguage);
    persistLanguage(resolved);
    setLanguageState(resolved);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('carchief:locale-changed', { detail: { language: resolved } }));
    }
    onLanguageChange?.(resolved);
  }, [onLanguageChange]);

  const value = useMemo<CarChiefI18nContextValue>(() => ({
    language,
    languageInfo: getLanguageInfo(language),
    setLanguage,
    t: (key, params, defaultText) => instance.t(key, { ...params, defaultValue: defaultText ?? key }),
    isRTL: getLanguageInfo(language).direction === 'rtl',
    supportedLanguages: SUPPORTED_LANGUAGES,
  }), [instance, language, setLanguage]);

  return <I18nextProvider i18n={instance}><CarChiefI18nContext.Provider value={value}>{children}</CarChiefI18nContext.Provider></I18nextProvider>;
}

const CarChiefI18nContext = React.createContext<CarChiefI18nContextValue | null>(null);

export function useTranslation(): CarChiefI18nContextValue {
  const context = React.useContext(CarChiefI18nContext);
  const { i18n } = useReactI18nextTranslation();
  if (context) return context;
  const language = resolveLanguageCode(i18n.language);
  return {
    language,
    languageInfo: getLanguageInfo(language),
    setLanguage: () => undefined,
    t: (key, params, defaultText) => i18n.t(key, { ...params, defaultValue: defaultText ?? key }),
    isRTL: getLanguageInfo(language).direction === 'rtl',
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

export function formatCurrency(value: number, currency = 'USD', language: LanguageCode = DEFAULT_LANGUAGE): string {
  return new Intl.NumberFormat(language, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function formatNumber(value: number, language: LanguageCode = DEFAULT_LANGUAGE): string {
  return new Intl.NumberFormat(language).format(value);
}

export function formatPercentage(value: number, language: LanguageCode = DEFAULT_LANGUAGE): string {
  return new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 }).format(value / 100);
}

export function formatDate(value: string | Date, language: LanguageCode = DEFAULT_LANGUAGE, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(language, options).format(new Date(value));
}
