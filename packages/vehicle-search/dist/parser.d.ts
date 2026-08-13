import type { SearchVehiclesQuery } from '@carchief/domain';
export interface UnderstoodToken {
    token: string;
    field: string;
    label: string;
}
export interface ParsedNaturalQueryResult {
    rawQuery: string;
    parsedParams: SearchVehiclesQuery;
    understoodTokens: UnderstoodToken[];
    unparsedQuery: string;
}
/**
 * Deterministic natural language query parser for vehicle search.
 * Parses user input into structured search parameters without invoking AI APIs.
 */
export declare function parseNaturalSearchQuery(query: string): ParsedNaturalQueryResult;
//# sourceMappingURL=parser.d.ts.map