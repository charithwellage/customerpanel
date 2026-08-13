export interface NavItem {
  label: string;
  href: string;
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'ALL STOCK', href: '/allstock' },
  { label: 'PREMIUM STOCK', href: '/allstock?category=premium' },
  { label: 'HOW TO BUY', href: '/how-to-buy' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
  { label: 'TESTIMONIALS', href: '/testimonials' },
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
