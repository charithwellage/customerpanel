/** Shared language metadata. UI resources live in @carchief/i18n. */
export type LanguageCode = 'en' | 'ja' | 'es' | 'fr' | 'sw' | 'pt' | 'ru' | 'ar';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: readonly LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'sw', label: 'Swahili', nativeLabel: 'Kiswahili', flag: '🇰🇪', direction: 'ltr' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹', direction: 'ltr' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺', direction: 'ltr' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇦🇪', direction: 'rtl' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function resolveLanguageCode(code: unknown): LanguageCode {
  return typeof code === 'string' && SUPPORTED_LANGUAGES.some((language) => language.code === code)
    ? code as LanguageCode
    : DEFAULT_LANGUAGE;
}

export function getLanguageInfo(code: LanguageCode): LanguageInfo {
  return SUPPORTED_LANGUAGES.find((language) => language.code === code) ?? SUPPORTED_LANGUAGES[0]!;
}
