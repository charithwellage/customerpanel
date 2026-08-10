export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  icon?: string;
}

export function getStatusBadgeCssClass(variant: StatusBadgeVariant = 'neutral'): string {
  switch (variant) {
    case 'success':
      return 'cc-badge cc-badge-success';
    case 'warning':
      return 'cc-badge cc-badge-warning';
    case 'error':
      return 'cc-badge cc-badge-error';
    case 'info':
      return 'cc-badge cc-badge-info';
    default:
      return 'cc-badge cc-badge-neutral';
  }
}
