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
export declare const defaultSemanticTheme: SemanticThemeTokens;
//# sourceMappingURL=tokens.d.ts.map