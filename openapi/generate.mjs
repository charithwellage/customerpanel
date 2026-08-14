import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const openapiPath = join(root, 'openapi', 'openapi.json');
const outputPath = join(root, 'packages', 'api-client', 'src', 'generated', 'schema.d.ts');

if (!existsSync(openapiPath)) {
  console.error(`OpenAPI spec not found at ${openapiPath}`);
  process.exit(1);
}

const openapiSpec = JSON.parse(readFileSync(openapiPath, 'utf8'));

const outputContent = `/**
 * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Generated from openapi/openapi.json specification.
 */

export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
  liveAuctionUrl?: string;
}

export interface SessionClaims {
  sub: string;
  email: string;
  role: 'PublicVisitor' | 'CustomerBuyer' | 'Salesperson' | 'StockController' | 'FinanceManager' | 'SystemAdmin';
  permissions: string[];
  exp: number;
}

export interface DemoSessionResponse {
  token: string;
  claims: SessionClaims;
  nonProduction: boolean;
}

export interface VehicleSummary {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: 'Draft' | 'Available' | 'Pending' | 'Reserved' | 'ReservedWithPI' | 'InvoiceCreated' | 'Invoiced' | 'Sold';
  category?: string;
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
  createdAt?: string;
  images?: string[];
  featured?: boolean;
  stockType?: 'J' | 'CRFO';
  destinationPort?: string;
  discountPercent?: number;
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
  status: 'Draft' | 'Available' | 'Pending' | 'Reserved' | 'ReservedWithPI' | 'InvoiceCreated' | 'Invoiced' | 'Sold';
  priceState: 'priced' | 'request_price';
  priceUsd?: number;
  requestPrice: boolean;
  discountPercent?: number;
  discountedPriceUsd?: number;
  category?: string;
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
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

export interface ErrorResponse {
  statusCode: number;
  message: string;
  correlationId: string;
  field?: string;
  reason?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
}

export interface ResetResponse {
  success: boolean;
  message: string;
}

// Phase 1.5: freight destination, port and rate lookup (D01-ASM-001).
// No cubic-volume/freight formula and no computed total exist on this
// contract while DEC-PUB-FREIGHT-MODEL is OPEN.

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

export interface FreightEstimateResponse {
  outcome: 'estimate_unavailable_pending_rate';
  destinationCode: string;
  portCode: string;
  rateStatus: 'active' | 'stale' | 'no_rate';
  currency?: string;
  rateEffectiveFrom?: string;
  rateEffectiveTo?: string;
  message: string;
}

// Phase 1.5: quotation enquiry (PUB-13, PUB-15, D01-P05-T004). Independent of
// DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY; carries no monetary total.

export interface EnquiryEstimateSnapshot {
  destinationCode: string;
  portCode: string;
  rateStatus: 'active' | 'stale' | 'no_rate';
  currency?: string;
  rateEffectiveFrom?: string;
  rateEffectiveTo?: string;
  message: string;
}

export interface EnquiryRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  vehicleSlug?: string;
  destinationCode?: string;
  portCode?: string;
  enquiryType?: 'general' | 'vehicle' | 'price-request' | 'premium-vehicle';
  source?: 'form' | 'whatsapp' | 'email' | 'call';
  preferredMake?: string;
  preferredModel?: string;
  preferredDriveSide?: 'left' | 'right';
  preferredYear?: number;
  targetPriceUsd?: number;
}

export interface EnquiryResponse {
  id: string;
  receivedAt: string;
  status: 'received';
  duplicate: boolean;
  enquiryType: 'general' | 'vehicle' | 'price-request' | 'premium-vehicle';
  source: 'form' | 'whatsapp' | 'email' | 'call';
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
}

// Phase 1.6: lead and enquiry contracts (PUB-16, D01-P06-T001). The canonical
// staff-visible lead record, retrievable through the future Salesperson
// service boundary — the explicit regression fix for the POC
// disconnected-lead defect.

export interface LeadRecord {
  id: string;
  receivedAt: string;
  status: 'New' | 'Contacted' | 'InProgress' | 'Sold' | 'Archived';
  enquiryType: 'general' | 'vehicle' | 'price-request' | 'premium-vehicle';
  source: 'form' | 'whatsapp' | 'email' | 'call';
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
  preferredDriveSide?: 'left' | 'right';
  preferredYear?: number;
  targetPriceUsd?: number;
}

export interface LeadListResponse {
  items: LeadRecord[];
  total: number;
}

// Phase 1.6: transactional reservation eligibility and hold (PUB-23,
// RULE-05, RULE-08, RULE-10, D01-P06-T004). \`status\` is always computed live
// from \`expiresAt\` versus the current instant — DEC-PUB-RESERVATION-EXPIRY-ACTION
// is OPEN, so no automatic release action is ever claimed to have occurred.

export interface ReservationRequest {
  vehicleSlug: string;
}

export interface ReservationResponse {
  id: string;
  vehicleSlug: string;
  vehicleId: string;
  customerId: string;
  customerEmail: string;
  status: 'active' | 'expired';
  createdAt: string;
  expiresAt: string;
  holdHours: number;
}

// Phase 1.7: Public Content, FAQ and Testimonial Services (PUB-17, PUB-18, PUB-19,
// PUB-20, PUB-21, PUB-27, PUB-29, PUB-30, PUB-31, PUB-35)
export type ContentApprovalStatus = 'approved' | 'pending' | 'draft' | 'unavailable' | 'rejected';

export interface FaqCategory {
  id: string;
  name: string;
  description?: string;
  order: number;
}

export interface FaqItem {
  id: string;
  categoryId: string;
  categoryName: string;
  question: string;
  answer: string;
  slug: string;
  featured?: boolean;
  order?: number;
  owner: string;
  status: ContentApprovalStatus;
  updatedAt: string;
}

export interface FaqQueryResponse {
  categories: FaqCategory[];
  items: FaqItem[];
  total: number;
  matchedCount: number;
  groundedNoAnswer: boolean;
  message?: string;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorLocation: string;
  avatarUrl?: string;
  vehiclePurchased?: string;
  rating: number;
  content: string;
  submittedAt: string;
  status: ContentApprovalStatus;
  consent: boolean;
}

export interface TestimonialSubmissionRequest {
  authorName: string;
  authorLocation: string;
  vehiclePurchased?: string;
  rating: number;
  content: string;
  consent: boolean;
}

export interface TestimonialSubmissionResponse {
  id: string;
  status: 'pending';
  submittedAt: string;
  message: string;
}

export interface TestimonialListResponse {
  items: TestimonialItem[];
  total: number;
}

export interface ContentPageSection {
  title: string;
  content: string;
  image?: string;
}

export interface PublicContentPage {
  slug: string;
  title: string;
  summary: string;
  body: string;
  owner: string;
  status: ContentApprovalStatus;
  updatedAt: string;
  sections?: ContentPageSection[];
  metadata?: Record<string, unknown>;
}

export interface OfficeLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: string;
  isPrimary: boolean;
  status: ContentApprovalStatus;
}

export interface OfficeListResponse {
  items: OfficeLocation[];
  total: number;
}

export interface BranchTeamMember {
  name: string;
  role: string;
  photoUrl?: string;
  contactEmail?: string;
}

export interface BranchContactDetails {
  phone: string;
  email: string;
  address: string;
  hours: string;
}

export interface BranchContent {
  id: string;
  name: string;
  code: string;
  destinationPort: string;
  introduction: string;
  welcomeBanner: string;
  contactBanner: string;
  teamMembers: BranchTeamMember[];
  meetAndGreetInfo: string;
  contactDetails: BranchContactDetails;
  contentOwner: string;
  status: ContentApprovalStatus;
  latestArrivalsQuery?: { destinationPort?: string; limit?: number };
  recentlyDiscountedQuery?: { destinationPort?: string; limit?: number };
}

export interface BranchListResponse {
  items: BranchContent[];
  total: number;
}

// Phase 2.2: customer dashboard KPI baseline (D02-ASM-001). Non-blocking
// aggregate derived from linked mock records: outstanding balance = issued
// invoice total - approved allocations; credit utilisation = outstanding
// balance ÷ credit limit; vehicle counts use canonical IDs and server status.
// Server-authoritative; no browser calculation or fabrication.

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

export interface CustomerDashboard {
  customerId: string;
  customerEmail: string;
  creditLimitUsd: number;
  outstandingBalanceUsd: number;
  creditUtilisationPercent: number;
  vehicleCountReserved: number;
  vehicleCountInvoiced: number;
  vehicleCountDelivered: number;
  lastUpdated: string;
}
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, outputContent, 'utf8');
console.log(`Generated API schema client at ${outputPath}`);
