"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSalespersonAppTheme = getSalespersonAppTheme;
exports.getSalespersonAppSkeletonInfo = getSalespersonAppSkeletonInfo;
const theme_1 = require("@carchief/theme");
function getSalespersonAppTheme(themeId) {
    const definition = (0, theme_1.getThemeDefinition)((0, theme_1.resolveThemeId)(themeId));
    return { id: definition.id, variables: (0, theme_1.getThemeCssVariables)(definition.tokens) };
}
function getSalespersonAppSkeletonInfo(themeId) {
    return `CarChief Salesperson Application Skeleton (${getSalespersonAppTheme(themeId).id}, ${theme_1.defaultTheme.colors.surface})`;
}
//# sourceMappingURL=index.js.map