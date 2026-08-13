import { SemanticThemeTokens, defaultSemanticTheme } from './tokens.js';

export function getThemeCssVariables(theme: SemanticThemeTokens = defaultSemanticTheme): Record<string, string> {
  return {
    '--color-primary': theme.colors.primary,
    '--color-primary-hover': theme.colors.primaryHover,
    '--color-accent': theme.colors.accent,
    '--color-secondary': theme.colors.secondary,
    '--color-background': theme.colors.background,
    '--color-surface': theme.colors.surface,
    '--color-surface-elevated': theme.colors.surfaceElevated,
    '--color-surface-dark': theme.colors.surfaceDark,
    '--color-text-primary': theme.colors.textPrimary,
    '--color-text-secondary': theme.colors.textSecondary,
    '--color-text-on-dark': theme.colors.textOnDark,
    '--color-text-on-primary': theme.colors.textOnPrimary,
    '--color-text-on-accent': theme.colors.textOnAccent,
    '--color-border': theme.colors.border,
    '--color-focus': theme.colors.focus,
    '--color-success': theme.colors.success,
    '--color-success-surface': theme.colors.successSurface,
    '--color-warning': theme.colors.warning,
    '--color-warning-surface': theme.colors.warningSurface,
    '--color-error': theme.colors.error,
    '--color-error-surface': theme.colors.errorSurface,
    '--color-info': theme.colors.info,
    '--color-info-surface': theme.colors.infoSurface,
    '--color-neutral-surface': theme.colors.neutralSurface,
    '--font-body': theme.typography.fontFamily,
    '--font-display': theme.typography.fontDisplay,
    '--font-mono': theme.typography.fontMono,
    '--font-size-xs': theme.typography.sizes.xs,
    '--font-size-sm': theme.typography.sizes.sm,
    '--font-size-base': theme.typography.sizes.base,
    '--font-size-lg': theme.typography.sizes.lg,
    '--font-size-xl': theme.typography.sizes.xl,
    '--font-size-2xl': theme.typography.sizes['2xl'],
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
