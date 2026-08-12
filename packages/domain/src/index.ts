export type VehicleStatus =
  | 'Draft'
  | 'Available'
  | 'Pending'
  | 'Reserved'
  | 'ReservedWithPI'
  | 'InvoiceCreated'
  | 'Invoiced'
  | 'Sold';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'InProgress'
  | 'Sold'
  | 'Archived';

export type PaymentStatus = 'Pending' | 'Approved' | 'Rejected';
export type ShipmentStatus = 'Purchased' | 'Inspection' | 'Ready' | 'InTransit' | 'Delivered';
export type CustomerTier = 'Platinum' | 'Gold' | 'Silver' | 'Standard';

export type VehicleLocationStatus = 'In Japan' | 'In Transit' | 'In Port';
export type PublicVehicleCategory = 'arrival' | 'premium' | 'clearance' | 'best_offer';

export interface VehicleDomainSummary {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: VehicleStatus;
  category?: string;
  locationStatus?: VehicleLocationStatus;
  createdAt?: string;
  images?: string[];
  featured?: boolean;
  stockType?: 'J' | 'CRFO';
  destinationPort?: string;
  discountPercent?: number;

  // Phase 1.3 Extensions
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  mileage?: number;
  etd?: string;
  eta?: string;
  requestPrice?: boolean;
}

export interface FacetCount {
  name: string;
  count: number;
}

export interface RangeFacet<T = number> {
  min: T;
  max: T;
}

export interface VehicleFacets {
  makes: FacetCount[];
  bodyStyles: FacetCount[];
  fuelTypes: FacetCount[];
  yearRange: RangeFacet<number>;
  priceRange: RangeFacet<number>;
}

export interface VehicleSearchResult {
  items: VehicleDomainSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  facets: VehicleFacets;
}

export interface SearchVehiclesQuery {
  searchQuery?: string;
  make?: string;
  model?: string;
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  stockType?: string;
  locationStatus?: string;
  market?: string;
  destinationPort?: string;
  category?: string;
  collection?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc';
  page?: number;
  limit?: number;
}

export interface CategorizedPublicMedia {
  gallery: string[];
  auctionPictures?: string[];
  auctionSheet?: string[];
  japanPictures?: string[];
  durbanPictures?: string[];
  showAuctionPictures?: boolean;
  showJapanPictures?: boolean;
  showDurbanPictures?: boolean;
  totalPicturesCount: number;
}

export interface VehicleDetail {
  id: string;
  chassisNumber: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  priceState: 'priced' | 'request_price';
  priceUsd?: number;
  requestPrice: boolean;
  discountPercent?: number;
  discountedPriceUsd?: number;
  category?: string;
  locationStatus?: VehicleLocationStatus;
  stockType?: 'J' | 'CRFO';
  destinationPort?: string;
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  mileage?: number;
  engineSize?: string;
  color?: string;
  modelCode?: string;
  versionClass?: string;
  registerYear?: string;
  mfgYear?: string;
  dimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    m3?: number;
  };
  etd?: string;
  eta?: string;
  featured?: boolean;
  countryEligibility?: string[];
  media: CategorizedPublicMedia;
}

// --- Phase 1.5: freight destination, port and rate lookup (D01-ASM-001) ---
//
// `DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY` are OPEN. This task owns
// only the data model and lookup layer below; it never derives a formula and
// never computes a monetary total from a rate record (RULE-09, RULE-10). See
// tasks/delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md row D01-ASM-001.

export interface FreightDestination {
  code: string;
  name: string;
  country: string;
}

export interface FreightPort {
  code: string;
  name: string;
  country: string;
}

/**
 * Status of the freight-rate lookup for a destination/port pair as of the
 * evaluation instant.
 * - `active`: a supplied rate record is currently effective.
 * - `stale`: a supplied rate record exists but its effective window has
 *   already passed with no effective replacement.
 * - `no_rate`: no rate record has been supplied for this pair yet.
 */
export type FreightRateStatus = 'active' | 'stale' | 'no_rate';

