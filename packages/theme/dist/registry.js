"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.themeRegistry = void 0;
exports.resolveThemeId = resolveThemeId;
exports.getThemeDefinition = getThemeDefinition;
exports.getThemeTokens = getThemeTokens;
const tokens_js_1 = require("./tokens.js");
const oceanTheme = {
    colors: {
        primary: '#0369a1',
        primaryHover: '#075985',
        accent: '#0e7490', // ocean-family cyan accent; AA contrast against white text (5.36:1)
        secondary: '#0f766e',
        background: '#f0f9ff',
        surface: '#ffffff',
        surfaceElevated: '#ffffff',
        surfaceDark: '#082f49',
        textPrimary: '#0c4a6e',
        textSecondary: '#155e75',
        textOnDark: '#f0f9ff',
        textOnPrimary: '#ffffff',
        border: '#bae6fd',
        focus: '#075985',
        success: '#166534',
        successSurface: '#dcfce7',
        warning: '#92400e',
        warningSurface: '#fef3c7',
        error: '#b91c1c',
        errorSurface: '#fee2e2',
        info: '#1d4ed8',
        infoSurface: '#dbeafe',
        neutralSurface: '#e0f2fe',
    },
    spacing: tokens_js_1.defaultSemanticTheme.spacing,
    typography: tokens_js_1.defaultSemanticTheme.typography,
    breakpoints: tokens_js_1.defaultSemanticTheme.breakpoints,
    motion: tokens_js_1.defaultSemanticTheme.motion,
    radii: tokens_js_1.defaultSemanticTheme.radii,
    shadows: tokens_js_1.defaultSemanticTheme.shadows,
    accessibility: tokens_js_1.defaultSemanticTheme.accessibility,
};
exports.themeRegistry = {
    carchief: { id: 'carchief', tokens: tokens_js_1.defaultSemanticTheme },
    ocean: { id: 'ocean', tokens: oceanTheme },
};
/** Resolves external configuration safely; unknown values always use the approved default. */
function resolveThemeId(value) {
    return value === 'ocean' ? 'ocean' : 'carchief';
}
function getThemeDefinition(value) {
    return exports.themeRegistry[resolveThemeId(value)];
}
function getThemeTokens(value) {
    return getThemeDefinition(value).tokens;
}
//# sourceMappingURL=registry.js.map