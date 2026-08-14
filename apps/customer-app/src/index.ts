import { defaultTheme, getThemeCssVariables, getThemeDefinition, resolveThemeId, ThemeId } from '@carchief/theme';

export * from './features/shell/index.js';
export * from './features/account/index.js';
export * from './features/pwa/index.js';
export * from './features/registry/index.js';

export function getCustomerAppTheme(themeId?: string): { id: ThemeId; variables: Record<string, string> } {
  const definition = getThemeDefinition(resolveThemeId(themeId));
  return { id: definition.id, variables: getThemeCssVariables(definition.tokens) };
}

export function getCustomerAppSkeletonInfo(themeId?: string): string {
  return `CarChief Customer Application (${getCustomerAppTheme(themeId).id}, ${defaultTheme.colors.primary})`;
}