/**
 * A freight rate record exactly as supplied by Finance/logistics. `amount`
 * and `currency` are stored verbatim; nothing in this task derives, rounds or
 * otherwise computes a total from them — that belongs to `D01-P05-T002` once
 * `DEC-PUB-FREIGHT-MODEL` resolves.
 */
export interface FreightRateRecord {
  destinationCode: string;
  portCode: string;
  currency: string;
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface FreightEstimateDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
}

export interface FreightEstimateRequest {
  destinationCode: string;
  portCode: string;
  dimensions?: FreightEstimateDimensions;
}

/**
 * The estimate operation exposes a single deterministic outcome while
 * `DEC-PUB-FREIGHT-MODEL` is unresolved: every supported destination/port
 * pair returns `estimate_unavailable_pending_rate`, distinguishable from an
 * error and from a zero/fabricated figure (D01-ASM-001). `rateStatus` and the
 * effective-date/currency fields are informational lookup context only —
 * this contract carries no monetary total field.
 */
export interface FreightEstimateResponse {
  outcome: 'estimate_unavailable_pending_rate';
  destinationCode: string;
  portCode: string;
  rateStatus: FreightRateStatus;
  currency?: string;
  rateEffectiveFrom?: string;
  rateEffectiveTo?: string;
  message: string;
}

// --- Phase 1.5: quotation enquiry (PUB-13, PUB-15, D01-P05-T004) ---
//
// The enquiry flow does not depend on `DEC-PUB-FREIGHT-MODEL` /
// `DEC-PUB-CITY-DELIVERY` (D01-ASM-001): a visitor can submit an enquiry
// about a specific vehicle, a specific destination, or neither, whether or
// not a priced freight estimate exists yet. When a destination/port pair is
// supplied the mock captures a snapshot of the current, server-resolved
// rate-lookup status alongside the enquiry for audit context — never a
// client-supplied or fabricated figure (RULE-09).

/**
 * Server-resolved freight rate-lookup context captured at the moment an
 * enquiry naming a destination/port pair is received. Informational only —
 * it carries no monetary total, matching `FreightEstimateResponse`.
 */
export interface EnquiryEstimateSnapshot {
  destinationCode: string;
  portCode: string;
  rateStatus: FreightRateStatus;
  currency?: string;
  rateEffectiveFrom?: string;
  rateEffectiveTo?: string;
  message: string;
}

// --- Phase 1.6: lead and enquiry contracts (PUB-13, PUB-14, PUB-16, PUB-28,
// PUB-34, D01-P06-T001) ---
//
// `enquiryType` preserves what kind of enquiry this was (general, vehicle,
// price-request or Premium Vehicle) for later staff triage — support-
// screening and country assignment remain later staff workflow states
// (Phase 1.6 CONTEXT.md §2). `source` preserves the approved public contact
// channel the visitor used. WhatsApp/email/call remain contact *intent*
// only: no external notification or provider delivery is implemented or
// claimed by this contract (RULE-10, DEC-WF-EXTERNAL-BOUNDARIES).

export type EnquiryType = 'general' | 'vehicle' | 'price-request' | 'premium-vehicle';
export type EnquirySource = 'form' | 'whatsapp' | 'email' | 'call';
export type EnquiryPreferredDriveSide = 'left' | 'right';

export const ENQUIRY_TYPES: readonly EnquiryType[] = ['general', 'vehicle', 'price-request', 'premium-vehicle'];
export const ENQUIRY_SOURCES: readonly EnquirySource[] = ['form', 'whatsapp', 'email', 'call'];
export const ENQUIRY_PREFERRED_DRIVE_SIDES: readonly EnquiryPreferredDriveSide[] = ['left', 'right'];

