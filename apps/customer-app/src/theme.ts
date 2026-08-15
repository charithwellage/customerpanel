import { getThemeCssVariables, getThemeDefinition, resolveThemeId, type ThemeId } from '@carchief/theme';

export interface CustomerTheme {
  id: ThemeId;
  variables: Record<string, string>;
}

/** Resolves Customer configuration through the shared registry/provider. */
export function getCustomerTheme(themeId?: string): CustomerTheme {
  const id = resolveThemeId(themeId);
  return { id, variables: getThemeCssVariables(getThemeDefinition(id).tokens) };
}

/** Applies only shared semantic variables to the document root. */
export function applyCustomerTheme(
  root: { setAttribute: (name: string, value: string) => void; style: { setProperty: (name: string, value: string) => void } },
  themeId?: string,
): CustomerTheme {
  const theme = getCustomerTheme(themeId);
  root.setAttribute('data-theme', theme.id);
  for (const [name, value] of Object.entries(theme.variables)) {
    root.style.setProperty(name, value);
  }
  return theme;
}
