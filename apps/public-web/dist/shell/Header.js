"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_NAV_ITEMS = void 0;
exports.renderHeaderConfig = renderHeaderConfig;
exports.PUBLIC_NAV_ITEMS = [
    { label: 'Home', href: '/' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'How to Buy', href: '/how-to-buy' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
];
function renderHeaderConfig(props = {}) {
    const siteName = props.siteName || 'CarChief';
    const navItems = props.navItems || exports.PUBLIC_NAV_ITEMS;
    return {
        landmark: 'header',
        siteName,
        navItems,
        isMobileOpen: !!props.isMobileOpen,
        skipLinkId: 'skip-to-main',
    };
}
//# sourceMappingURL=Header.js.map