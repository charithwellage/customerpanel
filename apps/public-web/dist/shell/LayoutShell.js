"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderLayoutShellConfig = renderLayoutShellConfig;
const Header_js_1 = require("./Header.js");
const Footer_js_1 = require("./Footer.js");
const NavigationDrawer_js_1 = require("./NavigationDrawer.js");
const theme_1 = require("@carchief/theme");
function renderLayoutShellConfig(props = {}) {
    const header = (0, Header_js_1.renderHeaderConfig)(props.headerProps);
    const footer = (0, Footer_js_1.renderFooterConfig)(props.footerProps);
    const drawer = (0, NavigationDrawer_js_1.renderNavigationDrawerConfig)({
        isOpen: !!props.isMobileDrawerOpen,
        navItems: header.navItems,
    });
    return {
        landmarks: {
            skipLink: { id: 'skip-to-main', label: 'Skip to main content', href: '#main-content' },
            header,
            navigation: { landmark: 'nav', ariaLabel: 'Main Navigation', activePath: props.activePath || '/' },
            main: { landmark: 'main', id: 'main-content', tabindex: -1 },
            footer,
            drawer,
        },
        themeVariables: (0, theme_1.getThemeCssVariables)(theme_1.defaultSemanticTheme),
    };
}
//# sourceMappingURL=LayoutShell.js.map