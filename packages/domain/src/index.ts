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

/**
 * A visitor-submitted enquiry (PUB-13): a general enquiry, an enquiry about a
 * specific vehicle, or a quotation enquiry naming a shipping destination —
 * any combination of `vehicleSlug`/`destinationCode`+`portCode` is valid, and
 * none is required beyond the contact fields themselves.
 */
export interface EnquiryRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  vehicleSlug?: string;
  destinationCode?: string;
  portCode?: string;
}

/**
 * Receipt confirmation returned after a successful submission (PUB-15). This
 * confirms only that the enquiry was received and persisted — it never
 * claims a staff member was notified, contacted, or that any downstream
 * action occurred (RULE-10). `duplicate` is true when an identical enquiry
 * (same contact, vehicle, destination and message) was already on file and
 * this submission was not persisted again, rather than silently discarded
 * (RULE-08) — the visitor still receives their original receipt.
 */
export interface EnquiryResponse {
  id: string;
  receivedAt: string;
  status: 'received';
  duplicate: boolean;
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
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
