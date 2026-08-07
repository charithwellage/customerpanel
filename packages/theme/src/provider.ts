import { SemanticThemeTokens, defaultSemanticTheme } from './tokens.js';

export function getThemeCssVariables(theme: SemanticThemeTokens = defaultSemanticTheme): Record<string, string> {
  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-hover': theme.colors.primaryHover,
    '--color-secondary': theme.colors.secondary,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-text-primary': theme.colors.textPrimary,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-border': theme.colors.border,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--spacing-xs': theme.spacing.xs,
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,
    '--spacing-xl': theme.spacing.xl,
    '--spacing-2xl': theme.spacing['2xl'],
    '--motion-fast': theme.motion.durationFast,
    '--motion-normal': theme.motion.durationNormal,
    '--motion-slow': theme.motion.durationSlow,
  };
}

export function formatCssVariableString(theme: SemanticThemeTokens = defaultSemanticTheme): string {
  const vars = getThemeCssVariables(theme);
  return Object.entries(vars)
    .map(([key, val]) => `${key}: ${val};`)
    .join(' ');
}
