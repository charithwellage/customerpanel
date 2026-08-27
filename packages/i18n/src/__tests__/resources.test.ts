import { describe, expect, it } from 'vitest';
import { resources } from '../resources.js';

describe('offline localization resources', () => {
  it('has a non-empty translation for every English common key in every locale', () => {
    const englishKeys = Object.keys(resources.en.common).sort();
    for (const [language, namespaces] of Object.entries(resources)) {
      const keys = Object.keys(namespaces.common).sort();
      expect(keys, `${language} key parity`).toEqual(englishKeys);
      for (const key of keys) {
        expect(namespaces.common[key as keyof typeof namespaces.common].trim(), `${language}.${key}`).not.toHaveLength(0);
      }
    }
  });
});
