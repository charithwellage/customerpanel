export interface ColorTokens {
  primary: string;
  primaryHover: string;
  /**
   * Secondary brand accent used for gradient highlights and CTA emphasis
   * (e.g. the home hero's title/button gradient stop, the active nav pill).
   * Distinct from `primary`: some POC-era markup composed a two-tone
   * primary -> accent gradient rather than a single flat brand colour.
   */
  accent: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceDark: string;
  textPrimary: string;
  textSecondary: string;
  textOnDark: string;
  textOnPrimary: string;
  border: string;
  focus: string;
  success: string;
  successSurface: string;
  warning: string;
  warningSurface: string;
  error: string;
  errorSurface: string;
  info: string;
  infoSurface: string;
  neutralSurface: string;
}

export interface SpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface TypographyTokens {
  fontFamily: string;
  fontDisplay: string;
  fontMono: string;
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  weights: {
    regular: number;
    medium: number;
    bold: number;
  };
}

export interface BreakpointTokens {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
}

export interface MotionTokens {
  durationFast: string;
  durationNormal: string;
  durationSlow: string;
  easing: string;
}

export interface RadiusTokens {
  sm: string;
  md: string;
  lg: string;
  pill: string;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
}

export interface AccessibilityTokens {
  focusRingWidth: string;
  minTouchTarget: string;
}

export interface SemanticThemeTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  breakpoints: BreakpointTokens;
  motion: MotionTokens;
  radii: RadiusTokens;
  shadows: ShadowTokens;
  accessibility: AccessibilityTokens;
}

export const defaultSemanticTheme: SemanticThemeTokens = {
  colors: {
    primary: '#dc2626', // POC red; AA contrast against white
    primaryHover: '#b91c1c',
    accent: '#ea580c', // POC hero gradient/active-nav orange
    secondary: '#525252',
    background: '#fafafa',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceDark: '#171717',
    textPrimary: '#171717',
    textSecondary: '#525252',
    textOnDark: '#fafafa',
    textOnPrimary: '#ffffff',
    border: '#e5e5e5',
    focus: '#b91c1c',
    success: '#166534',
    successSurface: '#dcfce7',
    warning: '#92400e',
    warningSurface: '#fef3c7',
    error: '#b91c1c',
    errorSurface: '#fee2e2',
    info: '#1d4ed8',
    infoSurface: '#dbeafe',
    neutralSurface: '#f5f5f5',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontDisplay: '"Space Grotesk", Inter, system-ui, sans-serif',
    fontMono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
    weights: {
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
  motion: {
    durationFast: '150ms',
    durationNormal: '300ms',
    durationSlow: '500ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    pill: '999px',
  },
  shadows: {
    sm: '0 1px 2px rgb(23 23 23 / 0.08)',
    md: '0 4px 16px rgb(23 23 23 / 0.10)',
    lg: '0 12px 30px rgb(23 23 23 / 0.14)',
  },
  accessibility: {
    focusRingWidth: '3px',
    minTouchTarget: '44px',
  },
};
