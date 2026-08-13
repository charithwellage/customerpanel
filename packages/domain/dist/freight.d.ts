import type { FreightDestination, FreightPort, FreightRateRecord, FreightRateStatus, FreightEstimateRequest, FreightEstimateResponse } from './index.js';
export declare class FreightRequestError extends Error {
    readonly statusCode: number;
    readonly field?: string;
    constructor(statusCode: number, message: string, field?: string);
}
/**
 * Pure rate-lookup resolution for a destination/port pair as of `nowISO`.
 * Selects the most recent rate record whose `effectiveFrom` has already
 * started and reports whether it is still open (`active`), has closed
 * (`stale`), or whether no started record exists at all (`no_rate`). This is
 * lookup context only — it never derives a total from `record.amount`.
 */
export declare function resolveFreightRateStatus(records: FreightRateRecord[], destinationCode: string, portCode: string, nowISO: string): {
    status: FreightRateStatus;
    record?: FreightRateRecord;
};
/**
 * Validates a freight-estimate request against the supported destination and
 * port catalogs and, when dimensions are supplied, that each is a positive
 * finite number. Throws a field-associated `FreightRequestError` (400) so an
 * invalid request or an unsupported destination/port stays distinguishable
 * from the honest `estimate_unavailable_pending_rate` outcome — they are
 * different states, never conflated.
 */
export declare function validateFreightEstimateRequest(destinations: FreightDestination[], ports: FreightPort[], request: FreightEstimateRequest): void;
/**
 * The freight-estimate calculation sequence (PUB-12). Validates the request,
 * resolves the rate-lookup context, then reaches the calculation-sequence
 * insertion point below.
 *
 * Insertion point for Branch A of D01-P05-T002: once `DEC-PUB-FREIGHT-MODEL`
 * and `DEC-PUB-CITY-DELIVERY` are `RESOLVED`, the approved cubic-volume,
 * freight, city-delivery, insurance, discount and total sequence is
 * implemented exactly here, consuming `dimensions`, `status` and `record`,
 * and the return value gains the approved monetary line items and total. No
 * other call site needs to change.
 *
 * Until that decision resolves, this function takes the documented no-op
 * path (D01-ASM-001) and returns the deterministic
 * `estimate_unavailable_pending_rate` outcome for every supported
 * destination/port pair, regardless of `rateStatus`. `rateStatus`, currency
 * and effective-date fields remain informational lookup context only — this
 * contract never carries a monetary total field while the decisions are
 * open (RULE-09, RULE-10).
 */
export declare function calculateFreightEstimate(destinations: FreightDestination[], ports: FreightPort[], records: FreightRateRecord[], request: FreightEstimateRequest, nowISO: string): FreightEstimateResponse;
//# sourceMappingURL=freight.d.ts.map