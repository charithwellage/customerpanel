import type {
  FreightDestination,
  FreightPort,
  FreightRateRecord,
  FreightRateStatus,
  FreightEstimateRequest,
  FreightEstimateResponse,
} from './index.js';

// --- Phase 1.5: freight calculation (D01-P05-T002, D01-ASM-001) ---
//
// This module is the single authoritative home for the freight-estimate
// calculation sequence (PUB-12). `DEC-PUB-FREIGHT-MODEL` and
// `DEC-PUB-CITY-DELIVERY` are OPEN, so no cubic-volume, freight,
// city-delivery, insurance, discount or total formula exists here — RULE-09
// forbids filling that gap with a plausible-looking number that was not
// calculated from anything, and RULE-10 forbids claiming a capability (a
// priced estimate) that does not exist yet.
//
// `calculateFreightEstimate` is nonetheless the real calculation-sequence
// entry point: it validates the request, resolves the rate-lookup context,
// and reaches the single marked insertion point below where the approved
// cubic-volume/freight/city-delivery/insurance/discount/total sequence will
// be implemented once the decisions resolve (Branch A of D01-P05-T002). Until
// then it takes the documented no-op path and returns the deterministic
// `estimate_unavailable_pending_rate` outcome for every supported
// destination/port pair — a structural passthrough, not a stub that needs
// rewriting later. See
// tasks/delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md row D01-ASM-001.

export class FreightRequestError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;

  constructor(statusCode: number, message: string, field?: string) {
    super(message);
    this.name = 'FreightRequestError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

/**
 * Pure rate-lookup resolution for a destination/port pair as of `nowISO`.
 * Selects the most recent rate record whose `effectiveFrom` has already
 * started and reports whether it is still open (`active`), has closed
 * (`stale`), or whether no started record exists at all (`no_rate`). This is
 * lookup context only — it never derives a total from `record.amount`.
 */
export function resolveFreightRateStatus(
  records: FreightRateRecord[],
  destinationCode: string,
  portCode: string,
  nowISO: string
): { status: FreightRateStatus; record?: FreightRateRecord } {
  const matches = records.filter((r) => r.destinationCode === destinationCode && r.portCode === portCode);
  if (matches.length === 0) {
    return { status: 'no_rate' };
  }

  const now = new Date(nowISO).getTime();
  // The record with the latest effectiveFrom that has already started.
  const started = matches
    .filter((r) => new Date(r.effectiveFrom).getTime() <= now)
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime());

  if (started.length === 0) {
    // Only future-dated records exist; nothing is effective yet.
    return { status: 'no_rate' };
  }

  const candidate = started[0];
  const stillOpen = !candidate.effectiveTo || new Date(candidate.effectiveTo).getTime() >= now;
  return stillOpen ? { status: 'active', record: candidate } : { status: 'stale', record: candidate };
}

/**
 * Validates a freight-estimate request against the supported destination and
 * port catalogs and, when dimensions are supplied, that each is a positive
 * finite number. Throws a field-associated `FreightRequestError` (400) so an
 * invalid request or an unsupported destination/port stays distinguishable
 * from the honest `estimate_unavailable_pending_rate` outcome — they are
 * different states, never conflated.
 */
export function validateFreightEstimateRequest(
  destinations: FreightDestination[],
  ports: FreightPort[],
  request: FreightEstimateRequest
): void {
  if (!request || typeof request.destinationCode !== 'string' || !request.destinationCode.trim()) {
    throw new FreightRequestError(400, 'destinationCode is required', 'destinationCode');
  }
  if (!request || typeof request.portCode !== 'string' || !request.portCode.trim()) {
    throw new FreightRequestError(400, 'portCode is required', 'portCode');
  }
  if (!destinations.some((d) => d.code === request.destinationCode)) {
    throw new FreightRequestError(400, `Unsupported destination '${request.destinationCode}'`, 'destinationCode');
  }
  if (!ports.some((p) => p.code === request.portCode)) {
    throw new FreightRequestError(400, `Unsupported port '${request.portCode}'`, 'portCode');
  }
  if (request.dimensions) {
    const { lengthMm, widthMm, heightMm } = request.dimensions;
    for (const [field, value] of Object.entries({ lengthMm, widthMm, heightMm })) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        throw new FreightRequestError(400, `dimensions.${field} must be a positive number`, `dimensions.${field}`);
      }
    }
  }
}

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
export function calculateFreightEstimate(
  destinations: FreightDestination[],
  ports: FreightPort[],
  records: FreightRateRecord[],
  request: FreightEstimateRequest,
  nowISO: string
): FreightEstimateResponse {
  validateFreightEstimateRequest(destinations, ports, request);

  const { status, record } = resolveFreightRateStatus(records, request.destinationCode, request.portCode, nowISO);

  // --- Calculation-sequence insertion point (Branch A, D01-P05-T002) ---
  // DEC-PUB-FREIGHT-MODEL / DEC-PUB-CITY-DELIVERY: OPEN. No cubic-volume,
  // freight, city-delivery, insurance, discount or total formula is invented
  // here (RULE-09, RULE-10). D01-ASM-001 authorizes this no-op path.
  return {
    outcome: 'estimate_unavailable_pending_rate',
    destinationCode: request.destinationCode,
    portCode: request.portCode,
    rateStatus: status,
    currency: record?.currency,
    rateEffectiveFrom: record?.effectiveFrom,
    rateEffectiveTo: record?.effectiveTo,
    message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
  };
}
