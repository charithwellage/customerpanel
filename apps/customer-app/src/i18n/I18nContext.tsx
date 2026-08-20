import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  type LanguageCode,
  type LanguageInfo,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  translateKey,
  resolveLanguageCode,
  getLanguageInfo,
} from '@carchief/domain';

export interface I18nContextValue {
  language: LanguageCode;
  languageInfo: LanguageInfo;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>, defaultText?: string) => string;
  isRTL: boolean;
  supportedLanguages: LanguageInfo[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'carchief_lang';
const GOOGTRANS_COOKIE = 'googtrans';

function getStoredLanguage(): LanguageCode {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return resolveLanguageCode(saved);

    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    if (match && match[1]) {
      return resolveLanguageCode(match[1]);
    }
  } catch {
    // Ignore storage access errors
  }
  return DEFAULT_LANGUAGE;
}

function persistLanguage(lang: LanguageCode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    const hostname = window.location.hostname;
    document.cookie = `${GOOGTRANS_COOKIE}=/en/${lang};path=/;max-age=31536000;SameSite=Lax`;
    if (hostname && hostname !== 'localhost' && !hostname.startsWith('127.')) {
      document.cookie = `${GOOGTRANS_COOKIE}=/en/${lang};path=/;domain=.${hostname};max-age=31536000;SameSite=Lax`;
    }

    const info = getLanguageInfo(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = info.direction;

    const googleSelect = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (googleSelect) {
      googleSelect.value = lang;
      googleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch {
    // Ignore storage/cookie access errors
  }
}

export interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: LanguageCode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return initialLanguage ? resolveLanguageCode(initialLanguage) : getStoredLanguage();
  });

  useEffect(() => {
    const stored = getStoredLanguage();
    if (stored !== language) {
      setLanguageState(stored);
    }
    const info = getLanguageInfo(stored);
    document.documentElement.lang = stored;
    document.documentElement.dir = info.direction;
  }, []);

  const setLanguage = useCallback((newLang: LanguageCode) => {
    const resolved = resolveLanguageCode(newLang);
    setLanguageState(resolved);
    persistLanguage(resolved);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>, defaultText?: string) => {
      return translateKey(language, key, params, defaultText);
    },
    [language]
  );

  const languageInfo = getLanguageInfo(language);
  const isRTL = languageInfo.direction === 'rtl';

  return (
    <I18nContext.Provider
      value={{
        language,
        languageInfo,
        setLanguage,
        t,
        isRTL,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    const language = DEFAULT_LANGUAGE;
    const languageInfo = getLanguageInfo(language);
    return {
      language,
      languageInfo,
      setLanguage: () => {},
      t: (key, params, defaultText) => translateKey(language, key, params, defaultText),
      isRTL: false,
      supportedLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
