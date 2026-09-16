export function renderWithProviders(componentName, options) {
    const theme = options?.theme || 'default';
    const route = options?.route || '/';
    return `<TestProvider theme="${theme}" route="${route}">${componentName}</TestProvider>`;
}
//# sourceMappingURL=render-helpers.js.map