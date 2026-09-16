export function getButtonCssClass(props = {}) {
    const variant = props.variant || 'primary';
    const size = props.size || 'md';
    const disabled = props.disabled ? 'btn-disabled opacity-50 cursor-not-allowed' : 'btn-interactive';
    return `cc-btn cc-btn-${variant} cc-btn-${size} ${disabled} ${props.className || ''}`.trim();
}
//# sourceMappingURL=Button.js.map