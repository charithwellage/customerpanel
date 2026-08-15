import { defaultTheme, type ThemeId } from '@carchief/theme';
import { getCustomerTheme } from './theme.js';

export * from './features/shell/index.js';
export * from './features/account/index.js';
export * from './features/pwa/index.js';
export * from './features/registry/index.js';
export * from './theme.js';

export function getCustomerAppTheme(themeId?: string): { id: ThemeId; variables: Record<string, string> } {
  return getCustomerTheme(themeId);
}

export function getCustomerAppSkeletonInfo(themeId?: string): string {
  return `CarChief Customer Application (${getCustomerAppTheme(themeId).id}, ${defaultTheme.colors.primary})`;
}
