import { defaultTheme, getThemeCssVariables, getThemeDefinition, resolveThemeId, ThemeId } from '@carchief/theme';

export function getCustomerAppTheme(themeId?: string): { id: ThemeId; variables: Record<string, string> } {
  const definition = getThemeDefinition(resolveThemeId(themeId));
  return { id: definition.id, variables: getThemeCssVariables(definition.tokens) };
}

export function getCustomerAppSkeletonInfo(themeId?: string): string {
  return `CarChief Customer Application Skeleton (${getCustomerAppTheme(themeId).id}, ${defaultTheme.colors.secondary})`;
}
