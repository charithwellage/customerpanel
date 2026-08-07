export interface NavItem {
  label: string;
  href: string;
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'How to Buy', href: '/how-to-buy' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

export interface HeaderProps {
  siteName?: string;
  navItems?: NavItem[];
  isMobileOpen?: boolean;
}

export function renderHeaderConfig(props: HeaderProps = {}) {
  const siteName = props.siteName || 'CarChief';
  const navItems = props.navItems || PUBLIC_NAV_ITEMS;

  return {
    landmark: 'header',
    siteName,
    navItems,
    isMobileOpen: !!props.isMobileOpen,
    skipLinkId: 'skip-to-main',
  };
}
