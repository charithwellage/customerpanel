import { getThemeCssVariables, getThemeDefinition, resolveThemeId, type ThemeId } from '@carchief/theme';

export type ThemeMode = 'daylight' | 'midnight';

export interface CustomerTheme {
  id: ThemeId;
  mode: ThemeMode;
  variables: Record<string, string>;
}

export const MIDNIGHT_COLOR_VARIABLES: Record<string, string> = {
  '--color-primary': '#ef4444',
  '--color-primary-hover': '#dc2626',
  '--color-accent': '#f97316',
  '--color-secondary': '#94a3b8',
  '--color-background': '#090d16',
  '--color-surface': '#111827',
  '--color-surface-elevated': '#1f2937',
  '--color-surface-dark': '#030712',
  '--color-text-primary': '#f9fafb',
  '--color-text-secondary': '#9ca3af',
  '--color-text-on-dark': '#f9fafb',
  '--color-text-on-primary': '#ffffff',
  '--color-text-on-accent': '#111827',
  '--color-border': '#1f2937',
  '--color-focus': '#94a3b8',
  '--color-success': '#34d399',
  '--color-success-surface': '#064e3b',
  '--color-warning': '#fbbf24',
  '--color-warning-surface': '#78350f',
  '--color-error': '#f87171',
  '--color-error-surface': '#7f1d1d',
  '--color-info': '#60a5fa',
  '--color-info-surface': '#1e3a8a',
  '--color-neutral-surface': '#1f2937',
};

/** Resolves Customer configuration through the shared registry/provider. */
export function getCustomerTheme(themeId?: string, mode: ThemeMode = 'daylight'): CustomerTheme {
  const id = resolveThemeId(themeId);
  const baseVariables = getThemeCssVariables(getThemeDefinition(id).tokens);
  const variables = mode === 'midnight'
    ? { ...baseVariables, ...MIDNIGHT_COLOR_VARIABLES }
    : baseVariables;
  return { id, mode, variables };
}

/** Applies only shared semantic variables to the document root. */
export function applyCustomerTheme(
  root: {
    setAttribute: (name: string, value: string) => void;
    style: { setProperty: (name: string, value: string) => void };
    classList?: { toggle: (cls: string, force?: boolean) => void };
  },
  themeId?: string,
  mode: ThemeMode = 'daylight',
): CustomerTheme {
  const theme = getCustomerTheme(themeId, mode);
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.mode);

  if (root.classList && typeof root.classList.toggle === 'function') {
    root.classList.toggle('dark-mode', mode === 'midnight');
  }

  for (const [name, value] of Object.entries(theme.variables)) {
    root.style.setProperty(name, value);
  }
  return theme;
}
