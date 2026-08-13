import { describe, it, expect } from 'vitest';
import { defaultSemanticTheme, getThemeCssVariables, formatCssVariableString, calculateContrastRatio, isWcagAaCompliant, getThemeDefinition, resolveThemeId, themeRegistry } from '../index.js';

describe('Theme Package Unit & Accessibility Tests', () => {
  it('defines all required semantic tokens', () => {
    expect(defaultSemanticTheme.colors.primary).toBe('#dc2626');
    expect(defaultSemanticTheme.colors.surfaceDark).toBe('#171717');
    expect(defaultSemanticTheme.typography.fontDisplay).toContain('Space Grotesk');
    expect(defaultSemanticTheme.typography.fontMono).toContain('JetBrains Mono');
    expect(defaultSemanticTheme.spacing.md).toBe('1rem');
    expect(defaultSemanticTheme.breakpoints.desktop).toBe('1024px');
    expect(defaultSemanticTheme.motion.durationNormal).toBe('300ms');
    expect(defaultSemanticTheme.radii.pill).toBe('999px');
    expect(defaultSemanticTheme.accessibility.minTouchTarget).toBe('44px');
  });

  it('generates valid CSS custom property mappings', () => {
    const vars = getThemeCssVariables();
    expect(vars['--color-primary']).toBe('#dc2626');
    expect(vars['--color-background']).toBe('#fafafa');
    expect(vars['--font-display']).toContain('Space Grotesk');
    expect(vars['--radius-lg']).toBe('0.75rem');
    expect(vars['--focus-ring-width']).toBe('3px');
    expect(Object.keys(vars)).toHaveLength(51);

    const formatted = formatCssVariableString();
    expect(formatted).toContain('--color-primary: #dc2626;');
  });

  it('verifies WCAG AA contrast ratio standards for core colors', () => {
    const textOnWhite = calculateContrastRatio(defaultSemanticTheme.colors.textPrimary, defaultSemanticTheme.colors.surface);
    expect(textOnWhite).toBeGreaterThanOrEqual(4.5);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.textPrimary, defaultSemanticTheme.colors.surface)).toBe(true);

    const primaryOnWhite = isWcagAaCompliant(defaultSemanticTheme.colors.primary, defaultSemanticTheme.colors.surface);
    expect(primaryOnWhite).toBe(true);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.primary, defaultSemanticTheme.colors.surfaceElevated)).toBe(true);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.textOnDark, defaultSemanticTheme.colors.surfaceDark)).toBe(true);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.success, '#dcfce7')).toBe(true);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.warning, '#fef3c7')).toBe(true);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.error, '#fee2e2')).toBe(true);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.info, '#dbeafe')).toBe(true);
  });

  it('provides carchief and ocean themes with a safe default fallback', () => {
    expect(Object.keys(themeRegistry)).toEqual(['carchief', 'ocean']);
    expect(getThemeDefinition('carchief').id).toBe('carchief');
    expect(getThemeDefinition('ocean').id).toBe('ocean');
    expect(getThemeDefinition('unknown').id).toBe('carchief');
    expect(resolveThemeId(undefined)).toBe('carchief');
    expect(resolveThemeId('ocean')).toBe('ocean');
    expect(resolveThemeId('OCEAN')).toBe('carchief');
    expect(getThemeCssVariables(getThemeDefinition('ocean').tokens)['--color-primary']).toBe('#0369a1');
    expect(isWcagAaCompliant(getThemeDefinition('ocean').tokens.colors.primary, getThemeDefinition('ocean').tokens.colors.surface)).toBe(true);
    expect(isWcagAaCompliant(getThemeDefinition('ocean').tokens.colors.textPrimary, getThemeDefinition('ocean').tokens.colors.surface)).toBe(true);
  });
});
