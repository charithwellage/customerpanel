import { describe, it, expect } from 'vitest';
import { issueSessionToken, parseSessionToken, hasPermission } from '../auth.js';
import { COUNTRIES, findCountryByIsoCode, resolveDialCode } from '../countries.js';

describe('Domain Auth & Session Token Utilities', () => {
  it('issues and parses session tokens with claims', () => {
    const token = issueSessionToken('Salesperson', 'sales-1', 'sales@carchief.com');
    const claims = parseSessionToken(token);
    expect(claims?.role).toBe('Salesperson');
    expect(claims?.sub).toBe('sales-1');
    expect(claims?.email).toBe('sales@carchief.com');
    expect(claims?.permissions).toContain('read:leads');
  });

  it('checks role permissions correctly', () => {
    expect(hasPermission('PublicVisitor', 'read:public')).toBe(true);
    expect(hasPermission('PublicVisitor', 'reset:data')).toBe(false);
    expect(hasPermission('SystemAdmin', 'reset:data')).toBe(true);
    expect(hasPermission('CustomerBuyer', 'create:reservation')).toBe(true);
  });
});

describe('Domain Country Catalog', () => {
  it('looks up a country by ISO alpha-2 code, case-insensitively', () => {
    expect(findCountryByIsoCode('KE')).toEqual({ isoCode: 'KE', name: 'Kenya', dialCode: '+254' });
    expect(findCountryByIsoCode('ke')).toEqual({ isoCode: 'KE', name: 'Kenya', dialCode: '+254' });
  });

  it('returns undefined for an unknown ISO code', () => {
    expect(findCountryByIsoCode('ZZ')).toBeUndefined();
    expect(findCountryByIsoCode('')).toBeUndefined();
  });

  it('resolves the E.164 dial code for a known country', () => {
    expect(resolveDialCode('UG')).toBe('+256');
    expect(resolveDialCode('US')).toBe('+1');
  });

  it('returns undefined dial code for an unknown country', () => {
    expect(resolveDialCode('ZZ')).toBeUndefined();
  });

  it('has no duplicate ISO codes in the catalog', () => {
    const codes = COUNTRIES.map((c) => c.isoCode);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('contains the complete platform country catalog, not only CarChief destinations', () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(COUNTRIES.some((country) => country.isoCode === 'BR' && country.name === 'Brazil')).toBe(true);
    expect(COUNTRIES.some((country) => country.isoCode === 'DE' && country.name === 'Germany')).toBe(true);
  });
});
