import { NavItem } from './Header.js';
export interface NavigationDrawerProps {
    isOpen: boolean;
    navItems?: NavItem[];
}
export declare function renderNavigationDrawerConfig(props: NavigationDrawerProps): {
    landmark: string;
    role: string;
    ariaModal: boolean;
    isOpen: boolean;
    navItems: NavItem[];
};
//# sourceMappingURL=NavigationDrawer.d.ts.map