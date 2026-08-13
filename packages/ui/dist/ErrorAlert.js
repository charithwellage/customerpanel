"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorAlertAttributes = getErrorAlertAttributes;
function getErrorAlertAttributes(props) {
    return {
        role: 'alert',
        'aria-live': 'assertive',
        id: props.id,
    };
}
//# sourceMappingURL=ErrorAlert.js.map