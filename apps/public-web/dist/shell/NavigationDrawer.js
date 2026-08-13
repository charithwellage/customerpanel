"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderNavigationDrawerConfig = renderNavigationDrawerConfig;
const Header_js_1 = require("./Header.js");
function renderNavigationDrawerConfig(props) {
    return {
        landmark: 'nav',
        role: 'dialog',
        ariaModal: true,
        isOpen: props.isOpen,
        navItems: props.navItems || Header_js_1.PUBLIC_NAV_ITEMS,
    };
}
//# sourceMappingURL=NavigationDrawer.js.map