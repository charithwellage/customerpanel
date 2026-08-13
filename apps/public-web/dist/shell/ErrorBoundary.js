"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorBoundaryConfig = createErrorBoundaryConfig;
function createErrorBoundaryConfig(error) {
    if (error) {
        return {
            hasError: true,
            error,
        };
    }
    return {
        hasError: false,
    };
}
//# sourceMappingURL=ErrorBoundary.js.map