import { renderHeaderConfig, HeaderProps } from './Header.js';
import { renderFooterConfig, FooterProps } from './Footer.js';
import { renderNavigationDrawerConfig } from './NavigationDrawer.js';
import { getThemeCssVariables, defaultSemanticTheme } from '@carchief/theme';

export interface LayoutShellConfigProps {
  headerProps?: HeaderProps;
  footerProps?: FooterProps;
  activePath?: string;
  isMobileDrawerOpen?: boolean;
}

export function renderLayoutShellConfig(props: LayoutShellConfigProps = {}) {
  const header = renderHeaderConfig(props.headerProps);
  const footer = renderFooterConfig(props.footerProps);
  const drawer = renderNavigationDrawerConfig({
    isOpen: !!props.isMobileDrawerOpen,
    navItems: header.navItems,
  });

  return {
    landmarks: {
      skipLink: { id: 'skip-to-main', label: 'Skip to main content', href: '#main-content' },
      header,
      navigation: { landmark: 'nav', ariaLabel: 'Main Navigation', activePath: props.activePath || '/' },
      main: { landmark: 'main', id: 'main-content', tabindex: -1 },
      footer,
      drawer,
    },
    themeVariables: getThemeCssVariables(defaultSemanticTheme),
  };
}
