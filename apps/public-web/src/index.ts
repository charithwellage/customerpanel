export * from './shell/Header.js';
export * from './shell/Footer.js';
export * from './shell/NavigationDrawer.js';
export * from './shell/LayoutShell.js';
export * from './shell/ErrorBoundary.js';

import { defaultTheme } from '@carchief/theme';
import { formatVehicleTitle } from '@carchief/vehicle-detail';

export function getPublicWebSkeletonInfo(): string {
  return `CarChief Public Website Shell (${defaultTheme.colors.primary})`;
}

export { formatVehicleTitle };
