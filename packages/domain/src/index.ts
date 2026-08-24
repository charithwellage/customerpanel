import type { VehicleComplianceEvaluation } from './compliance.js';

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

export type PaymentStatus = 'Pending' | 'Held' | 'Resubmitted' | 'Approved' | 'Rejected';
export type PaymentProofFileType = 'PDF' | 'JPG' | 'PNG';
export type PaymentProofScanStatus = 'Pending' | 'Passed' | 'Rejected';

export interface BankAccount {
  id: string;
  bankName: string;
  swiftCode?: string;
  branchName?: string;
  branchCode?: string;
  bankAddress?: string;
  accountName: string;
  accountNo: string;
  currency: string;
  logoUrl?: string;
  type: 'WIRE' | 'PAYPAL';
}

export interface CustomerPaymentProofMetadata {
  fileName: string;
  fileType: PaymentProofFileType;
  sizeBytes: number;
  scanStatus: PaymentProofScanStatus;
}

export interface CustomerPaymentAllocation {
  id: string;
  stockNumber: string;
  lastAllocationDate: string;
  ttNumber: string;
  allocationAmountUsd: number;
  fileName?: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  invoiceId?: string;
  reference: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  allocatedAmountUsd?: number;
  remainingBalanceUsd?: number;
  depositorName?: string;
  receivingBank?: string;
  customerName?: string;
  approvedDate?: string;
  financeNote?: string;
  allocations?: CustomerPaymentAllocation[];
  documents?: Array<{ name: string; url: string }>;
  paymentDate: string;
  remarks?: string;
  status: PaymentStatus;
  holdReason?: string;
  proof?: CustomerPaymentProofMetadata;
  idempotencyKey: string;
  createdAt: string;
}

export interface CreateCustomerPaymentRequest {
  /** Optional because a bulk TT can be verified before sales staff allocate it and issue its invoice. */
  invoiceId?: string;
  reference: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  paymentDate: string;
  remarks?: string;
  proof: CustomerPaymentProofMetadata;
  idempotencyKey: string;
}

export interface RecordPaymentNotificationRequest {
  event: CustomerPaymentNotificationEvent;
  reason?: string;
  allocationAmountUsd?: number;
}

export interface CustomerPaymentListResponse {
  items: CustomerPayment[];
  total: number;
}

export type CustomerPaymentPurpose = 'Advance' | 'Balance';
export type CustomerPaymentAllocationStatus = 'Unallocated' | 'PartiallyAllocated' | 'FullyAllocated';

export interface CustomerPaymentAllocationVehicle {
  id: string;
  slug: string;
  stockNumber: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  primaryImage?: string;
}

export interface CustomerPaymentAllocationLine {
  id: string;
  vehicle: CustomerPaymentAllocationVehicle;
  invoiceId?: string;
  invoiceNumber?: string;
  amountUsd: number;
  vehicleTotalAmountUsd: number;
  vehicleAllocatedAmountUsd: number;
  vehicleBalanceAmountUsd: number;
  purpose: CustomerPaymentPurpose;
  status: 'Approved' | 'Pending' | 'Rejected';
  allocatedAt: string;
}

export interface CustomerPaymentAllocationInvoice {
  id: string;
  invoiceNumber: string;
  issuedAt: string;
  totalAmountUsd: number;
  paidAmountUsd: number;
  outstandingAmountUsd: number;
  status: CustomerInvoiceStatus;
  vehicleCount: number;
  documentAvailable: boolean;
}

export interface CustomerPaymentAllocationSummary {
  id: string;
  reference: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  paymentDate: string;
  paymentStatus: PaymentStatus;
  allocationStatus: CustomerPaymentAllocationStatus;
  allocatedAmountUsd: number;
  unallocatedAmountUsd: number;
  allocationPercent: number;
  vehicleCount: number;
  allocations: CustomerPaymentAllocationLine[];
  invoice?: CustomerPaymentAllocationInvoice;
}

