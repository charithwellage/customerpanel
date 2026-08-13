export interface NavItem {
  label: string;
  href: string;
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'SHOWROOM', href: '/' },
  { label: 'ALL STOCK', href: '/allstock' },
  { label: 'PREMIUM STOCK', href: '/#premium-stock' },
  { label: 'HOW TO BUY', href: '/how-to-buy' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'TESTIMONIALS', href: '/testimonials' },
  { label: 'FAQ', href: '/faq' },
  { label: 'CONTACT', href: '/contact' },
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
