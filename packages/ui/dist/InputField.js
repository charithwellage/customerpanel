"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderInputFieldSkeleton = renderInputFieldSkeleton;
function renderInputFieldSkeleton(props) {
    return {
        id: props.id,
        labelId: `${props.id}-label`,
        errorId: props.error ? `${props.id}-error` : undefined,
        hasError: Boolean(props.error),
    };
}
//# sourceMappingURL=InputField.js.map