export interface NavItem {
  label: string;
  href: string;
}

export const PUBLIC_NAV_ITEMS: NavItem[] = [
  { label: 'SHOWROOM', href: '/' },
  { label: 'ALL STOCK', href: '/allstock' },
  { label: 'Clearance Stock', href: '/clearance-stock' },
  { label: 'PREMIUM STOCK', href: '/#premium-stock' },
  { label: 'SERVICES', href: '/services' },
  { label: 'HOW TO BUY', href: '/how-to-buy' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'TESTIMONIALS', href: '/testimonials' },
  { label: 'FAQ', href: '/faq' },
  { label: 'CONTACT', href: '/contact' },
];

/**
 * Resolves the Customer application's sign-in entry point (D02-P12-T003,
 * CUST-27) from configuration, never a hard-coded host. Customer-app has no
 * router (its `App.tsx` is a `pathname`-driven chain and pre-authentication
 * screens are gated by `AccountGuard`, not a route — see this phase's
 * `CONTEXT.md` §5), so its own root path renders the sign-in form whenever
 * no session is stored. `NEXT_PUBLIC_CUSTOMER_APP_URL` follows the same
 * build-time `NEXT_PUBLIC_*` convention already used for
 * `NEXT_PUBLIC_SITE_URL`/`NEXT_PUBLIC_THEME_ID`; it carries only a base URL,
 * never a secret. The `127.0.0.1:3001` fallback matches this repo's default
 * Profile A/B customer-app port (`docker-compose.frontend.yml`,
 * `TASK_EXECUTION_PROTOCOL.md` §3).
 */
export function resolveCustomerAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL;
  const browserFallback = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://127.0.0.1:3001';
  const base = configured && configured.trim() ? configured.trim() : browserFallback;
  return base.replace(/\/$/, '');
}

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
