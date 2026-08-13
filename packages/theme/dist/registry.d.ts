import { SemanticThemeTokens } from './tokens.js';
export type ThemeId = 'carchief' | 'ocean';
/** A complete semantic theme definition identified by its stable configuration name. */
export interface ThemeDefinition {
    id: ThemeId;
    tokens: SemanticThemeTokens;
}
export declare const themeRegistry: Readonly<Record<ThemeId, ThemeDefinition>>;
/** Resolves external configuration safely; unknown values always use the approved default. */
export declare function resolveThemeId(value: unknown): ThemeId;
export declare function getThemeDefinition(value?: unknown): ThemeDefinition;
export declare function getThemeTokens(value?: unknown): SemanticThemeTokens;
//# sourceMappingURL=registry.d.ts.map