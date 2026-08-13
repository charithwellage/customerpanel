"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDialogAccessibilityAttributes = getDialogAccessibilityAttributes;
function getDialogAccessibilityAttributes(props) {
    return {
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': `${props.id}-title`,
        'aria-describedby': props.description ? `${props.id}-description` : props.ariaDescribedBy || '',
        hidden: !props.isOpen,
    };
}
//# sourceMappingURL=Dialog.js.map