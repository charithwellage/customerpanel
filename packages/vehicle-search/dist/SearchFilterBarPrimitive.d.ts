import type { SearchVehiclesQuery, VehicleFacets } from '@carchief/domain';
import type { UnderstoodToken } from './parser.js';
export interface SearchFilterBarPrimitiveProps {
    query: SearchVehiclesQuery;
    facets?: VehicleFacets;
    naturalPhrase: string;
    understoodTokens: UnderstoodToken[];
    onNaturalPhraseChange: (phrase: string) => void;
    onApplyNaturalSearch: () => void;
    onUpdateQuery: (updates: Partial<SearchVehiclesQuery>) => void;
    onResetFilters: () => void;
}
export declare function SearchFilterBarPrimitive({ query, facets, naturalPhrase, understoodTokens, onNaturalPhraseChange, onApplyNaturalSearch, onUpdateQuery, onResetFilters, }: SearchFilterBarPrimitiveProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SearchFilterBarPrimitive.d.ts.map