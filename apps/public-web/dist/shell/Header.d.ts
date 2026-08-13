export interface NavItem {
    label: string;
    href: string;
}
export declare const PUBLIC_NAV_ITEMS: NavItem[];
export interface HeaderProps {
    siteName?: string;
    navItems?: NavItem[];
    isMobileOpen?: boolean;
}
export declare function renderHeaderConfig(props?: HeaderProps): {
    landmark: string;
    siteName: string;
    navItems: NavItem[];
    isMobileOpen: boolean;
    skipLinkId: string;
};
//# sourceMappingURL=Header.d.ts.map