/**
 * A visitor-submitted enquiry (PUB-13): a general enquiry, an enquiry about a
 * specific vehicle, or a quotation enquiry naming a shipping destination —
 * any combination of `vehicleSlug`/`destinationCode`+`portCode` is valid, and
 * none is required beyond the contact fields themselves. `enquiryType` and
 * `source` are optional on the request; the server resolves and persists a
 * definite value for both (never left ambiguous) — see `EnquiryResponse`.
 * `consent` is required (D01-P06-T002, PUB-14): the server rejects any
 * request that does not explicitly agree to be contacted, beyond what a
 * browser's own native checkbox validation would catch. The `preferred*`
 * fields are an optional vehicle-preference capture (D01-P06-T002 "In
 * scope") for a visitor who has no specific vehicle in mind yet — informal
 * intent only, never a saved search or matching guarantee.
 */
export interface EnquiryRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  vehicleSlug?: string;
  destinationCode?: string;
  portCode?: string;
  enquiryType?: EnquiryType;
  source?: EnquirySource;
  preferredMake?: string;
  preferredModel?: string;
  preferredDriveSide?: EnquiryPreferredDriveSide;
  preferredYear?: number;
  targetPriceUsd?: number;
}

/**
 * Receipt confirmation returned after a successful submission (PUB-15). This
 * confirms only that the enquiry was received and persisted — it never
 * claims a staff member was notified, contacted, or that any downstream
 * action occurred (RULE-10). `duplicate` is true when an identical enquiry
 * (same contact, vehicle, destination, enquiry type and message) was already
 * on file and this submission was not persisted again, rather than silently
 * discarded (RULE-08) — the visitor still receives their original receipt.
 */
export interface EnquiryResponse {
  id: string;
  receivedAt: string;
  status: 'received';
  duplicate: boolean;
  enquiryType: EnquiryType;
  source: EnquirySource;
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
}

/**
 * The canonical staff-visible lead record a submitted enquiry becomes,
 * retrievable through the future Salesperson service boundary (PUB-16). This
 * is the explicit regression fix for the POC disconnected-lead defect: a
 * submitted enquiry must be readable back through a staff-facing operation,
 * not only writable from the public form. `status` starts and stays `'New'`
 * in this task's scope — later staff workflow transitions (contacted,
 * archived, ...) are a future task, not invented here. `duplicateResubmissionCount`
 * is the audit/activity signal (D01-P06-T001 "In scope") that an identical
 * enquiry was resubmitted, without inventing a full activity-log subsystem.
 */
export interface LeadRecord {
  id: string;
  receivedAt: string;
  status: LeadStatus;
  enquiryType: EnquiryType;
  source: EnquirySource;
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
  duplicateResubmissionCount: number;
  preferredMake?: string;
  preferredModel?: string;
  preferredDriveSide?: EnquiryPreferredDriveSide;
  preferredYear?: number;
  targetPriceUsd?: number;
}

/** Staff-facing lead list proof operation (PUB-16, D01-P06-T001). */
export interface LeadListResponse {
  items: LeadRecord[];
  total: number;
}

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
export const RESERVATION_HOLD_HOURS = 48;
export const MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER = 3;

export type ReservationStatus = 'active' | 'expired';

export interface ReservationRequest {
  vehicleSlug: string;
}

/**
 * A persisted reservation, returned both from the create operation and the
 * read-by-id operation. `customerEmail` is the requesting customer's own
 * contact detail, not a third party's private field — the read operation is
 * gated to the owning customer or a staff identity with `read:leads`
 * (never a public, unauthenticated response).
 */
export interface ReservationResponse {
  id: string;
  vehicleSlug: string;
  vehicleId: string;
  customerId: string;
  customerEmail: string;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string;
  holdHours: number;
}

/**
 * Public branding/site configuration (`GET /api/v1/config/public`).
 * `liveAuctionUrl` gates the account-gated Live Auction entry (PUB-27,
 * D01-P06-T003, `D01-ASM-002`): absent/undefined means no approved external
 * destination is configured, so the entry point is never rendered — this
 * repo never claims a live auction capability it does not have (RULE-10).
 */
export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
  liveAuctionUrl?: string;
}

export function generateVehicleSlug(year: number, make: string, model: string, id: string): string {
  const raw = `${year}-${make}-${model}-${id}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export * from './auth.js';
export * from './freight.js';
