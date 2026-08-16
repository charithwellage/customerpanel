import { Pool, PoolClient } from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type {
  VehicleDomainSummary,
  VehicleStatus,
  VehicleSearchResult,
  VehicleFacets,
  SearchVehiclesQuery,
  VehicleDetail,
  VehicleTierPricing,
  VehicleReservationEligibility,
  ReservationIneligibilityReason,
  CustomerTier,
  FreightDestination,
  FreightPort,
  FreightRateRecord,
  FreightEstimateRequest,
  FreightEstimateResponse,
  EnquiryRequest,
  EnquiryResponse,
  EnquiryEstimateSnapshot,
  EnquiryType,
  EnquirySource,
  EnquiryPreferredDriveSide,
  LeadRecord,
  LeadListResponse,
  ReservationRequest,
  ReservationResponse,
  ReservationStatus,
  FaqCategory,
  FaqItem,
  FaqQueryResponse,
  TestimonialItem,
  TestimonialSubmissionRequest,
  TestimonialSubmissionResponse,
  TestimonialListResponse,
  PublicContentPage,
  OfficeLocation,
  OfficeListResponse,
  BranchContent,
  BranchListResponse,
  ContentApprovalStatus,
  Invoice,
  Allocation,
  CustomerDashboard,
  CustomerVehicleStatus,
  CustomerVehicleStatusHistoryItem,
  CustomerVehicleDocumentReference,
  CustomerVehicleDepositInfo,
  CustomerVehicleSummary,
  CustomerVehicleDetail,
  CustomerVehicleCountsByStatus,
  CustomerVehicleListResponse,
  ListCustomerVehiclesQuery,
  CustomerInvoiceType,
  CustomerInvoiceStatus,
  CustomerInvoiceAllocationItem,
  CustomerInvoiceSummary,
  CustomerInvoiceDetail,
  CustomerInvoiceCountsByType,
  CustomerInvoiceTotals,
  CustomerInvoiceListResponse,
  ListCustomerInvoicesQuery,
  CustomerInvoiceDocument,
  CustomerPayment,
  CustomerPaymentListResponse,
  CreateCustomerPaymentRequest,
  CustomerPaymentNotification,
  CustomerPaymentNotificationEvent,
  CustomerPaymentNotificationListResponse,
  RecordPaymentNotificationRequest,
  Notification,
  CustomerNotificationListResponse,
  MarkNotificationsReadResponse,
  CustomerProfile,
  UpdateCustomerProfileRequest,
} from '@carchief/domain';
import {
  generateVehicleSlug,
  calculateFreightEstimate,
  resolveFreightRateStatus,
  calculateTierPricing,
  calculateVehicleDeposit,
  TIER_DISCOUNTS,
  ENQUIRY_TYPES,
  ENQUIRY_SOURCES,
  ENQUIRY_PREFERRED_DRIVE_SIDES,
  RESERVATION_HOLD_HOURS,
  MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER,
  RESERVABLE_VEHICLE_STATUSES,
} from '@carchief/domain';
import { validateEmail } from '@carchief/validation';
export { FreightRequestError, resolveFreightRateStatus } from '@carchief/domain';


export interface VehicleRecord {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: string;
  category?: string;
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
  createdAt?: string;
  images?: string[];
  featured?: boolean;
  stockType?: 'J' | 'CRFO';
  destinationPort?: string;
  discountPercent?: number;
  internalNotes?: string;
  staffOwnerId?: string;

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

export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
  // PUB-27, D01-P06-T003, D01-ASM-002: gates the account-gated Live Auction
  // entry. Left unset — no approved external auction destination exists yet
  // — so the entry point stays hidden rather than pointing at an invented
  // URL (RULE-10). Reopen D01-P06-T003 once a destination is approved.
  liveAuctionUrl?: string;
}

export interface GetVehiclesQuery extends SearchVehiclesQuery {
  collection?: string;
  market?: string;
  category?: string;
  limit?: number;
}

const seedConfig: PublicConfig = { siteName: 'CarChief', currency: 'USD', contactPhone: '+256 700 000 000' };

// Reference date for deterministic 5-day window & ETD/ETA tests: 2026-08-10T10:00:00.000Z
const seedVehicles: VehicleRecord[] = [
  {
    id: 'veh-1',
    chassisNumber: 'NZE141-1234567',
    make: 'Toyota',
    model: 'Corolla Axio',
    year: 2021,
    priceUsd: 8500,
    status: 'Available',
    category: 'arrival,premium',
    createdAt: '2026-08-09T10:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 32000,
    etd: '2026-08-20T00:00:00.000Z', // Future ETD -> In Japan
    eta: '2026-09-10T00:00:00.000Z',
    requestPrice: false,
    internalNotes: 'Internal inspection passed',
    staffOwnerId: 'staff-99',
  },
  {
    id: 'veh-2',
    chassisNumber: 'KDH201-7654321',
    make: 'Toyota',
    model: 'HiAce Van',
    year: 2020,
    priceUsd: 14200,
    status: 'ReservedWithPI',
    category: 'arrival',
    createdAt: '2026-08-08T14:30:00.000Z',
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'Van',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 68000,
    etd: '2026-08-01T00:00:00.000Z', // Past ETD, Future ETA -> In Transit
    eta: '2026-08-25T00:00:00.000Z',
    requestPrice: false,
  },
  {
    id: 'veh-3',
    chassisNumber: 'T32-9876543',
    make: 'Nissan',
    model: 'X-Trail',
    year: 2022,
    priceUsd: 19500,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-07-30T09:00:00.000Z',
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400'],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 18000,
    etd: '2026-07-01T00:00:00.000Z', // Past ETD, Past ETA -> In Port
    eta: '2026-07-25T00:00:00.000Z',
    requestPrice: false,
  },
  {
    id: 'veh-4',
    chassisNumber: 'SK9-5544332',
    make: 'Subaru',
    model: 'Forester',
    year: 2019,
    priceUsd: 0,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-25T11:00:00.000Z',
    discountPercent: 10,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 54000,
    requestPrice: true, // Price on request
  },
  {
    id: 'veh-5',
    chassisNumber: 'GP5-1122334',
    make: 'Honda',
    model: 'Fit Hybrid',
    year: 2021,
    priceUsd: 7900,
    status: 'Available',
    category: 'best_offer',
    createdAt: '2026-08-07T08:00:00.000Z',
    discountPercent: 5,
    featured: true,
    stockType: 'J',
    destinationPort: 'Dar es Salaam',
    bodyStyle: 'Hatchback',
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 41000,
    etd: '2026-08-05T00:00:00.000Z', // In Transit
    eta: '2026-08-28T00:00:00.000Z',
    requestPrice: false,
  },
  {
    id: 'veh-6',
    chassisNumber: 'FE83-4455667',
    make: 'Mitsubishi',
    model: 'Fuso Canter',
    year: 2018,
    priceUsd: 16000,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-20T10:00:00.000Z',
    discountPercent: 15,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
    bodyStyle: 'Truck',
    fuelType: 'Diesel',
    transmission: 'Manual',
    driveTrain: '2WD',
    mileage: 95000,
    etd: '2026-06-15T00:00:00.000Z', // In Port
    eta: '2026-07-10T00:00:00.000Z',
    requestPrice: false,
  },
  {
    id: 'veh-7',
    chassisNumber: 'GYL25-6677889',
    make: 'Lexus',
    model: 'RX450h',
    year: 2023,
    priceUsd: 38000,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-09T16:00:00.000Z',
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 12000,
    requestPrice: false,
  },
  {
    id: 'veh-8',
    chassisNumber: 'KF2P-3344556',
    make: 'Mazda',
    model: 'CX-5',
    year: 2020,
    priceUsd: 13500,
    status: 'Available',
    category: 'arrival',
    createdAt: '2026-08-06T12:00:00.000Z',
    featured: false,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 49000,
    requestPrice: false,
  },
  {
    id: 'veh-9',
    chassisNumber: 'WDD205-998877',
    make: 'Mercedes-Benz',
    model: 'C200 AMG Line',
    year: 2019,
    priceUsd: 17800,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-08T09:00:00.000Z',
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 38000,
    etd: '2026-08-18T00:00:00.000Z',
    requestPrice: false,
  },
  {
    id: 'veh-10',
    chassisNumber: 'G01-112244',
    make: 'BMW',
    model: 'X3 xDrive20d',
    year: 2021,
    priceUsd: 26500,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-07T14:00:00.000Z',
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 27000,
    requestPrice: false,
  },
  {
    id: 'veh-11',
    chassisNumber: '8K-556677',
    make: 'Audi',
    model: 'A4 Avant',
    year: 2020,
    priceUsd: 15900,
    status: 'Available',
    category: 'best_offer',
    createdAt: '2026-08-05T10:00:00.000Z',
    featured: false,
    stockType: 'J',
    destinationPort: 'Dar es Salaam',
    bodyStyle: 'Wagon',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 52000,
    requestPrice: false,
  },
  {
    id: 'veh-12',
    chassisNumber: 'L663-778899',
    make: 'Land Rover',
    model: 'Defender 110',
    year: 2022,
    priceUsd: 49000,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-09T18:00:00.000Z',
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 15000,
    requestPrice: false,
  },
  {
    id: 'veh-price-req',
    chassisNumber: 'URJ201-998877',
    make: 'Lexus',
    model: 'LX570',
    year: 2023,
    priceUsd: 0,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-10T12:00:00.000Z',
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 5000,
    requestPrice: true,
  },
  {
    id: 'veh-sold',
    chassisNumber: 'KF2P-554433',
    make: 'Mazda',
    model: 'CX-5',
    year: 2019,
    priceUsd: 12000,
    status: 'Sold',
    category: 'arrival',
    createdAt: '2026-08-01T10:00:00.000Z',
    featured: false,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 45000,
    requestPrice: false,
  },
  {
    id: 'veh-no-media',
    chassisNumber: 'SJ5-112233',
    make: 'Subaru',
    model: 'Forester',
    year: 2018,
    priceUsd: 9800,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-25T10:00:00.000Z',
    images: [],
    featured: false,
    stockType: 'J',
    destinationPort: 'Dar es Salaam',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 72000,
    requestPrice: false,
  },
  {
    id: 'veh-draft',
    chassisNumber: 'DFT-001122',
    make: 'Honda',
    model: 'Civic Prototype',
    year: 2024,
    priceUsd: 22000,
    status: 'Draft',
    category: 'arrival',
    createdAt: '2026-08-10T08:00:00.000Z',
    featured: false,
    stockType: 'J',
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Manual',
    driveTrain: '2WD',
    mileage: 1000,
    requestPrice: false,
    internalNotes: 'Internal draft - compliance check pending',
    staffOwnerId: 'staff-99',
  },
];

export interface VehicleQueryContext {
  audience?: 'public' | 'customer' | 'salesperson';
  customerId?: string;
  customerTier?: CustomerTier;
  nowISO?: string;
  reservations?: ReservationRecord[];
}

