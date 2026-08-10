import { PUBLIC_NAV_ITEMS, NavItem } from './Header';

export interface NavigationDrawerProps {
  isOpen: boolean;
  navItems?: NavItem[];
}

export function renderNavigationDrawerConfig(props: NavigationDrawerProps) {
  return {
    landmark: 'nav',
    role: 'dialog',
    ariaModal: true,
    isOpen: props.isOpen,
    navItems: props.navItems || PUBLIC_NAV_ITEMS,
  };
}
