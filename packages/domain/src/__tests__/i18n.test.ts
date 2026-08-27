import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  getLanguageInfo,
  resolveLanguageCode,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from '../i18n.js';

describe('language metadata', () => {
  it('declares all supported offline locales and Arabic direction', () => {
    const expected: LanguageCode[] = ['en', 'ja', 'es', 'fr', 'sw', 'pt', 'ru', 'ar'];
    expect(SUPPORTED_LANGUAGES.map((language) => language.code)).toEqual(expected);
    expect(DEFAULT_LANGUAGE).toBe('en');
    expect(getLanguageInfo('ar').direction).toBe('rtl');
  });

  it('safely resolves untrusted locale input', () => {
    expect(resolveLanguageCode('ja')).toBe('ja');
    expect(resolveLanguageCode('invalid')).toBe('en');
    expect(resolveLanguageCode(undefined)).toBe('en');
  });
});