export interface ListCustomerPaymentAllocationsQuery {
  query?: string;
  paymentStatus?: PaymentStatus | string;
  allocationStatus?: CustomerPaymentAllocationStatus | string;
  purpose?: CustomerPaymentPurpose | string;
  scope?: 'SingleVehicle' | 'MultipleVehicles' | string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface CustomerPaymentAllocationListResponse {
  items: CustomerPaymentAllocationSummary[];
  total: number;
  page: number;
  limit: number;
  totals: {
    totalAmountUsd: number;
    allocatedAmountUsd: number;
    unallocatedAmountUsd: number;
    invoiceCount: number;
  };
}

export type CustomerPaymentNotificationEvent =
  | 'FinanceReviewRequested'
  | 'PaymentHeld'
  | 'PaymentResubmitted'
  | 'PaymentApproved'
  | 'PaymentAllocated';

export interface CustomerPaymentNotification {
  id: string;
  customerId: string;
  paymentId: string;
  invoiceId: string;
  event: CustomerPaymentNotificationEvent;
  createdAt: string;
}

export interface CustomerPaymentNotificationListResponse {
  items: CustomerPaymentNotification[];
  total: number;
}
export type ShipmentStatus = 'Purchased' | 'Inspection' | 'Ready' | 'InTransit' | 'Delivered';
export type VehicleLocationStatus = 'In Japan' | 'In Transit' | 'In Port';
export type PublicVehicleCategory = 'arrival' | 'premium' | 'clearance' | 'best_offer';

export interface CustomerTierRule {
  tier: CustomerTier;
  discountPercent: number;
  maxActiveReservations: number;
  description: string;
  active: boolean;
}

export interface CustomerTierBenefits {
  tier: CustomerTier;
  discountPercent: number;
  maxActiveReservations: number;
  activeReservations: number;
  remainingReservations: number;
  description: string;
}

/** Database-backed vehicle status catalogue entry used by customer projections. */
export interface VehicleStatusDefinition {
  code: VehicleStatus;
  singularLabel: string;
  pluralLabel: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface VehicleTierPricing {
  tier: CustomerTier;
  tierDiscountPercent: number;
  tierPriceUsd: number;
  originalPriceUsd: number;
}

export function calculateTierPricing(priceUsd: number, tier: CustomerTier = 'Standard', tierDiscountPercent = 0): VehicleTierPricing {
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

export type ReservationIneligibilityReason =
  | 'already_reserved_by_you'
  | 'reserved_by_other'
  | 'not_reservable'
  | 'price_on_request'
  | 'limit_exceeded';

export type InquiryIneligibilityReason =
  | 'allocated_to_another_customer'
  | 'not_available';

export interface VehicleReservationEligibility {
  eligible: boolean;
  reason?: ReservationIneligibilityReason;
  holdExpiresAt?: string;
  isOwnHold?: boolean;
}

export interface VehicleInquiryEligibility {
  eligible: boolean;
  reason?: InquiryIneligibilityReason;
}

export interface VehicleDomainSummary {
  id: string;
  chassisNumber: string;
  slug?: string;
  make: string;
  model: string;
  modelCode?: string;
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
  vehicleSubType?: string;
  engineCc?: number;
  overdrive?: string;
  color?: string;
  exteriorGrade?: string;
  steering?: string;
  stockCountry?: string;
  stockLocation?: string;
  seats?: number;
  loadCapacity?: number;
  features?: Record<string, boolean>;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  mileage?: number;
  etd?: string;
  eta?: string;
  requestPrice?: boolean;

  // Phase 2.3 Customer Projections (D02-P03-T001)
  active?: boolean;
  nowOnSale?: boolean;
  priceState?: 'priced' | 'request_price';
  countryEligibility?: string[];
  compliance?: VehicleComplianceEvaluation;
  tierPricing?: VehicleTierPricing;
  reservationEligibility?: VehicleReservationEligibility;
  inquiryEligibility?: VehicleInquiryEligibility;
}

export interface FacetCount {
  name: string;
  count: number;
}

export interface FeatureFacet {
  key: string;
  label: string;
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
  transmissions: FacetCount[];
  driveTrains: FacetCount[];
  models: FacetCount[];
  modelCodes: FacetCount[];
  vehicleTypes: FacetCount[];
  vehicleSubTypes: FacetCount[];
  locationStatuses: FacetCount[];
  destinationPorts: FacetCount[];
  overdrives: FacetCount[];
  colors: FacetCount[];
  exteriorGrades: FacetCount[];
  steerings: FacetCount[];
  stockCountries: FacetCount[];
  stockLocations: FacetCount[];
  features: FeatureFacet[];
  yearRange: RangeFacet<number>;
  priceRange: RangeFacet<number>;
  mileageRange: RangeFacet<number>;
  engineCcRange: RangeFacet<number>;
  seatsRange: RangeFacet<number>;
  loadCapacityRange: RangeFacet<number>;
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
  modelCode?: string;
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  vehicleSubType?: string;
  engineCcMin?: number;
  engineCcMax?: number;
  overdrive?: string;
  color?: string;
  exteriorGrade?: string;
  steering?: string;
  stockCountry?: string;
  stockLocation?: string;
  seatsMin?: number;
  seatsMax?: number;
  loadCapacityMin?: number;
  loadCapacityMax?: number;
  features?: string[];
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
  mileageMin?: number;
  mileageMax?: number;
  discountMin?: number;
  destinationCountry?: string;
  complianceOnly?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'mileage_asc';
  page?: number;
  limit?: number;
  audience?: 'public' | 'customer' | 'salesperson';
  tier?: CustomerTier;
}

export interface CategorizedPublicMedia {
  gallery: string[];
  auctionPictures?: string[];
  japanPictures?: string[];
  durbanPictures?: string[];
  showAuctionPictures?: boolean;
  showJapanPictures?: boolean;
  showDurbanPictures?: boolean;
}

export interface VehicleDetail {
  id: string;
  chassisNumber: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  status: VehicleStatus;
  /** Customer-facing label resolved by the server status catalogue. */
  statusLabel?: string;
  /** Customer-facing plural label resolved by the server status catalogue. */
  statusLabelPlural?: string;
  statusDescription?: string;
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
  compliance?: VehicleComplianceEvaluation;
  media: CategorizedPublicMedia;

  // Phase 2.3 Customer Projections (D02-P03-T001)
  active?: boolean;
  nowOnSale?: boolean;
  tierPricing?: VehicleTierPricing;
  reservationEligibility?: VehicleReservationEligibility;
  inquiryEligibility?: VehicleInquiryEligibility;
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
  customerId: string;
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
  customerId: string;
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

/** Customer's own quote request summary (D02-P13-T001, CUST-34). */
export interface CustomerInquirySummary {
  vehicleSlug: string;
  vehicleId: string;
  vehicleTitle: string;
  requestedAt: string;
  inquirerCount: number;
}

/** Signed-in customer's inquiry list (D02-P13-T001, CUST-34). */
export interface CustomerInquiryListResponse {
  items: CustomerInquirySummary[];
}

/** Aggregate of distinct inquirers for a vehicle (D02-P13-T001, CUST-35). */
export interface VehicleInquiryAggregate {
  vehicleSlug: string;
  inquirerCount: number;
}

// --- Phase 2.13: Wishlist and Favourites (D02-P13-T002, CUST-36 through CUST-40) ---
//
// A wishlist item saves a specific vehicle for a customer. A favourite saves
// reusable search-criteria profiles; up to 25 per customer, with an at-cap 409
// rejection (CUST-40). Favourites fields without backing VehicleRecord columns
// today (Model Code, Engine CC, Color, Steering per D02-ASM-008) return empty
// arrays from the facets endpoint, never fabricated option lists.

/** A customer's saved vehicle (D02-P13-T002, CUST-36). */
export interface WishlistItem {
  id: string;
  customerId: string;
  vehicleId: string;
  vehicleSlug: string;
  createdAt: string;
}

/** Wishlist list response (D02-P13-T002, CUST-36/CUST-37). */
export interface WishlistListResponse {
  items: WishlistItem[];
}

/** Wishlist add/remove request (D02-P13-T002, CUST-36). */
export interface WishlistToggleRequest {
  vehicleSlug: string;
}

/** Wishlist add/remove response (D02-P13-T002, CUST-36). */
export interface WishlistToggleResponse {
  wishlisted: boolean;
  item?: WishlistItem;
}

/** Search criteria for a favourite (D02-P13-T002, CUST-38/CUST-39, D02-ASM-008/010). */
export interface FavouriteSearchCriteria {
  make?: string;
  model?: string;
  modelCode?: string; // D02-ASM-008: no backing column today
  yearFrom?: number;
  yearTo?: number;
  priceFromUsd?: number;
  priceToUsd?: number;
  mileageMin?: number;
  mileageMax?: number;
  engineCc?: string; // D02-ASM-008: no backing column today
  fuelType?: string;
  color?: string; // D02-ASM-008: no backing column today
  steering?: string; // D02-ASM-008: no backing column today
  driveTrain?: string;
  transmission?: string;
}

/** A customer's saved search criteria (D02-P13-T002, CUST-38/CUST-39). */
export interface FavouriteSearch {
  id: string;
  customerId: string;
  name: string;
  criteria: FavouriteSearchCriteria;
  createdAt: string;
}

/** Favourite list response (D02-P13-T002, CUST-38/CUST-39, CUST-40). */
export interface FavouriteSearchListResponse {
  items: FavouriteSearch[];
  limit: number;
}

/** Distinct values available for each favourite field (D02-P13-T002, CUST-39, D02-ASM-008). */
export interface FavouriteSearchFacets {
  makes: Array<{ name: string; count: number }>;
  models: Array<{ name: string; count: number }>;
  fuelTypes: Array<{ name: string; count: number }>;
  driveTrains: Array<{ name: string; count: number }>;
  transmissions: Array<{ name: string; count: number }>;
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
  // D02-ASM-008: these four fields have no backing columns today; return empty.
  modelCodes: string[];
  engineCcOptions: string[];
  colors: string[];
  steeringOptions: string[];
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
export const RESERVABLE_VEHICLE_STATUSES: readonly VehicleStatus[] = ['Available'];

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
  tierDescriptions?: Partial<Record<CustomerTier, string>>;
}

export function generateVehicleSlug(year: number, make: string, model: string, id: string): string {
  const raw = `${year}-${make}-${model}-${id}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- Phase 2.2: customer dashboard KPI baseline (D02-ASM-001) ---
//
// Non-blocking customer dashboard aggregate derived from linked mock records:
// outstanding balance = issued invoice total minus approved allocations;
// credit utilisation = outstanding balance ÷ mock credit limit;
// vehicle counts use canonical vehicle IDs and current server status.
// All values are server-derived; no browser calculation or fabrication.

export interface Invoice {
  id: string;
  customerId: string;
  vehicleId: string;
  vehicleSlug: string;
  make: string;
  model: string;
  year: number;
  totalAmountUsd: number;
  invoicedAt: string;
  status: 'Draft' | 'Issued' | 'Paid' | 'Overdue';
}

export interface Allocation {
  id: string;
  customerId: string;
  paymentId: string;
  invoiceId: string;
  amountUsd: number;
  allocatedAt: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface Payment {
  id: string;
  customerId: string;
  invoiceId: string;
  amountUsd: number;
  paidAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Shipment {
  id: string;
  customerId: string;
  vehicleId: string;
  status: ShipmentStatus;
  shippedAt: string;
  deliveredAt?: string;
}

export interface Document {
  id: string;
  customerId: string;
  shipmentId?: string;
  vehicleId?: string;
  type: 'Invoice' | 'PaymentProof' | 'ShippingLabel' | 'DeliveryProof' | 'Other';
  status: 'Available' | 'Pending' | 'Unavailable';
  createdAt: string;
}

export interface Notification {
  id: string;
  customerId: string;
  title?: string;
  message: string;
  type: 'Payment' | 'Shipment' | 'Document' | 'Vehicle' | 'Promotion';
  isRead: boolean;
  createdAt: string;
  related?: {
    kind: 'Vehicle' | 'ProformaInvoice' | 'Invoice' | 'Payment' | 'Shipment' | 'Document' | 'ShipOk' | 'DocumentRelease';
    id: string;
    href: string;
  };
}

export interface CustomerNotificationListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
}

export interface CustomerProfile {
  customerId: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  deliveryAddress: string;
  version: number;
  updatedAt: string;
}

export interface UpdateCustomerProfileRequest {
  companyName: string;
  phone: string;
  deliveryAddress: string;
  expectedVersion?: number;
}

export interface MarkNotificationsReadResponse {
  updatedCount: number;
  unreadCount: number;
}

export interface CustomerDashboard {
  customerId: string;
  customerEmail: string;
  creditLimitUsd: number;
  outstandingBalanceUsd: number;
  creditUtilisationPercent: number;
  vehicleCountReserved: number;
  vehicleCountInvoiced: number;
  vehicleCountDelivered: number;
  // Enhanced with linked record aggregates (D02-P02-T001)
  paymentStatusSummary?: {
    approved: number;
    pending: number;
    rejected: number;
  };
  shipmentStatusSummary?: {
    ready: number;
    inTransit: number;
    delivered: number;
    other: number;
  };
  documentAvailabilityCount?: {
    available: number;
    pending: number;
    unavailable: number;
  };
  notificationUnreadCount?: number;
}

// --- Phase 2.4: Customer Vehicle Transaction & Status Projections (CUST-10, CUST-11, CUST-12, CUST-13, RULE-04, RULE-07, RULE-08, RULE-09) ---

export type CustomerVehicleStatus =
  | 'Under Negotiation'
  | 'Under Negotiation With PI'
  | 'Confirmed'
  | 'In Transit'
  | 'Delivered'
  | 'Expired'
  | 'Cancelled';

export interface CustomerVehicleStatusHistoryItem {
  status: CustomerVehicleStatus;
  timestamp: string;
  notes?: string;
}

export interface CustomerVehicleDocumentReference {
  id: string;
  type: string;
  title: string;
  status: 'Available' | 'Pending' | 'Draft';
  issuedAt?: string;
}

export interface CustomerVehicleDepositInfo {
  requiredPercent: number; // 30 under RULE-07
  requiredAmountUsd: number;
  paidAmountUsd: number;
  remainingAmountUsd: number;
}

export const DEPOSIT_PERCENT_RULE_07 = 30;

/**
 * Computes the 30% deposit requirement for vehicles under negotiation with PI (RULE-07).
 */
export function calculateVehicleDeposit(totalAmountUsd: number, paidAmountUsd = 0): CustomerVehicleDepositInfo {
  const requiredAmountUsd = Math.round(totalAmountUsd * (DEPOSIT_PERCENT_RULE_07 / 100));
  const remainingAmountUsd = Math.max(0, requiredAmountUsd - paidAmountUsd);
  return {
    requiredPercent: DEPOSIT_PERCENT_RULE_07,
    requiredAmountUsd,
    paidAmountUsd,
    remainingAmountUsd,
  };
}

export interface CustomerCommercialBillInfo {
  soldAmountUsd: number;
  paidAmountUsd: number;
  balanceAmountUsd: number;
}

export type CustomerVehiclePaymentStatus = 'Unpaid' | 'PartiallyPaid' | 'Paid';

export interface CustomerVehicleSummary {
  id: string;
  vehicleId: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  slug: string;
  primaryImage?: string;
  priceUsd: number;
  totalAmountUsd: number;
  status: CustomerVehicleStatus;
  paymentStatus: CustomerVehiclePaymentStatus;
  paidAmountUsd: number;
  balanceAmountUsd: number;
  invoiceTotalAmountUsd?: number;
  invoiceId?: string;
  vehicleStatusCode: VehicleStatus;
  statusLabel: string;
  statusLabelPlural: string;
  statusDescription?: string;
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
  destinationPort?: string;
  reservationExpiresAt?: string;
  proformaInvoiceId?: string;
  paymentDeadline?: string;
  deposit?: CustomerVehicleDepositInfo;
  stockNumber?: string;
  color?: string;
  colorSpec?: string;
  mileage?: number;
  logisticsStatus?: string;
  piRef?: string;
  commercialBill?: CustomerCommercialBillInfo;
  shippingStage?: 'Reserved' | 'Inspection' | 'In Transit' | 'Delivered' | string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVehicleDetail extends CustomerVehicleSummary {
  images: string[];
  stockType?: 'J' | 'CRFO';
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  mileage?: number;
  engineSize?: string;
  modelCode?: string;
  versionClass?: string;
  registerYear?: string;
  mfgYear?: string;
  steering?: string;
  seats?: number;
  loadCapacity?: number;
  doors?: number;
  grossWeight?: number;
  dimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    m3?: number;
  };
  invoiceId?: string;
  shipmentId?: string;
  vesselName?: string;
  etd?: string;
  eta?: string;
  ata?: string;
  yardInDate?: string;
  yardOutDate?: string;
  billOfLadingNo?: string;
  negotiationDate?: string;
  proformaDate?: string;
  orderPlacedDate?: string;
  inspectionDate?: string;
  inspectionStatus?: string;
  reInspectionDate?: string;
  reInspectionStatus?: string;
  courierCompany?: string;
  trackingNumber?: string;
  courierRemarks?: string;
  statusHistory: CustomerVehicleStatusHistoryItem[];
  documents: CustomerVehicleDocumentReference[];
}

export interface CustomerVehicleCountsByStatus {
  underNegotiation: number;
  underNegotiationWithPI: number;
  confirmed: number;
  inTransit: number;
  delivered: number;
  all: number;
}

export interface CustomerVehicleListResponse {
  items: CustomerVehicleSummary[];
  total: number;
  countsByStatus: CustomerVehicleCountsByStatus;
  statusDefinitions: VehicleStatusDefinition[];
}

export interface ListCustomerVehiclesQuery {
  status?: CustomerVehicleStatus | string;
  query?: string;
  page?: number;
  limit?: number;
}

export type CustomerInvoiceType = 'Proforma' | 'Commercial';

export type CustomerInvoiceStatus =
  | 'Draft'
  | 'Issued'
  | 'PartiallyPaid'
  | 'Paid'
  | 'Overdue'
  | 'Expired'
  | 'Cancelled';

export interface CustomerInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  amountUsd: number;
}

export interface CustomerInvoiceAllocationItem {
  id: string;
  paymentId: string;
  amountUsd: number;
  allocatedAt: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface CustomerInvoiceBankDetails {
  bankName: string;
  swiftCode: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  bankAddress: string;
  reference: string;
}

export interface CustomerInvoiceSummary {
  id: string;
  invoiceNumber: string;
  type: CustomerInvoiceType;
  customerId: string;
  vehicleId: string;
  vehicleSlug: string;
  make: string;
  model: string;
  year: number;
  totalAmountUsd: number;
  paidAmountUsd: number;
  outstandingAmountUsd: number;
  depositRequiredUsd?: number;
  status: CustomerInvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paymentDeadline?: string;
  currency: string;
}

export interface CustomerInvoiceDetailVehicle {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  slug: string;
  primaryImage?: string;
}

export interface CustomerInvoiceDetail extends CustomerInvoiceSummary {
  vehicle: CustomerInvoiceDetailVehicle;
  /** Includes every vehicle where a single TT-backed invoice is allocated to a fleet. */
  vehicles?: CustomerInvoiceDetailVehicle[];
  lineItems: CustomerInvoiceLineItem[];
  allocations: CustomerInvoiceAllocationItem[];
  bankDetails?: CustomerInvoiceBankDetails;
  isExpired?: boolean;
  notes?: string;
}

export interface CustomerInvoiceTotals {
  totalInvoicedUsd: number;
  totalPaidUsd: number;
  totalOutstandingUsd: number;
}

export interface CustomerInvoiceListResponse {
  items: CustomerInvoiceSummary[];
  total: number;
  page: number;
  limit: number;
  totals: CustomerInvoiceTotals;
}

export interface ListCustomerInvoicesQuery {
  type?: CustomerInvoiceType | string;
  status?: CustomerInvoiceStatus | string;
  query?: string;
  page?: number;
  limit?: number;
}

export interface CustomerInvoiceDocument {
  invoiceId: string;
  invoiceNumber: string;
  type: CustomerInvoiceType;
  title: string;
  contentHtml: string;
  status: 'Available' | 'Unavailable';
}

/**
 * Calculates remaining balance and payment status for an invoice.
 */
export function calculateInvoiceBalance(totalAmountUsd: number, paidAmountUsd: number): {
  outstandingAmountUsd: number;
  isFullyPaid: boolean;
} {
  const outstandingAmountUsd = Math.max(0, totalAmountUsd - paidAmountUsd);
  return {
    outstandingAmountUsd,
    isFullyPaid: outstandingAmountUsd === 0,
  };
}

export interface CustomerStatementEntry {
  id: string;
  date: string;
  description: string;
  referenceNo?: string;
  debitUsd: number;
  creditUsd: number;
  runningBalanceUsd: number;
  isOpeningBalance?: boolean;
}

export interface CustomerStatementSummary {
  customerId: string;
  fromDate: string;
  toDate: string;
  openingBalanceUsd: number;
  totalDebitsUsd: number;
  totalCreditsUsd: number;
  closingBalanceUsd: number;
  entries: CustomerStatementEntry[];
}

export interface CustomerPolymorphicInquiry {
  id: string;
  customerId?: string;
  inquiryNumber: string;
  source: 'Stock' | 'WhatsApp' | 'Auction' | 'General';
  status: 'Pending Reply' | 'Replied';
  inquiryDate: string;
  make: string;
  model: string;
  yom: string;
  stockNumber?: string;
  chassisNumber?: string;
  lotNumber?: string;
  chassisModel?: string;
  viewsCount?: number;
  message: string;
  replyMessage?: string;
  repliedAt?: string;
  fobPriceUsd?: number;
  cfPriceUsd?: number;
  startPriceUsd?: number;
  minFobUsd?: number;
  maxFobUsd?: number;
  driveType?: string;
  mfgYearRange?: string;
  deliveryLocation?: string;
  inquirerCount?: number;
  auctionRemaining?: string;
  auctionFinished?: boolean;
  imageUrl?: string;
}

export interface CustomerPolymorphicInquiryListResponse {
  items: CustomerPolymorphicInquiry[];
  total: number;
}


export * from './auth.js';
export * from './freight.js';
export * from './content.js';
export * from './countries.js';
export * from './compliance.js';
export * from './i18n.js';
import type { CustomerTier } from './auth.js';
