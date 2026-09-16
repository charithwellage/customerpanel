export function getStatusBadgeCssClass(variant = 'neutral') {
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
//# sourceMappingURL=StatusBadge.js.map