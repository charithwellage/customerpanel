import { describe, expect, it } from 'vitest';
import { applyCustomerTheme, getCustomerAppTheme, getCustomerTheme } from '../index.js';

describe('Customer theme provider integration', () => {
  it('keeps carchief as the default and safe fallback', () => {
    expect(getCustomerTheme().id).toBe('carchief');
    expect(getCustomerTheme('unrecognized').id).toBe('carchief');
    expect(getCustomerAppTheme('')).toEqual(getCustomerTheme('carchief'));
  });

  it('resolves ocean through the shared registry with the same token surface', () => {
    const carchief = getCustomerTheme('carchief');
    const ocean = getCustomerTheme('ocean');

    expect(ocean.id).toBe('ocean');
    expect(Object.keys(ocean.variables).sort()).toEqual(Object.keys(carchief.variables).sort());
    expect(ocean.variables['--color-primary']).not.toBe(carchief.variables['--color-primary']);
  });

  it('applies the resolved theme without changing application data configuration', () => {
    const attributes = new Map<string, string>();
    const variables = new Map<string, string>();
    const root = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      style: { setProperty: (name: string, value: string) => variables.set(name, value) },
    };

    const applied = applyCustomerTheme(root, 'ocean');

    expect(attributes.get('data-theme')).toBe('ocean');
    expect(variables.get('--color-primary')).toBe(applied.variables['--color-primary']);
    expect(variables.size).toBe(Object.keys(applied.variables).length);
  });
});
