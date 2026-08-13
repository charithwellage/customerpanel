import { defaultSemanticTheme, SemanticThemeTokens } from './tokens.js';

export type ThemeId = 'carchief' | 'ocean';

/** A complete semantic theme definition identified by its stable configuration name. */
export interface ThemeDefinition {
  id: ThemeId;
  tokens: SemanticThemeTokens;
}

const oceanTheme: SemanticThemeTokens = {
  colors: {
    primary: '#0369a1',
    primaryHover: '#075985',
    accent: '#0e7490', // ocean-family cyan accent; AA contrast against white text (5.36:1)
    secondary: '#0f766e',
    background: '#f0f9ff',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceDark: '#082f49',
    textPrimary: '#0c4a6e',
    textSecondary: '#155e75',
    textOnDark: '#f0f9ff',
    textOnPrimary: '#ffffff',
    // Same white as textOnPrimary: ocean's accent (#0e7490) is a dark teal,
    // so white text already passes WCAG AA (5.36:1, verified via contrast.ts)
    // -- unlike carchief, which needs a distinct dark value here.
    textOnAccent: '#ffffff',
    border: '#bae6fd',
    focus: '#075985',
    success: '#166534',
    successSurface: '#dcfce7',
    warning: '#92400e',
    warningSurface: '#fef3c7',
    error: '#b91c1c',
    errorSurface: '#fee2e2',
    info: '#1d4ed8',
    infoSurface: '#dbeafe',
    neutralSurface: '#e0f2fe',
  },
  spacing: defaultSemanticTheme.spacing,
  typography: defaultSemanticTheme.typography,
  breakpoints: defaultSemanticTheme.breakpoints,
  motion: defaultSemanticTheme.motion,
  radii: defaultSemanticTheme.radii,
  shadows: defaultSemanticTheme.shadows,
  accessibility: defaultSemanticTheme.accessibility,
};

export const themeRegistry: Readonly<Record<ThemeId, ThemeDefinition>> = {
  carchief: { id: 'carchief', tokens: defaultSemanticTheme },
  ocean: { id: 'ocean', tokens: oceanTheme },
};

/** Resolves external configuration safely; unknown values always use the approved default. */
export function resolveThemeId(value: unknown): ThemeId {
  return value === 'ocean' ? 'ocean' : 'carchief';
}

export function getThemeDefinition(value?: unknown): ThemeDefinition {
  return themeRegistry[resolveThemeId(value)];
}

export function getThemeTokens(value?: unknown): SemanticThemeTokens {
  return getThemeDefinition(value).tokens;
}
