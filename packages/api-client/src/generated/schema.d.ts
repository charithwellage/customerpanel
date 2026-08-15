/**
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
// RULE-05, RULE-08, RULE-10, D01-P06-T004). `status` is always computed live
// from `expiresAt` versus the current instant — DEC-PUB-RESERVATION-EXPIRY-ACTION
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

export interface PaymentStatusSummary {
  approved: number;
  pending: number;
  rejected: number;
}

export interface ShipmentStatusSummary {
  ready: number;
  inTransit: number;
  delivered: number;
  other: number;
}

export interface DocumentAvailabilityCount {
  available: number;
  pending: number;
  unavailable: number;
}

export interface PartialFailureIndicators {
  paymentsFailed: boolean;
  shipmentsFailed: boolean;
  documentsFailed: boolean;
  notificationsFailed: boolean;
}

export interface CustomerShipment {
  id: string;
  vehicleId: string;
  stage: 'Purchased' | 'Inspection' | 'Ready' | 'In Transit' | 'Delivered';
  shippedAt: string;
  deliveredAt?: string;
  eta?: string;
  location?: string;
  freshness: 'fresh' | 'stale' | 'unknown';
  shipOkStatus: 'Pending' | 'Approved' | 'Rejected';
  shipOkRejectionReason?: string;
  documentReleaseStatus: 'Pending' | 'Approved' | 'Rejected';
  documentReleaseRejectionReason?: string;
  timeline: Array<{ stage: CustomerShipment['stage']; occurredAt?: string; current: boolean }>;
}

export interface CustomerShipmentList {
  items: CustomerShipment[];
}

export type PaymentProofFileType = 'PDF' | 'JPG' | 'PNG';
export type PaymentProofScanStatus = 'Pending' | 'Passed' | 'Rejected';
export interface CustomerPaymentProofMetadata {
  fileName: string;
  fileType: PaymentProofFileType;
  sizeBytes: number;
  scanStatus: PaymentProofScanStatus;
}
export interface CustomerPayment {
  id: string;
  customerId: string;
  invoiceId: string;
  reference: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  allocatedAmountUsd?: number;
  remainingBalanceUsd?: number;
  paymentDate: string;
  remarks?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  holdReason?: string;
  proof?: CustomerPaymentProofMetadata;
  idempotencyKey: string;
  createdAt: string;
}
export interface CreateCustomerPaymentRequest {
  invoiceId: string;
  reference: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  paymentDate: string;
  remarks?: string;
  proof: CustomerPaymentProofMetadata;
  idempotencyKey: string;
}
export interface CustomerPaymentListResponse { items: CustomerPayment[]; total: number; }
export type CustomerPaymentNotificationEvent = 'FinanceReviewRequested' | 'PaymentHeld' | 'PaymentResubmitted' | 'PaymentApproved' | 'PaymentAllocated';
export interface CustomerPaymentNotification {
  id: string;
  customerId: string;
  paymentId: string;
  invoiceId: string;
  event: CustomerPaymentNotificationEvent;
  deliveryStatus: 'Queued';
  createdAt: string;
}
export interface CustomerPaymentNotificationListResponse { items: CustomerPaymentNotification[]; total: number; }
export interface RecordPaymentNotificationRequest { event: CustomerPaymentNotificationEvent; }

export interface CustomerDocument {
  id: string;
  shipmentId?: string;
  vehicleId?: string;
  type: 'Invoice' | 'PaymentProof' | 'ShippingLabel' | 'DeliveryProof' | 'Other';
  status: 'Available' | 'Pending' | 'Unavailable';
  createdAt: string;
}

export interface CustomerDocumentList {
  items: CustomerDocument[];
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
  paymentStatusSummary: PaymentStatusSummary;
  shipmentStatusSummary: ShipmentStatusSummary;
  documentAvailabilityCount: DocumentAvailabilityCount;
  notificationUnreadCount: number;
  partialFailureIndicators: PartialFailureIndicators;
}

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
  fileUrl?: string;
  issuedAt?: string;
}

export interface CustomerVehicleDepositInfo {
  requiredPercent: number;
  requiredAmountUsd: number;
  paidAmountUsd: number;
  remainingAmountUsd: number;
  isFullyPaid: boolean;
}

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
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
  destinationPort?: string;
  reservationExpiresAt?: string;
  proformaInvoiceId?: string;
  paymentDeadline?: string;
  deposit?: CustomerVehicleDepositInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerVehicleDetail extends CustomerVehicleSummary {
  images: string[];
  bodyStyle?: string;
  fuelType?: string;
  transmission?: string;
  driveTrain?: string;
  mileage?: number;
  invoiceId?: string;
  shipmentId?: string;
  vesselName?: string;
  etd?: string;
  eta?: string;
  billOfLadingNo?: string;
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
  depositPaidUsd?: number;
  status: CustomerInvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paymentDeadline?: string;
  documentStatus: 'Available' | 'Pending' | 'Unavailable';
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
  lineItems: CustomerInvoiceLineItem[];
  allocations: CustomerInvoiceAllocationItem[];
  bankDetails?: CustomerInvoiceBankDetails;
  documentUrl?: string;
  termsAndConditions?: string[];
  isExpired?: boolean;
  notes?: string;
}

export interface CustomerInvoiceCountsByType {
  all: number;
  proforma: number;
  commercial: number;
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
  countsByType: CustomerInvoiceCountsByType;
  totals: CustomerInvoiceTotals;
}

export interface CustomerInvoiceDocument {
  documentId: string;
  invoiceId: string;
  invoiceNumber: string;
  type: CustomerInvoiceType;
  title: string;
  contentHtml: string;
  status: 'Available' | 'Unavailable';
  generatedAt: string;
}
