export function renderInputFieldSkeleton(props) {
    return {
        id: props.id,
        labelId: `${props.id}-label`,
        errorId: props.error ? `${props.id}-error` : undefined,
        hasError: Boolean(props.error),
    };
}
//# sourceMappingURL=InputField.js.map