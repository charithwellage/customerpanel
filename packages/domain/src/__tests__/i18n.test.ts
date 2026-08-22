import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  TRANSLATION_DICTIONARIES,
  formatTranslation,
  translateKey,
  CUSTOMER_APP_TRANSLATIONS,
  resolveLanguageCode,
  getLanguageInfo,
  type LanguageCode,
} from '../i18n.js';

describe('Domain i18n & Globalization Catalog', () => {
  it('covers customer-app UI keys for every supported language', () => {
    const keys = Object.keys(CUSTOMER_APP_TRANSLATIONS.en);
    expect(keys.length).toBeGreaterThan(0);
    for (const language of SUPPORTED_LANGUAGES) {
      for (const key of keys) {
        expect(translateKey(language.code, key)).not.toBe(key);
      }
    }
  });

  it('defines the required primary language codes and metadata', () => {
    const expectedCodes: LanguageCode[] = ['en', 'ja', 'es', 'fr', 'sw', 'pt', 'ru', 'ar'];
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(expectedCodes);
    expect(DEFAULT_LANGUAGE).toBe('en');

    // Arabic must be rtl, others ltr
    const arabic = getLanguageInfo('ar');
    expect(arabic.direction).toBe('rtl');
    expect(arabic.nativeLabel).toBe('العربية');

    const japanese = getLanguageInfo('ja');
    expect(japanese.direction).toBe('ltr');
    expect(japanese.nativeLabel).toBe('日本語');

    const swahili = getLanguageInfo('sw');
    expect(swahili.nativeLabel).toBe('Kiswahili');
  });

  it('safely resolves language codes with default fallback', () => {
    expect(resolveLanguageCode('ja')).toBe('ja');
    expect(resolveLanguageCode('es')).toBe('es');
    expect(resolveLanguageCode('invalid_lang')).toBe('en');
    expect(resolveLanguageCode(null)).toBe('en');
    expect(resolveLanguageCode(undefined)).toBe('en');
  });

  it('formats translation templates with parameters', () => {
    expect(formatTranslation('Hello {name}!', { name: 'Kenji' })).toBe('Hello Kenji!');
    expect(formatTranslation('Total: {count} cars', { count: 42 })).toBe('Total: 42 cars');
    expect(formatTranslation('No params')).toBe('No params');
    expect(formatTranslation('Missing {foo} param', {})).toBe('Missing {foo} param');
  });

  it('translates static keys across all supported dictionaries', () => {
    const keysToCheck = [
      'header.login',
      'header.register',
      'nav.home',
      'nav.inventory',
      'nav.services',
      'nav.howToBuy',
      'action.getQuote',
      'action.addToWishlist',
      'customer.dashboard',
      'compliance.bannerTitle',
    ];

    for (const lang of SUPPORTED_LANGUAGES) {
      for (const key of keysToCheck) {
        const translated = translateKey(lang.code, key);
        expect(translated).toBeDefined();
        expect(translated.length).toBeGreaterThan(0);
        expect(translated).not.toBe(key); // Must not return raw key
      }
    }
  });

  it('falls back to English when a key is missing in a foreign language dictionary', () => {
    // Inject test key check
    const englishVal = translateKey('en', 'header.searchPlaceholder');
    expect(englishVal).toBe('Search by make, model, stock # or keywords...');

    // If key does not exist anywhere, returns defaultText or raw key
    expect(translateKey('ja', 'non_existent_key', undefined, 'Fallback Text')).toBe('Fallback Text');
    expect(translateKey('ja', 'non_existent_key')).toBe('non_existent_key');
  });

  it('ensures every language dictionary contains essential navigation and header keys', () => {
    const requiredKeys = [
      'header.searchPlaceholder',
      'header.searchButton',
      'header.login',
      'header.register',
      'nav.home',
      'nav.inventory',
      'nav.services',
      'nav.howToBuy',
      'action.getQuote',
      'customer.dashboard',
      'customer.logout',
      'compliance.bannerTitle',
    ];

    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATION_DICTIONARIES[lang.code];
      expect(dict).toBeDefined();
      for (const reqKey of requiredKeys) {
        expect(dict[reqKey]).toBeDefined();
        expect(dict[reqKey]!.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