export interface DemoStore {
  ready(): Promise<void>;
  getConfig(): Promise<PublicConfig>;
  getVehicles(query?: GetVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleDomainSummary[]>;
  searchVehicles(query?: SearchVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleSearchResult>;
  getVehicleDetail(idOrSlug: string, context?: VehicleQueryContext): Promise<VehicleDetail | null>;
  getFreightDestinations(): Promise<FreightDestination[]>;
  getFreightPorts(): Promise<FreightPort[]>;
  getFreightEstimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse>;
  createEnquiry(request: EnquiryRequest): Promise<EnquiryResponse>;
  getLeadById(id: string): Promise<LeadRecord | null>;
  listLeads(): Promise<LeadListResponse>;
  createReservation(customerId: string, customerEmail: string, request: ReservationRequest, nowISO?: string): Promise<ReservationResponse>;
  getReservationById(id: string): Promise<ReservationResponse | null>;
  // Phase 1.7 Content methods
  getFaqs(query?: { category?: string; q?: string }): Promise<FaqQueryResponse>;
  getTestimonials(): Promise<TestimonialListResponse>;
  submitTestimonial(request: TestimonialSubmissionRequest): Promise<TestimonialSubmissionResponse>;
  getContentPages(): Promise<PublicContentPage[]>;
  getContentPageBySlug(slug: string): Promise<PublicContentPage | null>;
  getOffices(): Promise<OfficeListResponse>;
  getBranches(): Promise<BranchListResponse>;
  getBranchById(id: string): Promise<BranchContent | null>;
  // Phase 2.2: customer dashboard KPI baseline (D02-ASM-001)
  getCustomerDashboard(customerId: string, customerEmail: string): Promise<CustomerDashboard>;
  // Phase 2.4: customer vehicle projections (CUST-10, CUST-11, CUST-12, CUST-13, RULE-04, RULE-07, RULE-08)
  getCustomerVehicles(customerId: string, query?: ListCustomerVehiclesQuery, nowISO?: string): Promise<CustomerVehicleListResponse>;
  getCustomerVehicleById(customerId: string, idOrSlug: string, nowISO?: string): Promise<CustomerVehicleDetail | null>;
  listCustomerShipments(customerId: string): Promise<CustomerShipment[]>;
  getCustomerShipment(customerId: string, shipmentId: string): Promise<CustomerShipment | null>;
  listCustomerDocuments(customerId: string): Promise<CustomerDocument[]>;
  getCustomerDocument(customerId: string, documentId: string): Promise<CustomerDocument | null>;
  listCustomerNotifications(customerId: string, query?: { status?: 'all' | 'read' | 'unread'; q?: string }): Promise<CustomerNotificationListResponse>;
  getCustomerNotification(customerId: string, notificationId: string): Promise<Notification | null>;
  markCustomerNotificationRead(customerId: string, notificationId: string): Promise<Notification | null>;
  markAllCustomerNotificationsRead(customerId: string): Promise<MarkNotificationsReadResponse>;
  getCustomerProfile(customerId: string, email: string): Promise<CustomerProfile>;
  updateCustomerProfile(customerId: string, email: string, request: UpdateCustomerProfileRequest, nowISO?: string): Promise<CustomerProfile>;
  // Phase 2.5: customer invoice projections (CUST-02, CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-08, RULE-10)
  getCustomerInvoices(customerId: string, query?: ListCustomerInvoicesQuery, nowISO?: string): Promise<CustomerInvoiceListResponse>;
  getCustomerInvoiceById(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDetail | null>;
  getCustomerInvoiceDocument(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDocument | null>;
  listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse>;
  getCustomerPayment(customerId: string, id: string): Promise<CustomerPayment | null>;
  createCustomerPayment(customerId: string, request: CreateCustomerPaymentRequest, nowISO?: string): Promise<CustomerPayment>;
  listCustomerPaymentNotifications(customerId: string, paymentId?: string): Promise<CustomerPaymentNotificationListResponse>;
  resubmitCustomerPayment(customerId: string, paymentId: string, nowISO?: string): Promise<CustomerPayment>;
  recordPaymentNotification(paymentId: string, request: RecordPaymentNotificationRequest, nowISO?: string): Promise<CustomerPaymentNotification | null>;
  // Phase 2.12: customer self-registration, credentials and password reset
  // (CUST-26..30, D02-ASM-005/006/007). The Mock API is the only authority
  // for credentials and sessions; no password, hash or salt is ever
  // returned, logged or cached, and no route accepts a client-supplied
  // customer id.
  registerCustomerAccount(request: RegisterCustomerRequest, nowISO?: string): Promise<CustomerAccountProjection>;
  authenticateCustomer(request: LoginRequest): Promise<CustomerAccountProjection>;
  changeCustomerPassword(customerId: string, request: ChangePasswordRequest, nowISO?: string): Promise<void>;
  requestPasswordReset(request: PasswordResetRequest, nowISO?: string): Promise<void>;
  confirmPasswordReset(request: ConfirmPasswordResetRequest, nowISO?: string): Promise<void>;
  listPasswordResetOutbox(): Promise<PasswordResetOutboxRecord[]>;
  getCountries(): Promise<CountriesResponse>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

// --- Phase 2.12: customer self-registration, credential handling and the
// password-reset contract (CUST-26..30, D02-ASM-005/006/007). ---
//
// The account and reset-outbox entities live in both `MemoryStore` and
// `PostgresStore` per the `enquiries`/`reservations` precedent. Passwords are
// hashed with salted `scrypt` from `node:crypto`; no plaintext password, hash
// or salt is ever stored elsewhere, logged, cached or returned by any route.
// `AccountRequestError` follows the existing `ReservationRequestError` /
// `EnquiryRequestError` typed-error idiom for field-level 400/409 responses.

export class AccountRequestError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;

  constructor(statusCode: number, message: string, field?: string) {
    super(message);
    this.name = 'AccountRequestError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

/**
 * A single generic authentication failure — reused for "unknown email" and
 * "wrong password" so a caller can never distinguish account existence from
 * a login response (CUST-27, account-enumeration boundary).
 */
export class AuthenticationError extends Error {
  readonly statusCode = 401;

  constructor(message = 'Invalid email or password') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface CustomerAccountRecord {
  id: string;
  customerId: string;
  nameWithInitials: string;
  countryCode: string;
  dialCode: string;
  mobileNumber: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  status: 'active';
  verificationState: 'unverified';
  createdAt: string;
  updatedAt: string;
  passwordUpdatedAt: string;
}

export interface PasswordResetOutboxRecord {
  token: string;
  email: string;
  issuedAt: string;
  expiresAt: string;
  consumed: boolean;
}

export interface CustomerAccountProjection {
  id: string;
  customerId: string;
  nameWithInitials: string;
  countryCode: string;
  dialCode: string;
  mobileNumber: string;
  email: string;
  status: string;
  verificationState: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterCustomerRequest {
  nameWithInitials: string;
  countryCode: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface ConfirmPasswordResetRequest {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface CountryOption {
  isoCode: string;
  name: string;
  dialCode: string;
}

export interface CountriesResponse {
  items: CountryOption[];
}

// ISO-3166 country + E.164 dial-code catalog. Deliberately covers CarChief's
// primary export destinations plus a broad conventional set so registration
// is usable for any visitor; `packages/domain` may later become the single
// shared source (Phase 2.12 T002) without changing this route's contract.
const COUNTRIES: CountryOption[] = [
  { isoCode: 'UG', name: 'Uganda', dialCode: '+256' },
  { isoCode: 'KE', name: 'Kenya', dialCode: '+254' },
  { isoCode: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { isoCode: 'RW', name: 'Rwanda', dialCode: '+250' },
  { isoCode: 'SS', name: 'South Sudan', dialCode: '+211' },
  { isoCode: 'BI', name: 'Burundi', dialCode: '+257' },
  { isoCode: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { isoCode: 'SO', name: 'Somalia', dialCode: '+252' },
  { isoCode: 'ZM', name: 'Zambia', dialCode: '+260' },
  { isoCode: 'MW', name: 'Malawi', dialCode: '+265' },
  { isoCode: 'CD', name: 'DR Congo', dialCode: '+243' },
  { isoCode: 'NG', name: 'Nigeria', dialCode: '+234' },
  { isoCode: 'GH', name: 'Ghana', dialCode: '+233' },
  { isoCode: 'ZA', name: 'South Africa', dialCode: '+27' },
  { isoCode: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { isoCode: 'US', name: 'United States', dialCode: '+1' },
  { isoCode: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { isoCode: 'JP', name: 'Japan', dialCode: '+81' },
  { isoCode: 'IN', name: 'India', dialCode: '+91' },
  { isoCode: 'AU', name: 'Australia', dialCode: '+61' },
];

const SCRYPT_KEY_LENGTH = 64;

/** Salted `scrypt` derivation (`node:crypto`), server-side only. */
function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex');
  return { hash, salt };
}

/** Constant-length comparison against the stored derivation. */
function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

// A fixed dummy derivation, computed once at module load, so an unknown
// email still performs a `scrypt` comparison before the login route
// responds — the same generic 401 either way, with no obviously-faster path
// for an unregistered address (CUST-27 account-enumeration boundary).
const DUMMY_PASSWORD_DERIVATION = hashPassword('unknown-account-timing-parity');

/**
 * D02-ASM-005: minimum 12 characters, no maximum below 128, at least one
 * letter and one digit, no forced rotation and no further composition rule.
 * Declared once here and enforced authoritatively by the Mock API; the
 * shared `packages/validation` copy is Phase 2.12 T002's responsibility.
 */
function validatePasswordPolicy(password: string): string | null {
  if (typeof password !== 'string' || password.length < 12) {
    return 'Password must be at least 12 characters long';
  }
  if (password.length > 128) {
    return 'Password must be no more than 128 characters long';
  }
  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one digit';
  }
  return null;
}

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

interface ValidatedRegistration {
  nameWithInitials: string;
  countryCode: string;
  dialCode: string;
  mobileNumber: string;
  email: string;
  password: string;
}

function validateRegisterCustomerRequest(request: RegisterCustomerRequest, countries: CountryOption[]): ValidatedRegistration {
  const nameWithInitials = typeof request?.nameWithInitials === 'string' ? request.nameWithInitials.trim() : '';
  if (!nameWithInitials) {
    throw new AccountRequestError(400, 'Name with initials is required', 'nameWithInitials');
  }

  const countryCode = typeof request?.countryCode === 'string' ? request.countryCode.trim().toUpperCase() : '';
  const country = countries.find((c) => c.isoCode === countryCode);
  if (!country) {
    throw new AccountRequestError(400, 'A valid country is required', 'countryCode');
  }

  const mobileNumber = typeof request?.mobileNumber === 'string' ? request.mobileNumber.trim() : '';
  if (!mobileNumber || !/^[0-9]{4,15}$/.test(mobileNumber)) {
    throw new AccountRequestError(400, 'A valid mobile number is required', 'mobileNumber');
  }

  const rawEmail = typeof request?.email === 'string' ? request.email.trim() : '';
  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    throw new AccountRequestError(400, 'A valid email address is required', 'email');
  }

  const password = typeof request?.password === 'string' ? request.password : '';
  const policyError = validatePasswordPolicy(password);
  if (policyError) {
    throw new AccountRequestError(400, policyError, 'password');
  }

  const confirmPassword = typeof request?.confirmPassword === 'string' ? request.confirmPassword : '';
  if (password !== confirmPassword) {
    throw new AccountRequestError(400, 'Passwords do not match', 'confirmPassword');
  }

  return {
    nameWithInitials,
    countryCode,
    dialCode: country.dialCode,
    mobileNumber,
    email: normalizeEmail(rawEmail),
    password,
  };
}

function toCustomerAccountProjection(record: CustomerAccountRecord): CustomerAccountProjection {
  return {
    id: record.id,
    customerId: record.customerId,
    nameWithInitials: record.nameWithInitials,
    countryCode: record.countryCode,
    dialCode: record.dialCode,
    mobileNumber: record.mobileNumber,
    email: record.email,
    status: record.status,
    verificationState: record.verificationState,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function generateAccountId(): string {
  return `acct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateCustomerId(): string {
  return `cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function performRegisterCustomerAccount(
  accounts: CustomerAccountRecord[],
  request: RegisterCustomerRequest,
  nowISO: string
): CustomerAccountRecord {
  const validated = validateRegisterCustomerRequest(request, COUNTRIES);
  const existing = accounts.find((a) => a.email === validated.email);
  if (existing) {
    throw new AccountRequestError(409, 'An account with this email already exists', 'email');
  }
  const { hash, salt } = hashPassword(validated.password);
  return {
    id: generateAccountId(),
    customerId: generateCustomerId(),
    nameWithInitials: validated.nameWithInitials,
    countryCode: validated.countryCode,
    dialCode: validated.dialCode,
    mobileNumber: validated.mobileNumber,
    email: validated.email,
    passwordHash: hash,
    passwordSalt: salt,
    status: 'active',
    verificationState: 'unverified',
    createdAt: nowISO,
    updatedAt: nowISO,
    passwordUpdatedAt: nowISO,
  };
}

function performAuthenticateCustomer(accounts: CustomerAccountRecord[], request: LoginRequest): CustomerAccountRecord {
  const email = normalizeEmail(request?.email);
  const password = typeof request?.password === 'string' ? request.password : '';
  const account = accounts.find((a) => a.email === email);
  if (!account) {
    verifyPassword(password, DUMMY_PASSWORD_DERIVATION.hash, DUMMY_PASSWORD_DERIVATION.salt);
    throw new AuthenticationError();
  }
  if (!verifyPassword(password, account.passwordHash, account.passwordSalt)) {
    throw new AuthenticationError();
  }
  return account;
}

function performChangeCustomerPassword(
  accounts: CustomerAccountRecord[],
  customerId: string,
  request: ChangePasswordRequest,
  nowISO: string
): void {
  const account = accounts.find((a) => a.customerId === customerId);
  if (!account) {
    throw new AuthenticationError('Current password is incorrect');
  }
  const currentPassword = typeof request?.currentPassword === 'string' ? request.currentPassword : '';
  if (!verifyPassword(currentPassword, account.passwordHash, account.passwordSalt)) {
    throw new AuthenticationError('Current password is incorrect');
  }
  const newPassword = typeof request?.newPassword === 'string' ? request.newPassword : '';
  const policyError = validatePasswordPolicy(newPassword);
  if (policyError) {
    throw new AccountRequestError(400, policyError, 'newPassword');
  }
  const confirmNewPassword = typeof request?.confirmNewPassword === 'string' ? request.confirmNewPassword : '';
  if (newPassword !== confirmNewPassword) {
    throw new AccountRequestError(400, 'Passwords do not match', 'confirmNewPassword');
  }
  const { hash, salt } = hashPassword(newPassword);
  account.passwordHash = hash;
  account.passwordSalt = salt;
  account.passwordUpdatedAt = nowISO;
  account.updatedAt = nowISO;
}

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

function performRequestPasswordReset(
  accounts: CustomerAccountRecord[],
  outbox: PasswordResetOutboxRecord[],
  request: PasswordResetRequest,
  nowISO: string
): void {
  const email = normalizeEmail(request?.email);
  const account = accounts.find((a) => a.email === email);
  // Always a silent no-op for an unknown email — the caller always responds
  // 202 regardless (D02-ASM-007 account-enumeration boundary).
  if (!account) return;
  const token = randomBytes(24).toString('hex');
  const expiresAt = new Date(new Date(nowISO).getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
  outbox.push({ token, email, issuedAt: nowISO, expiresAt, consumed: false });
}

function performConfirmPasswordReset(
  accounts: CustomerAccountRecord[],
  outbox: PasswordResetOutboxRecord[],
  request: ConfirmPasswordResetRequest,
  nowISO: string
): void {
  const token = typeof request?.token === 'string' ? request.token : '';
  const entry = outbox.find((o) => o.token === token);
  if (!entry) {
    throw new AccountRequestError(400, 'Invalid or expired reset token', 'token');
  }
  if (entry.consumed) {
    throw new AccountRequestError(400, 'Reset token has already been used', 'token');
  }
  if (new Date(entry.expiresAt).getTime() <= new Date(nowISO).getTime()) {
    throw new AccountRequestError(400, 'Reset token has expired', 'token');
  }

  const newPassword = typeof request?.newPassword === 'string' ? request.newPassword : '';
  const policyError = validatePasswordPolicy(newPassword);
  if (policyError) {
    throw new AccountRequestError(400, policyError, 'newPassword');
  }
  const confirmNewPassword = typeof request?.confirmNewPassword === 'string' ? request.confirmNewPassword : '';
  if (newPassword !== confirmNewPassword) {
    throw new AccountRequestError(400, 'Passwords do not match', 'confirmNewPassword');
  }

  const account = accounts.find((a) => a.email === entry.email);
  if (!account) {
    throw new AccountRequestError(400, 'Invalid or expired reset token', 'token');
  }

  const { hash, salt } = hashPassword(newPassword);
  account.passwordHash = hash;
  account.passwordSalt = salt;
  account.passwordUpdatedAt = nowISO;
  account.updatedAt = nowISO;
  entry.consumed = true;
}

const SEED_CUSTOMER_ACCOUNT_EMAIL = 'demo.customer@carchief.com';
// Fixture-only credential bound to the seeded `cust-123` identity so every
// existing Delivery 02 customer suite keeps a working sign-in. Never a
// production secret — mock/dev-only, and only ever stored as its scrypt hash.
const SEED_CUSTOMER_ACCOUNT_PASSWORD = 'CarChief#Fixture2026';

function buildSeedCustomerAccount(): CustomerAccountRecord {
  const { hash, salt } = hashPassword(SEED_CUSTOMER_ACCOUNT_PASSWORD);
  const seedTimestamp = '2026-01-01T00:00:00.000Z';
  return {
    id: 'acct-cust-123',
    customerId: 'cust-123',
    nameWithInitials: 'J. K. Demo',
    countryCode: 'UG',
    dialCode: '+256',
    mobileNumber: '700000000',
    email: SEED_CUSTOMER_ACCOUNT_EMAIL,
    passwordHash: hash,
    passwordSalt: salt,
    status: 'active',
    verificationState: 'unverified',
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    passwordUpdatedAt: seedTimestamp,
  };
}

// --- Phase 1.5: freight destination, port and rate lookup (D01-ASM-001) ---
//
// This reference data is Finance/logistics-owned catalog and rate data, not
// per-tenant records, so both MemoryStore and PostgresStore serve it from the
// same in-process constants rather than a new Postgres table — there is no
// mutation path in this task's scope (no CRUD), so no schema/reset is needed.
// See tasks/delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md row D01-ASM-001.

// Reference instant used to evaluate rate effective windows deterministically,
// matching the vehicle-location reference date used elsewhere in this store.
const FREIGHT_REFERENCE_DATE = '2026-08-10T10:00:00.000Z';

const freightDestinations: FreightDestination[] = [
  { code: 'UG', name: 'Uganda', country: 'Uganda' },
  { code: 'KE', name: 'Kenya', country: 'Kenya' },
  { code: 'TZ', name: 'Tanzania', country: 'Tanzania' },
  { code: 'RW', name: 'Rwanda', country: 'Rwanda' },
  { code: 'SS', name: 'South Sudan', country: 'South Sudan' },
];

const freightPorts: FreightPort[] = [
  { code: 'MBA', name: 'Mombasa', country: 'Kenya' },
  { code: 'DAR', name: 'Dar es Salaam', country: 'Tanzania' },
];

// Rate records as supplied data only (D01-ASM-001): a placeholder `amount`
// stands in for a real Finance-supplied figure so the lookup layer (active /
// stale / no_rate) is demonstrable. No route ever surfaces `amount` as, or
// folds it into, a computed total.
const freightRateRecords: FreightRateRecord[] = [
  // UG via Mombasa: currently active.
  { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2026-06-01T00:00:00.000Z' },
  // KE via Mombasa: expired with no replacement supplied yet -> stale.
  {
    destinationCode: 'KE',
    portCode: 'MBA',
    currency: 'USD',
    amount: 400,
    effectiveFrom: '2025-01-01T00:00:00.000Z',
    effectiveTo: '2026-01-01T00:00:00.000Z',
  },
  // TZ via Dar es Salaam: currently active.
  { destinationCode: 'TZ', portCode: 'DAR', currency: 'USD', amount: 700, effectiveFrom: '2026-07-01T00:00:00.000Z' },
  // RW and SS: intentionally no rate record supplied yet -> no_rate.
];

// The calculation sequence itself (D01-P05-T002) lives in
// `@carchief/domain`'s `calculateFreightEstimate` — the mock API supplies the
// catalog/rate-record data below and calls it; the calculation stays
// authoritative and server-side in both branches (never the browser).
// `FreightRequestError` and `resolveFreightRateStatus` are re-exported above
// unchanged so existing call sites and tests are unaffected by the move.

/**
 * Thin store-owned wrapper around the domain calculation sequence, supplying
 * this store's default reference instant when the caller omits one.
 */
export function buildFreightEstimate(
  destinations: FreightDestination[],
  ports: FreightPort[],
  records: FreightRateRecord[],
  request: FreightEstimateRequest,
  nowISO: string = FREIGHT_REFERENCE_DATE
): FreightEstimateResponse {
  return calculateFreightEstimate(destinations, ports, records, request, nowISO);
}

// --- Phase 1.7: Public Content, FAQ and Testimonial Seed Fixtures (PUB-17..PUB-35) ---

export class TestimonialRequestError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;

  constructor(statusCode: number, message: string, field?: string) {
    super(message);
    this.name = 'TestimonialRequestError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

const seedFaqCategories: FaqCategory[] = [
  { id: 'cat-buying-process', name: 'Buying Process', description: 'Step-by-step guidance on searching, reserving, and purchasing vehicles.', order: 1 },
  { id: 'cat-payment-pricing', name: 'Payment & Pricing', description: 'Understanding prices, pro-forma invoices, wire transfers, and currency.', order: 2 },
  { id: 'cat-shipping-freight', name: 'Shipping & Logistics', description: 'Ocean freight schedules, destination ports, RORO vs container shipping.', order: 3 },
  { id: 'cat-vehicle-condition', name: 'Vehicle Condition & Inspection', description: 'Japanese auction grading standards, inspection sheets, and condition guarantees.', order: 4 },
  { id: 'cat-customs-duties', name: 'Customs & Import Duties', description: 'Import duty calculators, tax guidance, and country age restrictions.', order: 5 },
  { id: 'cat-documentation', name: 'Documents & Registration', description: 'Export certificates, Bills of Lading, JAVIC/QISJ inspection certificates.', order: 6 },
  { id: 'cat-warranty-returns', name: 'Warranty & Claims', description: 'Vehicle guarantee policies, claim submission, and dispute resolution.', order: 7 },
  { id: 'cat-auction-services', name: 'Auction Services', description: 'Auction sourcing service, account-gated bidding access, and deposit/fee guidance.', order: 8 },
  { id: 'cat-account-security', name: 'Account & Security', description: 'Managing user profiles, demo sessions, and secure communication channels.', order: 9 },
  { id: 'cat-insurance-coverage', name: 'Insurance Coverage', description: 'Marine transit insurance, coverage limits, and damage claims during shipping.', order: 10 },
  { id: 'cat-country-regulations', name: 'Country Import Rules', description: 'Specific vehicle age limits, drive-side rules, and port requirements by country.', order: 11 },
  { id: 'cat-customer-support', name: 'Customer Support & Service', description: 'Contacting local branch offices, WhatsApp assistance, and working hours.', order: 12 },
];

const seedFaqItems: FaqItem[] = [
  {
    id: 'faq-1',
    categoryId: 'cat-buying-process',
    categoryName: 'Buying Process',
    question: 'How do I purchase a vehicle on CarChief?',
    answer: 'Browse our available inventory, select your vehicle, and request a quotation or click Reserve. Our team will issue a Proforma Invoice and guide you through payment and shipping.',
    slug: 'how-do-i-purchase-a-vehicle',
    featured: true,
    order: 1,
    owner: 'ContentTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-2',
    categoryId: 'cat-payment-pricing',
    categoryName: 'Payment & Pricing',
    question: 'What payment methods does CarChief accept?',
    answer: 'We accept telegraphic transfers (T/T wire transfers) to our verified official bank accounts. Detailed banking instructions are included on your Proforma Invoice.',
    slug: 'what-payment-methods-accepted',
    featured: true,
    order: 1,
    owner: 'ContentTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-3',
    categoryId: 'cat-shipping-freight',
    categoryName: 'Shipping & Logistics',
    question: 'Which ports does CarChief ship to in Africa and the Caribbean?',
    answer: 'We regularly ship to major regional ports including Mombasa (Kenya), Dar es Salaam (Tanzania), Durban (South Africa), Port Louis (Mauritius), and Kingston (Jamaica).',
    slug: 'which-ports-shipped-to',
    featured: true,
    order: 1,
    owner: 'LogisticsTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-4',
    categoryId: 'cat-vehicle-condition',
    categoryName: 'Vehicle Condition & Inspection',
    question: 'What do Japanese auction grades mean?',
    answer: 'Japanese auction grades rate vehicle condition on a scale from Grade 5 (like new) down to Grade 3 or R (repaired). Every vehicle listing includes authentic inspection reports.',
    slug: 'japanese-auction-grades-explained',
    featured: false,
    order: 1,
    owner: 'QualityTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-5',
    categoryId: 'cat-customs-duties',
    categoryName: 'Customs & Import Duties',
    question: 'Who pays customs duties and port clearance fees?',
    answer: 'Customs clearance and local import duties are the responsibility of the buyer at the destination port, unless a local branch office package is specifically arranged.',
    slug: 'customs-duties-responsibility',
    featured: false,
    order: 1,
    owner: 'ComplianceTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-6',
    categoryId: 'cat-documentation',
    categoryName: 'Documents & Registration',
    question: 'Which documents will I receive for vehicle registration?',
    answer: 'You will receive the original Export Certificate (Japanese de-registration certificate), Bill of Lading, Commercial Invoice, and pre-shipment inspection certificates (JAVIC/QISJ).',
    slug: 'documents-received-for-registration',
    featured: false,
    order: 1,
    owner: 'DocumentationTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-7',
    categoryId: 'cat-warranty-returns',
    categoryName: 'Warranty & Claims',
    question: 'Are vehicles covered by a warranty?',
    answer: 'All stock is inspected prior to shipment. Optional transit insurance covers damage during voyage. Contact support for any pre-delivery discrepancies.',
    slug: 'vehicle-warranty-policy',
    featured: false,
    order: 1,
    owner: 'SupportTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-8',
    categoryId: 'cat-auction-services',
    categoryName: 'Auction Services',
    question: 'Does CarChief provide access to Japanese vehicle auctions?',
    answer: 'CarChief’s team sources vehicles found at major Japanese auto auctions on your behalf and shares translated inspection sheets. Live bidding access on the auction sites themselves is account-gated for registered clients — this public website does not provide direct auction-site bidding or real-time auction data.',
    slug: 'bidding-on-japanese-auctions',
    featured: true,
    order: 1,
    owner: 'AuctionTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-9',
    categoryId: 'cat-account-security',
    categoryName: 'Account & Security',
    question: 'How does CarChief protect my account and personal data?',
    answer: 'We enforce strict HTTPS encryption, demo session tokens, and never share private buyer contact information publicly or with third parties.',
    slug: 'account-data-security-policy',
    featured: false,
    order: 1,
    owner: 'SecurityTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-10',
    categoryId: 'cat-insurance-coverage',
    categoryName: 'Insurance Coverage',
    question: 'Is marine transit insurance included with shipping?',
    answer: 'Marine transit insurance is available as an option on all FOB and C&F quotes to protect your vehicle against loss or damage during ocean transit.',
    slug: 'marine-transit-insurance-coverage',
    featured: false,
    order: 1,
    owner: 'LogisticsTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    // PUB-30, D01-ASM-006: no approved country-specific import-age/levy figure
    // exists in REQUIREMENT.md or any approved decision. A specific numeric
    // regulatory claim carries real legal/financial consequences for a buyer
    // who relies on it (RULE-09, RULE-10), so this answer stays deliberately
    // general and directs the buyer to confirm current rules rather than
    // asserting an unverified threshold.
    id: 'faq-11',
    categoryId: 'cat-country-regulations',
    categoryName: 'Country Import Rules',
    question: 'What import age restrictions or regulations apply in my destination country?',
    answer: 'Import age restrictions, levies and other vehicle-import regulations vary by destination country and change over time. CarChief does not publish specific country-by-country figures on this page; please confirm the current requirements for your destination with your local customs/import authority or contact CarChief directly for guidance before purchase.',
    slug: 'country-vehicle-age-restrictions',
    featured: true,
    order: 1,
    owner: 'ComplianceTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'faq-12',
    categoryId: 'cat-customer-support',
    categoryName: 'Customer Support & Service',
    question: 'How can I contact CarChief customer support?',
    answer: 'Reach our team via live WhatsApp inquiry, email at support@carchief.com, or visit one of our regional branch offices during business hours.',
    slug: 'contacting-customer-support',
    featured: true,
    order: 1,
    owner: 'SupportTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
];

const seedTestimonials: TestimonialItem[] = [
  {
    id: 'testim-1',
    authorName: 'John K.',
    authorLocation: 'Harare, Zimbabwe',
    vehiclePurchased: '2021 Toyota Corolla Axio',
    rating: 5,
    content: 'Seamless import process! My Toyota Axio arrived at Durban port on schedule and in excellent condition.',
    submittedAt: '2026-08-01T12:00:00.000Z',
    status: 'approved',
    consent: true,
  },
  {
    id: 'testim-2',
    authorName: 'Amina M.',
    authorLocation: 'Mombasa, Kenya',
    vehiclePurchased: '2020 Mazda CX-5',
    rating: 5,
    content: 'Highly professional service. Clear freight updates and accurate auction inspection sheets made buying easy.',
    submittedAt: '2026-08-03T14:30:00.000Z',
    status: 'approved',
    consent: true,
  },
  {
    id: 'testim-3',
    authorName: 'David O.',
    authorLocation: 'Kampala, Uganda',
    vehiclePurchased: '2019 Mercedes-Benz C200',
    rating: 5,
    content: 'Transparent pricing, no hidden costs. The team guided me step-by-step from Yokohama port to my door.',
    submittedAt: '2026-08-05T09:15:00.000Z',
    status: 'approved',
    consent: true,
  },
];

const seedPublicContentPages: PublicContentPage[] = [
  {
    slug: 'about-us',
    title: 'About CarChief',
    summary: 'Leading Japanese vehicle export specialist connecting global buyers with certified quality stock.',
    body: 'CarChief is a premier Japanese vehicle export dealer headquartered in Tokyo, Japan. We specialize in supplying high-quality Japanese used vehicles to importers, dealers, and individual buyers across East Africa, Southern Africa, the Caribbean, and Oceania.',
    owner: 'ExecutiveTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
    sections: [
      { title: 'Our Mission', content: 'Delivering transparent, reliable, and accessible vehicle purchasing directly from Japan to your local port.' },
      { title: 'Quality Standards', content: 'Every vehicle in our stock undergoes rigorous pre-shipment multi-point inspections by certified inspectors.' },
    ],
  },
  {
    slug: 'how-to-buy',
    title: 'How to Buy a Vehicle Step-by-Step',
    summary: 'A clear four-step guide explaining search, reservation, payment, and port delivery.',
    body: 'Buying your dream car from Japan is straightforward with CarChief. Follow our four simple steps to select, reserve, pay for, and receive your vehicle.',
    owner: 'SalesTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
    sections: [
      { title: 'Step 1: Select Your Vehicle', content: 'Browse our stock online or request a specific model through our search and quotation form.' },
      { title: 'Step 2: Reserve & Quotation', content: 'Click Reserve or Request Quote to lock in vehicle availability and receive a formal Proforma Invoice.' },
      { title: 'Step 3: Payment', content: 'Complete wire transfer payment according to the Proforma Invoice instructions within the hold window.' },
      { title: 'Step 4: Shipping & Customs', content: 'Track ocean voyage progress, receive original documents via DHL, and clear the vehicle at destination port.' },
    ],
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    summary: 'Connect with our regional sales specialists and support hubs worldwide.',
    body: 'Our international customer service team is available Monday through Friday. Reach out via email, phone, or visit our regional branch hubs.',
    owner: 'SupportTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
    sections: [
      // PUB-21, PUB-28, D01-ASM-004: no approved, verified hotline number
      // exists yet. Labelled explicitly as a demo/placeholder value pending
      // approval, matching the office/branch fixture convention below,
      // rather than presenting an unverified number as a real contact line.
      { title: 'Global Customer Support', content: 'Email: support@carchief.com | Hotline: +256 700 000 000 (demo number — pending approval)' },
    ],
  },
  {
    // PUB-27, D01-ASM-005: Live Auction bidding/data integration is account-gated
    // or an approved external destination and is not implied by this public page.
    // This copy describes the sourcing service CarChief actually provides through
    // this website; it must never claim direct auction-site bidding access or a
    // specific listing-volume statistic that has not been approved.
    slug: 'auction-services',
    title: 'Japanese Auto Auction Services',
    summary: 'CarChief’s Japanese auction-sourcing service: buying guidance, translated inspection sheets and account-gated bidding access.',
    body: 'CarChief’s team sources vehicles found at major Japanese auto auctions on behalf of buyers, reviewing translated inspection sheets and coordinating the purchase process. Live bidding access on the auction sites themselves is account-gated for registered clients and is not provided directly through this public website.',
    owner: 'AuctionTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
    sections: [
      { title: 'Auction Sourcing Service', content: 'Contact a sales representative to discuss vehicle sourcing from Japanese auto auctions and, where account-gated, to activate bidding access.' },
      { title: 'Auction Terms', content: 'Bids placed through an activated account require a refundable bidding deposit. Inspection sheets are translated by our staff before a purchase decision is made.' },
    ],
  },
  {
    // PUB-29, D01-ASM-005: no approved vessel-schedule data source exists. This
    // page must describe how ocean shipping generally works without asserting
    // specific departure dates or transit-time figures that were never approved.
    slug: 'shipping-schedule',
    title: 'Ocean Shipping Schedule',
    summary: 'How ocean shipping works for CarChief vehicle exports from Japan, and where to get current sailing information.',
    body: 'Vehicles purchased through CarChief are shipped by RORO (Roll-on/Roll-off) or container vessel from Japan to your destination port. Confirmed vessel departure dates and transit-time estimates vary by carrier and route and are not published on this page.',
    owner: 'LogisticsTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
    sections: [
      { title: 'How Ocean Shipping Generally Works', content: 'After purchase, vehicles are consolidated for RORO or container shipment from a Japanese port to your destination port. Route and vessel choice depend on your destination.' },
      { title: 'Current Sailing Information', content: 'Confirmed departure dates and transit times are pending approved carrier data and are not shown here. Contact our logistics team for the current schedule for your route.' },
    ],
  },
  {
    slug: 'company-services',
    title: 'CarChief Company Services',
    summary: 'Comprehensive auto export, inspection, marine insurance, and logistics management.',
    body: 'CarChief offers end-to-end vehicle sourcing, pre-export mechanical inspections, custom container packing, marine insurance, and port handling services.',
    owner: 'OperationsTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    slug: 'our-team',
    title: 'Meet Our Leadership & Global Team',
    summary: 'Dedicated automotive export specialists, logistics managers, and customer support representatives.',
    // PUB-30, D01-ASM-005: no approved source exists for a specific years-of-experience
    // figure, so this copy describes the team's role composition without an ungrounded statistic.
    body: 'Our multicultural team of automotive export specialists, logistics coordinators and customer support representatives works together to support buyers through every step of the Japanese vehicle import process.',
    owner: 'HRTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    slug: 'gallery-news',
    title: 'Company News & Operations Gallery',
    summary: 'Latest updates on port shipments, market trends, and CarChief announcements.',
    body: 'Stay updated with news from Japanese auto auctions, regional import regulation changes, and photos from our port yards in Japan.',
    owner: 'MediaTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
  {
    slug: 'security-bank-info',
    title: 'Official Bank Details & Payment Security',
    summary: 'Verified payment security guidelines and official bank account projection for Proforma Invoice verification.',
    body: 'To protect our clients against fraudulent phishing attempts, always verify payment details against our official bank account numbers before initiating a wire transfer.',
    owner: 'FinanceTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
    sections: [
      { title: 'Payment Verification Protocol', content: 'CarChief bank details are provided solely on official Proforma Invoices. Never transfer funds to personal or unverified accounts.' },
    ],
  },
  {
    slug: 'privacy-cookie-policy',
    title: 'Privacy & Cookie Policy',
    summary: 'Information on data protection, cookie usage choices, and privacy rights.',
    body: 'We respect your privacy. This page outlines how CarChief collects, uses, and safeguards visitor data in compliance with international privacy standards.',
    owner: 'LegalTeam',
    status: 'approved',
    updatedAt: '2026-08-10T10:00:00.000Z',
  },
];

// D01-ASM-004: office location roster and contact details are an illustrative MVP
// demo projection (city/country level only — no street address, named individual or
// verified phone/email is asserted as real). Pending DEC-PUB-BRANCH-PAGE and an
// approved office/content owner sign-off. See REQUIREMENT_GAPS_AND_ASSUMPTIONS.md.
const seedOfficeLocations: OfficeLocation[] = [
  {
    id: 'off-1',
    name: 'Tokyo Head Office (demo)',
    city: 'Tokyo',
    country: 'Japan',
    address: 'Tokyo, Japan — exact office address pending approval',
    phone: '+81 3 0000 0000',
    email: 'japan@carchief.com',
    operatingHours: 'Mon-Fri 09:00 - 18:00 JST',
    isPrimary: true,
    status: 'approved',
  },
  {
    id: 'off-2',
    name: 'Durban Regional Hub (demo)',
    city: 'Durban',
    country: 'South Africa',
    address: 'Durban, South Africa — exact office address pending approval',
    phone: '+27 31 000 0000',
    email: 'durban@carchief.com',
    operatingHours: 'Mon-Fri 08:00 - 17:00 SAST',
    isPrimary: false,
    status: 'approved',
  },
  {
    id: 'off-3',
    name: 'Harare Representative Office (demo)',
    city: 'Harare',
    country: 'Zimbabwe',
    address: 'Harare, Zimbabwe — exact office address pending approval',
    phone: '+263 24 000 0000',
    email: 'harare@carchief.com',
    operatingHours: 'Mon-Fri 08:30 - 16:30 CAT',
    isPrimary: false,
    status: 'approved',
  },
];

// D01-ASM-004: the branch roster (which branches exist, their names/codes/ports) and
// the "CarChief Team" entries within each branch are an illustrative MVP demo
// projection, not an approved company definition. DEC-PUB-BRANCH-PAGE stays OPEN —
// no branch list, staff roster or office address here is asserted as real/approved.
// Team entries are role-only contact points; no named individual is invented.
// See REQUIREMENT_GAPS_AND_ASSUMPTIONS.md (D01-ASM-004).
const seedBranches: BranchContent[] = [
  {
    id: 'harare-hub',
    name: 'Harare Hub (demo)',
    code: 'HRE',
    destinationPort: 'Durban',
    introduction: 'CarChief Harare Hub connects buyers in Zimbabwe with direct imports routed via Durban port. This is a demo branch projection pending an approved branch definition.',
    welcomeBanner: 'Welcome to CarChief Harare Hub — Direct Imports to Zimbabwe',
    contactBanner: 'Contact our Harare team today for personalized vehicle sourcing',
    teamMembers: [
      { name: 'Harare Branch Support', role: 'Branch Manager (role contact — pending approved staff directory)', contactEmail: 'harare@carchief.com' },
      { name: 'Harare Customer Success', role: 'Customer Success Advisor (role contact — pending approved staff directory)', contactEmail: 'harare@carchief.com' },
    ],
    meetAndGreetInfo: 'Visit our Harare representative office for in-person consultation and pro-forma invoice assistance.',
    contactDetails: {
      phone: '+263 24 000 0000',
      email: 'harare@carchief.com',
      address: 'Harare, Zimbabwe — exact office address pending approval',
      hours: 'Mon-Fri 08:30 - 16:30 CAT',
    },
    contentOwner: 'BranchTeam',
    status: 'approved',
    latestArrivalsQuery: { destinationPort: 'Durban', limit: 4 },
    recentlyDiscountedQuery: { destinationPort: 'Durban', limit: 4 },
  },
  {
    id: 'kingston-hub',
    name: 'Kingston Hub (demo)',
    code: 'KIN',
    destinationPort: 'Kingston',
    introduction: 'CarChief Kingston Hub offers Caribbean vehicle buyers direct access to top-grade Japanese stock. This is a demo branch projection pending an approved branch definition.',
    welcomeBanner: 'Welcome to CarChief Kingston Hub — Direct Imports to Jamaica',
    contactBanner: 'Connect with our Kingston team for fast quotes and shipping updates',
    teamMembers: [
      { name: 'Kingston Branch Support', role: 'Caribbean Regional Contact (role contact — pending approved staff directory)', contactEmail: 'kingston@carchief.com' },
    ],
    meetAndGreetInfo: 'Our Kingston team assists with port clearance and Jamaican import compliance.',
    contactDetails: {
      phone: '+1 876 000 0000',
      email: 'kingston@carchief.com',
      address: 'Kingston, Jamaica — exact office address pending approval',
      hours: 'Mon-Fri 08:00 - 17:00 EST',
    },
    contentOwner: 'BranchTeam',
    status: 'approved',
    latestArrivalsQuery: { limit: 4 },
    recentlyDiscountedQuery: { limit: 4 },
  },
  {
    id: 'port-louis-hub',
    name: 'Port Louis Hub (demo)',
    code: 'PLU',
    destinationPort: 'Port Louis',
    introduction: 'CarChief Port Louis Hub serves buyers in Mauritius with quality Japanese vehicle imports. This is a demo branch projection pending an approved branch definition.',
    welcomeBanner: 'Welcome to CarChief Port Louis Hub — Direct Imports to Mauritius',
    contactBanner: 'Speak with our Port Louis team for local clearance advice',
    teamMembers: [
      { name: 'Port Louis Branch Support', role: 'Operations Contact (role contact — pending approved staff directory)', contactEmail: 'portlouis@carchief.com' },
    ],
    meetAndGreetInfo: 'Our Port Louis team provides guidance on Mauritian duty structures and inspection certs.',
    contactDetails: {
      phone: '+230 211 0000',
      email: 'portlouis@carchief.com',
      address: 'Port Louis, Mauritius — exact office address pending approval',
      hours: 'Mon-Fri 08:30 - 16:30 MUT',
    },
    contentOwner: 'BranchTeam',
    status: 'approved',
    latestArrivalsQuery: { limit: 4 },
    recentlyDiscountedQuery: { limit: 4 },
  },
];

function filterFaqs(
  items: FaqItem[],
  categories: FaqCategory[],
  query?: { category?: string; q?: string }
): FaqQueryResponse {
  let approvedItems = items.filter((item) => item.status === 'approved');

  if (query?.category) {
    const catVal = query.category.toLowerCase().trim();
    approvedItems = approvedItems.filter(
      (item) => item.categoryId.toLowerCase() === catVal || item.categoryName.toLowerCase() === catVal
    );
  }

  if (query?.q) {
    const qLower = query.q.toLowerCase().trim();
    const matched = approvedItems.filter(
      (item) =>
        item.question.toLowerCase().includes(qLower) ||
        item.answer.toLowerCase().includes(qLower) ||
        item.categoryName.toLowerCase().includes(qLower)
    );

    if (matched.length === 0) {
      return {
        categories,
        items: [],
        total: categories.length,
        matchedCount: 0,
        groundedNoAnswer: true,
        message: 'No grounded answer found matching your query. Please contact our support team.',
      };
    }

    return {
      categories,
      items: matched,
      total: categories.length,
      matchedCount: matched.length,
      groundedNoAnswer: false,
    };
  }

  return {
    categories,
    items: approvedItems,
    total: categories.length,
    matchedCount: approvedItems.length,
    groundedNoAnswer: false,
  };
}

function validateTestimonialSubmission(request: TestimonialSubmissionRequest): void {
  if (!request || typeof request !== 'object') {
    throw new TestimonialRequestError(400, 'Request body is required');
  }
  if (!request.authorName || !request.authorName.trim()) {
    throw new TestimonialRequestError(400, 'Name is required', 'authorName');
  }
  if (!request.authorLocation || !request.authorLocation.trim()) {
    throw new TestimonialRequestError(400, 'Location is required', 'authorLocation');
  }
  if (!request.content || !request.content.trim()) {
    throw new TestimonialRequestError(400, 'Testimonial content is required', 'content');
  }
  const ratingNum = Number(request.rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new TestimonialRequestError(400, 'Rating must be an integer between 1 and 5', 'rating');
  }
  if (request.consent !== true) {
    throw new TestimonialRequestError(400, 'Consent is required to submit a testimonial', 'consent');
  }
}


// --- Phase 1.5: quotation enquiry persistence (PUB-13, PUB-15, D01-P05-T004) ---
//
// The enquiry flow is delivered in full regardless of DEC-PUB-FREIGHT-MODEL /
// DEC-PUB-CITY-DELIVERY (D01-ASM-001): a visitor can submit an enquiry about
// a vehicle, a shipping destination, or neither, and it is persisted with no
// dependency on a priced estimate. When a destination/port pair is supplied
// this captures a server-resolved rate-lookup snapshot for audit context only
// — never a computed total (RULE-09).

export class EnquiryRequestError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;

  constructor(statusCode: number, message: string, field?: string) {
    super(message);
    this.name = 'EnquiryRequestError';
    this.statusCode = statusCode;
    this.field = field;
  }
}

export interface EnquiryRecord {
  id: string;
  dedupeKey: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
  receivedAt: string;
  enquiryType: EnquiryType;
  source: EnquirySource;
  duplicateResubmissionCount: number;
  preferredMake?: string;
  preferredModel?: string;
  preferredDriveSide?: EnquiryPreferredDriveSide;
  preferredYear?: number;
  targetPriceUsd?: number;
}

interface PreparedEnquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
  enquiryType: EnquiryType;
  source: EnquirySource;
  preferredMake?: string;
  preferredModel?: string;
  preferredDriveSide?: EnquiryPreferredDriveSide;
  preferredYear?: number;
  targetPriceUsd?: number;
}

function requireNonEmptyString(value: unknown, field: string, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new EnquiryRequestError(400, `${label} is required`, field);
  }
  return value.trim();
}

/**
 * Validates and normalizes an enquiry request, resolving an optional vehicle
 * link and an optional server-side freight rate-lookup snapshot. Throws a
 * field-associated `EnquiryRequestError` (400) for anything invalid — never
 * silently drops or substitutes a value.
 */
export function prepareEnquiry(
  vehicles: VehicleRecord[],
  destinations: FreightDestination[],
  ports: FreightPort[],
  records: FreightRateRecord[],
  request: EnquiryRequest,
  nowISO: string
): PreparedEnquiry {
  if (!request || typeof request !== 'object') {
    throw new EnquiryRequestError(400, 'A request body is required');
  }

  const name = requireNonEmptyString(request.name, 'name', 'Name');
  const email = requireNonEmptyString(request.email, 'email', 'Email');
  if (!validateEmail(email)) {
    throw new EnquiryRequestError(400, 'Enter a valid email address', 'email');
  }
  const phone = requireNonEmptyString(request.phone, 'phone', 'Phone number');
  const message = requireNonEmptyString(request.message, 'message', 'Message');

  // D01-P06-T002 (PUB-14): consent is validated beyond native browser
  // checkbox validation — the server rejects any submission that does not
  // explicitly agree to be contacted, never inferring or defaulting it.
  if (request.consent !== true) {
    throw new EnquiryRequestError(400, 'You must agree to be contacted before sending this enquiry.', 'consent');
  }
  const consent = true;

  let vehicleSlug: string | undefined;
  if (request.vehicleSlug !== undefined && request.vehicleSlug !== null && request.vehicleSlug !== '') {
    if (typeof request.vehicleSlug !== 'string') {
      throw new EnquiryRequestError(400, 'vehicleSlug must be a string', 'vehicleSlug');
    }
    const record = findVehicleRecord(vehicles, request.vehicleSlug);
    if (!record) {
      throw new EnquiryRequestError(400, `Unknown vehicle '${request.vehicleSlug}'`, 'vehicleSlug');
    }
    vehicleSlug = generateVehicleSlug(record.year, record.make, record.model, record.id);
  }

  const hasDestination = Boolean(request.destinationCode);
  const hasPort = Boolean(request.portCode);
  let estimateSnapshot: EnquiryEstimateSnapshot | undefined;
  if (hasDestination !== hasPort) {
    throw new EnquiryRequestError(
      400,
      'Provide both destinationCode and portCode, or neither',
      hasDestination ? 'portCode' : 'destinationCode'
    );
  }
  if (hasDestination && hasPort) {
    const destinationCode = request.destinationCode as string;
    const portCode = request.portCode as string;
    if (!destinations.some((d) => d.code === destinationCode)) {
      throw new EnquiryRequestError(400, `Unsupported destination '${destinationCode}'`, 'destinationCode');
    }
    if (!ports.some((p) => p.code === portCode)) {
      throw new EnquiryRequestError(400, `Unsupported port '${portCode}'`, 'portCode');
    }
    const { status, record } = resolveFreightRateStatus(records, destinationCode, portCode, nowISO);
    estimateSnapshot = {
      destinationCode,
      portCode,
      rateStatus: status,
      currency: record?.currency,
      rateEffectiveFrom: record?.effectiveFrom,
      rateEffectiveTo: record?.effectiveTo,
      message: 'Shipping estimate unavailable — pending a confirmed freight rate.',
    };
  }

  let enquiryType: EnquiryType;
  if (request.enquiryType !== undefined && request.enquiryType !== null) {
    if (!ENQUIRY_TYPES.includes(request.enquiryType)) {
      throw new EnquiryRequestError(400, `Unsupported enquiryType '${String(request.enquiryType)}'`, 'enquiryType');
    }
    enquiryType = request.enquiryType;
  } else {
    // Safe MVP default (D01-P06-T001): a vehicle-linked enquiry with no
    // explicit type is a 'vehicle' enquiry; everything else defaults to
    // 'general'. 'price-request' and 'premium-vehicle' are never inferred —
    // the caller must state them explicitly.
    enquiryType = vehicleSlug ? 'vehicle' : 'general';
  }

  let source: EnquirySource;
  if (request.source !== undefined && request.source !== null) {
    if (!ENQUIRY_SOURCES.includes(request.source)) {
      throw new EnquiryRequestError(400, `Unsupported source '${String(request.source)}'`, 'source');
    }
    source = request.source;
  } else {
    source = 'form';
  }

  // D01-P06-T002 "In scope": optional vehicle-preference capture for a
  // visitor with no specific vehicle in mind yet. Informal intent only —
  // never a saved search, and never inferred when omitted.
  let preferredMake: string | undefined;
  if (request.preferredMake !== undefined && request.preferredMake !== null && request.preferredMake !== '') {
    preferredMake = requireNonEmptyString(request.preferredMake, 'preferredMake', 'Preferred make');
  }
  let preferredModel: string | undefined;
  if (request.preferredModel !== undefined && request.preferredModel !== null && request.preferredModel !== '') {
    preferredModel = requireNonEmptyString(request.preferredModel, 'preferredModel', 'Preferred model');
  }
  let preferredDriveSide: EnquiryPreferredDriveSide | undefined;
  if (request.preferredDriveSide !== undefined && request.preferredDriveSide !== null && (request.preferredDriveSide as unknown) !== '') {
    if (!ENQUIRY_PREFERRED_DRIVE_SIDES.includes(request.preferredDriveSide)) {
      throw new EnquiryRequestError(400, `Unsupported preferredDriveSide '${String(request.preferredDriveSide)}'`, 'preferredDriveSide');
    }
    preferredDriveSide = request.preferredDriveSide;
  }
  let preferredYear: number | undefined;
  if (request.preferredYear !== undefined && request.preferredYear !== null && (request.preferredYear as unknown) !== '') {
    const year = Number(request.preferredYear);
    const maxYear = new Date(nowISO).getFullYear() + 1;
    if (!Number.isInteger(year) || year < 1990 || year > maxYear) {
      throw new EnquiryRequestError(400, `Enter a preferred year between 1990 and ${maxYear}`, 'preferredYear');
    }
    preferredYear = year;
  }
  let targetPriceUsd: number | undefined;
  if (request.targetPriceUsd !== undefined && request.targetPriceUsd !== null && (request.targetPriceUsd as unknown) !== '') {
    const price = Number(request.targetPriceUsd);
    if (!Number.isFinite(price) || price < 0) {
      throw new EnquiryRequestError(400, 'Enter a target price of 0 or more', 'targetPriceUsd');
    }
    targetPriceUsd = price;
  }

  return {
    name,
    email,
    phone,
    message,
    consent,
    vehicleSlug,
    estimateSnapshot,
    enquiryType,
    source,
    preferredMake,
    preferredModel,
    preferredDriveSide,
    preferredYear,
    targetPriceUsd,
  };
}

/**
 * A resubmission is the same enquiry, not a new lead: identical contact
 * email, vehicle, destination/port and message text collapse to one stored
 * record (RULE-08) rather than creating unlimited duplicates from a
 * double-click or retry.
 */
export function buildEnquiryDedupeKey(prepared: PreparedEnquiry): string {
  return [
    prepared.email.trim().toLowerCase(),
    prepared.vehicleSlug ?? '',
    prepared.estimateSnapshot?.destinationCode ?? '',
    prepared.estimateSnapshot?.portCode ?? '',
    prepared.enquiryType,
    prepared.message.trim().toLowerCase(),
    prepared.preferredMake?.trim().toLowerCase() ?? '',
    prepared.preferredModel?.trim().toLowerCase() ?? '',
    prepared.preferredDriveSide ?? '',
    prepared.preferredYear ?? '',
    prepared.targetPriceUsd ?? '',
  ].join('|');
}

const ENQUIRY_SELECT_COLUMNS =
  'SELECT id, dedupe_key, name, email, phone, message, consent, vehicle_slug, destination_code, port_code, rate_status, currency, rate_effective_from, rate_effective_to, estimate_message, received_at, enquiry_type, source, duplicate_resubmission_count, preferred_make, preferred_model, preferred_drive_side, preferred_year, target_price_usd';

function rowToEnquiryRecord(row: Record<string, unknown>): EnquiryRecord {
  const destinationCode = row.destination_code as string | null;
  const portCode = row.port_code as string | null;
  return {
    id: row.id as string,
    dedupeKey: row.dedupe_key as string,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    message: row.message as string,
    consent: row.consent === undefined || row.consent === null ? true : Boolean(row.consent),
    vehicleSlug: (row.vehicle_slug as string | null) || undefined,
    receivedAt: row.received_at as string,
    enquiryType: (row.enquiry_type as EnquiryType | null) || 'general',
    source: (row.source as EnquirySource | null) || 'form',
    duplicateResubmissionCount: Number(row.duplicate_resubmission_count ?? 0),
    preferredMake: (row.preferred_make as string | null) || undefined,
    preferredModel: (row.preferred_model as string | null) || undefined,
    preferredDriveSide: (row.preferred_drive_side as EnquiryPreferredDriveSide | null) || undefined,
    preferredYear: row.preferred_year !== undefined && row.preferred_year !== null ? Number(row.preferred_year) : undefined,
    targetPriceUsd: row.target_price_usd !== undefined && row.target_price_usd !== null ? Number(row.target_price_usd) : undefined,
    estimateSnapshot:
      destinationCode && portCode
        ? {
            destinationCode,
            portCode,
            rateStatus: row.rate_status as EnquiryEstimateSnapshot['rateStatus'],
            currency: (row.currency as string | null) || undefined,
            rateEffectiveFrom: (row.rate_effective_from as string | null) || undefined,
            rateEffectiveTo: (row.rate_effective_to as string | null) || undefined,
            message: row.estimate_message as string,
          }
        : undefined,
  };
}

function toEnquiryResponse(record: EnquiryRecord, duplicate: boolean): EnquiryResponse {
  return {
    id: record.id,
    receivedAt: record.receivedAt,
    status: 'received',
    duplicate,
    enquiryType: record.enquiryType,
    source: record.source,
    vehicleSlug: record.vehicleSlug,
    estimateSnapshot: record.estimateSnapshot,
  };
}

/**
 * Projects a persisted enquiry into the canonical staff-visible lead record
 * (PUB-16, D01-P06-T001) — the explicit regression fix proving a submitted
 * enquiry is retrievable through the salesperson-facing service boundary,
 * not only writable. `status` starts and stays `'New'`; later staff
 * workflow transitions are a future task, not invented here.
 */
function toLeadRecord(record: EnquiryRecord): LeadRecord {
  return {
    id: record.id,
    receivedAt: record.receivedAt,
    status: 'New',
    enquiryType: record.enquiryType,
    source: record.source,
    name: record.name,
    email: record.email,
    phone: record.phone,
    message: record.message,
    consent: record.consent,
    vehicleSlug: record.vehicleSlug,
    estimateSnapshot: record.estimateSnapshot,
    duplicateResubmissionCount: record.duplicateResubmissionCount,
    preferredMake: record.preferredMake,
    preferredModel: record.preferredModel,
    preferredDriveSide: record.preferredDriveSide,
    preferredYear: record.preferredYear,
    targetPriceUsd: record.targetPriceUsd,
  };
}

// Service-owned location projection based on ETD/ETA rules (PUB-08)
export function resolveLocationStatus(v: VehicleRecord, nowISO = '2026-08-10T10:00:00.000Z'): 'In Japan' | 'In Transit' | 'In Port' {
  if (!v.etd && !v.eta) {
    return v.locationStatus || 'In Japan';
  }
  const now = new Date(nowISO).getTime();
  const etdTime = v.etd ? new Date(v.etd).getTime() : null;
  const etaTime = v.eta ? new Date(v.eta).getTime() : null;

  if (etaTime && now >= etaTime) {
    return 'In Port';
  }
  if (etdTime && now >= etdTime && (!etaTime || now < etaTime)) {
    return 'In Transit';
  }
  return 'In Japan';
}

export function projectVehicle(
  v: VehicleRecord,
  context: VehicleQueryContext = {}
): VehicleDomainSummary {
  const nowISO = context.nowISO || '2026-08-10T10:00:00.000Z';
  const now = new Date(nowISO).getTime();
  const resolvedLoc = resolveLocationStatus(v, nowISO);

  const isDraft = v.status === 'Draft';
  const isSold = v.status === 'Sold';
  const isArchived = v.status === 'Archived';
  const active = !isDraft && !isArchived;

  const slug = generateVehicleSlug(v.year, v.make, v.model, v.id);

  // Active reservation hold check
  const activeHold = context.reservations?.find((r) => {
    const matches = r.vehicleId === v.id || r.vehicleSlug === slug;
    if (!matches) return false;
    const exp = new Date(r.expiresAt).getTime();
    return exp > now;
  });

  const nowOnSale = active && !isSold && (!activeHold || Boolean(context.customerId && activeHold.customerId === context.customerId));
  const isRequestPrice = Boolean(v.requestPrice || !v.priceUsd || v.priceUsd <= 0);
  const priceState: 'priced' | 'request_price' = isRequestPrice ? 'request_price' : 'priced';

  // Tier Pricing (RULE-06)
  const tier = context.customerTier || (context.audience === 'customer' ? 'Standard' : undefined);
  const tierPricing = tier && v.priceUsd > 0 ? calculateTierPricing(v.priceUsd, tier) : undefined;

  // Reservation Eligibility (RULE-05, RULE-08, RULE-10)
  let reservationEligibility: VehicleReservationEligibility | undefined = undefined;
  if (context.audience === 'customer' || context.customerId || context.customerTier) {
    if (isSold || !active) {
      reservationEligibility = { eligible: false, reason: 'not_reservable' };
    } else if (isRequestPrice) {
      reservationEligibility = { eligible: false, reason: 'price_on_request' };
    } else if (activeHold) {
      const isOwnHold = Boolean(context.customerId && activeHold.customerId === context.customerId);
      reservationEligibility = {
        eligible: false,
        reason: isOwnHold ? 'already_reserved_by_you' : 'reserved_by_other',
        holdExpiresAt: activeHold.expiresAt,
        isOwnHold,
      };
    } else {
      reservationEligibility = { eligible: true };
    }
  }

  return {
    id: v.id,
    chassisNumber: v.chassisNumber,
    slug,
    make: v.make,
    model: v.model,
    year: v.year,
    priceUsd: v.priceUsd,
    status: v.status as VehicleStatus,
    category: v.category,
    locationStatus: resolvedLoc,
    createdAt: v.createdAt,
    images: v.images ? [...v.images] : [],
    featured: v.featured,
    stockType: v.stockType,
    destinationPort: v.destinationPort,
    discountPercent: v.discountPercent,
    bodyStyle: v.bodyStyle,
    fuelType: v.fuelType,
    transmission: v.transmission,
    driveTrain: v.driveTrain,
    mileage: v.mileage,
    etd: v.etd,
    eta: v.eta,
    requestPrice: isRequestPrice,
    active,
    nowOnSale,
    priceState,
    countryEligibility: [...DEMO_COUNTRY_ELIGIBILITY_PLACEHOLDER],
    tierPricing,
    reservationEligibility,
  };
}

export function projectPublicVehicle(v: VehicleRecord): VehicleDomainSummary {
  return projectVehicle(v, { audience: 'public' });
}

/**
 * Demo-only stand-in for the country eligibility projection.
 *
 * The real projection is server-authoritative and per-vehicle (PUB-25), but the
 * demo record carries no eligibility source data and `DEC-PUB-LEGACY-PARITY` is
 * still OPEN. This constant is therefore an explicitly named placeholder, not a
 * business rule: it must be replaced with per-vehicle data before any screen
 * makes an eligibility claim to a visitor.
 */
export const DEMO_COUNTRY_ELIGIBILITY_PLACEHOLDER = ['UG', 'KE', 'TZ', 'RW', 'SS'] as const;

export function buildVehicleDetail(
  v: VehicleRecord,
  context: VehicleQueryContext = {}
): VehicleDetail {
  const nowISO = context.nowISO || '2026-08-10T10:00:00.000Z';
  const now = new Date(nowISO).getTime();
  const slug = generateVehicleSlug(v.year, v.make, v.model, v.id);
  const isRequestPrice = Boolean(v.requestPrice || !v.priceUsd || v.priceUsd <= 0);
  const priceState: 'priced' | 'request_price' = isRequestPrice ? 'request_price' : 'priced';
  const priceUsd = isRequestPrice ? undefined : v.priceUsd;
  const discountPercent = isRequestPrice ? undefined : v.discountPercent;
  const discountedPriceUsd = (priceState === 'priced' && priceUsd && discountPercent)
    ? Math.round(priceUsd * (1 - discountPercent / 100))
    : undefined;

  const gallery = v.images ? [...v.images] : [];
  const locStatus = resolveLocationStatus(v, nowISO);

  const isDraft = v.status === 'Draft';
  const isSold = v.status === 'Sold';
  const isArchived = v.status === 'Archived';
  const active = !isDraft && !isArchived;

  // Active reservation hold check
  const activeHold = context.reservations?.find((r) => {
    const matches = r.vehicleId === v.id || r.vehicleSlug === slug;
    if (!matches) return false;
    const exp = new Date(r.expiresAt).getTime();
    return exp > now;
  });

  const nowOnSale = active && !isSold && (!activeHold || Boolean(context.customerId && activeHold.customerId === context.customerId));

  // Tier Pricing (RULE-06)
  const tier = context.customerTier || (context.audience === 'customer' ? 'Standard' : undefined);
  const tierPricing = tier && v.priceUsd > 0 ? calculateTierPricing(v.priceUsd, tier) : undefined;

  // Reservation Eligibility (RULE-05, RULE-08, RULE-10)
  let reservationEligibility: VehicleReservationEligibility | undefined = undefined;
  if (context.audience === 'customer' || context.customerId || context.customerTier) {
    if (isSold || !active) {
      reservationEligibility = { eligible: false, reason: 'not_reservable' };
    } else if (isRequestPrice) {
      reservationEligibility = { eligible: false, reason: 'price_on_request' };
    } else if (activeHold) {
      const isOwnHold = Boolean(context.customerId && activeHold.customerId === context.customerId);
      reservationEligibility = {
        eligible: false,
        reason: isOwnHold ? 'already_reserved_by_you' : 'reserved_by_other',
        holdExpiresAt: activeHold.expiresAt,
        isOwnHold,
      };
    } else {
      reservationEligibility = { eligible: true };
    }
  }

  return {
    id: v.id,
    chassisNumber: v.chassisNumber,
    slug,
    make: v.make,
    model: v.model,
    year: v.year,
    status: (v.status as VehicleStatus) || 'Available',
    priceState,
    priceUsd,
    requestPrice: isRequestPrice,
    discountPercent,
    discountedPriceUsd,
    category: v.category,
    locationStatus: locStatus,
    stockType: v.stockType,
    destinationPort: v.destinationPort,
    bodyStyle: v.bodyStyle,
    fuelType: v.fuelType,
    transmission: v.transmission,
    driveTrain: v.driveTrain,
    mileage: v.mileage,
    etd: v.etd,
    eta: v.eta,
    featured: v.featured,
    countryEligibility: [...DEMO_COUNTRY_ELIGIBILITY_PLACEHOLDER],
    // The demo record carries a single uncategorized `images` array, so only the
    // general gallery is populated. Auction/Japan/Durban categories stay empty
    // with their visibility flags false rather than re-labelling gallery images
    // as a category the source system never asserted (PUB-25).
    media: {
      gallery,
      auctionPictures: [],
      auctionSheet: [],
      japanPictures: [],
      durbanPictures: [],
      showAuctionPictures: false,
      showJapanPictures: false,
      showDurbanPictures: false,
      totalPicturesCount: gallery.length,
    },
    active,
    nowOnSale,
    tierPricing,
    reservationEligibility,
  };
}

export function findVehicleRecord(vehicles: VehicleRecord[], idOrSlug: string): VehicleRecord | undefined {
  const norm = idOrSlug.toLowerCase();
  const matchId = vehicles.find((v) => v.id.toLowerCase() === norm);
  if (matchId) return matchId;

  const matchChassis = vehicles.find((v) => v.chassisNumber.toLowerCase() === norm);
  if (matchChassis) return matchChassis;

  const matchSlug = vehicles.find((v) => generateVehicleSlug(v.year, v.make, v.model, v.id) === norm);
  if (matchSlug) return matchSlug;

  // Deliberately no suffix/partial fallback: any string ending in a known id would
  // otherwise resolve to that vehicle, producing unlimited duplicate public URLs.
  return undefined;
}

function calculateFacets(vehicles: VehicleDomainSummary[]): VehicleFacets {
  const makeMap = new Map<string, number>();
  const bodyStyleMap = new Map<string, number>();
  const fuelTypeMap = new Map<string, number>();

  let minYear = 2026;
  let maxYear = 1970;
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  vehicles.forEach((v) => {
    if (v.make) makeMap.set(v.make, (makeMap.get(v.make) || 0) + 1);
    if (v.bodyStyle) bodyStyleMap.set(v.bodyStyle, (bodyStyleMap.get(v.bodyStyle) || 0) + 1);
    if (v.fuelType) fuelTypeMap.set(v.fuelType, (fuelTypeMap.get(v.fuelType) || 0) + 1);

    if (v.year) {
      if (v.year < minYear) minYear = v.year;
      if (v.year > maxYear) maxYear = v.year;
    }

    if (v.priceUsd && !v.requestPrice) {
      if (v.priceUsd < minPrice) minPrice = v.priceUsd;
      if (v.priceUsd > maxPrice) maxPrice = v.priceUsd;
    }
  });

  const sortFacets = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    makes: sortFacets(makeMap),
    bodyStyles: sortFacets(bodyStyleMap),
    fuelTypes: sortFacets(fuelTypeMap),
    yearRange: {
      min: minYear <= maxYear ? minYear : 2015,
      max: minYear <= maxYear ? maxYear : 2024,
    },
    priceRange: {
      min: minPrice <= maxPrice ? minPrice : 0,
      max: minPrice <= maxPrice ? maxPrice : 50000,
    },
  };
}

function filterAndSortVehicles(
  vehicles: VehicleRecord[],
  query?: GetVehiclesQuery,
  context: VehicleQueryContext = {}
): VehicleDomainSummary[] {
  let rawList = [...vehicles];
  const effectiveAudience = context.audience || query?.audience || 'public';
  const effectiveTier = context.customerTier || query?.tier;
  const mergedContext: VehicleQueryContext = {
    ...context,
    audience: effectiveAudience,
    customerTier: effectiveTier,
  };

  if (effectiveAudience !== 'salesperson') {
    rawList = rawList.filter((v) => v.status !== 'Draft');
  }

  let list: VehicleDomainSummary[] = rawList.map((v) => projectVehicle(v, mergedContext));
  const now = new Date(mergedContext.nowISO || '2026-08-10T10:00:00.000Z').getTime();
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

  if (query?.category) {
    list = list.filter((v) => v.category?.split(',').includes(query.category!));
  }

  if (query?.collection) {
    switch (query.collection) {
      case 'latest_arrivals': {
        const eligible = list.filter((v) => {
          if (v.locationStatus !== 'In Japan') return false;
          if (!v.createdAt) return false;
          const createdTime = new Date(v.createdAt).getTime();
          return now - createdTime <= FIVE_DAYS_MS;
        });
        if (eligible.length > 0) {
          list = eligible;
        } else {
          list = list.filter((v) => v.locationStatus === 'In Japan');
        }
        break;
      }
      case 'premium_teaser': {
        const premium = list.filter((v) => v.category?.split(',').includes('premium'));
        const limitNum = Math.min(query.limit ? Number(query.limit) : 10, 10);
        list = premium.slice(0, limitNum);
        break;
      }
      case 'discounted': {
        list = list.filter((v) => v.category?.split(',').includes('best_offer') || (v.discountPercent && v.discountPercent > 0));
        break;
      }
      case 'clearance': {
        list = list.filter((v) => v.category?.split(',').includes('clearance'));
        break;
      }
      case 'featured': {
        list = list.filter((v) => v.featured === true);
        break;
      }
      case 'browse':
      default: {
        const locationPriority: Record<string, number> = { 'In Port': 1, 'In Transit': 2, 'In Japan': 3 };
        const stockPriority: Record<string, number> = { J: 1, CRFO: 2 };
        list.sort((a, b) => {
          const locA = locationPriority[a.locationStatus || 'In Japan'] || 3;
          const locB = locationPriority[b.locationStatus || 'In Japan'] || 3;
          if (locA !== locB) return locA - locB;

          const stockA = stockPriority[a.stockType || 'J'] || 1;
          const stockB = stockPriority[b.stockType || 'J'] || 1;
          if (stockA !== stockB) return stockA - stockB;

          return a.id.localeCompare(b.id);
        });
        break;
      }
    }
  }

  // Keyword searchQuery
  if (query?.searchQuery) {
    const q = query.searchQuery.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.chassisNumber.toLowerCase().includes(q) ||
        (v.bodyStyle && v.bodyStyle.toLowerCase().includes(q)) ||
        (v.destinationPort && v.destinationPort.toLowerCase().includes(q))
    );
  }

  // Faceted query filters
  if (query?.make) {
    const makeVal = query.make.toLowerCase();
    list = list.filter((v) => v.make.toLowerCase() === makeVal);
  }

  if (query?.model) {
    const modelVal = query.model.toLowerCase();
    list = list.filter((v) => v.model.toLowerCase().includes(modelVal));
  }

  if (query?.bodyStyle) {
    const bodyVal = query.bodyStyle.toLowerCase();
    list = list.filter((v) => v.bodyStyle && v.bodyStyle.toLowerCase() === bodyVal);
  }

  if (query?.fuelType) {
    const fuelVal = query.fuelType.toLowerCase();
    list = list.filter((v) => v.fuelType && v.fuelType.toLowerCase() === fuelVal);
  }

  if (query?.transmission) {
    const transVal = query.transmission.toLowerCase();
    list = list.filter((v) => v.transmission && v.transmission.toLowerCase() === transVal);
  }

  if (query?.driveTrain) {
    const dtVal = query.driveTrain.toLowerCase();
    list = list.filter((v) => v.driveTrain && v.driveTrain.toLowerCase() === dtVal);
  }

  if (query?.stockType) {
    list = list.filter((v) => v.stockType === query.stockType);
  }

  if (query?.locationStatus) {
    list = list.filter((v) => v.locationStatus === query.locationStatus);
  }

  if (query?.yearMin !== undefined) {
    const minY = Number(query.yearMin);
    list = list.filter((v) => v.year >= minY);
  }

  if (query?.yearMax !== undefined) {
    const maxY = Number(query.yearMax);
    list = list.filter((v) => v.year <= maxY);
  }

  if (query?.priceMin !== undefined) {
    const minP = Number(query.priceMin);
    list = list.filter((v) => v.requestPrice || v.priceUsd >= minP);
  }

  if (query?.priceMax !== undefined) {
    const maxP = Number(query.priceMax);
    list = list.filter((v) => v.requestPrice || v.priceUsd <= maxP);
  }

  // Sorting
  if (query?.sortBy) {
    switch (query.sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.priceUsd - b.priceUsd);
        break;
      case 'price_desc':
        list.sort((a, b) => b.priceUsd - a.priceUsd);
        break;
      case 'year_desc':
        list.sort((a, b) => b.year - a.year);
        break;
      case 'year_asc':
        list.sort((a, b) => a.year - b.year);
        break;
      case 'mileage_asc':
        list.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
        break;
      case 'newest':
      default:
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
    }
  }

  if (query?.limit && query.collection !== 'premium_teaser' && !query.page) {
    const limitNum = Number(query.limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      list = list.slice(0, limitNum);
    }
  }

  return list;
}

// --- Phase 1.6: transactional reservation eligibility and hold (PUB-23,
// RULE-05, RULE-08, RULE-10, D01-P06-T004) ---
//
// A reservation is a transactional 48-hour hold on one vehicle for one
// authenticated demo customer. Authorization (an authenticated identity
// carrying `create:reservation`) is enforced in `server.ts`, matching the
// existing staff-route pattern; this module owns the vehicle-availability,
// conflict/duplicate and per-customer-limit checks plus the atomic hold
// itself. `DEC-PUB-RESERVATION-EXPIRY-ACTION` is OPEN (automatic vs. manual
// release unconfirmed): an expired hold is recognized live, at request time,
// by comparing `expiresAt` to the current instant — no background job or
// scheduled status flip is implemented, and the underlying vehicle's
// persisted `status` is never silently reverted by this check alone
// (RULE-10). This still lets WF-07's confirmed end-state ("the vehicle ...
// becomes Now On Sale for customers to reserve again") govern *new*
// reservation eligibility without inventing the unapproved automatic
// display-update mechanism.

export class ReservationRequestError extends Error {
  public readonly statusCode: number;
  public readonly field?: string;
  public readonly reason?: string;

  constructor(statusCode: number, message: string, field?: string, reason?: string) {
    super(message);
    this.name = 'ReservationRequestError';
    this.statusCode = statusCode;
    this.field = field;
    this.reason = reason;
  }
}

/**
 * `RESERVABLE_VEHICLE_STATUSES` as a `Set` for `O(1)` membership checks; the
 * vocabulary itself is shared with the public UI via `@carchief/domain`.
 * `VehicleRecord.status` is `string` (not the narrower `VehicleStatus`)
 * because the mock's seed/store layer predates that domain type, so the
 * `Set` stays `string`-keyed to match without a forced cast.
 */
const RESERVABLE_VEHICLE_STATUS_SET = new Set<string>(RESERVABLE_VEHICLE_STATUSES);

export interface ReservationRecord {
  id: string;
  vehicleId: string;
  vehicleSlug: string;
  customerId: string;
  customerEmail: string;
  createdAt: string;
  expiresAt: string;
  holdHours: number;
}

export const seedReservations: ReservationRecord[] = [
  {
    id: 'res-seed-active-1',
    vehicleId: 'veh-2',
    vehicleSlug: '2020-toyota-hiace-van-veh-2',
    customerId: 'user-other-456',
    customerEmail: 'other@example.com',
    createdAt: '2026-08-09T10:00:00.000Z',
    expiresAt: '2026-08-11T10:00:00.000Z', // Active relative to 2026-08-10 reference date (48-hour hold)
    holdHours: 48,
  },
  {
    id: 'res-seed-active-cust-1',
    vehicleId: 'veh-6',
    vehicleSlug: '2018-mitsubishi-fuso-canter-veh-6',
    customerId: 'cust-123',
    customerEmail: 'customer@example.com',
    createdAt: '2026-08-10T08:00:00.000Z',
    expiresAt: '2026-08-12T08:00:00.000Z', // Active relative to 2026-08-10 reference date (48-hour hold)
    holdHours: 48,
  },
  {
    id: 'res-seed-expired-1',
    vehicleId: 'veh-3',
    vehicleSlug: '2022-nissan-x-trail-veh-3',
    customerId: 'user-other-456',
    customerEmail: 'other@example.com',
    createdAt: '2026-08-06T10:00:00.000Z',
    expiresAt: '2026-08-08T10:00:00.000Z', // Expired relative to 2026-08-10 reference date
    holdHours: 48,
  },
];

function computeReservationStatus(record: Pick<ReservationRecord, 'expiresAt'>, nowISO: string): ReservationStatus {
  return new Date(record.expiresAt).getTime() > new Date(nowISO).getTime() ? 'active' : 'expired';
}

function isReservationActive(record: Pick<ReservationRecord, 'expiresAt'>, nowISO: string): boolean {
  return computeReservationStatus(record, nowISO) === 'active';
}

function toReservationResponse(record: ReservationRecord, nowISO: string): ReservationResponse {
  return {
    id: record.id,
    vehicleSlug: record.vehicleSlug,
    vehicleId: record.vehicleId,
    customerId: record.customerId,
    customerEmail: record.customerEmail,
    status: computeReservationStatus(record, nowISO),
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    holdHours: record.holdHours,
  };
}

// --- Phase 2.2: customer dashboard KPI baseline (D02-ASM-001) ---
//
// Mock seed data for invoices and allocations used to compute dashboard KPIs:
// outstanding balance = issued invoice total - approved allocations.
// Vehicle counts use canonical IDs and server status (not phantom/duplicated records).
// Credit utilisation = outstanding balance ÷ mock credit limit.
// All values are server-derived; no browser calculation or fabrication.

export interface InvoiceRecord {
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

export interface AllocationRecord {
  id: string;
  customerId: string;
  paymentId: string;
  invoiceId: string;
  amountUsd: number;
  allocatedAt: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  invoiceId: string;
  amountUsd: number;
  paidAt: string;
  status: 'Pending' | 'Held' | 'Resubmitted' | 'Approved' | 'Rejected';
  holdReason?: string;
  reference?: string;
  bankName?: string;
  currency?: string;
  paymentDate?: string;
  remarks?: string;
  proof?: CreateCustomerPaymentRequest['proof'];
  idempotencyKey?: string;
  createdAt?: string;
}

export interface ShipmentRecord {
  id: string;
  customerId: string;
  vehicleId: string;
  status: 'Purchased' | 'Inspection' | 'Ready' | 'InTransit' | 'Delivered';
  shippedAt: string;
  deliveredAt?: string;
  eta?: string;
  location?: string;
  freshness?: 'fresh' | 'stale' | 'unknown';
  shipOkStatus?: 'Pending' | 'Approved' | 'Rejected';
  shipOkRejectionReason?: string;
  documentReleaseStatus?: 'Pending' | 'Approved' | 'Rejected';
  documentReleaseRejectionReason?: string;
}

export interface DocumentRecord {
  id: string;
  customerId: string;
  shipmentId?: string;
  vehicleId?: string;
  type: 'Invoice' | 'PaymentProof' | 'ShippingLabel' | 'DeliveryProof' | 'Other';
  status: 'Available' | 'Pending' | 'Unavailable';
  createdAt: string;
  releaseApproved?: boolean;
  visibleToCustomer?: boolean;
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
  timeline: Array<{ stage: CustomerShipment['stage']; occurredAt?: string; current: boolean }>;
  shipOkStatus: 'Pending' | 'Approved' | 'Rejected';
  shipOkRejectionReason?: string;
  documentReleaseStatus: 'Pending' | 'Approved' | 'Rejected';
  documentReleaseRejectionReason?: string;
}

export interface CustomerDocument {
  id: string;
  shipmentId?: string;
  vehicleId?: string;
  type: DocumentRecord['type'];
  status: 'Available' | 'Pending' | 'Unavailable';
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  customerId: string;
  message: string;
  type: 'Payment' | 'Shipment' | 'Document' | 'Vehicle' | 'Promotion';
  isRead: boolean;
  createdAt: string;
  title?: string;
  related?: Notification['related'];
}

export interface CustomerProfileRecord {
  customerId: string;
  companyName: string;
  phone: string;
  deliveryAddress: string;
  version: number;
  updatedAt: string;
}

export interface PaymentNotificationRecord {
  id: string;
  customerId: string;
  paymentId: string;
  invoiceId: string;
  event: CustomerPaymentNotificationEvent;
  deliveryStatus: 'Queued';
  createdAt: string;
}

const seedInvoices: InvoiceRecord[] = [
  // Active customer (cust-123): 3 invoices
  {
    id: 'inv-001',
    customerId: 'cust-123',
    vehicleId: 'veh-1',
    vehicleSlug: '2021-toyota-corolla-axio-veh-1',
    make: 'Toyota',
    model: 'Corolla Axio',
    year: 2021,
    totalAmountUsd: 8500.00,
    invoicedAt: '2026-08-10T10:00:00.000Z',
    status: 'Issued',
  },
  {
    id: 'inv-002',
    customerId: 'cust-123',
    vehicleId: 'veh-2',
    vehicleSlug: '2020-toyota-hiace-van-veh-2',
    make: 'Toyota',
    model: 'HiAce Van',
    year: 2020,
    totalAmountUsd: 14200.00,
    invoicedAt: '2026-08-09T14:30:00.000Z',
    status: 'Issued',
  },
  {
    id: 'inv-003',
    customerId: 'cust-123',
    vehicleId: 'veh-3',
    vehicleSlug: '2022-nissan-x-trail-veh-3',
    make: 'Nissan',
    model: 'X-Trail',
    year: 2022,
    totalAmountUsd: 19500.00,
    invoicedAt: '2026-08-11T09:00:00.000Z',
    status: 'Issued',
  },
  // Exception customer (cust-exception-001): 1 invoice
  {
    id: 'inv-004',
    customerId: 'cust-exception-001',
    vehicleId: 'veh-4',
    vehicleSlug: '2021-honda-civic-veh-4',
    make: 'Honda',
    model: 'Civic',
    year: 2021,
    totalAmountUsd: 9500.00,
    invoicedAt: '2026-08-12T10:00:00.000Z',
    status: 'Issued',
  },
];

const seedAllocations: AllocationRecord[] = [
  {
    id: 'alloc-001',
    customerId: 'cust-123',
    paymentId: 'pay-001',
    invoiceId: 'inv-001',
    amountUsd: 2000.00,
    allocatedAt: '2026-08-11T10:00:00.000Z',
    status: 'Approved',
  },
  {
    id: 'alloc-002',
    customerId: 'cust-123',
    paymentId: 'pay-002',
    invoiceId: 'inv-001',
    amountUsd: 3500.00,
    allocatedAt: '2026-08-12T11:00:00.000Z',
    status: 'Approved',
  },
  {
    id: 'alloc-003',
    customerId: 'cust-123',
    paymentId: 'pay-003',
    invoiceId: 'inv-002',
    amountUsd: 7000.00,
    allocatedAt: '2026-08-12T14:00:00.000Z',
    status: 'Approved',
  },
];

// Seed data for payments (D02-P02-T001)
const seedPayments: PaymentRecord[] = [
  // Active customer (cust-123): 3 approved payments
  {
    id: 'pay-001',
    customerId: 'cust-123',
    invoiceId: 'inv-001',
    amountUsd: 2000.00,
    paidAt: '2026-08-11T10:00:00.000Z',
    status: 'Approved',
  },
  {
    id: 'pay-002',
    customerId: 'cust-123',
    invoiceId: 'inv-001',
    amountUsd: 3500.00,
    paidAt: '2026-08-12T11:00:00.000Z',
    status: 'Approved',
  },
  {
    id: 'pay-003',
    customerId: 'cust-123',
    invoiceId: 'inv-002',
    amountUsd: 7000.00,
    paidAt: '2026-08-12T14:00:00.000Z',
    status: 'Approved',
  },
  // Active customer: 1 pending payment
  {
    id: 'pay-004',
    customerId: 'cust-123',
    invoiceId: 'inv-003',
    amountUsd: 5000.00,
    paidAt: '2026-08-13T09:00:00.000Z',
    status: 'Pending',
  },
  // Exception customer: 1 rejected payment
  {
    id: 'pay-005',
    customerId: 'cust-exception-001',
    invoiceId: 'inv-004',
    amountUsd: 3000.00,
    paidAt: '2026-08-13T10:00:00.000Z',
    status: 'Rejected',
  },
];

const seedPaymentNotifications: PaymentNotificationRecord[] = [
  {
    id: 'pay-event-001',
    customerId: 'cust-123',
    paymentId: 'pay-004',
    invoiceId: 'inv-003',
    event: 'FinanceReviewRequested',
    deliveryStatus: 'Queued',
    createdAt: '2026-08-13T09:00:00.000Z',
  },
];

// Seed data for shipments (D02-P02-T001)
const seedShipments: ShipmentRecord[] = [
  // Active customer (cust-123): shipments linked to vehicles
  {
    id: 'ship-001',
    customerId: 'cust-123',
    vehicleId: 'veh-1',
    status: 'Ready',
    shippedAt: '2026-08-10T10:00:00.000Z',
    eta: '2026-08-20T10:00:00.000Z',
    location: 'Mombasa Port',
    freshness: 'fresh',
    shipOkStatus: 'Approved',
    documentReleaseStatus: 'Approved',
  },
  {
    id: 'ship-002',
    customerId: 'cust-123',
    vehicleId: 'veh-2',
    status: 'InTransit',
    shippedAt: '2026-08-09T14:30:00.000Z',
    eta: '2026-08-25T10:00:00.000Z',
    location: 'Indian Ocean',
    freshness: 'fresh',
    shipOkStatus: 'Pending',
    documentReleaseStatus: 'Pending',
  },
  {
    id: 'ship-003',
    customerId: 'cust-123',
    vehicleId: 'veh-3',
    status: 'Delivered',
    shippedAt: '2026-08-11T09:00:00.000Z',
    deliveredAt: '2026-08-14T08:00:00.000Z',
    location: 'Customer destination',
    freshness: 'fresh',
    shipOkStatus: 'Approved',
    documentReleaseStatus: 'Pending',
  },
  // Exception customer: 1 shipment
  {
    id: 'ship-004',
    customerId: 'cust-exception-001',
    vehicleId: 'veh-4',
    status: 'Inspection',
    shippedAt: '2026-08-12T10:00:00.000Z',
    location: 'Inspection facility',
    freshness: 'stale',
    shipOkStatus: 'Rejected',
    shipOkRejectionReason: 'Finance requested updated shipment evidence.',
    documentReleaseStatus: 'Rejected',
    documentReleaseRejectionReason: 'Finance requested corrected release documents.',
  },
];

// Seed data for documents (D02-P02-T001)
const seedDocuments: DocumentRecord[] = [
  // Active customer (cust-123): documents linked to shipments/vehicles
  {
    id: 'doc-001',
    customerId: 'cust-123',
    shipmentId: 'ship-001',
    vehicleId: 'veh-1',
    type: 'ShippingLabel',
    status: 'Available',
    createdAt: '2026-08-10T10:00:00.000Z',
    releaseApproved: true,
    visibleToCustomer: true,
  },
  {
    id: 'doc-002',
    customerId: 'cust-123',
    shipmentId: 'ship-002',
    vehicleId: 'veh-2',
    type: 'DeliveryProof',
    status: 'Pending',
    createdAt: '2026-08-11T10:00:00.000Z',
    releaseApproved: false,
    visibleToCustomer: true,
  },
  {
    id: 'doc-003',
    customerId: 'cust-123',
    shipmentId: 'ship-003',
    vehicleId: 'veh-3',
    type: 'DeliveryProof',
    status: 'Available',
    createdAt: '2026-08-14T08:00:00.000Z',
    releaseApproved: true,
    visibleToCustomer: false,
  },
  {
    id: 'doc-004',
    customerId: 'cust-123',
    vehicleId: 'veh-1',
    type: 'Invoice',
    status: 'Available',
    createdAt: '2026-08-10T10:00:00.000Z',
    releaseApproved: true,
    visibleToCustomer: true,
  },
  // Exception customer: document with status Unavailable
  {
    id: 'doc-005',
    customerId: 'cust-exception-001',
    shipmentId: 'ship-004',
    vehicleId: 'veh-4',
    type: 'ShippingLabel',
    status: 'Unavailable',
    createdAt: '2026-08-12T10:00:00.000Z',
    releaseApproved: false,
    visibleToCustomer: false,
  },
];

// Seed data for notifications (D02-P02-T001)
const seedNotifications: NotificationRecord[] = [
  // Active customer (cust-123): mix of read and unread
  {
    id: 'notif-001',
    customerId: 'cust-123',
    message: 'Payment received for invoice INV-001',
    type: 'Payment',
    isRead: true,
    createdAt: '2026-08-11T10:00:00.000Z',
    related: { kind: 'Invoice', id: 'inv-001', href: '/customer/invoices/inv-001' },
  },
  {
    id: 'notif-002',
    customerId: 'cust-123',
    message: 'Your vehicle veh-1 is ready for shipment',
    type: 'Shipment',
    isRead: false,
    createdAt: '2026-08-13T10:00:00.000Z',
    related: { kind: 'Shipment', id: 'ship-001', href: '/customer/shipments/ship-001' },
  },
  {
    id: 'notif-003',
    customerId: 'cust-123',
    message: 'Delivery proof for vehicle veh-3 now available',
    type: 'Document',
    isRead: false,
    createdAt: '2026-08-14T08:30:00.000Z',
    related: { kind: 'DocumentRelease', id: 'doc-003', href: '/customer/documents/doc-003' },
  },
  {
    id: 'notif-004',
    customerId: 'cust-123',
    message: 'Special promotion: 10% off on premium vehicles',
    type: 'Promotion',
    isRead: true,
    createdAt: '2026-08-12T12:00:00.000Z',
  },
  // New customer (cust-new-001): single unread notification
  {
    id: 'notif-005',
    customerId: 'cust-new-001',
    message: 'Welcome to CarChief! Start browsing vehicles.',
    type: 'Promotion',
    isRead: false,
    createdAt: '2026-08-14T08:00:00.000Z',
  },
  // Exception customer (cust-exception-001): no notifications
];

const seedCustomerProfiles: CustomerProfileRecord[] = [
  {
    customerId: 'cust-123',
    companyName: 'CarChief Demo Customer',
    phone: '+1 555 0100',
    deliveryAddress: 'Customer delivery address, demo only',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
  {
    customerId: 'cust-exception-001',
    companyName: 'Exception Customer',
    phone: '+1 555 0101',
    deliveryAddress: 'Exception customer address, demo only',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
];

// Seed data for Proforma Invoices (D02-P04-T001, CUST-10, RULE-07)
export interface ProformaInvoiceRecord {
  id: string;
  customerId: string;
  vehicleId: string;
  vehicleSlug: string;
  make: string;
  model: string;
  year: number;
  totalAmountUsd: number;
  issuedAt: string;
  paymentDeadline: string;
  status: 'Issued' | 'Expired' | 'Cancelled';
}

const seedProformaInvoices: ProformaInvoiceRecord[] = [
  {
    id: 'pi-001',
    customerId: 'cust-123',
    vehicleId: 'veh-5',
    vehicleSlug: '2021-honda-fit-hybrid-veh-5',
    make: 'Honda',
    model: 'Fit Hybrid',
    year: 2021,
    totalAmountUsd: 7900.00,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-13T10:00:00.000Z',
    status: 'Issued',
  },
];

/**
 * Builds customer fleet vehicle projections from linked mock records (CUST-10, CUST-11, CUST-12, CUST-13, RULE-04, RULE-07, RULE-08, RULE-09).
 * Ensures:
 * 1. Strict customer scoping (RULE-04)
 * 2. Zero duplicate vehicle listings across categories (RULE-08)
 * 3. Server-computed 50% deposit calculations (RULE-07)
 * 4. 48-hour deterministic hold expiry (RULE-05)
 * 5. Full chronological status history (CUST-12)
 * 6. Linked export documents (CUST-13)
 */
export function buildCustomerVehicleProjections(
  customerId: string,
  vehicles: VehicleRecord[],
  reservations: ReservationRecord[],
  proformaInvoices: ProformaInvoiceRecord[],
  invoices: InvoiceRecord[],
  allocations: AllocationRecord[],
  shipments: ShipmentRecord[],
  documents: DocumentRecord[],
  nowISO: string = new Date().toISOString()
): CustomerVehicleDetail[] {
  const relevantVehicleIds = new Set<string>();

  for (const inv of invoices) {
    if (inv.customerId === customerId) relevantVehicleIds.add(inv.vehicleId);
  }
  for (const pi of proformaInvoices) {
    if (pi.customerId === customerId && pi.status !== 'Cancelled') relevantVehicleIds.add(pi.vehicleId);
  }
  for (const r of reservations) {
    if (r.customerId === customerId) relevantVehicleIds.add(r.vehicleId);
  }

  const result: CustomerVehicleDetail[] = [];

  for (const vId of relevantVehicleIds) {
    const vehicle = vehicles.find((v) => v.id === vId);
    if (!vehicle) continue;

    const r = reservations.find((res) => res.customerId === customerId && res.vehicleId === vId && isReservationActive(res, nowISO));
    const pi = proformaInvoices.find((p) => p.customerId === customerId && p.vehicleId === vId && p.status !== 'Cancelled');
    const piDeadline = pi?.paymentDeadline ? new Date(pi.paymentDeadline).getTime() : undefined;
    const piExpired = Boolean(pi && pi.status === 'Issued' && piDeadline !== undefined && piDeadline <= new Date(nowISO).getTime());
    const activePi = pi && pi.status === 'Issued' && !piExpired ? pi : undefined;
    const inv = invoices.find((i) => i.customerId === customerId && i.vehicleId === vId);
    const shipment = shipments.find((s) => s.customerId === customerId && s.vehicleId === vId);
    const customerAllocs = inv ? allocations.filter((a) => a.customerId === customerId && a.invoiceId === inv.id && a.status === 'Approved') : [];
    const paidAmountUsd = customerAllocs.reduce((sum, a) => sum + a.amountUsd, 0);

    const priceUsd = vehicle.priceUsd;
    const totalAmountUsd = inv ? inv.totalAmountUsd : (pi ? pi.totalAmountUsd : priceUsd);

    // Determine status
    let status: CustomerVehicleStatus;
    if (shipment?.status === 'Delivered' || vehicle.status === 'Sold') {
      status = 'Delivered';
    } else if (shipment?.status === 'InTransit' || vehicle.locationStatus === 'In Transit') {
      status = 'In Transit';
    } else if (inv || shipment?.status === 'Ready' || vehicle.status === 'InvoiceCreated' || vehicle.status === 'Invoiced' || (paidAmountUsd >= totalAmountUsd * 0.5 && totalAmountUsd > 0)) {
      status = 'Confirmed';
    } else if (activePi || (vehicle.status === 'ReservedWithPI' && !piExpired)) {
      status = 'Under Negotiation With PI';
    } else if (r || vehicle.status === 'Reserved') {
      status = 'Under Negotiation';
    } else {
      status = 'Expired';
    }

    // Deposit computation under RULE-07
    let deposit: CustomerVehicleDepositInfo | undefined;
    if (status === 'Under Negotiation With PI' || status === 'Confirmed' || status === 'In Transit' || status === 'Delivered' || pi || inv) {
      deposit = calculateVehicleDeposit(totalAmountUsd, paidAmountUsd);
    }

    // Location Status
    let locationStatus: 'In Japan' | 'In Transit' | 'In Port' | undefined;
    if (status === 'In Transit') {
      locationStatus = 'In Transit';
    } else if (status === 'Delivered') {
      locationStatus = 'In Port';
    } else {
      locationStatus = vehicle.locationStatus || 'In Japan';
    }

    const slug = generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id);
    const primaryImage = vehicle.images?.[0];

    // Status timeline
    const statusHistory: CustomerVehicleStatusHistoryItem[] = [];
    statusHistory.push({
      status: 'Under Negotiation',
      timestamp: r?.createdAt || pi?.issuedAt || inv?.invoicedAt || vehicle.createdAt || '2026-08-09T10:00:00.000Z',
      notes: '48-hour reservation hold placed',
    });

    if (pi || inv || status === 'Under Negotiation With PI' || status === 'Confirmed' || status === 'In Transit' || status === 'Delivered') {
      statusHistory.push({
        status: 'Under Negotiation With PI',
        timestamp: pi?.issuedAt || inv?.invoicedAt || '2026-08-10T10:00:00.000Z',
        notes: piExpired ? '72-hour PI hold expired; vehicle returned to Now On Sale' : 'Proforma invoice issued with 50% deposit requirement',
      });
    }

    if (inv || status === 'Confirmed' || status === 'In Transit' || status === 'Delivered') {
      statusHistory.push({
        status: 'Confirmed',
        timestamp: customerAllocs[0]?.allocatedAt || inv?.invoicedAt || '2026-08-11T10:00:00.000Z',
        notes: 'Deposit received and commercial invoice issued',
      });
    }

    if (status === 'In Transit' || status === 'Delivered') {
      statusHistory.push({
        status: 'In Transit',
        timestamp: shipment?.shippedAt || '2026-08-12T10:00:00.000Z',
        notes: 'Vehicle dispatched on vessel and in transit',
      });
    }

    if (status === 'Delivered') {
      statusHistory.push({
        status: 'Delivered',
        timestamp: shipment?.deliveredAt || '2026-08-14T08:00:00.000Z',
        notes: 'Vehicle arrived at destination port and cleared customs',
      });
    }

    // Linked documents
    const docs: CustomerVehicleDocumentReference[] = [];
    if (pi) {
      docs.push({
        id: `doc-pi-${vId}`,
        type: 'ProformaInvoice',
        title: `Proforma Invoice ${pi.id.toUpperCase()}`,
        status: 'Available',
        fileUrl: `/documents/${pi.id}.pdf`,
        issuedAt: pi.issuedAt,
      });
    }
    if (inv) {
      docs.push({
        id: `doc-inv-${vId}`,
        type: 'CommercialInvoice',
        title: `Commercial Invoice ${inv.id.toUpperCase()}`,
        status: 'Available',
        fileUrl: `/documents/${inv.id}.pdf`,
        issuedAt: inv.invoicedAt,
      });
    }
    if (shipment) {
      docs.push({
        id: `doc-bl-${vId}`,
        type: 'BillOfLading',
        title: 'Bill of Lading BL-789012',
        status: shipment.status === 'InTransit' || shipment.status === 'Delivered' ? 'Available' : 'Pending',
        fileUrl: '/documents/bl-789012.pdf',
      });
      docs.push({
        id: `doc-ec-${vId}`,
        type: 'ExportCertificate',
        title: 'Japan Export Certificate',
        status: 'Available',
        fileUrl: '/documents/export-cert.pdf',
      });
      docs.push({
        id: `doc-ic-${vId}`,
        type: 'InspectionCertificate',
        title: 'JEVIC Pre-Shipment Inspection Certificate',
        status: 'Available',
        fileUrl: '/documents/jevic-cert.pdf',
      });
    }

    const detail: CustomerVehicleDetail = {
      id: vId,
      vehicleId: vId,
      chassisNumber: vehicle.chassisNumber,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      slug,
      primaryImage,
      images: vehicle.images || (primaryImage ? [primaryImage] : []),
      priceUsd,
      totalAmountUsd,
      status,
      locationStatus,
      destinationPort: vehicle.destinationPort || 'Mombasa',
      reservationExpiresAt: r?.expiresAt,
      proformaInvoiceId: pi?.id,
      paymentDeadline: pi?.paymentDeadline,
      deposit,
      bodyStyle: vehicle.bodyStyle,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      driveTrain: vehicle.driveTrain,
      mileage: vehicle.mileage,
      invoiceId: inv?.id,
      shipmentId: shipment?.id,
      vesselName: shipment ? 'Global Highway' : undefined,
      etd: vehicle.etd,
      eta: vehicle.eta,
      billOfLadingNo: shipment ? 'BL-789012' : undefined,
      statusHistory,
      documents: docs,
      createdAt: vehicle.createdAt || '2026-08-09T10:00:00.000Z',
      updatedAt: vehicle.createdAt || '2026-08-09T10:00:00.000Z',
    };

    result.push(detail);
  }

  return result;
}

export function queryCustomerVehicles(
  allVehicles: CustomerVehicleDetail[],
  query?: ListCustomerVehiclesQuery
): CustomerVehicleListResponse {
  const countsByStatus: CustomerVehicleCountsByStatus = {
    underNegotiation: allVehicles.filter((v) => v.status === 'Under Negotiation').length,
    underNegotiationWithPI: allVehicles.filter((v) => v.status === 'Under Negotiation With PI').length,
    confirmed: allVehicles.filter((v) => v.status === 'Confirmed').length,
    inTransit: allVehicles.filter((v) => v.status === 'In Transit').length,
    delivered: allVehicles.filter((v) => v.status === 'Delivered').length,
    all: allVehicles.length,
  };

  let filtered = allVehicles;

  if (query?.status) {
    const s = query.status.trim().toLowerCase();
    filtered = filtered.filter((v) => v.status.toLowerCase() === s);
  }

  if (query?.query) {
    const q = query.query.trim().toLowerCase();
    filtered = filtered.filter((v) =>
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.chassisNumber.toLowerCase().includes(q) ||
      String(v.year).includes(q)
    );
  }

  const page = Math.max(1, query?.page || 1);
  const limit = Math.max(1, Math.min(100, query?.limit || 20));
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  const items: CustomerVehicleSummary[] = paginated.map((d) => ({
    id: d.id,
    vehicleId: d.vehicleId,
    chassisNumber: d.chassisNumber,
    make: d.make,
    model: d.model,
    year: d.year,
    slug: d.slug,
    primaryImage: d.primaryImage,
    priceUsd: d.priceUsd,
    totalAmountUsd: d.totalAmountUsd,
    status: d.status,
    locationStatus: d.locationStatus,
    destinationPort: d.destinationPort,
    reservationExpiresAt: d.reservationExpiresAt,
    proformaInvoiceId: d.proformaInvoiceId,
    paymentDeadline: d.paymentDeadline,
    deposit: d.deposit,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return {
    items,
    total: filtered.length,
    countsByStatus,
  };
}

/**
 * Phase 2.5: Customer Invoice & Proforma Invoice Projections
 * (CUST-02, CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-08, RULE-10)
 */
export function buildCustomerInvoiceProjections(
  customerId: string,
  invoices: InvoiceRecord[],
  proformaInvoices: ProformaInvoiceRecord[],
  allocations: AllocationRecord[],
  vehicles: VehicleRecord[],
  documents: DocumentRecord[],
  nowISO: string = new Date().toISOString()
): CustomerInvoiceDetail[] {
  const result: CustomerInvoiceDetail[] = [];

  // Proforma Invoices (PI)
  for (const pi of proformaInvoices) {
    if (pi.customerId !== customerId) continue;
    const vehicle = vehicles.find((v) => v.id === pi.vehicleId);
    if (!vehicle) continue;

    const invoiceNumber = `PI-${pi.id.replace(/^pi-?/i, '').padStart(4, '0')}`;
    const slug = generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id);
    const primaryImage = vehicle.images?.[0];

    const totalAmountUsd = pi.totalAmountUsd;
    const depositInfo = calculateVehicleDeposit(totalAmountUsd, 0);

    // 72-hour payment deadline
    const issuedTime = new Date(pi.issuedAt).getTime();
    const deadlineTime = pi.paymentDeadline ? new Date(pi.paymentDeadline).getTime() : issuedTime + (72 * 60 * 60 * 1000);
    const paymentDeadline = new Date(deadlineTime).toISOString();
    const isExpired = new Date(nowISO).getTime() > deadlineTime;
    const status: CustomerInvoiceStatus = isExpired ? 'Expired' : (pi.status === 'Cancelled' ? 'Cancelled' : 'Issued');

    result.push({
      id: pi.id,
      invoiceNumber,
      type: 'Proforma',
      customerId: pi.customerId,
      vehicleId: pi.vehicleId,
      vehicleSlug: slug,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      totalAmountUsd,
      paidAmountUsd: 0,
      outstandingAmountUsd: totalAmountUsd,
      depositRequiredUsd: depositInfo.requiredAmountUsd,
      depositPaidUsd: 0,
      status,
      issuedAt: pi.issuedAt,
      dueDate: paymentDeadline,
      paymentDeadline,
      documentStatus: 'Available',
      currency: 'USD',
      vehicle: {
        id: vehicle.id,
        chassisNumber: vehicle.chassisNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        slug,
        primaryImage,
      },
      lineItems: [],
      allocations: [],
      bankDetails: undefined,
      documentUrl: undefined,
      termsAndConditions: [
        'This Proforma Invoice and reservation hold are valid for 72 hours from the issue date.',
        'A minimum deposit of 50% is required to secure the vehicle and proceed with export preparation.',
        'Payment instructions are unavailable pending Finance confirmation.',
      ],
      isExpired,
      notes: 'Proforma Invoice issued for initial vehicle reservation and wire transfer payment.',
    });
  }

  // Commercial Invoices
  for (const inv of invoices) {
    if (inv.customerId !== customerId) continue;
    const vehicle = vehicles.find((v) => v.id === inv.vehicleId);
    if (!vehicle) continue;

    const invoiceNumber = `INV-${inv.id.replace(/^inv-?/i, '').padStart(4, '0')}`;
    const slug = generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id);
    const primaryImage = vehicle.images?.[0];

    const totalAmountUsd = inv.totalAmountUsd;
    const customerAllocs = allocations.filter((a) => a.customerId === customerId && a.invoiceId === inv.id && a.status === 'Approved');
    const paidAmountUsd = customerAllocs.reduce((sum, a) => sum + a.amountUsd, 0);
    const outstandingAmountUsd = Math.max(0, totalAmountUsd - paidAmountUsd);

    let status: CustomerInvoiceStatus = inv.status as CustomerInvoiceStatus;
    if (outstandingAmountUsd === 0 && totalAmountUsd > 0) {
      status = 'Paid';
    } else if (paidAmountUsd > 0) {
      status = 'PartiallyPaid';
    } else {
      status = 'Issued';
    }

    const docRecord = documents.find((d) => d.customerId === customerId && (d.vehicleId === inv.vehicleId || d.id === `doc-${inv.id}`) && d.type === 'Invoice');
    const documentStatus: 'Available' | 'Pending' | 'Unavailable' = docRecord ? docRecord.status : 'Available';

    const allocationItems: CustomerInvoiceAllocationItem[] = customerAllocs.map((a) => ({
      id: a.id,
      paymentId: a.paymentId,
      amountUsd: a.amountUsd,
      allocatedAt: a.allocatedAt,
      status: a.status,
    }));

    const dueDate = new Date(new Date(inv.invoicedAt).getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString();

    result.push({
      id: inv.id,
      invoiceNumber,
      type: 'Commercial',
      customerId: inv.customerId,
      vehicleId: inv.vehicleId,
      vehicleSlug: slug,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      totalAmountUsd,
      paidAmountUsd,
      outstandingAmountUsd,
      depositRequiredUsd: Math.round(totalAmountUsd * 0.5),
      depositPaidUsd: Math.min(Math.round(totalAmountUsd * 0.5), paidAmountUsd),
      status,
      issuedAt: inv.invoicedAt,
      dueDate,
      documentStatus,
      currency: 'USD',
      vehicle: {
        id: vehicle.id,
        chassisNumber: vehicle.chassisNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        slug,
        primaryImage,
      },
      lineItems: [],
      allocations: allocationItems,
      bankDetails: undefined,
      documentUrl: undefined,
      termsAndConditions: [
        'Final Commercial Invoice projection; approved payment allocations are shown separately.',
        'Payment instructions are unavailable pending Finance confirmation.',
      ],
      isExpired: false,
      notes: 'Final Commercial Invoice for vehicle export.',
    });
  }

  return result;
}

export function queryCustomerInvoices(
  allInvoices: CustomerInvoiceDetail[],
  query?: ListCustomerInvoicesQuery
): CustomerInvoiceListResponse {
  const countsByType: CustomerInvoiceCountsByType = {
    all: allInvoices.length,
    proforma: allInvoices.filter((i) => i.type === 'Proforma').length,
    commercial: allInvoices.filter((i) => i.type === 'Commercial').length,
  };

  const totals: CustomerInvoiceTotals = {
    totalInvoicedUsd: allInvoices.reduce((sum, i) => sum + i.totalAmountUsd, 0),
    totalPaidUsd: allInvoices.reduce((sum, i) => sum + i.paidAmountUsd, 0),
    totalOutstandingUsd: allInvoices.reduce((sum, i) => sum + i.outstandingAmountUsd, 0),
  };

  let filtered = allInvoices;

  if (query?.type && query.type.toLowerCase() !== 'all') {
    const t = query.type.trim().toLowerCase();
    filtered = filtered.filter((i) => i.type.toLowerCase() === t);
  }

  if (query?.status && query.status.toLowerCase() !== 'all') {
    const s = query.status.trim().toLowerCase();
    filtered = filtered.filter((i) => i.status.toLowerCase() === s);
  }

  if (query?.query) {
    const q = query.query.trim().toLowerCase();
    filtered = filtered.filter((i) =>
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.make.toLowerCase().includes(q) ||
      i.model.toLowerCase().includes(q) ||
      i.vehicle.chassisNumber.toLowerCase().includes(q) ||
      String(i.year).includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }

  const page = Math.max(1, query?.page || 1);
  const limit = Math.max(1, Math.min(100, query?.limit || 20));
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  const items: CustomerInvoiceSummary[] = paginated.map((d) => ({
    id: d.id,
    invoiceNumber: d.invoiceNumber,
    type: d.type,
    customerId: d.customerId,
    vehicleId: d.vehicleId,
    vehicleSlug: d.vehicleSlug,
    make: d.make,
    model: d.model,
    year: d.year,
    totalAmountUsd: d.totalAmountUsd,
    paidAmountUsd: d.paidAmountUsd,
    outstandingAmountUsd: d.outstandingAmountUsd,
    depositRequiredUsd: d.depositRequiredUsd,
    depositPaidUsd: d.depositPaidUsd,
    status: d.status,
    issuedAt: d.issuedAt,
    dueDate: d.dueDate,
    paymentDeadline: d.paymentDeadline,
    documentStatus: d.documentStatus,
    currency: d.currency,
  }));

  return {
    items,
    total: filtered.length,
    page,
    limit,
    countsByType,
    totals,
  };
}

export function buildCustomerInvoiceDocument(invoice: CustomerInvoiceDetail): CustomerInvoiceDocument {
  const contentHtml = `
    <div class="carchief-invoice-document">
      <header class="carchief-invoice-document__header">
        <h1>CarChief International Co., Ltd.</h1>
        <p>7-1, Marunouchi 2-chome, Chiyoda-ku, Tokyo 100-8388, Japan</p>
        <p>Official ${invoice.type === 'Proforma' ? 'Proforma Invoice' : 'Commercial Invoice'}</p>
      </header>
      <div class="carchief-invoice-document__meta">
        <div><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</div>
        <div><strong>Issue Date:</strong> ${new Date(invoice.issuedAt).toLocaleDateString()}</div>
        <div><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</div>
        <div><strong>Customer ID:</strong> ${invoice.customerId}</div>
      </div>
      <div class="carchief-invoice-document__vehicle">
        <h3>Vehicle Information</h3>
        <p>${invoice.year} ${invoice.make} ${invoice.model} (Chassis: ${invoice.vehicle.chassisNumber})</p>
      </div>
      <table class="carchief-invoice-document__table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price (USD)</th>
            <th>Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.lineItems.length === 0 ? `
            <tr><td colspan="4">Itemized charges are unavailable pending an approved invoice breakdown.</td></tr>
          ` : invoice.lineItems.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>$${item.unitPriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>$${item.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Total Amount:</strong></td>
            <td><strong>$${invoice.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
          </tr>
          <tr>
            <td colspan="3">Paid Amount:</td>
            <td>$${invoice.paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td colspan="3"><strong>Outstanding Balance:</strong></td>
            <td><strong>$${invoice.outstandingAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
          </tr>
        </tfoot>
      </table>
      <div class="carchief-invoice-document__banking">
        <h3>Official Wire Transfer Instructions (T/T Only)</h3>
        ${invoice.bankDetails ? `
          <p><strong>Bank:</strong> ${invoice.bankDetails.bankName}</p>
          <p><strong>SWIFT:</strong> ${invoice.bankDetails.swiftCode}</p>
          <p><strong>Account Name:</strong> ${invoice.bankDetails.accountName}</p>
          <p><strong>Account Number:</strong> ${invoice.bankDetails.accountNumber}</p>
          <p><strong>Branch:</strong> ${invoice.bankDetails.branchName}</p>
          <p><strong>Payment Reference:</strong> ${invoice.bankDetails.reference}</p>
        ` : '<p>Bank instructions are unavailable pending Finance confirmation.</p>'}
      </div>
    </div>
  `;

  return {
    documentId: `doc-${invoice.id}`,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    title: `${invoice.type === 'Proforma' ? 'Proforma Invoice' : 'Commercial Invoice'} ${invoice.invoiceNumber}`,
    contentHtml,
    status: invoice.documentStatus === 'Unavailable' ? 'Unavailable' : 'Available',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Validates the reservation request and resolves the target vehicle. Throws
 * a field-associated `ReservationRequestError` (400) for a malformed
 * request, or a `reason`-tagged 404 for an unknown vehicle — never silently
 * substitutes or drops the target.
 */
function resolveReservationVehicle(vehicles: VehicleRecord[], request: ReservationRequest): VehicleRecord {
  if (!request || typeof request !== 'object' || typeof request.vehicleSlug !== 'string' || !request.vehicleSlug.trim()) {
    throw new ReservationRequestError(400, 'vehicleSlug is required', 'vehicleSlug');
  }
  const record = findVehicleRecord(vehicles, request.vehicleSlug.trim());
  if (!record) {
    throw new ReservationRequestError(404, `Unknown vehicle '${request.vehicleSlug}'`, 'vehicleSlug', 'vehicle_not_found');
  }
  return record;
}

/**
 * Checks eligibility (conflict/duplicate/unavailable/limit) against the
 * existing reservations for this customer/vehicle and throws a
 * `reason`-tagged `ReservationRequestError` (409) on the first violation.
 * Returns nothing — the caller performs the atomic create/mutate once this
 * passes. Both `MemoryStore` and `PostgresStore` call this with the same
 * semantics so behavior never forks between runtime profiles.
 */
function checkReservationEligibility(
  vehicle: VehicleRecord,
  existingReservations: ReservationRecord[],
  customerId: string,
  nowISO: string
): void {
  const activeForVehicle = existingReservations.filter((r) => r.vehicleId === vehicle.id && isReservationActive(r, nowISO));
  const activeConflict = activeForVehicle.find((r) => r.customerId !== customerId);
  if (activeConflict) {
    throw new ReservationRequestError(409, 'This vehicle is already on hold for another customer', undefined, 'conflict');
  }
  const activeDuplicate = activeForVehicle.find((r) => r.customerId === customerId);
  if (activeDuplicate) {
    throw new ReservationRequestError(409, 'You already have an active reservation on this vehicle', undefined, 'duplicate');
  }

  // No active hold blocks this vehicle (any earlier hold on it has expired,
  // or none ever existed). Any status outside the reservable set is
  // ineligible on its own merits (Draft/Pending/ReservedWithPI/InvoiceCreated/
  // Invoiced/Sold) regardless of hold history.
  if (!RESERVABLE_VEHICLE_STATUS_SET.has(vehicle.status)) {
    throw new ReservationRequestError(409, `Vehicle is not available to reserve (status: ${vehicle.status})`, undefined, 'vehicle_unavailable');
  }

  const activeCountForCustomer = existingReservations.filter((r) => r.customerId === customerId && isReservationActive(r, nowISO)).length;
  if (activeCountForCustomer >= MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER) {
    throw new ReservationRequestError(
      409,
      `You already have ${MAX_ACTIVE_RESERVATIONS_PER_CUSTOMER} active reservations, the maximum allowed at once`,
      undefined,
      'limit_exceeded'
    );
  }
}

const shipmentStages: CustomerShipment['stage'][] = ['Purchased', 'Inspection', 'Ready', 'In Transit', 'Delivered'];

function toCustomerShipment(record: ShipmentRecord): CustomerShipment {
  const stage = record.status === 'InTransit' ? 'In Transit' : record.status;
  const currentIndex = shipmentStages.indexOf(stage);
  return {
    id: record.id,
    vehicleId: record.vehicleId,
    stage,
    shippedAt: record.shippedAt,
    deliveredAt: record.deliveredAt,
    eta: record.eta,
    location: record.location,
    freshness: record.freshness ?? 'unknown',
    shipOkStatus: record.shipOkStatus ?? 'Pending',
    shipOkRejectionReason: record.shipOkRejectionReason,
    documentReleaseStatus: record.documentReleaseStatus ?? 'Pending',
    documentReleaseRejectionReason: record.documentReleaseRejectionReason,
    timeline: shipmentStages.map((timelineStage, index) => ({
      stage: timelineStage,
      current: index === currentIndex,
      ...(index === currentIndex ? { occurredAt: record.shippedAt } : {}),
    })),
  };
}

function toCustomerDocument(record: DocumentRecord): CustomerDocument {
  return {
    id: record.id,
    shipmentId: record.shipmentId,
    vehicleId: record.vehicleId,
    type: record.type,
    status: record.status,
    createdAt: record.createdAt,
  };
}

function toCustomerNotification(record: NotificationRecord): Notification {
  return {
    id: record.id,
    customerId: record.customerId,
    ...(record.title ? { title: record.title } : {}),
    message: record.message,
    type: record.type,
    isRead: record.isRead,
    createdAt: record.createdAt,
    ...(record.related ? { related: { ...record.related } } : {}),
  };
}

function queryCustomerNotifications(records: NotificationRecord[], query?: { status?: 'all' | 'read' | 'unread'; q?: string }): CustomerNotificationListResponse {
  const status = query?.status || 'all';
  const search = query?.q?.trim().toLowerCase();
  const items = records
    .filter((notification) => status === 'all' || (status === 'read' ? notification.isRead : !notification.isRead))
    .filter((notification) => !search || `${notification.title || ''} ${notification.message} ${notification.type}`.toLowerCase().includes(search))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(toCustomerNotification);
  return { items, total: items.length, unreadCount: records.filter((notification) => !notification.isRead).length };
}

function toCustomerProfile(record: CustomerProfileRecord, email: string): CustomerProfile {
  return {
    customerId: record.customerId,
    name: email.split('@')[0] || 'Customer',
    email,
    companyName: record.companyName,
    phone: record.phone,
    deliveryAddress: record.deliveryAddress,
    version: record.version,
    updatedAt: record.updatedAt,
  };
}

function validateCustomerProfileRequest(request: UpdateCustomerProfileRequest): void {
  if (!request || typeof request.companyName !== 'string' || request.companyName.trim().length < 2 || request.companyName.length > 120) throw new Error('Company name must be between 2 and 120 characters');
  if (typeof request.phone !== 'string' || !/^\+?[0-9 ()-]{7,30}$/.test(request.phone.trim())) throw new Error('Phone number is invalid');
  if (typeof request.deliveryAddress !== 'string' || request.deliveryAddress.trim().length < 5 || request.deliveryAddress.length > 240) throw new Error('Delivery address must be between 5 and 240 characters');
  if (request.expectedVersion !== undefined && (!Number.isInteger(request.expectedVersion) || request.expectedVersion < 1)) throw new Error('expectedVersion is invalid');
}

function toCustomerPayment(record: PaymentRecord, invoices: InvoiceRecord[] = [], allocations: AllocationRecord[] = []): CustomerPayment {
  const invoice = invoices.find((candidate) => candidate.id === record.invoiceId && candidate.customerId === record.customerId);
  const allocatedAmountUsd = allocations
    .filter((allocation) => allocation.customerId === record.customerId && allocation.invoiceId === record.invoiceId && allocation.status === 'Approved')
    .reduce((sum, allocation) => sum + allocation.amountUsd, 0);
  return {
    id: record.id,
    customerId: record.customerId,
    invoiceId: record.invoiceId,
    reference: record.reference || record.id.toUpperCase(),
    bankName: record.bankName || 'Unspecified bank',
    currency: record.currency || 'USD',
    amountUsd: record.amountUsd,
    ...(invoice ? { allocatedAmountUsd, remainingBalanceUsd: Math.max(invoice.totalAmountUsd - allocatedAmountUsd, 0) } : {}),
    paymentDate: record.paymentDate || record.paidAt,
    remarks: record.remarks,
    status: record.status,
    holdReason: record.holdReason,
    proof: record.proof,
    idempotencyKey: record.idempotencyKey || record.id,
    createdAt: record.createdAt || record.paidAt,
  };
}

function toCustomerPaymentNotification(record: PaymentNotificationRecord): CustomerPaymentNotification {
  return {
    id: record.id,
    customerId: record.customerId,
    paymentId: record.paymentId,
    invoiceId: record.invoiceId,
    event: record.event,
    deliveryStatus: 'Queued',
    createdAt: record.createdAt,
  };
}

const PAYMENT_NOTIFICATION_EVENTS: CustomerPaymentNotificationEvent[] = [
  'FinanceReviewRequested',
  'PaymentHeld',
  'PaymentResubmitted',
  'PaymentApproved',
  'PaymentAllocated',
];

export class PaymentWorkflowError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'PaymentWorkflowError';
  }
}

export class ProfileConflictError extends Error {
  readonly statusCode = 409;

  constructor() {
    super('Customer profile changed since it was loaded');
    this.name = 'ProfileConflictError';
  }
}

function paymentWorkflowState(payment: PaymentRecord, notifications: PaymentNotificationRecord[]): PaymentRecord['status'] {
  const events = notifications.filter((item) => item.paymentId === payment.id).map((item) => item.event);
  if (events.includes('PaymentAllocated') || events.includes('PaymentApproved')) return 'Approved';
  if (events.includes('PaymentResubmitted')) return 'Resubmitted';
  if (events.includes('PaymentHeld')) return 'Held';
  return payment.status;
}

function applyPaymentNotification(
  payment: PaymentRecord,
  request: RecordPaymentNotificationRequest,
  notifications: PaymentNotificationRecord[],
  allocations: AllocationRecord[],
  nowISO: string,
): PaymentNotificationRecord {
  if (!PAYMENT_NOTIFICATION_EVENTS.includes(request.event)) throw new PaymentWorkflowError(400, 'Unsupported payment notification event');
  const existing = notifications.find((item) => item.paymentId === payment.id && item.event === request.event);
  if (existing) return existing;

  const current = paymentWorkflowState(payment, notifications);
  if (request.event === 'PaymentHeld') {
    if (!request.reason?.trim()) throw new PaymentWorkflowError(400, 'A hold reason is required');
    if (!['Pending', 'Resubmitted'].includes(current)) throw new PaymentWorkflowError(409, 'Only a pending payment can be held');
    payment.status = 'Held';
    payment.holdReason = request.reason.trim();
  } else if (request.event === 'PaymentResubmitted') {
    if (current !== 'Held') throw new PaymentWorkflowError(409, 'Only a held payment can be resubmitted');
    payment.status = 'Resubmitted';
  } else if (request.event === 'PaymentApproved') {
    if (!['Pending', 'Held', 'Resubmitted'].includes(current)) throw new PaymentWorkflowError(409, 'Payment cannot be approved from its current state');
    payment.status = 'Approved';
  } else if (request.event === 'PaymentAllocated') {
    if (current !== 'Approved') throw new PaymentWorkflowError(409, 'Only an approved payment can be allocated');
    const alreadyAllocated = allocations.filter((item) => item.paymentId === payment.id && item.status === 'Approved').reduce((sum, item) => sum + item.amountUsd, 0);
    const amount = request.allocationAmountUsd ?? payment.amountUsd;
    const invoice = seedInvoices.find((item) => item.id === payment.invoiceId && item.customerId === payment.customerId);
    const invoiceRemaining = invoice ? Math.max(invoice.totalAmountUsd - allocations.filter((item) => item.invoiceId === payment.invoiceId && item.status === 'Approved').reduce((sum, item) => sum + item.amountUsd, 0), 0) : 0;
    if (!Number.isFinite(amount) || amount <= 0 || amount > payment.amountUsd - alreadyAllocated || amount > invoiceRemaining) throw new PaymentWorkflowError(409, 'Allocation exceeds the available payment or invoice balance');
    allocations.push({ id: `alloc-${payment.id}`, customerId: payment.customerId, paymentId: payment.id, invoiceId: payment.invoiceId, amountUsd: amount, allocatedAt: nowISO, status: 'Approved' });
    payment.status = 'Approved';
  }

  const record: PaymentNotificationRecord = {
    id: `pay-event-${notifications.length + 1}`, customerId: payment.customerId, paymentId: payment.id,
    invoiceId: payment.invoiceId, event: request.event, deliveryStatus: 'Queued', createdAt: nowISO,
  };
  notifications.push(record);
  return record;
}

function validatePaymentRequest(request: CreateCustomerPaymentRequest): void {
  if (!request || !request.invoiceId || !request.reference || !request.bankName || request.currency !== 'USD') throw new Error('Invalid payment or invoice reference');
  if (!Number.isFinite(request.amountUsd) || request.amountUsd <= 0) throw new Error('amountUsd must be greater than zero');
  if (!request.idempotencyKey) throw new Error('idempotencyKey is required');
  if (!request.proof || !['PDF', 'JPG', 'PNG'].includes(request.proof.fileType)) throw new Error('Proof must be PDF, JPG or PNG metadata');
  if (!Number.isInteger(request.proof.sizeBytes) || request.proof.sizeBytes <= 0 || request.proof.sizeBytes > 10 * 1024 * 1024) throw new Error('Proof size exceeds the 10MB demo limit');
}

function createPaymentRecord(
  customerId: string,
  request: CreateCustomerPaymentRequest,
  nowISO: string,
  existing: PaymentRecord[],
  invoices: InvoiceRecord[],
): PaymentRecord {
  validatePaymentRequest(request);
  const invoice = invoices.find((candidate) => candidate.id === request.invoiceId);
  if (!invoice || invoice.customerId !== customerId) throw new Error('Invoice not found or not owned by customer');
  const duplicate = existing.find((payment) => payment.customerId === customerId && payment.idempotencyKey === request.idempotencyKey);
  if (duplicate) return duplicate;
  const record: PaymentRecord = {
    id: `pay-${Date.now()}-${existing.length + 1}`,
    customerId,
    invoiceId: request.invoiceId,
    amountUsd: request.amountUsd,
    paidAt: request.paymentDate,
    paymentDate: request.paymentDate,
    status: 'Pending',
    reference: request.reference,
    bankName: request.bankName,
    currency: request.currency,
    remarks: request.remarks,
    proof: { ...request.proof, scanStatus: 'Pending' },
    idempotencyKey: request.idempotencyKey,
    createdAt: nowISO,
  };
  existing.push(record);
  return record;
}

class MemoryStore implements DemoStore {
  private config = { ...seedConfig };
  private vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));
  private enquiries: EnquiryRecord[] = [];
  private enquirySeq = 0;
  private reservations: ReservationRecord[] = seedReservations.map((r) => ({ ...r }));
  private reservationSeq = 0;
  private invoices = seedInvoices.map((i) => ({ ...i }));
  private proformaInvoices = seedProformaInvoices.map((p) => ({ ...p }));
  private allocations = seedAllocations.map((a) => ({ ...a }));
  private payments = seedPayments.map((p) => ({ ...p }));
  private paymentNotifications = seedPaymentNotifications.map((n) => ({ ...n }));
  private shipments = seedShipments.map((s) => ({ ...s }));
  private documents = seedDocuments.map((d) => ({ ...d }));
  private notifications = seedNotifications.map((n) => ({ ...n }));
  private customerProfiles = seedCustomerProfiles.map((profile) => ({ ...profile }));
  private faqCategories = seedFaqCategories.map((c) => ({ ...c }));
  private faqItems = seedFaqItems.map((f) => ({ ...f }));
  private testimonials = seedTestimonials.map((t) => ({ ...t }));
  private testimonialSeq = 0;
  private publicPages = seedPublicContentPages.map((p) => ({ ...p }));
  private offices = seedOfficeLocations.map((o) => ({ ...o }));
  private branches = seedBranches.map((b) => ({ ...b }));
  private customerAccounts: CustomerAccountRecord[] = [buildSeedCustomerAccount()];
  private passwordResetOutbox: PasswordResetOutboxRecord[] = [];

  ready(): Promise<void> {
    return Promise.resolve();
  }

  getConfig(): Promise<PublicConfig> {
    return Promise.resolve({ ...this.config });
  }

  getVehicles(query?: GetVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleDomainSummary[]> {
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations: this.reservations,
    };
    return Promise.resolve(filterAndSortVehicles(this.vehicles, query, mergedContext));
  }

  searchVehicles(query?: SearchVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleSearchResult> {
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations: this.reservations,
    };
    const filteredList = filterAndSortVehicles(this.vehicles, query, mergedContext);
    const facets = calculateFacets(filteredList);

    const page = Math.max(1, query?.page ? Number(query.page) : 1);
    const limit = Math.max(1, query?.limit ? Number(query.limit) : 12);
    const total = filteredList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const startIndex = (page - 1) * limit;
    const items = filteredList.slice(startIndex, startIndex + limit);

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      facets,
    });
  }

  getVehicleDetail(idOrSlug: string, context?: VehicleQueryContext): Promise<VehicleDetail | null> {
    const record = findVehicleRecord(this.vehicles, idOrSlug);
    if (!record) return Promise.resolve(null);
    if ((context?.audience || 'public') !== 'salesperson' && record.status === 'Draft') {
      return Promise.resolve(null);
    }
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations: this.reservations,
    };
    return Promise.resolve(buildVehicleDetail(record, mergedContext));
  }

  getFreightDestinations(): Promise<FreightDestination[]> {
    return Promise.resolve(freightDestinations.map((d) => ({ ...d })));
  }

  getFreightPorts(): Promise<FreightPort[]> {
    return Promise.resolve(freightPorts.map((p) => ({ ...p })));
  }

  async getFreightEstimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse> {
    return buildFreightEstimate(freightDestinations, freightPorts, freightRateRecords, request);
  }

  async createEnquiry(request: EnquiryRequest): Promise<EnquiryResponse> {
    const prepared = prepareEnquiry(this.vehicles, freightDestinations, freightPorts, freightRateRecords, request, FREIGHT_REFERENCE_DATE);
    const dedupeKey = buildEnquiryDedupeKey(prepared);

    const existing = this.enquiries.find((e) => e.dedupeKey === dedupeKey);
    if (existing) {
      existing.duplicateResubmissionCount += 1;
      return toEnquiryResponse(existing, true);
    }

    const record: EnquiryRecord = {
      id: `enq-${Date.now()}-${this.enquirySeq++}`,
      dedupeKey,
      receivedAt: new Date().toISOString(),
      duplicateResubmissionCount: 0,
      ...prepared,
    };
    this.enquiries.push(record);
    return toEnquiryResponse(record, false);
  }

  getLeadById(id: string): Promise<LeadRecord | null> {
    const record = this.enquiries.find((e) => e.id === id);
    return Promise.resolve(record ? toLeadRecord(record) : null);
  }

  listLeads(): Promise<LeadListResponse> {
    return Promise.resolve({
      items: this.enquiries.map(toLeadRecord),
      total: this.enquiries.length,
    });
  }

  // No `await` between the eligibility check and the mutation below, so two
  // concurrent calls (e.g. `Promise.all([...])`) resolve this async function
  // body to completion, one after the other, without interleaving — the
  // second call always observes the first call's already-applied mutation
  // (RULE-08's "never both succeed" transactional requirement for a single
  // Node.js event loop).
  async createReservation(customerId: string, customerEmail: string, request: ReservationRequest, nowISO: string = new Date().toISOString()): Promise<ReservationResponse> {
    const vehicle = resolveReservationVehicle(this.vehicles, request);
    checkReservationEligibility(vehicle, this.reservations, customerId, nowISO);

    const expiresAt = new Date(new Date(nowISO).getTime() + RESERVATION_HOLD_HOURS * 60 * 60 * 1000).toISOString();
    const record: ReservationRecord = {
      id: `res-${Date.now()}-${this.reservationSeq++}`,
      vehicleId: vehicle.id,
      vehicleSlug: generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id),
      customerId,
      customerEmail,
      createdAt: nowISO,
      expiresAt,
      holdHours: RESERVATION_HOLD_HOURS,
    };
    this.reservations.push(record);
    vehicle.status = 'Reserved';

    return Promise.resolve(toReservationResponse(record, nowISO));
  }

  getReservationById(id: string): Promise<ReservationResponse | null> {
    const record = this.reservations.find((r) => r.id === id);
    return Promise.resolve(record ? toReservationResponse(record, new Date().toISOString()) : null);
  }

  // Phase 1.7 Content Methods
  getFaqs(query?: { category?: string; q?: string }): Promise<FaqQueryResponse> {
    return Promise.resolve(filterFaqs(this.faqItems, this.faqCategories, query));
  }

  getTestimonials(): Promise<TestimonialListResponse> {
    const approved = this.testimonials.filter((t) => t.status === 'approved');
    return Promise.resolve({ items: approved, total: approved.length });
  }

  submitTestimonial(request: TestimonialSubmissionRequest): Promise<TestimonialSubmissionResponse> {
    validateTestimonialSubmission(request);
    const submittedAt = new Date().toISOString();
    const id = `testim-${Date.now()}-${this.testimonialSeq++}`;
    const item: TestimonialItem = {
      id,
      authorName: request.authorName.trim(),
      authorLocation: request.authorLocation.trim(),
      vehiclePurchased: request.vehiclePurchased?.trim(),
      rating: Number(request.rating),
      content: request.content.trim(),
      submittedAt,
      status: 'pending',
      consent: request.consent,
    };
    this.testimonials.push(item);
    return Promise.resolve({
      id,
      status: 'pending',
      submittedAt,
      message: 'Testimonial submitted successfully and is pending review.',
    });
  }

  getContentPages(): Promise<PublicContentPage[]> {
    const approved = this.publicPages.filter((p) => p.status === 'approved');
    return Promise.resolve(approved);
  }

  getContentPageBySlug(slug: string): Promise<PublicContentPage | null> {
    const page = this.publicPages.find((p) => p.slug === slug && p.status === 'approved');
    return Promise.resolve(page || null);
  }

  getOffices(): Promise<OfficeListResponse> {
    const approved = this.offices.filter((o) => o.status === 'approved');
    return Promise.resolve({ items: approved, total: approved.length });
  }

  getBranches(): Promise<BranchListResponse> {
    const approved = this.branches.filter((b) => b.status === 'approved');
    return Promise.resolve({ items: approved, total: approved.length });
  }

  getBranchById(id: string): Promise<BranchContent | null> {
    const branch = this.branches.find((b) => (b.id === id || b.code === id) && b.status === 'approved');
    return Promise.resolve(branch || null);
  }

  getCustomerDashboard(customerId: string, customerEmail: string): Promise<CustomerDashboard> {
    // Outstanding balance = sum of issued invoices - sum of approved allocations (D02-ASM-001)
    const customerInvoices = this.invoices.filter((i) => i.customerId === customerId && i.status === 'Issued');
    const totalIssuedAmount = customerInvoices.reduce((sum, inv) => sum + inv.totalAmountUsd, 0);

    const customerAllocations = this.allocations.filter((a) => a.customerId === customerId && a.status === 'Approved');
    const totalApprovedAmount = customerAllocations.reduce((sum, alloc) => sum + alloc.amountUsd, 0);

    const outstandingBalanceUsd = Math.max(0, totalIssuedAmount - totalApprovedAmount);

    // Credit utilisation = outstanding balance / credit limit
    const creditLimitUsd = 500000.00; // Mock credit limit
    const creditUtilisationPercent = (outstandingBalanceUsd / creditLimitUsd) * 100;

    // Vehicle counts use canonical vehicle IDs and current server status
    const reservedVehicleIds = new Set(
      this.reservations
        .filter((r) => r.customerId === customerId && isReservationActive(r, new Date().toISOString()))
        .map((r) => r.vehicleId)
    );

    const invoicedVehicleIds = new Set(
      customerInvoices.map((i) => i.vehicleId)
    );

    // Count delivered vehicles (those invoiced and with Delivered status)
    const deliveredVehicleIds = new Set(
      customerInvoices
        .filter((i) => {
          const vehicle = this.vehicles.find((v) => v.id === i.vehicleId);
          return vehicle && vehicle.status === 'Sold'; // Sold status indicates delivered
        })
        .map((i) => i.vehicleId)
    );

    // Compute linked record aggregates (D02-P02-T001)
    // Payment status summary: count payments by status for this customer's invoices
    const customerInvoiceIds = new Set(customerInvoices.map((i) => i.id));
    const customerPayments = this.payments.filter((p) => p.customerId === customerId && customerInvoiceIds.has(p.invoiceId));
    const paymentStatusSummary = {
      approved: customerPayments.filter((p) => p.status === 'Approved').length,
      pending: customerPayments.filter((p) => p.status === 'Pending').length,
      rejected: customerPayments.filter((p) => p.status === 'Rejected').length,
    };

    // Shipment status summary: count shipments by status for this customer's vehicles
    const customerVehicleIds = new Set(customerInvoices.map((i) => i.vehicleId));
    const customerShipments = this.shipments.filter((s) => s.customerId === customerId && customerVehicleIds.has(s.vehicleId));
    const shipmentStatusSummary = {
      ready: customerShipments.filter((s) => s.status === 'Ready').length,
      inTransit: customerShipments.filter((s) => s.status === 'InTransit').length,
      delivered: customerShipments.filter((s) => s.status === 'Delivered').length,
      other: customerShipments.filter((s) => !['Ready', 'InTransit', 'Delivered'].includes(s.status)).length,
    };

    // Document availability: count documents by status for this customer's shipments/vehicles
    const customerShipmentIds = new Set(customerShipments.map((s) => s.id));
    const customerDocuments = this.documents.filter((d) => d.customerId === customerId && (customerShipmentIds.has(d.shipmentId || '') || customerVehicleIds.has(d.vehicleId || '')));
    const documentAvailabilityCount = {
      available: customerDocuments.filter((d) => d.status === 'Available').length,
      pending: customerDocuments.filter((d) => d.status === 'Pending').length,
      unavailable: customerDocuments.filter((d) => d.status === 'Unavailable').length,
    };

    // Notification unread count for this customer
    const notificationUnreadCount = this.notifications.filter((n) => n.customerId === customerId && !n.isRead).length;

    // Partial failure indicators: all set to false since this is mock data (no actual failures)
    const partialFailureIndicators = {
      paymentsFailed: false,
      shipmentsFailed: false,
      documentsFailed: false,
      notificationsFailed: false,
    };

    return Promise.resolve({
      customerId,
      customerEmail,
      creditLimitUsd,
      outstandingBalanceUsd,
      creditUtilisationPercent: Math.round(creditUtilisationPercent * 10) / 10, // Round to 1 decimal place
      vehicleCountReserved: reservedVehicleIds.size,
      vehicleCountInvoiced: invoicedVehicleIds.size,
      vehicleCountDelivered: deliveredVehicleIds.size,
      lastUpdated: new Date().toISOString(),
      paymentStatusSummary,
      shipmentStatusSummary,
      documentAvailabilityCount,
      notificationUnreadCount,
      partialFailureIndicators,
    });
  }

  getCustomerVehicles(customerId: string, query?: ListCustomerVehiclesQuery, nowISO?: string): Promise<CustomerVehicleListResponse> {
    const all = buildCustomerVehicleProjections(
      customerId,
      this.vehicles,
      this.reservations,
      this.proformaInvoices,
      this.invoices,
      this.allocations,
      this.shipments,
      this.documents,
      nowISO || new Date().toISOString()
    );
    return Promise.resolve(queryCustomerVehicles(all, query));
  }

  getCustomerVehicleById(customerId: string, idOrSlug: string, nowISO?: string): Promise<CustomerVehicleDetail | null> {
    const all = buildCustomerVehicleProjections(
      customerId,
      this.vehicles,
      this.reservations,
      this.proformaInvoices,
      this.invoices,
      this.allocations,
      this.shipments,
      this.documents,
      nowISO || new Date().toISOString()
    );
    const target = all.find((v) => v.id === idOrSlug || v.vehicleId === idOrSlug || v.slug === idOrSlug);
    return Promise.resolve(target || null);
  }

  listCustomerShipments(customerId: string): Promise<CustomerShipment[]> {
    return Promise.resolve(this.shipments
      .filter((shipment) => shipment.customerId === customerId)
      .map(toCustomerShipment));
  }

  async getCustomerShipment(customerId: string, shipmentId: string): Promise<CustomerShipment | null> {
    const shipment = this.shipments.find((candidate) => candidate.id === shipmentId && candidate.customerId === customerId);
    return shipment ? toCustomerShipment(shipment) : null;
  }

  listCustomerDocuments(customerId: string): Promise<CustomerDocument[]> {
    const customerShipmentIds = new Set(this.shipments
      .filter((shipment) => shipment.customerId === customerId)
      .map((shipment) => shipment.id));
    return Promise.resolve(this.documents
      .filter((document) => document.customerId === customerId
        && (document.releaseApproved === true && document.visibleToCustomer === true)
        && (!document.shipmentId || customerShipmentIds.has(document.shipmentId)))
      .map(toCustomerDocument));
  }

  async getCustomerDocument(customerId: string, documentId: string): Promise<CustomerDocument | null> {
    const document = this.documents.find((candidate) => candidate.id === documentId && candidate.customerId === customerId);
    if (!document || document.releaseApproved !== true || document.visibleToCustomer !== true) return null;
    return toCustomerDocument(document);
  }

  listCustomerNotifications(customerId: string, query?: { status?: 'all' | 'read' | 'unread'; q?: string }): Promise<CustomerNotificationListResponse> {
    return Promise.resolve(queryCustomerNotifications(this.notifications.filter((notification) => notification.customerId === customerId), query));
  }

  getCustomerNotification(customerId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.find((candidate) => candidate.customerId === customerId && candidate.id === notificationId);
    return Promise.resolve(notification ? toCustomerNotification(notification) : null);
  }

  markCustomerNotificationRead(customerId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.find((candidate) => candidate.customerId === customerId && candidate.id === notificationId);
    if (notification) notification.isRead = true;
    return Promise.resolve(notification ? toCustomerNotification(notification) : null);
  }

  markAllCustomerNotificationsRead(customerId: string): Promise<MarkNotificationsReadResponse> {
    const owned = this.notifications.filter((notification) => notification.customerId === customerId);
    const updatedCount = owned.filter((notification) => !notification.isRead).length;
    owned.forEach((notification) => { notification.isRead = true; });
    return Promise.resolve({ updatedCount, unreadCount: 0 });
  }

  getCustomerProfile(customerId: string, email: string): Promise<CustomerProfile> {
    const profile = this.customerProfiles.find((candidate) => candidate.customerId === customerId);
    if (!profile) throw new Error('Customer profile not found');
    return Promise.resolve(toCustomerProfile(profile, email));
  }

  updateCustomerProfile(customerId: string, email: string, request: UpdateCustomerProfileRequest, nowISO = new Date().toISOString()): Promise<CustomerProfile> {
    validateCustomerProfileRequest(request);
    const profile = this.customerProfiles.find((candidate) => candidate.customerId === customerId);
    if (!profile) throw new Error('Customer profile not found');
    if (request.expectedVersion !== undefined && request.expectedVersion !== profile.version) throw new ProfileConflictError();
    profile.companyName = request.companyName.trim();
    profile.phone = request.phone.trim();
    profile.deliveryAddress = request.deliveryAddress.trim();
    profile.version += 1;
    profile.updatedAt = nowISO;
    return Promise.resolve(toCustomerProfile(profile, email));
  }

  getCustomerInvoices(customerId: string, query?: ListCustomerInvoicesQuery, nowISO?: string): Promise<CustomerInvoiceListResponse> {
    const all = buildCustomerInvoiceProjections(
      customerId,
      this.invoices,
      this.proformaInvoices,
      this.allocations,
      this.vehicles,
      this.documents,
      nowISO || new Date().toISOString()
    );
    return Promise.resolve(queryCustomerInvoices(all, query));
  }

  getCustomerInvoiceById(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDetail | null> {
    const all = buildCustomerInvoiceProjections(
      customerId,
      this.invoices,
      this.proformaInvoices,
      this.allocations,
      this.vehicles,
      this.documents,
      nowISO || new Date().toISOString()
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    return Promise.resolve(target || null);
  }

  getCustomerInvoiceDocument(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDocument | null> {
    const all = buildCustomerInvoiceProjections(
      customerId,
      this.invoices,
      this.proformaInvoices,
      this.allocations,
      this.vehicles,
      this.documents,
      nowISO || new Date().toISOString()
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    if (!target) return Promise.resolve(null);
    return Promise.resolve(buildCustomerInvoiceDocument(target));
  }

  listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse> {
    const items = this.payments.filter((payment) => payment.customerId === customerId).map((payment) => toCustomerPayment(payment, this.invoices, this.allocations));
    return Promise.resolve({ items, total: items.length });
  }

  getCustomerPayment(customerId: string, id: string): Promise<CustomerPayment | null> {
    const payment = this.payments.find((candidate) => candidate.customerId === customerId && candidate.id === id);
    return Promise.resolve(payment ? toCustomerPayment(payment, this.invoices, this.allocations) : null);
  }

  createCustomerPayment(customerId: string, request: CreateCustomerPaymentRequest, nowISO = new Date().toISOString()): Promise<CustomerPayment> {
    return Promise.resolve(toCustomerPayment(createPaymentRecord(customerId, request, nowISO, this.payments, this.invoices), this.invoices, this.allocations));
  }

  resubmitCustomerPayment(customerId: string, paymentId: string, nowISO = new Date().toISOString()): Promise<CustomerPayment> {
    const payment = this.payments.find((candidate) => candidate.id === paymentId && candidate.customerId === customerId);
    if (!payment) throw new PaymentWorkflowError(404, 'Payment not found or not owned by customer');
    applyPaymentNotification(payment, { event: 'PaymentResubmitted' }, this.paymentNotifications, this.allocations, nowISO);
    return Promise.resolve(toCustomerPayment(payment, this.invoices, this.allocations));
  }

  listCustomerPaymentNotifications(customerId: string, paymentId?: string): Promise<CustomerPaymentNotificationListResponse> {
    const items = this.paymentNotifications
      .filter((notification) => notification.customerId === customerId && (!paymentId || notification.paymentId === paymentId))
      .map(toCustomerPaymentNotification);
    return Promise.resolve({ items, total: items.length });
  }

  recordPaymentNotification(paymentId: string, request: RecordPaymentNotificationRequest, nowISO = new Date().toISOString()): Promise<CustomerPaymentNotification | null> {
    const payment = this.payments.find((candidate) => candidate.id === paymentId);
    if (!payment) return Promise.resolve(null);
    return Promise.resolve(toCustomerPaymentNotification(applyPaymentNotification(payment, request, this.paymentNotifications, this.allocations, nowISO)));
  }

  async registerCustomerAccount(request: RegisterCustomerRequest, nowISO: string = new Date().toISOString()): Promise<CustomerAccountProjection> {
    const record = performRegisterCustomerAccount(this.customerAccounts, request, nowISO);
    this.customerAccounts.push(record);
    this.customerProfiles.push({
      customerId: record.customerId,
      companyName: '',
      phone: '',
      deliveryAddress: '',
      version: 1,
      updatedAt: nowISO,
    });
    return toCustomerAccountProjection(record);
  }

  async authenticateCustomer(request: LoginRequest): Promise<CustomerAccountProjection> {
    const account = performAuthenticateCustomer(this.customerAccounts, request);
    return toCustomerAccountProjection(account);
  }

  async changeCustomerPassword(customerId: string, request: ChangePasswordRequest, nowISO: string = new Date().toISOString()): Promise<void> {
    performChangeCustomerPassword(this.customerAccounts, customerId, request, nowISO);
  }

  async requestPasswordReset(request: PasswordResetRequest, nowISO: string = new Date().toISOString()): Promise<void> {
    performRequestPasswordReset(this.customerAccounts, this.passwordResetOutbox, request, nowISO);
  }

  async confirmPasswordReset(request: ConfirmPasswordResetRequest, nowISO: string = new Date().toISOString()): Promise<void> {
    performConfirmPasswordReset(this.customerAccounts, this.passwordResetOutbox, request, nowISO);
  }

  async listPasswordResetOutbox(): Promise<PasswordResetOutboxRecord[]> {
    return this.passwordResetOutbox.map((o) => ({ ...o }));
  }

  async getCountries(): Promise<CountriesResponse> {
    return { items: COUNTRIES.map((c) => ({ ...c })) };
  }

  reset(): Promise<void> {
    this.config = { ...seedConfig };
    this.vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));
    this.enquiries = [];
    this.reservations = seedReservations.map((r) => ({ ...r }));
    this.invoices = seedInvoices.map((i) => ({ ...i }));
    this.proformaInvoices = seedProformaInvoices.map((p) => ({ ...p }));
    this.allocations = seedAllocations.map((a) => ({ ...a }));
    this.payments = seedPayments.map((p) => ({ ...p }));
    this.paymentNotifications = seedPaymentNotifications.map((n) => ({ ...n }));
    this.shipments = seedShipments.map((s) => ({ ...s }));
    this.documents = seedDocuments.map((d) => ({ ...d }));
    this.notifications = seedNotifications.map((n) => ({ ...n }));
    this.customerProfiles = seedCustomerProfiles.map((profile) => ({ ...profile }));
    this.faqCategories = seedFaqCategories.map((c) => ({ ...c }));
    this.faqItems = seedFaqItems.map((f) => ({ ...f }));
    this.testimonials = seedTestimonials.map((t) => ({ ...t }));
    this.publicPages = seedPublicContentPages.map((p) => ({ ...p }));
    this.offices = seedOfficeLocations.map((o) => ({ ...o }));
    this.branches = seedBranches.map((b) => ({ ...b }));
    this.customerAccounts = [buildSeedCustomerAccount()];
    this.passwordResetOutbox = [];
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

class PostgresStore implements DemoStore {
  private readonly pool: Pool;
  private paymentRecords = seedPayments.map((payment) => ({ ...payment }));
  private paymentNotifications = seedPaymentNotifications.map((notification) => ({ ...notification }));
  private notifications = seedNotifications.map((notification) => ({ ...notification }));
  private customerProfiles = seedCustomerProfiles.map((profile) => ({ ...profile }));
  private allocations = seedAllocations.map((allocation) => ({ ...allocation }));

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async ready(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS public_config (id integer PRIMARY KEY, site_name text NOT NULL, currency text NOT NULL, contact_phone text NOT NULL);`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS vehicles (
        id text PRIMARY KEY,
        chassis_number text NOT NULL,
        make text NOT NULL,
        model text NOT NULL,
        year integer NOT NULL,
        price_usd numeric NOT NULL,
        status text NOT NULL,
        category text,
        location_status text,
        created_at text,
        images text,
        featured boolean,
        stock_type text,
        destination_port text,
        discount_percent numeric,
        internal_notes text,
        staff_owner_id text,
        body_style text,
        fuel_type text,
        transmission text,
        drive_train text,
        mileage integer,
        etd text,
        eta text,
        request_price boolean
      );`
    );
    await this.pool.query(
      `ALTER TABLE vehicles
        ADD COLUMN IF NOT EXISTS category text,
        ADD COLUMN IF NOT EXISTS location_status text,
        ADD COLUMN IF NOT EXISTS created_at text,
        ADD COLUMN IF NOT EXISTS images text,
        ADD COLUMN IF NOT EXISTS featured boolean,
        ADD COLUMN IF NOT EXISTS stock_type text,
        ADD COLUMN IF NOT EXISTS destination_port text,
        ADD COLUMN IF NOT EXISTS discount_percent numeric,
        ADD COLUMN IF NOT EXISTS internal_notes text,
        ADD COLUMN IF NOT EXISTS staff_owner_id text,
        ADD COLUMN IF NOT EXISTS body_style text,
        ADD COLUMN IF NOT EXISTS fuel_type text,
        ADD COLUMN IF NOT EXISTS transmission text,
        ADD COLUMN IF NOT EXISTS drive_train text,
        ADD COLUMN IF NOT EXISTS mileage integer,
        ADD COLUMN IF NOT EXISTS etd text,
        ADD COLUMN IF NOT EXISTS eta text,
        ADD COLUMN IF NOT EXISTS request_price boolean;`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS enquiries (
        id text PRIMARY KEY,
        dedupe_key text NOT NULL,
        name text NOT NULL,
        email text NOT NULL,
        phone text NOT NULL,
        message text NOT NULL,
        vehicle_slug text,
        destination_code text,
        port_code text,
        rate_status text,
        currency text,
        rate_effective_from text,
        rate_effective_to text,
        estimate_message text,
        received_at text NOT NULL
      );`
    );
    // Phase 1.6 (D01-P06-T001): ADD COLUMN IF NOT EXISTS because
    // CREATE TABLE IF NOT EXISTS above does not add columns to an
    // already-existing volume (see TASK_EXECUTION_PROTOCOL.md §3 Docker
    // schema-drift note).
    await this.pool.query(
      `ALTER TABLE enquiries
        ADD COLUMN IF NOT EXISTS enquiry_type text,
        ADD COLUMN IF NOT EXISTS source text,
        ADD COLUMN IF NOT EXISTS duplicate_resubmission_count integer;`
    );
    // Phase 1.6 (D01-P06-T002): consent and the optional vehicle-preference
    // capture fields — same ADD COLUMN IF NOT EXISTS schema-drift pattern as
    // above, since an already-existing local volume never gets these columns
    // from CREATE TABLE IF NOT EXISTS alone.
    await this.pool.query(
      `ALTER TABLE enquiries
        ADD COLUMN IF NOT EXISTS consent boolean,
        ADD COLUMN IF NOT EXISTS preferred_make text,
        ADD COLUMN IF NOT EXISTS preferred_model text,
        ADD COLUMN IF NOT EXISTS preferred_drive_side text,
        ADD COLUMN IF NOT EXISTS preferred_year integer,
        ADD COLUMN IF NOT EXISTS target_price_usd numeric;`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS reservations (
        id text PRIMARY KEY,
        vehicle_id text NOT NULL,
        vehicle_slug text NOT NULL,
        customer_id text NOT NULL,
        customer_email text NOT NULL,
        created_at text NOT NULL,
        expires_at text NOT NULL,
        hold_hours integer NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS faq_categories (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text,
        sort_order integer NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS faq_items (
        id text PRIMARY KEY,
        category_id text NOT NULL,
        category_name text NOT NULL,
        question text NOT NULL,
        answer text NOT NULL,
        slug text NOT NULL,
        featured boolean,
        sort_order integer,
        owner text NOT NULL,
        status text NOT NULL,
        updated_at text NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS testimonials (
        id text PRIMARY KEY,
        author_name text NOT NULL,
        author_location text NOT NULL,
        avatar_url text,
        vehicle_purchased text,
        rating integer NOT NULL,
        content text NOT NULL,
        submitted_at text NOT NULL,
        status text NOT NULL,
        consent boolean NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS content_pages (
        slug text PRIMARY KEY,
        title text NOT NULL,
        summary text NOT NULL,
        body text NOT NULL,
        owner text NOT NULL,
        status text NOT NULL,
        updated_at text NOT NULL,
        sections text,
        metadata text
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS office_locations (
        id text PRIMARY KEY,
        name text NOT NULL,
        city text NOT NULL,
        country text NOT NULL,
        address text NOT NULL,
        phone text NOT NULL,
        email text NOT NULL,
        operating_hours text NOT NULL,
        is_primary boolean NOT NULL,
        status text NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS branch_content (
        id text PRIMARY KEY,
        name text NOT NULL,
        code text NOT NULL,
        destination_port text NOT NULL,
        introduction text NOT NULL,
        welcome_banner text NOT NULL,
        contact_banner text NOT NULL,
        team_members text NOT NULL,
        meet_and_greet_info text NOT NULL,
        contact_details text NOT NULL,
        content_owner text NOT NULL,
        status text NOT NULL,
        latest_arrivals_query text,
        recently_discounted_query text
      );`
    );
    // Phase 2.12 (D02-P12-T001): customer_accounts and password_reset_outbox
    // are brand-new tables, so CREATE TABLE IF NOT EXISTS alone is
    // sufficient for an already-existing local volume — there is no prior
    // shape to reconcile with ADD COLUMN IF NOT EXISTS (unlike `enquiries`).
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS customer_accounts (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        name_with_initials text NOT NULL,
        country_code text NOT NULL,
        dial_code text NOT NULL,
        mobile_number text NOT NULL,
        email text NOT NULL,
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        status text NOT NULL,
        verification_state text NOT NULL,
        created_at text NOT NULL,
        updated_at text NOT NULL,
        password_updated_at text NOT NULL
      );`
    );
    await this.pool.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS customer_accounts_email_lower_idx ON customer_accounts (lower(email));'
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS password_reset_outbox (
        token text PRIMARY KEY,
        email text NOT NULL,
        issued_at text NOT NULL,
        expires_at text NOT NULL,
        consumed boolean NOT NULL
      );`
    );

    const seededAccountResult = await this.pool.query('SELECT id FROM customer_accounts WHERE id = $1', ['acct-cust-123']);
    if (seededAccountResult.rows.length === 0) {
      const seed = buildSeedCustomerAccount();
      await this.pool.query(
        `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          seed.id,
          seed.customerId,
          seed.nameWithInitials,
          seed.countryCode,
          seed.dialCode,
          seed.mobileNumber,
          seed.email,
          seed.passwordHash,
          seed.passwordSalt,
          seed.status,
          seed.verificationState,
          seed.createdAt,
          seed.updatedAt,
          seed.passwordUpdatedAt,
        ]
      );
    }

    const configResult = await this.pool.query('SELECT id FROM public_config WHERE id = 1');
    if (configResult.rows.length === 0) {
      await this.pool.query(
        'INSERT INTO public_config (id, site_name, currency, contact_phone) VALUES (1, $1, $2, $3)',
        [seedConfig.siteName, seedConfig.currency, seedConfig.contactPhone]
      );
      for (const vehicle of seedVehicles) {
        await this.pool.query(
          'INSERT INTO vehicles (id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, internal_notes, staff_owner_id, body_style, fuel_type, transmission, drive_train, mileage, etd, eta, request_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)',
          [
            vehicle.id,
            vehicle.chassisNumber,
            vehicle.make,
            vehicle.model,
            vehicle.year,
            vehicle.priceUsd,
            vehicle.status,
            vehicle.category || null,
            vehicle.locationStatus || null,
            vehicle.createdAt || null,
            vehicle.images ? JSON.stringify(vehicle.images) : null,
            vehicle.featured ?? false,
            vehicle.stockType || null,
            vehicle.destinationPort || null,
            vehicle.discountPercent || null,
            vehicle.internalNotes || null,
            vehicle.staffOwnerId || null,
            vehicle.bodyStyle || null,
            vehicle.fuelType || null,
            vehicle.transmission || null,
            vehicle.driveTrain || null,
            vehicle.mileage || null,
            vehicle.etd || null,
            vehicle.eta || null,
            vehicle.requestPrice ?? false,
          ]
        );
      }
      for (const res of seedReservations) {
        await this.pool.query(
          'INSERT INTO reservations (id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [res.id, res.vehicleId, res.vehicleSlug, res.customerId, res.customerEmail, res.createdAt, res.expiresAt, res.holdHours]
        );
      }
      for (const cat of seedFaqCategories) {
        await this.pool.query('INSERT INTO faq_categories (id, name, description, sort_order) VALUES ($1, $2, $3, $4)', [cat.id, cat.name, cat.description || null, cat.order]);
      }
      for (const item of seedFaqItems) {
        await this.pool.query('INSERT INTO faq_items (id, category_id, category_name, question, answer, slug, featured, sort_order, owner, status, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [item.id, item.categoryId, item.categoryName, item.question, item.answer, item.slug, item.featured ?? false, item.order || 1, item.owner, item.status, item.updatedAt]);
      }
      for (const testim of seedTestimonials) {
        await this.pool.query('INSERT INTO testimonials (id, author_name, author_location, avatar_url, vehicle_purchased, rating, content, submitted_at, status, consent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [testim.id, testim.authorName, testim.authorLocation, testim.avatarUrl || null, testim.vehiclePurchased || null, testim.rating, testim.content, testim.submittedAt, testim.status, testim.consent]);
      }
      for (const page of seedPublicContentPages) {
        await this.pool.query('INSERT INTO content_pages (slug, title, summary, body, owner, status, updated_at, sections, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [page.slug, page.title, page.summary, page.body, page.owner, page.status, page.updatedAt, page.sections ? JSON.stringify(page.sections) : null, page.metadata ? JSON.stringify(page.metadata) : null]);
      }
      for (const office of seedOfficeLocations) {
        await this.pool.query('INSERT INTO office_locations (id, name, city, country, address, phone, email, operating_hours, is_primary, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [office.id, office.name, office.city, office.country, office.address, office.phone, office.email, office.operatingHours, office.isPrimary, office.status]);
      }
      for (const branch of seedBranches) {
        await this.pool.query('INSERT INTO branch_content (id, name, code, destination_port, introduction, welcome_banner, contact_banner, team_members, meet_and_greet_info, contact_details, content_owner, status, latest_arrivals_query, recently_discounted_query) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)', [branch.id, branch.name, branch.code, branch.destinationPort, branch.introduction, branch.welcomeBanner, branch.contactBanner, JSON.stringify(branch.teamMembers), branch.meetAndGreetInfo, JSON.stringify(branch.contactDetails), branch.contentOwner, branch.status, branch.latestArrivalsQuery ? JSON.stringify(branch.latestArrivalsQuery) : null, branch.recentlyDiscountedQuery ? JSON.stringify(branch.recentlyDiscountedQuery) : null]);
      }
    }
  }

  private async getRawReservations(): Promise<ReservationRecord[]> {
    const result = await this.pool.query(
      'SELECT id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours FROM reservations'
    );
    return result.rows.map(PostgresStore.rowToReservationRecord);
  }

  private async getRawVehicles(): Promise<VehicleRecord[]> {
    const result = await this.pool.query(
      'SELECT id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, body_style, fuel_type, transmission, drive_train, mileage, etd, eta, request_price FROM vehicles ORDER BY id'
    );
    return result.rows.map((row) => ({
      id: row.id,
      chassisNumber: row.chassis_number,
      make: row.make,
      model: row.model,
      year: Number(row.year),
      priceUsd: Number(row.price_usd),
      status: row.status,
      category: row.category,
      locationStatus: row.location_status,
      createdAt: row.created_at,
      images: row.images ? JSON.parse(row.images) : [],
      featured: Boolean(row.featured),
      stockType: row.stock_type,
      destinationPort: row.destination_port,
      discountPercent: row.discount_percent ? Number(row.discount_percent) : undefined,
      bodyStyle: row.body_style,
      fuelType: row.fuel_type,
      transmission: row.transmission,
      driveTrain: row.drive_train,
      mileage: row.mileage ? Number(row.mileage) : undefined,
      etd: row.etd,
      eta: row.eta,
      requestPrice: Boolean(row.request_price),
    }));
  }

  private async getRawVehiclesWith(client: PoolClient): Promise<VehicleRecord[]> {
    const result = await client.query(
      'SELECT id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, body_style, fuel_type, transmission, drive_train, mileage, etd, eta, request_price FROM vehicles ORDER BY id'
    );
    return result.rows.map((row) => ({
      id: row.id,
      chassisNumber: row.chassis_number,
      make: row.make,
      model: row.model,
      year: Number(row.year),
      priceUsd: Number(row.price_usd),
      status: row.status,
      category: row.category,
      locationStatus: row.location_status,
      createdAt: row.created_at,
      images: row.images ? JSON.parse(row.images) : [],
      featured: Boolean(row.featured),
      stockType: row.stock_type,
      destinationPort: row.destination_port,
      discountPercent: row.discount_percent ? Number(row.discount_percent) : undefined,
      bodyStyle: row.body_style,
      fuelType: row.fuel_type,
      transmission: row.transmission,
      driveTrain: row.drive_train,
      mileage: row.mileage ? Number(row.mileage) : undefined,
      etd: row.etd,
      eta: row.eta,
      requestPrice: Boolean(row.request_price),
    }));
  }

  async getConfig(): Promise<PublicConfig> {
    const result = await this.pool.query('SELECT site_name, currency, contact_phone FROM public_config WHERE id = 1');
    const row = result.rows[0];
    return row ? { siteName: row.site_name, currency: row.currency, contactPhone: row.contact_phone } : { ...seedConfig };
  }

  async getVehicles(query?: GetVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleDomainSummary[]> {
    const rawRecords = await this.getRawVehicles();
    const reservations = await this.getRawReservations();
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations,
    };
    return filterAndSortVehicles(rawRecords, query, mergedContext);
  }

  async searchVehicles(query?: SearchVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleSearchResult> {
    const rawRecords = await this.getRawVehicles();
    const reservations = await this.getRawReservations();
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations,
    };
    const filteredList = filterAndSortVehicles(rawRecords, query, mergedContext);
    const facets = calculateFacets(filteredList);

    const page = Math.max(1, query?.page ? Number(query.page) : 1);
    const limit = Math.max(1, query?.limit ? Number(query.limit) : 12);
    const total = filteredList.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const startIndex = (page - 1) * limit;
    const items = filteredList.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      facets,
    };
  }

  async getVehicleDetail(idOrSlug: string, context?: VehicleQueryContext): Promise<VehicleDetail | null> {
    const rawRecords = await this.getRawVehicles();
    const record = findVehicleRecord(rawRecords, idOrSlug);
    if (!record) return null;
    if ((context?.audience || 'public') !== 'salesperson' && record.status === 'Draft') {
      return null;
    }
    const reservations = await this.getRawReservations();
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations,
    };
    return buildVehicleDetail(record, mergedContext);
  }

  async getFreightDestinations(): Promise<FreightDestination[]> {
    return freightDestinations.map((d) => ({ ...d }));
  }

  async getFreightPorts(): Promise<FreightPort[]> {
    return freightPorts.map((p) => ({ ...p }));
  }

  async getFreightEstimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse> {
    return buildFreightEstimate(freightDestinations, freightPorts, freightRateRecords, request);
  }

  async createEnquiry(request: EnquiryRequest): Promise<EnquiryResponse> {
    const rawVehicles = await this.getRawVehicles();
    const prepared = prepareEnquiry(rawVehicles, freightDestinations, freightPorts, freightRateRecords, request, FREIGHT_REFERENCE_DATE);
    const dedupeKey = buildEnquiryDedupeKey(prepared);

    const existingResult = await this.pool.query(
      `${ENQUIRY_SELECT_COLUMNS} FROM enquiries WHERE dedupe_key = $1 LIMIT 1`,
      [dedupeKey]
    );

    if (existingResult.rows.length > 0) {
      const existingRow = existingResult.rows[0];
      const newCount = Number(existingRow.duplicate_resubmission_count || 0) + 1;
      await this.pool.query('UPDATE enquiries SET duplicate_resubmission_count = $1 WHERE id = $2', [newCount, existingRow.id]);
      const updatedRecord = rowToEnquiryRecord({ ...existingRow, duplicate_resubmission_count: newCount });
      return toEnquiryResponse(updatedRecord, true);
    }

    const id = `enq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const receivedAt = new Date().toISOString();
    await this.pool.query(
      'INSERT INTO enquiries (id, dedupe_key, name, email, phone, message, consent, vehicle_slug, destination_code, port_code, rate_status, currency, rate_effective_from, rate_effective_to, estimate_message, received_at, enquiry_type, source, duplicate_resubmission_count, preferred_make, preferred_model, preferred_drive_side, preferred_year, target_price_usd) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)',
      [
        id,
        dedupeKey,
        prepared.name,
        prepared.email,
        prepared.phone,
        prepared.message,
        prepared.consent,
        prepared.vehicleSlug || null,
        prepared.estimateSnapshot?.destinationCode || null,
        prepared.estimateSnapshot?.portCode || null,
        prepared.estimateSnapshot?.rateStatus || null,
        prepared.estimateSnapshot?.currency || null,
        prepared.estimateSnapshot?.rateEffectiveFrom || null,
        prepared.estimateSnapshot?.rateEffectiveTo || null,
        prepared.estimateSnapshot?.message || null,
        receivedAt,
        prepared.enquiryType,
        prepared.source,
        0,
        prepared.preferredMake || null,
        prepared.preferredModel || null,
        prepared.preferredDriveSide || null,
        prepared.preferredYear || null,
        prepared.targetPriceUsd || null,
      ]
    );

    const record: EnquiryRecord = { id, dedupeKey, receivedAt, duplicateResubmissionCount: 0, ...prepared };
    return toEnquiryResponse(record, false);
  }

  async getLeadById(id: string): Promise<LeadRecord | null> {
    const result = await this.pool.query(`${ENQUIRY_SELECT_COLUMNS} FROM enquiries WHERE id = $1 LIMIT 1`, [id]);
    const row = result.rows[0];
    return row ? toLeadRecord(rowToEnquiryRecord(row)) : null;
  }

  async listLeads(): Promise<LeadListResponse> {
    const result = await this.pool.query(`${ENQUIRY_SELECT_COLUMNS} FROM enquiries ORDER BY received_at ASC, id ASC`);
    const items = result.rows.map((row) => toLeadRecord(rowToEnquiryRecord(row)));
    return { items, total: items.length };
  }

  private static rowToReservationRecord(row: Record<string, unknown>): ReservationRecord {
    return {
      id: row.id as string,
      vehicleId: row.vehicle_id as string,
      vehicleSlug: row.vehicle_slug as string,
      customerId: row.customer_id as string,
      customerEmail: row.customer_email as string,
      createdAt: row.created_at as string,
      expiresAt: row.expires_at as string,
      holdHours: Number(row.hold_hours),
    };
  }

  private static readonly RESERVATION_LOCK_KEY = 872_364_501;

  async createReservation(
    customerId: string,
    customerEmail: string,
    request: ReservationRequest,
    nowISO: string = new Date().toISOString()
  ): Promise<ReservationResponse> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock($1)', [PostgresStore.RESERVATION_LOCK_KEY]);

      const rawVehicles = await this.getRawVehiclesWith(client);
      const vehicle = resolveReservationVehicle(rawVehicles, request);

      const existingResult = await client.query(
        'SELECT id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours FROM reservations WHERE vehicle_id = $1 OR customer_id = $2',
        [vehicle.id, customerId]
      );
      const existingReservations = existingResult.rows.map(PostgresStore.rowToReservationRecord);
      checkReservationEligibility(vehicle, existingReservations, customerId, nowISO);

      const expiresAt = new Date(new Date(nowISO).getTime() + RESERVATION_HOLD_HOURS * 60 * 60 * 1000).toISOString();
      const id = `res-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const vehicleSlug = generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id);
      await client.query(
        'INSERT INTO reservations (id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [id, vehicle.id, vehicleSlug, customerId, customerEmail, nowISO, expiresAt, RESERVATION_HOLD_HOURS]
      );
      await client.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['Reserved', vehicle.id]);

      await client.query('COMMIT');
      this.paymentRecords = seedPayments.map((payment) => ({ ...payment }));
      this.paymentNotifications = seedPaymentNotifications.map((notification) => ({ ...notification }));
      this.allocations = seedAllocations.map((allocation) => ({ ...allocation }));

      const record: ReservationRecord = { id, vehicleId: vehicle.id, vehicleSlug, customerId, customerEmail, createdAt: nowISO, expiresAt, holdHours: RESERVATION_HOLD_HOURS };
      return toReservationResponse(record, nowISO);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getReservationById(id: string): Promise<ReservationResponse | null> {
    const result = await this.pool.query(
      'SELECT id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours FROM reservations WHERE id = $1 LIMIT 1',
      [id]
    );
    const row = result.rows[0];
    return row ? toReservationResponse(PostgresStore.rowToReservationRecord(row), new Date().toISOString()) : null;
  }

  // Phase 1.7 Content methods for PostgresStore
  async getFaqs(query?: { category?: string; q?: string }): Promise<FaqQueryResponse> {
    const catResult = await this.pool.query('SELECT id, name, description, sort_order FROM faq_categories ORDER BY sort_order ASC');
    const itemResult = await this.pool.query('SELECT id, category_id, category_name, question, answer, slug, featured, sort_order, owner, status, updated_at FROM faq_items WHERE status = $1 ORDER BY sort_order ASC', ['approved']);

    const categories: FaqCategory[] = catResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      order: Number(row.sort_order),
    }));

    const items: FaqItem[] = itemResult.rows.map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      question: row.question,
      answer: row.answer,
      slug: row.slug,
      featured: Boolean(row.featured),
      order: Number(row.sort_order),
      owner: row.owner,
      status: row.status as ContentApprovalStatus,
      updatedAt: row.updated_at,
    }));

    return filterFaqs(items, categories, query);
  }

  async getTestimonials(): Promise<TestimonialListResponse> {
    const result = await this.pool.query('SELECT id, author_name, author_location, avatar_url, vehicle_purchased, rating, content, submitted_at, status, consent FROM testimonials WHERE status = $1 ORDER BY submitted_at DESC', ['approved']);
    const items: TestimonialItem[] = result.rows.map((row) => ({
      id: row.id,
      authorName: row.author_name,
      authorLocation: row.author_location,
      avatarUrl: row.avatar_url || undefined,
      vehiclePurchased: row.vehicle_purchased || undefined,
      rating: Number(row.rating),
      content: row.content,
      submittedAt: row.submitted_at,
      status: row.status as ContentApprovalStatus,
      consent: Boolean(row.consent),
    }));
    return { items, total: items.length };
  }

  async submitTestimonial(request: TestimonialSubmissionRequest): Promise<TestimonialSubmissionResponse> {
    validateTestimonialSubmission(request);
    const submittedAt = new Date().toISOString();
    const id = `testim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.pool.query(
      'INSERT INTO testimonials (id, author_name, author_location, avatar_url, vehicle_purchased, rating, content, submitted_at, status, consent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        id,
        request.authorName.trim(),
        request.authorLocation.trim(),
        null,
        request.vehiclePurchased?.trim() || null,
        Number(request.rating),
        request.content.trim(),
        submittedAt,
        'pending',
        request.consent,
      ]
    );
    return {
      id,
      status: 'pending',
      submittedAt,
      message: 'Testimonial submitted successfully and is pending review.',
    };
  }

  async getContentPages(): Promise<PublicContentPage[]> {
    const result = await this.pool.query('SELECT slug, title, summary, body, owner, status, updated_at, sections, metadata FROM content_pages WHERE status = $1 ORDER BY slug ASC', ['approved']);
    return result.rows.map((row) => ({
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      body: row.body,
      owner: row.owner,
      status: row.status as ContentApprovalStatus,
      updatedAt: row.updated_at,
      sections: row.sections ? JSON.parse(row.sections) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  async getContentPageBySlug(slug: string): Promise<PublicContentPage | null> {
    const result = await this.pool.query('SELECT slug, title, summary, body, owner, status, updated_at, sections, metadata FROM content_pages WHERE slug = $1 AND status = $2 LIMIT 1', [slug, 'approved']);
    const row = result.rows[0];
    if (!row) return null;
    return {
      slug: row.slug,
      title: row.title,
      summary: row.summary,
      body: row.body,
      owner: row.owner,
      status: row.status as ContentApprovalStatus,
      updatedAt: row.updated_at,
      sections: row.sections ? JSON.parse(row.sections) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  async getOffices(): Promise<OfficeListResponse> {
    const result = await this.pool.query('SELECT id, name, city, country, address, phone, email, operating_hours, is_primary, status FROM office_locations WHERE status = $1 ORDER BY id ASC', ['approved']);
    const items: OfficeLocation[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      country: row.country,
      address: row.address,
      phone: row.phone,
      email: row.email,
      operatingHours: row.operating_hours,
      isPrimary: Boolean(row.is_primary),
      status: row.status as ContentApprovalStatus,
    }));
    return { items, total: items.length };
  }

  async getBranches(): Promise<BranchListResponse> {
    const result = await this.pool.query('SELECT id, name, code, destination_port, introduction, welcome_banner, contact_banner, team_members, meet_and_greet_info, contact_details, content_owner, status, latest_arrivals_query, recently_discounted_query FROM branch_content WHERE status = $1 ORDER BY id ASC', ['approved']);
    const items: BranchContent[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      destinationPort: row.destination_port,
      introduction: row.introduction,
      welcomeBanner: row.welcome_banner,
      contactBanner: row.contact_banner,
      teamMembers: JSON.parse(row.team_members),
      meetAndGreetInfo: row.meet_and_greet_info,
      contactDetails: JSON.parse(row.contact_details),
      contentOwner: row.content_owner,
      status: row.status as ContentApprovalStatus,
      latestArrivalsQuery: row.latest_arrivals_query ? JSON.parse(row.latest_arrivals_query) : undefined,
      recentlyDiscountedQuery: row.recently_discounted_query ? JSON.parse(row.recently_discounted_query) : undefined,
    }));
    return { items, total: items.length };
  }

  async getBranchById(id: string): Promise<BranchContent | null> {
    const result = await this.pool.query('SELECT id, name, code, destination_port, introduction, welcome_banner, contact_banner, team_members, meet_and_greet_info, contact_details, content_owner, status, latest_arrivals_query, recently_discounted_query FROM branch_content WHERE (id = $1 OR code = $1) AND status = $2 LIMIT 1', [id, 'approved']);
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      destinationPort: row.destination_port,
      introduction: row.introduction,
      welcomeBanner: row.welcome_banner,
      contactBanner: row.contact_banner,
      teamMembers: JSON.parse(row.team_members),
      meetAndGreetInfo: row.meet_and_greet_info,
      contactDetails: JSON.parse(row.contact_details),
      contentOwner: row.content_owner,
      status: row.status as ContentApprovalStatus,
      latestArrivalsQuery: row.latest_arrivals_query ? JSON.parse(row.latest_arrivals_query) : undefined,
      recentlyDiscountedQuery: row.recently_discounted_query ? JSON.parse(row.recently_discounted_query) : undefined,
    };
  }

  async getCustomerDashboard(customerId: string, customerEmail: string): Promise<CustomerDashboard> {
    // For PostgresStore, use the seed data like MemoryStore until database tables are added
    // Outstanding balance = sum of issued invoices - sum of approved allocations (D02-ASM-001)
    const customerInvoices = seedInvoices.filter((i) => i.customerId === customerId && i.status === 'Issued');
    const totalIssuedAmount = customerInvoices.reduce((sum, inv) => sum + inv.totalAmountUsd, 0);

    const customerAllocations = seedAllocations.filter((a) => a.customerId === customerId && a.status === 'Approved');
    const totalApprovedAmount = customerAllocations.reduce((sum, alloc) => sum + alloc.amountUsd, 0);

    const outstandingBalanceUsd = Math.max(0, totalIssuedAmount - totalApprovedAmount);

    // Credit utilisation = outstanding balance / credit limit
    const creditLimitUsd = 500000.00; // Mock credit limit
    const creditUtilisationPercent = (outstandingBalanceUsd / creditLimitUsd) * 100;

    // Vehicle counts use canonical vehicle IDs and current server status
    const vehicles = await this.getRawVehicles();

    // Get reservations for this customer
    const reservationResult = await this.pool.query(
      'SELECT vehicle_id, customer_id, expires_at FROM reservations WHERE customer_id = $1 ORDER BY id',
      [customerId]
    );
    const reservedVehicleIds = new Set<string>();
    for (const row of reservationResult.rows) {
      const isActive = new Date(row.expires_at).getTime() > new Date().getTime();
      if (isActive) {
        reservedVehicleIds.add(row.vehicle_id);
      }
    }

    const invoicedVehicleIds = new Set(customerInvoices.map((i) => i.vehicleId));

    // Count delivered vehicles (those invoiced and with Sold status)
    const deliveredVehicleIds = new Set(
      customerInvoices
        .filter((i) => {
          const vehicle = vehicles.find((v) => v.id === i.vehicleId);
          return vehicle && vehicle.status === 'Sold';
        })
        .map((i) => i.vehicleId)
    );

    // Compute linked record aggregates from seed data (D02-P02-T001)
    // Payment status summary: count payments by status for this customer's invoices
    const customerInvoiceIds = new Set(customerInvoices.map((i) => i.id));
    const customerPayments = seedPayments.filter((p) => p.customerId === customerId && customerInvoiceIds.has(p.invoiceId));
    const paymentStatusSummary = {
      approved: customerPayments.filter((p) => p.status === 'Approved').length,
      pending: customerPayments.filter((p) => p.status === 'Pending').length,
      rejected: customerPayments.filter((p) => p.status === 'Rejected').length,
    };

    // Shipment status summary: count shipments by status for this customer's vehicles
    const customerVehicleIds = new Set(customerInvoices.map((i) => i.vehicleId));
    const customerShipments = seedShipments.filter((s) => s.customerId === customerId && customerVehicleIds.has(s.vehicleId));
    const shipmentStatusSummary = {
      ready: customerShipments.filter((s) => s.status === 'Ready').length,
      inTransit: customerShipments.filter((s) => s.status === 'InTransit').length,
      delivered: customerShipments.filter((s) => s.status === 'Delivered').length,
      other: customerShipments.filter((s) => !['Ready', 'InTransit', 'Delivered'].includes(s.status)).length,
    };

    // Document availability: count documents by status for this customer's shipments/vehicles
    const customerShipmentIds = new Set(customerShipments.map((s) => s.id));
    const customerDocuments = seedDocuments.filter((d) => d.customerId === customerId && (customerShipmentIds.has(d.shipmentId || '') || customerVehicleIds.has(d.vehicleId || '')));
    const documentAvailabilityCount = {
      available: customerDocuments.filter((d) => d.status === 'Available').length,
      pending: customerDocuments.filter((d) => d.status === 'Pending').length,
      unavailable: customerDocuments.filter((d) => d.status === 'Unavailable').length,
    };

    // Notification unread count for this customer
    const notificationUnreadCount = seedNotifications.filter((n) => n.customerId === customerId && !n.isRead).length;

    // Partial failure indicators: all set to false since this is seed data (no actual failures)
    const partialFailureIndicators = {
      paymentsFailed: false,
      shipmentsFailed: false,
      documentsFailed: false,
      notificationsFailed: false,
    };

    return {
      customerId,
      customerEmail,
      creditLimitUsd,
      outstandingBalanceUsd,
      creditUtilisationPercent: Math.round(creditUtilisationPercent * 10) / 10,
      vehicleCountReserved: reservedVehicleIds.size,
      vehicleCountInvoiced: invoicedVehicleIds.size,
      vehicleCountDelivered: deliveredVehicleIds.size,
      lastUpdated: new Date().toISOString(),
      paymentStatusSummary,
      shipmentStatusSummary,
      documentAvailabilityCount,
      notificationUnreadCount,
      partialFailureIndicators,
    };
  }

  async getCustomerVehicles(customerId: string, query?: ListCustomerVehiclesQuery, nowISO?: string): Promise<CustomerVehicleListResponse> {
    const vehicles = await this.getRawVehicles();
    const reservations = await this.getRawReservations();
    const all = buildCustomerVehicleProjections(
      customerId,
      vehicles,
      reservations,
      seedProformaInvoices,
      seedInvoices,
      seedAllocations,
      seedShipments,
      seedDocuments,
      nowISO || new Date().toISOString()
    );
    return queryCustomerVehicles(all, query);
  }

  async getCustomerVehicleById(customerId: string, idOrSlug: string, nowISO?: string): Promise<CustomerVehicleDetail | null> {
    const vehicles = await this.getRawVehicles();
    const reservations = await this.getRawReservations();
    const all = buildCustomerVehicleProjections(
      customerId,
      vehicles,
      reservations,
      seedProformaInvoices,
      seedInvoices,
      seedAllocations,
      seedShipments,
      seedDocuments,
      nowISO || new Date().toISOString()
    );
    const target = all.find((v) => v.id === idOrSlug || v.vehicleId === idOrSlug || v.slug === idOrSlug);
    return target || null;
  }

  async listCustomerShipments(customerId: string): Promise<CustomerShipment[]> {
    return seedShipments
      .filter((shipment) => shipment.customerId === customerId)
      .map(toCustomerShipment);
  }

  async getCustomerShipment(customerId: string, shipmentId: string): Promise<CustomerShipment | null> {
    const shipment = seedShipments.find((candidate) => candidate.id === shipmentId && candidate.customerId === customerId);
    return shipment ? toCustomerShipment(shipment) : null;
  }

  async listCustomerDocuments(customerId: string): Promise<CustomerDocument[]> {
    const customerShipmentIds = new Set(seedShipments
      .filter((shipment) => shipment.customerId === customerId)
      .map((shipment) => shipment.id));
    return seedDocuments
      .filter((document) => document.customerId === customerId
        && document.releaseApproved === true
        && document.visibleToCustomer === true
        && (!document.shipmentId || customerShipmentIds.has(document.shipmentId)))
      .map(toCustomerDocument);
  }

  async getCustomerDocument(customerId: string, documentId: string): Promise<CustomerDocument | null> {
    const document = seedDocuments.find((candidate) => candidate.id === documentId && candidate.customerId === customerId);
    if (!document || document.releaseApproved !== true || document.visibleToCustomer !== true) return null;
    return toCustomerDocument(document);
  }

  async listCustomerNotifications(customerId: string, query?: { status?: 'all' | 'read' | 'unread'; q?: string }): Promise<CustomerNotificationListResponse> {
    return queryCustomerNotifications(this.notifications.filter((notification) => notification.customerId === customerId), query);
  }

  async getCustomerNotification(customerId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.find((candidate) => candidate.customerId === customerId && candidate.id === notificationId);
    return notification ? toCustomerNotification(notification) : null;
  }

  async markCustomerNotificationRead(customerId: string, notificationId: string): Promise<Notification | null> {
    const notification = this.notifications.find((candidate) => candidate.customerId === customerId && candidate.id === notificationId);
    if (notification) notification.isRead = true;
    return notification ? toCustomerNotification(notification) : null;
  }

  async markAllCustomerNotificationsRead(customerId: string): Promise<MarkNotificationsReadResponse> {
    const owned = this.notifications.filter((notification) => notification.customerId === customerId);
    const updatedCount = owned.filter((notification) => !notification.isRead).length;
    owned.forEach((notification) => { notification.isRead = true; });
    return { updatedCount, unreadCount: 0 };
  }

  async getCustomerProfile(customerId: string, email: string): Promise<CustomerProfile> {
    const profile = this.customerProfiles.find((candidate) => candidate.customerId === customerId);
    if (!profile) throw new Error('Customer profile not found');
    return toCustomerProfile(profile, email);
  }

  async updateCustomerProfile(customerId: string, email: string, request: UpdateCustomerProfileRequest, nowISO = new Date().toISOString()): Promise<CustomerProfile> {
    validateCustomerProfileRequest(request);
    const profile = this.customerProfiles.find((candidate) => candidate.customerId === customerId);
    if (!profile) throw new Error('Customer profile not found');
    if (request.expectedVersion !== undefined && request.expectedVersion !== profile.version) throw new ProfileConflictError();
    profile.companyName = request.companyName.trim();
    profile.phone = request.phone.trim();
    profile.deliveryAddress = request.deliveryAddress.trim();
    profile.version += 1;
    profile.updatedAt = nowISO;
    return toCustomerProfile(profile, email);
  }

  async getCustomerInvoices(customerId: string, query?: ListCustomerInvoicesQuery, nowISO?: string): Promise<CustomerInvoiceListResponse> {
    const vehicles = await this.getRawVehicles();
    const all = buildCustomerInvoiceProjections(
      customerId,
      seedInvoices,
      seedProformaInvoices,
      seedAllocations,
      vehicles,
      seedDocuments,
      nowISO || new Date().toISOString()
    );
    return queryCustomerInvoices(all, query);
  }

  async getCustomerInvoiceById(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDetail | null> {
    const vehicles = await this.getRawVehicles();
    const all = buildCustomerInvoiceProjections(
      customerId,
      seedInvoices,
      seedProformaInvoices,
      seedAllocations,
      vehicles,
      seedDocuments,
      nowISO || new Date().toISOString()
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    return target || null;
  }

  async getCustomerInvoiceDocument(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDocument | null> {
    const vehicles = await this.getRawVehicles();
    const all = buildCustomerInvoiceProjections(
      customerId,
      seedInvoices,
      seedProformaInvoices,
      seedAllocations,
      vehicles,
      seedDocuments,
      nowISO || new Date().toISOString()
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    if (!target) return null;
    return buildCustomerInvoiceDocument(target);
  }

  async listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse> {
    const items = this.paymentRecords.filter((payment) => payment.customerId === customerId).map((payment) => toCustomerPayment(payment, seedInvoices, this.allocations));
    return { items, total: items.length };
  }

  async getCustomerPayment(customerId: string, id: string): Promise<CustomerPayment | null> {
    const payment = this.paymentRecords.find((candidate) => candidate.customerId === customerId && candidate.id === id);
    return payment ? toCustomerPayment(payment, seedInvoices, this.allocations) : null;
  }

  async createCustomerPayment(customerId: string, request: CreateCustomerPaymentRequest, nowISO = new Date().toISOString()): Promise<CustomerPayment> {
    return toCustomerPayment(createPaymentRecord(customerId, request, nowISO, this.paymentRecords, seedInvoices), seedInvoices, this.allocations);
  }

  async resubmitCustomerPayment(customerId: string, paymentId: string, nowISO = new Date().toISOString()): Promise<CustomerPayment> {
    const payment = this.paymentRecords.find((candidate) => candidate.id === paymentId && candidate.customerId === customerId);
    if (!payment) throw new PaymentWorkflowError(404, 'Payment not found or not owned by customer');
    applyPaymentNotification(payment, { event: 'PaymentResubmitted' }, this.paymentNotifications, this.allocations, nowISO);
    return toCustomerPayment(payment, seedInvoices, this.allocations);
  }

  async listCustomerPaymentNotifications(customerId: string, paymentId?: string): Promise<CustomerPaymentNotificationListResponse> {
    const items = this.paymentNotifications
      .filter((notification) => notification.customerId === customerId && (!paymentId || notification.paymentId === paymentId))
      .map(toCustomerPaymentNotification);
    return { items, total: items.length };
  }

  async recordPaymentNotification(paymentId: string, request: RecordPaymentNotificationRequest, nowISO = new Date().toISOString()): Promise<CustomerPaymentNotification | null> {
    const payment = this.paymentRecords.find((candidate) => candidate.id === paymentId);
    if (!payment) return null;
    return toCustomerPaymentNotification(applyPaymentNotification(payment, request, this.paymentNotifications, this.allocations, nowISO));
  }

  private static rowToCustomerAccountRecord(row: {
    id: string;
    customer_id: string;
    name_with_initials: string;
    country_code: string;
    dial_code: string;
    mobile_number: string;
    email: string;
    password_hash: string;
    password_salt: string;
    status: string;
    verification_state: string;
    created_at: string;
    updated_at: string;
    password_updated_at: string;
  }): CustomerAccountRecord {
    return {
      id: row.id,
      customerId: row.customer_id,
      nameWithInitials: row.name_with_initials,
      countryCode: row.country_code,
      dialCode: row.dial_code,
      mobileNumber: row.mobile_number,
      email: row.email,
      passwordHash: row.password_hash,
      passwordSalt: row.password_salt,
      status: row.status as CustomerAccountRecord['status'],
      verificationState: row.verification_state as CustomerAccountRecord['verificationState'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      passwordUpdatedAt: row.password_updated_at,
    };
  }

  async registerCustomerAccount(request: RegisterCustomerRequest, nowISO: string = new Date().toISOString()): Promise<CustomerAccountProjection> {
    const validated = validateRegisterCustomerRequest(request, COUNTRIES);
    const existing = await this.pool.query('SELECT id FROM customer_accounts WHERE lower(email) = $1 LIMIT 1', [validated.email]);
    if (existing.rows.length > 0) {
      throw new AccountRequestError(409, 'An account with this email already exists', 'email');
    }
    const { hash, salt } = hashPassword(validated.password);
    const id = generateAccountId();
    const customerId = generateCustomerId();
    await this.pool.query(
      `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [id, customerId, validated.nameWithInitials, validated.countryCode, validated.dialCode, validated.mobileNumber, validated.email, hash, salt, 'active', 'unverified', nowISO, nowISO, nowISO]
    );
    this.customerProfiles.push({
      customerId,
      companyName: '',
      phone: '',
      deliveryAddress: '',
      version: 1,
      updatedAt: nowISO,
    });
    return toCustomerAccountProjection({
      id,
      customerId,
      nameWithInitials: validated.nameWithInitials,
      countryCode: validated.countryCode,
      dialCode: validated.dialCode,
      mobileNumber: validated.mobileNumber,
      email: validated.email,
      passwordHash: hash,
      passwordSalt: salt,
      status: 'active',
      verificationState: 'unverified',
      createdAt: nowISO,
      updatedAt: nowISO,
      passwordUpdatedAt: nowISO,
    });
  }

  async authenticateCustomer(request: LoginRequest): Promise<CustomerAccountProjection> {
    const email = normalizeEmail(request?.email);
    const password = typeof request?.password === 'string' ? request.password : '';
    const result = await this.pool.query('SELECT * FROM customer_accounts WHERE lower(email) = $1 LIMIT 1', [email]);
    const row = result.rows[0];
    if (!row) {
      verifyPassword(password, DUMMY_PASSWORD_DERIVATION.hash, DUMMY_PASSWORD_DERIVATION.salt);
      throw new AuthenticationError();
    }
    const record = PostgresStore.rowToCustomerAccountRecord(row);
    if (!verifyPassword(password, record.passwordHash, record.passwordSalt)) {
      throw new AuthenticationError();
    }
    return toCustomerAccountProjection(record);
  }

  async changeCustomerPassword(customerId: string, request: ChangePasswordRequest, nowISO: string = new Date().toISOString()): Promise<void> {
    const result = await this.pool.query('SELECT * FROM customer_accounts WHERE customer_id = $1 LIMIT 1', [customerId]);
    const row = result.rows[0];
    if (!row) {
      throw new AuthenticationError('Current password is incorrect');
    }
    const record = PostgresStore.rowToCustomerAccountRecord(row);
    const currentPassword = typeof request?.currentPassword === 'string' ? request.currentPassword : '';
    if (!verifyPassword(currentPassword, record.passwordHash, record.passwordSalt)) {
      throw new AuthenticationError('Current password is incorrect');
    }
    const newPassword = typeof request?.newPassword === 'string' ? request.newPassword : '';
    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      throw new AccountRequestError(400, policyError, 'newPassword');
    }
    const confirmNewPassword = typeof request?.confirmNewPassword === 'string' ? request.confirmNewPassword : '';
    if (newPassword !== confirmNewPassword) {
      throw new AccountRequestError(400, 'Passwords do not match', 'confirmNewPassword');
    }
    const { hash, salt } = hashPassword(newPassword);
    await this.pool.query(
      'UPDATE customer_accounts SET password_hash = $1, password_salt = $2, password_updated_at = $3, updated_at = $3 WHERE customer_id = $4',
      [hash, salt, nowISO, customerId]
    );
  }

  async requestPasswordReset(request: PasswordResetRequest, nowISO: string = new Date().toISOString()): Promise<void> {
    const email = normalizeEmail(request?.email);
    const result = await this.pool.query('SELECT email FROM customer_accounts WHERE lower(email) = $1 LIMIT 1', [email]);
    if (result.rows.length === 0) return;
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(new Date(nowISO).getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();
    await this.pool.query('INSERT INTO password_reset_outbox (token, email, issued_at, expires_at, consumed) VALUES ($1,$2,$3,$4,$5)', [token, email, nowISO, expiresAt, false]);
  }

  async confirmPasswordReset(request: ConfirmPasswordResetRequest, nowISO: string = new Date().toISOString()): Promise<void> {
    const token = typeof request?.token === 'string' ? request.token : '';
    const result = await this.pool.query('SELECT * FROM password_reset_outbox WHERE token = $1 LIMIT 1', [token]);
    const row = result.rows[0];
    if (!row) {
      throw new AccountRequestError(400, 'Invalid or expired reset token', 'token');
    }
    if (row.consumed) {
      throw new AccountRequestError(400, 'Reset token has already been used', 'token');
    }
    if (new Date(row.expires_at).getTime() <= new Date(nowISO).getTime()) {
      throw new AccountRequestError(400, 'Reset token has expired', 'token');
    }

    const newPassword = typeof request?.newPassword === 'string' ? request.newPassword : '';
    const policyError = validatePasswordPolicy(newPassword);
    if (policyError) {
      throw new AccountRequestError(400, policyError, 'newPassword');
    }
    const confirmNewPassword = typeof request?.confirmNewPassword === 'string' ? request.confirmNewPassword : '';
    if (newPassword !== confirmNewPassword) {
      throw new AccountRequestError(400, 'Passwords do not match', 'confirmNewPassword');
    }

    const { hash, salt } = hashPassword(newPassword);
    await this.pool.query(
      'UPDATE customer_accounts SET password_hash = $1, password_salt = $2, password_updated_at = $3, updated_at = $3 WHERE lower(email) = $4',
      [hash, salt, nowISO, row.email]
    );
    await this.pool.query('UPDATE password_reset_outbox SET consumed = true WHERE token = $1', [token]);
  }

  async listPasswordResetOutbox(): Promise<PasswordResetOutboxRecord[]> {
    const result = await this.pool.query('SELECT token, email, issued_at, expires_at, consumed FROM password_reset_outbox ORDER BY issued_at ASC');
    return result.rows.map((row) => ({
      token: row.token,
      email: row.email,
      issuedAt: row.issued_at,
      expiresAt: row.expires_at,
      consumed: Boolean(row.consumed),
    }));
  }

  async getCountries(): Promise<CountriesResponse> {
    return { items: COUNTRIES.map((c) => ({ ...c })) };
  }

  async reset(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM vehicles');
      await client.query('DELETE FROM public_config');
      await client.query('DELETE FROM enquiries');
      await client.query('DELETE FROM reservations');
      await client.query('DELETE FROM faq_categories');
      await client.query('DELETE FROM faq_items');
      await client.query('DELETE FROM testimonials');
      await client.query('DELETE FROM content_pages');
      await client.query('DELETE FROM office_locations');
      await client.query('DELETE FROM branch_content');
      await client.query('DELETE FROM password_reset_outbox');
      await client.query('DELETE FROM customer_accounts');

      const seedAccount = buildSeedCustomerAccount();
      await client.query(
        `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          seedAccount.id,
          seedAccount.customerId,
          seedAccount.nameWithInitials,
          seedAccount.countryCode,
          seedAccount.dialCode,
          seedAccount.mobileNumber,
          seedAccount.email,
          seedAccount.passwordHash,
          seedAccount.passwordSalt,
          seedAccount.status,
          seedAccount.verificationState,
          seedAccount.createdAt,
          seedAccount.updatedAt,
          seedAccount.passwordUpdatedAt,
        ]
      );

      await client.query('INSERT INTO public_config (id, site_name, currency, contact_phone) VALUES (1, $1, $2, $3)', [
        seedConfig.siteName,
        seedConfig.currency,
        seedConfig.contactPhone,
      ]);
      for (const vehicle of seedVehicles) {
        await client.query(
          'INSERT INTO vehicles (id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, internal_notes, staff_owner_id, body_style, fuel_type, transmission, drive_train, mileage, etd, eta, request_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)',
          [
            vehicle.id,
            vehicle.chassisNumber,
            vehicle.make,
            vehicle.model,
            vehicle.year,
            vehicle.priceUsd,
            vehicle.status,
            vehicle.category || null,
            vehicle.locationStatus || null,
            vehicle.createdAt || null,
            vehicle.images ? JSON.stringify(vehicle.images) : null,
            vehicle.featured ?? false,
            vehicle.stockType || null,
            vehicle.destinationPort || null,
            vehicle.discountPercent || null,
            vehicle.internalNotes || null,
            vehicle.staffOwnerId || null,
            vehicle.bodyStyle || null,
            vehicle.fuelType || null,
            vehicle.transmission || null,
            vehicle.driveTrain || null,
            vehicle.mileage || null,
            vehicle.etd || null,
            vehicle.eta || null,
            vehicle.requestPrice ?? false,
          ]
        );
      }
      for (const res of seedReservations) {
        await client.query(
          'INSERT INTO reservations (id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [res.id, res.vehicleId, res.vehicleSlug, res.customerId, res.customerEmail, res.createdAt, res.expiresAt, res.holdHours]
        );
      }
      for (const cat of seedFaqCategories) {
        await client.query('INSERT INTO faq_categories (id, name, description, sort_order) VALUES ($1, $2, $3, $4)', [cat.id, cat.name, cat.description || null, cat.order]);
      }
      for (const item of seedFaqItems) {
        await client.query('INSERT INTO faq_items (id, category_id, category_name, question, answer, slug, featured, sort_order, owner, status, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [item.id, item.categoryId, item.categoryName, item.question, item.answer, item.slug, item.featured ?? false, item.order || 1, item.owner, item.status, item.updatedAt]);
      }
      for (const testim of seedTestimonials) {
        await client.query('INSERT INTO testimonials (id, author_name, author_location, avatar_url, vehicle_purchased, rating, content, submitted_at, status, consent) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [testim.id, testim.authorName, testim.authorLocation, testim.avatarUrl || null, testim.vehiclePurchased || null, testim.rating, testim.content, testim.submittedAt, testim.status, testim.consent]);
      }
      for (const page of seedPublicContentPages) {
        await client.query('INSERT INTO content_pages (slug, title, summary, body, owner, status, updated_at, sections, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [page.slug, page.title, page.summary, page.body, page.owner, page.status, page.updatedAt, page.sections ? JSON.stringify(page.sections) : null, page.metadata ? JSON.stringify(page.metadata) : null]);
      }
      for (const office of seedOfficeLocations) {
        await client.query('INSERT INTO office_locations (id, name, city, country, address, phone, email, operating_hours, is_primary, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [office.id, office.name, office.city, office.country, office.address, office.phone, office.email, office.operatingHours, office.isPrimary, office.status]);
      }
      for (const branch of seedBranches) {
        await client.query('INSERT INTO branch_content (id, name, code, destination_port, introduction, welcome_banner, contact_banner, team_members, meet_and_greet_info, contact_details, content_owner, status, latest_arrivals_query, recently_discounted_query) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)', [branch.id, branch.name, branch.code, branch.destinationPort, branch.introduction, branch.welcomeBanner, branch.contactBanner, JSON.stringify(branch.teamMembers), branch.meetAndGreetInfo, JSON.stringify(branch.contactDetails), branch.contentOwner, branch.status, branch.latestArrivalsQuery ? JSON.stringify(branch.latestArrivalsQuery) : null, branch.recentlyDiscountedQuery ? JSON.stringify(branch.recentlyDiscountedQuery) : null]);
      }

      await client.query('COMMIT');
      this.notifications = seedNotifications.map((notification) => ({ ...notification }));
      this.customerProfiles = seedCustomerProfiles.map((profile) => ({ ...profile }));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createStore(connectionString = process.env.DATABASE_URL): DemoStore {
  return connectionString ? new PostgresStore(connectionString) : new MemoryStore();
}
