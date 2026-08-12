import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isThemeSwitcherEnabled } from '../app/layout';
import { metadata as accountMetadata } from '../app/account/layout';

// RULE-08, RULE-10: any NEXT_PUBLIC_*/VITE_* variable is bundled straight
// into the browser, so its *name* must never look like it carries a secret.
const FORBIDDEN_SECRET_NAME_PATTERN = /SECRET|PRIVATE_KEY|PASSWORD|_PASS(?:_|\b)|TOKEN|API_KEY/i;
const PUBLIC_ENV_VAR_REFERENCE_PATTERN = /\b(?:NEXT_PUBLIC|VITE)_[A-Z0-9_]+\b/g;
const SKIPPED_DIRECTORIES = new Set(['__tests__', 'node_modules', '.next', 'dist']);

/**
 * Walks real application source (not test code) collecting every
 * NEXT_PUBLIC_ or VITE_ variable name actually referenced, so the
 * secret-name check below exercises the shipped source tree unconditionally
 * instead of gating on environment variables that are never set in CI.
 */
function collectPublicEnvVarNames(rootDir: string, names: Set<string> = new Set()): Set<string> {
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      collectPublicEnvVarNames(fullPath, names);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const matches = fs.readFileSync(fullPath, 'utf-8').match(PUBLIC_ENV_VAR_REFERENCE_PATTERN) ?? [];
      matches.forEach((name) => names.add(name));
    }
  }
  return names;
}

describe('Public Web Production Release Guard (RULE-08, RULE-09, RULE-10)', () => {
  it('renders the dev-only ThemeSwitcher only when NODE_ENV is not production, via the real layout predicate', () => {
    expect(isThemeSwitcherEnabled('production')).toBe(false);
    expect(isThemeSwitcherEnabled('development')).toBe(true);
    expect(isThemeSwitcherEnabled('test')).toBe(true);
    expect(isThemeSwitcherEnabled(undefined)).toBe(true);
  });

  it('never references a secret-shaped name through a NEXT_PUBLIC_*/VITE_* variable in application source', () => {
    const srcDir = path.resolve(__dirname, '..');
    const referencedNames = collectPublicEnvVarNames(srcDir);

    // Guard against a no-op scan silently passing: the app is known to
    // reference at least NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_THEME_ID today.
    expect(referencedNames.size).toBeGreaterThan(0);

    for (const name of referencedNames) {
      expect(name, `${name} is a NEXT_PUBLIC_*/VITE_* variable that looks like it carries a secret`).not.toMatch(
        FORBIDDEN_SECRET_NAME_PATTERN,
      );
    }

    const envExamplePath = path.resolve(__dirname, '../../.env.example');
    if (fs.existsSync(envExamplePath)) {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf-8');
      expect(envExampleContent).not.toMatch(
        /(NEXT_PUBLIC_|VITE_)\w*(SECRET|PRIVATE_KEY|PASSWORD|TOKEN|API_KEY)/i,
      );
    }
  });

  it('validates the real exported account-portal metadata blocks indexing (noindex/nofollow)', () => {
    const robots = accountMetadata.robots as { index: boolean; follow: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });
});
