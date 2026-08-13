import { describe, it, expect } from 'vitest';
import { themeRegistry, calculateContrastRatio, isWcagAaCompliant, type ThemeId, type SemanticThemeTokens } from '../index.js';

/**
 * Phase 1.9 (D01-P09-T001, UI-02, UI-03, RULE-10): proves both registered
 * themes — not just the default `carchief` theme already covered by
 * theme.test.ts — define every semantic token with a real value and keep
 * every foreground/background pairing actually used by shared components at
 * WCAG AA contrast. This is the automated gate that lets a future theme
 * addition or token edit fail fast instead of silently shipping unreadable
 * text or a token that falls back to a component-local default.
 */

const THEME_IDS: ThemeId[] = ['carchief', 'ocean'];

/**
 * Semantic foreground/background pairings that shared components actually
 * render (body copy on page/card surfaces, status copy on its own tinted
 * surface, and button/link text on the primary action color). Never a raw
 * hex literal — always resolved through the registered theme tokens, so a
 * future token edit is checked automatically rather than re-typed here.
 */
const CONTRAST_PAIRS: ReadonlyArray<{
  name: string;
  foreground: (tokens: SemanticThemeTokens) => string;
  background: (tokens: SemanticThemeTokens) => string;
}> = [
  { name: 'textPrimary on background', foreground: (t) => t.colors.textPrimary, background: (t) => t.colors.background },
  { name: 'textPrimary on surface', foreground: (t) => t.colors.textPrimary, background: (t) => t.colors.surface },
  { name: 'textPrimary on surfaceElevated', foreground: (t) => t.colors.textPrimary, background: (t) => t.colors.surfaceElevated },
  { name: 'textPrimary on neutralSurface', foreground: (t) => t.colors.textPrimary, background: (t) => t.colors.neutralSurface },
  { name: 'textSecondary on background', foreground: (t) => t.colors.textSecondary, background: (t) => t.colors.background },
  { name: 'textSecondary on surface', foreground: (t) => t.colors.textSecondary, background: (t) => t.colors.surface },
  { name: 'secondary on surface', foreground: (t) => t.colors.secondary, background: (t) => t.colors.surface },
  { name: 'secondary on background', foreground: (t) => t.colors.secondary, background: (t) => t.colors.background },
  { name: 'primary on surface', foreground: (t) => t.colors.primary, background: (t) => t.colors.surface },
  { name: 'primary on background', foreground: (t) => t.colors.primary, background: (t) => t.colors.background },
  { name: 'textOnDark on surfaceDark', foreground: (t) => t.colors.textOnDark, background: (t) => t.colors.surfaceDark },
  { name: 'textOnPrimary on primary', foreground: (t) => t.colors.textOnPrimary, background: (t) => t.colors.primary },
  { name: 'textOnPrimary on primaryHover', foreground: (t) => t.colors.textOnPrimary, background: (t) => t.colors.primaryHover },
  { name: 'success on successSurface', foreground: (t) => t.colors.success, background: (t) => t.colors.successSurface },
  { name: 'warning on warningSurface', foreground: (t) => t.colors.warning, background: (t) => t.colors.warningSurface },
  { name: 'error on errorSurface', foreground: (t) => t.colors.error, background: (t) => t.colors.errorSurface },
  { name: 'info on infoSurface', foreground: (t) => t.colors.info, background: (t) => t.colors.infoSurface },
];

const REQUIRED_AA_RATIO = 4.5;

/** Recursively flattens a token tree (e.g. `typography.sizes.base`) into `{ path, value }` leaves. */
function collectLeaves(value: unknown, path: string[] = []): Array<{ path: string; value: unknown }> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => collectLeaves(child, [...path, key]));
  }
  return [{ path: path.join('.'), value }];
}

describe('Theme contrast and token completeness (both registered themes)', () => {
  describe.each(THEME_IDS)('%s theme', (themeId) => {
    const tokens = themeRegistry[themeId].tokens;

    it('defines a non-empty value for every SemanticThemeTokens leaf (no component fallback needed)', () => {
      const leaves = collectLeaves(tokens);
      expect(leaves.length).toBeGreaterThan(0);

      for (const leaf of leaves) {
        expect(leaf.value, `token "${leaf.path}" must be defined`).not.toBeUndefined();
        expect(leaf.value, `token "${leaf.path}" must not be null`).not.toBeNull();
        if (typeof leaf.value === 'string') {
          expect(leaf.value.trim(), `token "${leaf.path}" must not be an empty string`).not.toBe('');
        } else {
          expect(typeof leaf.value, `token "${leaf.path}" must be a string or a finite number`).toBe('number');
          expect(Number.isFinite(leaf.value as number), `token "${leaf.path}" must be a finite number`).toBe(true);
        }
      }
    });

    it.each(CONTRAST_PAIRS)('meets WCAG AA contrast for $name', ({ foreground, background }) => {
      const fg = foreground(tokens);
      const bg = background(tokens);
      const ratio = calculateContrastRatio(fg, bg);

      expect(ratio, `${fg} on ${bg} must be at least ${REQUIRED_AA_RATIO}:1, was ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
        REQUIRED_AA_RATIO,
      );
      expect(isWcagAaCompliant(fg, bg)).toBe(true);
    });
  });

  it('both themes expose the identical set of token paths, so no theme silently omits a field the other defines', () => {
    const [first, second] = THEME_IDS;
    const firstPaths = collectLeaves(themeRegistry[first].tokens)
      .map((leaf) => leaf.path)
      .sort();
    const secondPaths = collectLeaves(themeRegistry[second].tokens)
      .map((leaf) => leaf.path)
      .sort();

    expect(secondPaths).toEqual(firstPaths);
  });
});
