export function calculateTierPricing(priceUsd, tier = 'Standard', tierDiscountPercent = 0) {
    const tierPriceUsd = tierDiscountPercent > 0
        ? Math.round(priceUsd * (1 - tierDiscountPercent / 100))
        : priceUsd;
    return {
        tier,
        tierDiscountPercent,
        tierPriceUsd,
        originalPriceUsd: priceUsd,
    };
}
export const ENQUIRY_TYPES = ['general', 'vehicle', 'price-request', 'premium-vehicle'];
export const ENQUIRY_SOURCES = ['form', 'whatsapp', 'email', 'call'];
export const ENQUIRY_PREFERRED_DRIVE_SIDES = ['left', 'right'];
// --- Phase 1.6: transactional reservation eligibility and hold (PUB-23,
// RULE-05, RULE-08, RULE-10, D01-P06-T004) ---
//
// A reservation is a transactional 48-hour hold on one vehicle for one
// authenticated demo customer (`DEC-PUB-AUTH-BOUNDARY`). `status` is always
// computed live from `expiresAt` versus the current instant — never a stored
// field flipped by a background job — because `DEC-PUB-RESERVATION-EXPIRY-ACTION`
// is OPEN: automatic versus manual release is unconfirmed, so this contract
// exposes the expiry timestamp and lets a caller derive "active"/"expired"
// itself, but never claims an automatic release action occurred (RULE-10).
// `RESERVATION_HOLD_HOURS` matches RULE-05's default; an administrator
// changing the hold duration is out of this task's scope. Reservation quotas
// are database-backed customer-tier benefits enforced by the mock store.
export const RESERVATION_HOLD_HOURS = 48;
/**
 * Vehicle statuses a fresh reservation attempt may ever apply to, once any
 * blocking active hold on that vehicle is excluded (checked separately as
 * `conflict`/`duplicate`). Shared by the mock's server-authoritative
 * eligibility check and the public UI's honest "not available to reserve"
 * empty state (RULE-09) — the browser never invents or forks this
 * vocabulary; it only uses it to decide whether to show a Reserve action at
 * all, never to grant eligibility itself.
 */
export const RESERVABLE_VEHICLE_STATUSES = ['Available'];
export function generateVehicleSlug(year, make, model, id) {
    const raw = `${year}-${make}-${model}-${id}`;
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
export const DEPOSIT_PERCENT_RULE_07 = 30;
/**
 * Computes the 30% deposit requirement for vehicles under negotiation with PI (RULE-07).
 */
export function calculateVehicleDeposit(totalAmountUsd, paidAmountUsd = 0) {
    const requiredAmountUsd = Math.round(totalAmountUsd * (DEPOSIT_PERCENT_RULE_07 / 100));
    const remainingAmountUsd = Math.max(0, requiredAmountUsd - paidAmountUsd);
    return {
        requiredPercent: DEPOSIT_PERCENT_RULE_07,
        requiredAmountUsd,
        paidAmountUsd,
        remainingAmountUsd,
    };
}
/**
 * Calculates remaining balance and payment status for an invoice.
 */
export function calculateInvoiceBalance(totalAmountUsd, paidAmountUsd) {
    const outstandingAmountUsd = Math.max(0, totalAmountUsd - paidAmountUsd);
    return {
        outstandingAmountUsd,
        isFullyPaid: outstandingAmountUsd === 0,
    };
}
export * from './auth.js';
export * from './freight.js';
export * from './content.js';
export * from './countries.js';
export * from './compliance.js';
export * from './i18n.js';
//# sourceMappingURL=index.js.map