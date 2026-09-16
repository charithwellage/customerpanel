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
  /**
   * Text colour for content placed directly on the `accent` background
   * (`.hero-btn-primary`, `.nav-link-active`). Deliberately a separate token
   * from `textOnPrimary`: `accent` and `primary` are unrelated hues/luminances
   * per theme (carchief's accent orange is lighter than its primary red;
   * ocean's accent teal is darker than carchief's), so a single shared value
   * cannot pass WCAG AA against both — each theme calibrates its own.
   */
  textOnAccent: string;
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
    primary: '#c8102e', // CarChief Red brand accent
    primaryHover: '#a00c24',
    accent: '#0f172a', // Sleek Slate-900
    secondary: '#475569', // Slate-600
    background: '#f8fafc', // Slate-50 background matching chiefdesign.netlify.app
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceDark: '#0f172a',
    textPrimary: '#0f172a', // Slate-900 text
    textSecondary: '#64748b', // Slate-500 text
    textOnDark: '#ffffff',
    textOnPrimary: '#ffffff',
    textOnAccent: '#ffffff',
    border: 'rgba(0, 0, 0, 0.08)', // Crisp bento card border
    focus: '#c8102e',
    success: '#047857',
    successSurface: '#ecfdf5',
    warning: '#92400e',
    warningSurface: '#fffbeb',
    error: '#c8102e',
    errorSurface: '#fef2f2',
    info: '#0369a1',
    infoSurface: '#f0f9ff',
    neutralSurface: '#f8fafc',
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
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    fontDisplay: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    fontMono: '"SF Mono", -apple-system, BlinkMacSystemFont, "Segoe UI Mono", Menlo, Monaco, Consolas, monospace',
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
      bold: 600,
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
