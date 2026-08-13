"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWithProviders = renderWithProviders;
function renderWithProviders(componentName, options) {
    const theme = options?.theme || 'default';
    const route = options?.route || '/';
    return `<TestProvider theme="${theme}" route="${route}">${componentName}</TestProvider>`;
}
//# sourceMappingURL=render-helpers.js.map