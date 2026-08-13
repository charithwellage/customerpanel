export type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export interface StatusBadgeProps {
    label: string;
    variant?: StatusBadgeVariant;
    icon?: string;
}
export declare function getStatusBadgeCssClass(variant?: StatusBadgeVariant): string;
//# sourceMappingURL=StatusBadge.d.ts.map