import { defaultTheme } from '@carchief/theme';
import { formatVehicleTitle } from '@carchief/vehicle-detail';

export function getPublicWebSkeletonInfo(): string {
  return `CarChief Public Website Skeleton (${defaultTheme.colors.primary})`;
}

export { formatVehicleTitle };
