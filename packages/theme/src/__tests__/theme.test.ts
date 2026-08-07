import { describe, it, expect } from 'vitest';
import { defaultSemanticTheme, getThemeCssVariables, formatCssVariableString, calculateContrastRatio, isWcagAaCompliant } from '../index.js';

describe('Theme Package Unit & Accessibility Tests', () => {
  it('defines all required semantic tokens', () => {
    expect(defaultSemanticTheme.colors.primary).toBe('#1d4ed8');
    expect(defaultSemanticTheme.spacing.md).toBe('1rem');
    expect(defaultSemanticTheme.breakpoints.desktop).toBe('1024px');
    expect(defaultSemanticTheme.motion.durationNormal).toBe('300ms');
  });

  it('generates valid CSS custom property mappings', () => {
    const vars = getThemeCssVariables();
    expect(vars['--color-primary']).toBe('#1d4ed8');
    expect(vars['--color-background']).toBe('#f8fafc');

    const formatted = formatCssVariableString();
    expect(formatted).toContain('--color-primary: #1d4ed8;');
  });

  it('verifies WCAG AA contrast ratio standards for core colors', () => {
    const textOnWhite = calculateContrastRatio(defaultSemanticTheme.colors.textPrimary, defaultSemanticTheme.colors.surface);
    expect(textOnWhite).toBeGreaterThanOrEqual(4.5);
    expect(isWcagAaCompliant(defaultSemanticTheme.colors.textPrimary, defaultSemanticTheme.colors.surface)).toBe(true);

    const primaryOnWhite = isWcagAaCompliant(defaultSemanticTheme.colors.primary, defaultSemanticTheme.colors.surface);
    expect(primaryOnWhite).toBe(true);
  });
});
