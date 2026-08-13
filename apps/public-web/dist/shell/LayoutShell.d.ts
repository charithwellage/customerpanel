import { HeaderProps } from './Header.js';
import { FooterProps } from './Footer.js';
export interface LayoutShellConfigProps {
    headerProps?: HeaderProps;
    footerProps?: FooterProps;
    activePath?: string;
    isMobileDrawerOpen?: boolean;
}
export declare function renderLayoutShellConfig(props?: LayoutShellConfigProps): {
    landmarks: {
        skipLink: {
            id: string;
            label: string;
            href: string;
        };
        header: {
            landmark: string;
            siteName: string;
            navItems: import("./Header.js").NavItem[];
            isMobileOpen: boolean;
            skipLinkId: string;
        };
        navigation: {
            landmark: string;
            ariaLabel: string;
            activePath: string;
        };
        main: {
            landmark: string;
            id: string;
            tabindex: number;
        };
        footer: {
            landmark: string;
            copyright: string;
            contactPhone: string;
        };
        drawer: {
            landmark: string;
            role: string;
            ariaModal: boolean;
            isOpen: boolean;
            navItems: import("./Header.js").NavItem[];
        };
    };
    themeVariables: Record<string, string>;
};
//# sourceMappingURL=LayoutShell.d.ts.map