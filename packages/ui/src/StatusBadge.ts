export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  icon?: string;
}

export function getStatusBadgeCssClass(variant: StatusBadgeVariant = 'neutral'): string {
  switch (variant) {
    case 'success':
      return 'cc-badge cc-badge-success bg-green-100 text-green-800';
    case 'warning':
      return 'cc-badge cc-badge-warning bg-amber-100 text-amber-800';
    case 'error':
      return 'cc-badge cc-badge-error bg-red-100 text-red-800';
    case 'info':
      return 'cc-badge cc-badge-info bg-blue-100 text-blue-800';
    default:
      return 'cc-badge cc-badge-neutral bg-slate-100 text-slate-800';
  }
}
