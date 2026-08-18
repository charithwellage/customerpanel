import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyCustomerTheme, getCustomerAppTheme, getCustomerTheme } from '../index.js';

async function collectCssFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectCssFiles(entryPath);
    return entry.name.endsWith('.css') ? [entryPath] : [];
  }));
  return nested.flat();
}

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
    expect(attributes.get('data-theme-mode')).toBe('daylight');
    expect(variables.get('--color-primary')).toBe(applied.variables['--color-primary']);
    expect(variables.size).toBe(Object.keys(applied.variables).length);
  });

  it('applies midnight dark mode and overrides color variables with midnight palette', () => {
    const attributes = new Map<string, string>();
    const variables = new Map<string, string>();
    const classListSet = new Set<string>();
    const root = {
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      style: { setProperty: (name: string, value: string) => variables.set(name, value) },
      classList: {
        toggle: (cls: string, force?: boolean) => {
          if (force) classListSet.add(cls);
          else classListSet.delete(cls);
        },
      },
    };

    const midnight = applyCustomerTheme(root, 'carchief', 'midnight');

    expect(attributes.get('data-theme-mode')).toBe('midnight');
    expect(classListSet.has('dark-mode')).toBe(true);
    expect(midnight.variables['--color-background']).toBe('#090d16');
    expect(variables.get('--color-background')).toBe('#090d16');
    expect(midnight.variables['--color-surface']).toBe('#111827');
    expect(variables.get('--color-surface')).toBe('#111827');
    expect(midnight.variables['--color-text-primary']).toBe('#f9fafb');
  });

  it('uses only emitted semantic theme variables and runtime-only CSS values', async () => {
    const sourceRoot = fileURLToPath(new URL('..', import.meta.url));
    const cssFiles = await collectCssFiles(sourceRoot);
    const emittedVariables = new Set(Object.keys(getCustomerTheme().variables));
    const runtimeVariables = new Set([
      '--cc-invoice-progress-width',
      '--cc-utilisation-width',
      '--status-color',
    ]);
    const undefinedReferences: string[] = [];
    const paletteLiterals: string[] = [];

    for (const cssFile of cssFiles) {
      const source = await readFile(cssFile, 'utf8');
      for (const match of source.matchAll(/var\((--[\w-]+)/g)) {
        if (!emittedVariables.has(match[1]) && !runtimeVariables.has(match[1])) {
          undefinedReferences.push(`${path.relative(sourceRoot, cssFile)}: ${match[1]}`);
        }
      }
      if (/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(source)) {
        paletteLiterals.push(path.relative(sourceRoot, cssFile));
      }
    }

    expect(undefinedReferences).toEqual([]);
    expect(paletteLiterals).toEqual([]);
  });
});
