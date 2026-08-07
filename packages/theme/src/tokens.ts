export interface ColorTokens {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
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

export interface SemanticThemeTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  breakpoints: BreakpointTokens;
  motion: MotionTokens;
}

export const defaultSemanticTheme: SemanticThemeTokens = {
  colors: {
    primary: '#1d4ed8', // AA contrast against #ffffff (4.5:1+)
    primaryHover: '#1e40af',
    secondary: '#0f766e',
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#0f172a', // 15.6:1 contrast against #ffffff
    textSecondary: '#475569', // 4.6:1 contrast against #ffffff
    border: '#cbd5e1',
    success: '#15803d',
    warning: '#b45309',
    error: '#b91c1c',
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
};
