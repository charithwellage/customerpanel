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

let translateTimer: ReturnType<typeof setInterval> | null = null;

function applyGoogleTranslate(lang: LanguageCode) {
  if (typeof window === 'undefined') return;

  const tryApply = () => {
    // 1. Direct combo in page
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      if (lang === 'en') {
        select.value = '';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        select.value = lang;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }

    // 2. Iframe combo if embedded in frame
    const frames = document.querySelectorAll<HTMLIFrameElement>('iframe.goog-te-menu-frame, iframe.goog-te-banner-frame');
    for (const frame of Array.from(frames)) {
      try {
        const frameDoc = frame.contentDocument || frame.contentWindow?.document;
        if (frameDoc) {
          const frameSelect = frameDoc.querySelector<HTMLSelectElement>('.goog-te-combo');
          if (frameSelect) {
            frameSelect.value = lang === 'en' ? '' : lang;
            frameSelect.dispatchEvent(new Event('change', { bubbles: true }));
            frameSelect.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
          }
        }
      } catch {
        // Cross-origin safe
      }
    }
    return false;
  };

  if (!tryApply()) {
    if (translateTimer) clearInterval(translateTimer);
    let attempts = 0;
    translateTimer = setInterval(() => {
      attempts++;
      if (tryApply() || attempts >= 20) {
        if (translateTimer) clearInterval(translateTimer);
        translateTimer = null;
      }
    }, 150);
  }
}

function persistLanguage(lang: LanguageCode) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    const hostname = window.location.hostname;

    if (lang === 'en') {
      document.cookie = `${GOOGTRANS_COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT;SameSite=Lax`;
      if (hostname && hostname !== 'localhost' && !hostname.startsWith('127.')) {
        document.cookie = `${GOOGTRANS_COOKIE}=;path=/;domain=.${hostname};expires=Thu, 01 Jan 1970 00:00:00 GMT;SameSite=Lax`;
      }
    } else {
      document.cookie = `${GOOGTRANS_COOKIE}=/en/${lang};path=/;max-age=31536000;SameSite=Lax`;
      if (hostname && hostname !== 'localhost' && !hostname.startsWith('127.')) {
        document.cookie = `${GOOGTRANS_COOKIE}=/en/${lang};path=/;domain=.${hostname};max-age=31536000;SameSite=Lax`;
      }
    }

    // Set document lang & direction
    const info = getLanguageInfo(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = info.direction;

    // Trigger Google Translate widget immediately without page reload
    applyGoogleTranslate(lang);

    // Dispatch custom event for immediate component updates
    window.dispatchEvent(new CustomEvent('carchief:language-change', { detail: { language: lang } }));
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
    // Hydrate stored preference
    const stored = getStoredLanguage();
    if (stored !== language) {
      setLanguageState(stored);
    }
    const info = getLanguageInfo(stored);
    document.documentElement.lang = stored;
    document.documentElement.dir = info.direction;
    applyGoogleTranslate(stored);
  }, []);

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: LanguageCode }>;
      if (customEvent.detail?.language && customEvent.detail.language !== language) {
        setLanguageState(resolveLanguageCode(customEvent.detail.language));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const resolved = resolveLanguageCode(e.newValue);
        if (resolved !== language) {
          setLanguageState(resolved);
          applyGoogleTranslate(resolved);
        }
      }
    };

    window.addEventListener('carchief:language-change', handleLangChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('carchief:language-change', handleLangChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, [language]);

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
