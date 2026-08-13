"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerAppTheme = getCustomerAppTheme;
exports.getCustomerAppSkeletonInfo = getCustomerAppSkeletonInfo;
const theme_1 = require("@carchief/theme");
function getCustomerAppTheme(themeId) {
    const definition = (0, theme_1.getThemeDefinition)((0, theme_1.resolveThemeId)(themeId));
    return { id: definition.id, variables: (0, theme_1.getThemeCssVariables)(definition.tokens) };
}
function getCustomerAppSkeletonInfo(themeId) {
    return `CarChief Customer Application Skeleton (${getCustomerAppTheme(themeId).id}, ${theme_1.defaultTheme.colors.secondary})`;
}
//# sourceMappingURL=index.js.map