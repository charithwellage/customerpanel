"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVABLE_VEHICLE_STATUSES = exports.MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER = exports.RESERVATION_HOLD_HOURS = exports.ENQUIRY_PREFERRED_DRIVE_SIDES = exports.ENQUIRY_SOURCES = exports.ENQUIRY_TYPES = void 0;
exports.generateVehicleSlug = generateVehicleSlug;
exports.ENQUIRY_TYPES = ['general', 'vehicle', 'price-request', 'premium-vehicle'];
exports.ENQUIRY_SOURCES = ['form', 'whatsapp', 'email', 'call'];
exports.ENQUIRY_PREFERRED_DRIVE_SIDES = ['left', 'right'];
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
// changing it is out of this task's scope. `MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER`
// is a safe MVP anti-abuse ceiling applied uniformly to every `CustomerBuyer`
// — no approved per-tier reservation-count limit exists anywhere in
// `REQUIREMENT.md`, and `CustomerTier` is not part of the demo session's
// claims, so no tier-differentiated figure is invented here (see
// `tasks/delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md` row `D01-ASM-003`).
exports.RESERVATION_HOLD_HOURS = 48;
exports.MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER = 3;
/**
 * Vehicle statuses a fresh reservation attempt may ever apply to, once any
 * blocking active hold on that vehicle is excluded (checked separately as
 * `conflict`/`duplicate`). Shared by the mock's server-authoritative
 * eligibility check and the public UI's honest "not available to reserve"
 * empty state (RULE-09) — the browser never invents or forks this
 * vocabulary; it only uses it to decide whether to show a Reserve action at
 * all, never to grant eligibility itself.
 */
exports.RESERVABLE_VEHICLE_STATUSES = ['Available', 'Reserved'];
function generateVehicleSlug(year, make, model, id) {
    const raw = `${year}-${make}-${model}-${id}`;
    return raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
__exportStar(require("./auth.js"), exports);
__exportStar(require("./freight.js"), exports);
__exportStar(require("./content.js"), exports);
//# sourceMappingURL=index.js.map