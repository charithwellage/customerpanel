import { SemanticThemeTokens, defaultSemanticTheme } from './tokens.js';

export function getThemeCssVariables(theme: SemanticThemeTokens = defaultSemanticTheme): Record<string, string> {
  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-hover': theme.colors.primaryHover,
    '--color-secondary': theme.colors.secondary,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-surface-elevated': theme.colors.surfaceElevated,
    '--color-surface-dark': theme.colors.surfaceDark,
    '--color-text-primary': theme.colors.textPrimary,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-text-on-dark': theme.colors.textOnDark,
    '--color-text-on-primary': theme.colors.textOnPrimary,
    '--color-border': theme.colors.border,
    '--color-focus': theme.colors.focus,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
    '--color-info': theme.colors.info,
    '--font-body': theme.typography.fontFamily,
    '--font-display': theme.typography.fontDisplay,
    '--font-mono': theme.typography.fontMono,
    '--spacing-xs': theme.spacing.xs,
    '--spacing-sm': theme.spacing.sm,
    '--spacing-md': theme.spacing.md,
    '--spacing-lg': theme.spacing.lg,
    '--spacing-xl': theme.spacing.xl,
    '--spacing-2xl': theme.spacing['2xl'],
    '--motion-fast': theme.motion.durationFast,
    '--motion-normal': theme.motion.durationNormal,
    '--motion-slow': theme.motion.durationSlow,
    '--radius-sm': theme.radii.sm,
    '--radius-md': theme.radii.md,
    '--radius-lg': theme.radii.lg,
    '--radius-pill': theme.radii.pill,
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
    '--focus-ring-width': theme.accessibility.focusRingWidth,
    '--min-touch-target': theme.accessibility.minTouchTarget,
  };
}

export function formatCssVariableString(theme: SemanticThemeTokens = defaultSemanticTheme): string {
  const vars = getThemeCssVariables(theme);
  return Object.entries(vars)
    .map(([key, val]) => `${key}: ${val};`)
    .join(' ');
}
