import { defaultTheme, getThemeCssVariables, getThemeDefinition, resolveThemeId, ThemeId } from '@carchief/theme';

export function getSalespersonAppTheme(themeId?: string): { id: ThemeId; variables: Record<string, string> } {
  const definition = getThemeDefinition(resolveThemeId(themeId));
  return { id: definition.id, variables: getThemeCssVariables(definition.tokens) };
}

export function getSalespersonAppSkeletonInfo(themeId?: string): string {
  return `CarChief Salesperson Application Skeleton (${getSalespersonAppTheme(themeId).id}, ${defaultTheme.colors.surface})`;
}
