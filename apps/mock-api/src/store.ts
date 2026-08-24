import { Pool, PoolClient } from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type {
  VehicleDomainSummary,
  VehicleStatus,
  VehicleSearchResult,
  VehicleFacets,
  FeatureFacet,
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
  CustomerInquirySummary,
  CustomerInquiryListResponse,
  WishlistItem,
  WishlistListResponse,
  WishlistToggleRequest,
  WishlistToggleResponse,
  FavouriteSearchCriteria,
  FavouriteSearch,
  FavouriteSearchListResponse,
  FavouriteSearchFacets,
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
  CustomerCommercialBillInfo,
  CustomerVehiclePaymentStatus,
  CustomerVehicleSummary,
  CustomerVehicleDetail,
  CustomerVehicleCountsByStatus,
  CustomerVehicleListResponse,
  VehicleStatusDefinition,
  ListCustomerVehiclesQuery,
  CustomerInvoiceType,
  CustomerInvoiceStatus,
  CustomerInvoiceAllocationItem,
  CustomerInvoiceSummary,
  CustomerInvoiceDetail,
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
  CustomerPaymentAllocationSummary,
  CustomerPaymentAllocationListResponse,
  ListCustomerPaymentAllocationsQuery,
  Notification,
  CustomerNotificationListResponse,
  MarkNotificationsReadResponse,
  CustomerProfile,
  UpdateCustomerProfileRequest,
  CustomerStatementEntry,
  CustomerStatementSummary,
  CustomerPolymorphicInquiry,
  CustomerPolymorphicInquiryListResponse,
  BankAccount,
} from '@carchief/domain';
import {
  generateVehicleSlug,
  calculateFreightEstimate,
  resolveFreightRateStatus,
  calculateTierPricing,
  calculateVehicleDeposit,
  ENQUIRY_TYPES,
  ENQUIRY_SOURCES,
  ENQUIRY_PREFERRED_DRIVE_SIDES,
  RESERVATION_HOLD_HOURS,
  RESERVABLE_VEHICLE_STATUSES,
  COUNTRIES,
  VehicleComplianceEvaluation,
  evaluateVehicleCompliance,
  isVehicleCompliantForCountry,
  normalizeCountryCode,
  CustomerTierRule,
  CustomerTierBenefits,
} from '@carchief/domain';
import { statementSeedRows } from './statement-seed.js';
export { FreightRequestError, resolveFreightRateStatus } from '@carchief/domain';


export interface VehicleRecord {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  modelCode?: string;
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
  stockNumber?: string;
  spec?: string;
  logisticsStatus?: string;
}

/** Reference values are canonicalized once at the persistence boundary. */
function normalizeReferenceKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function canonicalReferenceValue(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.trim().replace(/\s+/g, ' ');
}

const vehicleReferenceTables = {
  make: 'vehicle_makes',
  model: 'vehicle_models',
  bodyStyle: 'vehicle_body_styles',
  vehicleSubType: 'vehicle_sub_types',
  fuelType: 'vehicle_fuel_types',
  transmission: 'vehicle_transmissions',
  driveTrain: 'vehicle_drive_trains',
  overdrive: 'vehicle_overdrives',
  color: 'vehicle_colors',
  exteriorGrade: 'vehicle_exterior_grades',
  steering: 'vehicle_steering_types',
  stockCountry: 'vehicle_stock_countries',
  stockLocation: 'vehicle_stock_locations',
  destinationPort: 'vehicle_destination_ports',
} as const;

type VehicleReferenceKind = keyof typeof vehicleReferenceTables;

function canonicalizeVehicle(vehicle: VehicleRecord): VehicleRecord {
  return {
    ...vehicle,
    make: canonicalReferenceValue(vehicle.make) || vehicle.make,
    model: canonicalReferenceValue(vehicle.model) || vehicle.model,
    bodyStyle: canonicalReferenceValue(vehicle.bodyStyle),
    vehicleSubType: canonicalReferenceValue(vehicle.vehicleSubType),
    fuelType: canonicalReferenceValue(vehicle.fuelType),
    transmission: canonicalReferenceValue(vehicle.transmission),
    driveTrain: canonicalReferenceValue(vehicle.driveTrain),
    overdrive: canonicalReferenceValue(vehicle.overdrive),
    color: canonicalReferenceValue(vehicle.color),
    exteriorGrade: canonicalReferenceValue(vehicle.exteriorGrade),
    steering: canonicalReferenceValue(vehicle.steering),
    stockCountry: canonicalReferenceValue(vehicle.stockCountry),
    stockLocation: canonicalReferenceValue(vehicle.stockLocation),
    destinationPort: canonicalReferenceValue(vehicle.destinationPort),
    category: vehicle.category?.split(',').map((value) => canonicalReferenceValue(value) || '').filter(Boolean).join(','),
  };
}

interface VehicleFeatureCatalogEntry {
  key: string;
  label: string;
  sortOrder: number;
  active: boolean;
}

const vehicleFeatureCatalog: VehicleFeatureCatalogEntry[] = [
  ['airbag', 'Airbag'], ['airConditioning', 'Air Conditioning'], ['nonSmoker', 'Non-Smoker'],
  ['powerWindow', 'Power Window'], ['oneOwner', 'One Owner'], ['abs', 'ABS'],
  ['alloyWheels', 'Alloy Wheels'], ['backCamera', 'Back Camera'], ['navigation', 'Navigation'],
  ['sunRoof', 'Sun Roof'], ['leatherSeat', 'Leather Seat'], ['turbo', 'Turbo'],
  ['cdPlayer', 'CD Player'], ['radio', 'Radio'], ['cdChanger', 'CD Changer'],
  ['dvd', 'DVD'], ['tv', 'TV'], ['powerSeat', 'Power Seat'], ['frontCamera', 'Front Camera'],
  ['centralLocking', 'Central Locking'], ['keylessEntry', 'Keyless Entry'], ['pushStart', 'Push Start'],
  ['sideSkirts', 'Side Skirts'], ['grillGuard', 'Grill Guard'], ['rearCamera', 'Rear Camera'],
  ['esc', 'ESC'], ['spareTire', 'Spare Tire'], ['wheelSpanner', 'Wheel Spanner'], ['bodyKit', 'Body Kit'],
  ['fogLights', 'Fog Lights'], ['rearSpoiler', 'Rear Spoiler'], ['powerSteering', 'Power Steering'],
].map(([key, label], index) => ({ key, label, sortOrder: index + 1, active: true }));

export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
  tierDescriptions?: Partial<Record<'Platinum' | 'Gold' | 'Silver' | 'Standard', string>>;
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
  destinationCountry?: string;
}

const seedConfig: PublicConfig = {
  siteName: 'CarChief',
  currency: 'USD',
  contactPhone: '+256 700 000 000',
  tierDescriptions: {
    Platinum: 'Your verified account receives a 15% VIP discount on fixed-price export stock.',
    Gold: 'Your verified account receives a 10% VIP discount on fixed-price export stock.',
    Silver: 'Your verified account receives a 5% VIP discount on fixed-price export stock.',
    Standard: 'Standard export inventory pricing with real-time stock allocation and 48-hour reservation holds.',
  },
};

// Seed data for the database-backed customer benefit rules. These values are
// inserted into customer_tier_rules during mock reset/initialisation; runtime
// pricing and reservation enforcement always read the persisted rule.
const seedTierRules: CustomerTierRule[] = [
  { tier: 'Standard', discountPercent: 0, maxActiveReservations: 1, description: 'Standard export inventory pricing with real-time stock allocation and 48-hour reservation holds.', active: true },
  { tier: 'Silver', discountPercent: 5, maxActiveReservations: 2, description: 'Your verified account receives a 5% VIP discount on fixed-price export stock with up to 2 active reservation holds.', active: true },
  { tier: 'Gold', discountPercent: 10, maxActiveReservations: 3, description: 'Your verified account receives a 10% VIP discount on fixed-price export stock with up to 3 active reservation holds.', active: true },
  { tier: 'Platinum', discountPercent: 15, maxActiveReservations: 5, description: 'Your verified account receives a 15% VIP discount on fixed-price export stock with up to 5 active reservation holds.', active: true },
];

// Vehicle status codes remain stable business values; customer-facing labels
// are maintained in this catalogue and are persisted by the PostgreSQL store.
export const seedVehicleStatusDefinitions: VehicleStatusDefinition[] = [
  { code: 'Draft', singularLabel: 'Draft Vehicle', pluralLabel: 'Draft Vehicles', description: 'Vehicle record is still being prepared.', active: true, sortOrder: 10 },
  { code: 'Available', singularLabel: 'Available Vehicle', pluralLabel: 'Available Vehicles', description: 'Vehicle is available for reservation.', active: true, sortOrder: 20 },
  { code: 'Pending', singularLabel: 'Pending Vehicle', pluralLabel: 'Pending Vehicles', description: 'Vehicle availability is pending confirmation.', active: true, sortOrder: 30 },
  { code: 'Reserved', singularLabel: 'Reserved Vehicle', pluralLabel: 'Reserved Vehicles', description: 'Vehicle has an active reservation hold.', active: true, sortOrder: 40 },
  { code: 'ReservedWithPI', singularLabel: 'Advanced Paid Vehicle', pluralLabel: 'Advanced Paid Vehicles', description: 'Vehicle has received its advance payment and has a proforma invoice.', active: true, sortOrder: 50 },
  { code: 'InvoiceCreated', singularLabel: 'Purchased Vehicle', pluralLabel: 'Purchased Vehicles', description: 'A purchase invoice has been created for the vehicle.', active: true, sortOrder: 60 },
  { code: 'Invoiced', singularLabel: 'Purchased Vehicle', pluralLabel: 'Purchased Vehicles', description: 'A purchase invoice has been issued for the vehicle.', active: true, sortOrder: 70 },
  { code: 'Sold', singularLabel: 'Purchased Vehicle', pluralLabel: 'Purchased Vehicles', description: 'Vehicle purchase has been completed.', active: true, sortOrder: 80 },
];

function resolveVehicleStatusDefinition(code: string, definitions: VehicleStatusDefinition[] = seedVehicleStatusDefinitions): VehicleStatusDefinition {
  return definitions.find((definition) => definition.code === code) || {
    code: code as VehicleStatusDefinition['code'],
    singularLabel: `${code} Vehicle`,
    pluralLabel: `${code} Vehicles`,
    description: `Vehicle status: ${code}`,
    active: false,
    sortOrder: 999,
  };
}

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
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
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
    images: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
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
    chassisNumber: 'TRJ250-001234',
    make: 'Toyota',
    model: 'Land Cruiser 250',
    year: 2024,
    priceUsd: 16120,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-20T10:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
    discountPercent: 15,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 34497,
    stockNumber: 'STK: STK-013F',
    color: 'Pearl',
    spec: 'Pearl',
    logisticsStatus: 'RESERVED',
    etd: '2026-06-15T00:00:00.000Z',
    eta: '2026-07-10T00:00:00.000Z',
    requestPrice: false,
  },
  {
    id: 'veh-7',
    chassisNumber: 'A200A-009876',
    make: 'Toyota',
    model: 'Raize',
    year: 2024,
    priceUsd: 58000,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-09T16:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 0,
    stockNumber: 'STK: STK-3081',
    color: 'White',
    spec: 'White',
    logisticsStatus: 'RESERVED',
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
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
    ],
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
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
    ],
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
  // 6 With PI vehicles (matching Image 1)
  {
    id: 'veh-pi-1',
    chassisNumber: 'YV1MV485BE209044078077',
    make: 'Volvo',
    model: 'V40',
    year: 2013,
    priceUsd: 10800,
    status: 'ReservedWithPI',
    stockNumber: 'STK: YV1MV4',
    color: 'Red',
    mileage: 155391,
    logisticsStatus: 'RESERVED',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-pi-2',
    chassisNumber: 'KG2P-215718',
    make: 'Mazda',
    model: 'CX-8',
    year: 2019,
    priceUsd: 10192,
    status: 'ReservedWithPI',
    stockNumber: 'STK: KG2P-2',
    color: 'Gunmetal',
    mileage: 114289,
    logisticsStatus: 'RESERVED',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-pi-3',
    chassisNumber: 'GT7-202249',
    make: 'Subaru',
    model: 'Impreza Wagon',
    year: 2019,
    priceUsd: 12480,
    status: 'ReservedWithPI',
    stockNumber: 'STK: GT7-20',
    color: 'Black',
    mileage: 90821,
    logisticsStatus: 'RESERVED',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Wagon',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-pi-4',
    chassisNumber: 'YV1MV485BE2088252',
    make: 'Volvo',
    model: 'V40',
    year: 2013,
    priceUsd: 10800,
    status: 'ReservedWithPI',
    stockNumber: 'STK: YV1MV4',
    color: 'Blue',
    mileage: 85576,
    logisticsStatus: 'RESERVED',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-pi-5',
    chassisNumber: 'HA36S-519760',
    make: 'Suzuki',
    model: 'Alto',
    year: 2019,
    priceUsd: 12480,
    status: 'ReservedWithPI',
    stockNumber: 'STK: HA36S-',
    color: 'White',
    mileage: 64960,
    logisticsStatus: 'RESERVED',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-pi-6',
    chassisNumber: 'DK5FW-117884',
    make: 'Mazda',
    model: 'CX-3',
    year: 2015,
    priceUsd: 8624,
    status: 'ReservedWithPI',
    stockNumber: 'STK: DK5FW-',
    color: 'Red',
    mileage: 51233,
    logisticsStatus: 'RESERVED',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  // 15 Invoiced vehicles (matching Image 2)
  {
    id: 'veh-inv-1',
    chassisNumber: 'NRE161-0091995',
    make: 'Toyota',
    model: 'Corolla Fielder',
    year: 2021,
    priceUsd: 17360,
    status: 'Invoiced',
    stockNumber: 'STK: NRE161',
    color: 'White',
    mileage: 136683,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Wagon',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-2',
    chassisNumber: 'DE3FS-1048347777',
    make: 'Mazda',
    model: 'Demio',
    year: 2013,
    priceUsd: 7840,
    status: 'Invoiced',
    stockNumber: 'STK: DE3FS-',
    color: 'Gray',
    mileage: 95643,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-3',
    chassisNumber: 'NZT260-31386066',
    make: 'Toyota',
    model: 'Premio',
    year: 2013,
    priceUsd: 9440,
    status: 'Invoiced',
    stockNumber: 'STK: NZT260',
    color: 'Pearl',
    mileage: 157678,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-4',
    chassisNumber: 'WVWZZZAUZEW125455',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2013,
    priceUsd: 11200,
    status: 'Invoiced',
    stockNumber: 'STK: WVWZZZ',
    color: 'White',
    mileage: 124460,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-5',
    chassisNumber: 'HA36S-517414',
    make: 'Suzuki',
    model: 'Alto',
    year: 2019,
    priceUsd: 12480,
    status: 'Invoiced',
    stockNumber: 'STK: HA36S-',
    color: 'White',
    mileage: 182929,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-6',
    chassisNumber: 'NCP165-0063834',
    make: 'Toyota',
    model: 'Succeed Van',
    year: 2019,
    priceUsd: 13520,
    status: 'Invoiced',
    stockNumber: 'STK: NCP165',
    color: 'Green',
    mileage: 88789,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Van',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-7',
    chassisNumber: 'YV1MV485BE20882527777',
    make: 'Volvo',
    model: 'V40',
    year: 2013,
    priceUsd: 10800,
    status: 'Invoiced',
    stockNumber: 'STK: YV1MV4',
    color: 'Blue',
    mileage: 85576,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-8',
    chassisNumber: 'YV1MV485BE2090440',
    make: 'Volvo',
    model: 'V40',
    year: 2013,
    priceUsd: 10800,
    status: 'Invoiced',
    stockNumber: 'STK: YV1MV4',
    color: 'Red',
    mileage: 155391,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-9',
    chassisNumber: 'NRE161-009199566',
    make: 'Toyota',
    model: 'Corolla Fielder',
    year: 2013,
    priceUsd: 12400,
    status: 'Invoiced',
    stockNumber: 'STK: NRE161',
    color: 'White',
    mileage: 156683,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Wagon',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-10',
    chassisNumber: 'NZT260-3134360',
    make: 'Toyota',
    model: 'Premio',
    year: 2013,
    priceUsd: 9440,
    status: 'Invoiced',
    stockNumber: 'STK: NZT260',
    color: 'Red',
    mileage: 105754,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-11',
    chassisNumber: '4S-998811',
    make: 'Audi',
    model: 'R8 Coupe V10 Performance',
    year: 2023,
    priceUsd: 145000,
    status: 'Invoiced',
    stockNumber: 'STK: STK-VEH1',
    color: 'Catalunya Red Metallic',
    mileage: 3200,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Coupe',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-12',
    chassisNumber: '992-776655',
    make: 'Porsche',
    model: '911 GT3 RS',
    year: 2024,
    priceUsd: 220000,
    status: 'Invoiced',
    stockNumber: 'STK: STK-VEH2',
    color: 'Carrara White Metallic',
    mileage: 150,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Coupe',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-13',
    chassisNumber: '5YJSA1E2-11',
    make: 'Tesla',
    model: 'Model S Plaid',
    year: 2023,
    priceUsd: 89000,
    status: 'Invoiced',
    stockNumber: 'STK: STK-VEH3',
    color: 'Ultra Red',
    mileage: 8400,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Sedan',
    fuelType: 'Electric',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-14',
    chassisNumber: 'SALWR2V4-99',
    make: 'Land Rover',
    model: 'Range Rover Sport SV',
    year: 2024,
    priceUsd: 130000,
    status: 'Invoiced',
    stockNumber: 'STK: STK-VEH4',
    color: 'Firenze Red Metallic',
    mileage: 80,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
  {
    id: 'veh-inv-15',
    chassisNumber: 'DE3FS-137602',
    make: 'Mazda',
    model: 'Demio',
    year: 2012,
    priceUsd: 6500,
    status: 'Invoiced',
    stockNumber: 'STK: DE3FS-',
    color: 'Dark Gray',
    mileage: 75953,
    logisticsStatus: 'INSPECTION',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    bodyStyle: 'Hatchback',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    destinationPort: 'Mombasa',
    createdAt: '2026-08-10T10:00:00.000Z',
  },
];

export interface VehicleQueryContext {
  audience?: 'public' | 'customer' | 'salesperson';
  customerId?: string;
  customerTier?: CustomerTier;
  customerCountry?: string;
  destinationCountry?: string;
  nowISO?: string;
  reservations?: ReservationRecord[];
  tierRule?: CustomerTierRule;
  allocatedCustomerId?: string;
  vehicleStatusDefinitions?: VehicleStatusDefinition[];
}

export interface DemoStore {
  ready(): Promise<void>;
  getConfig(): Promise<PublicConfig>;
  getCustomerTier(customerId: string): Promise<CustomerTier>;
  getCustomerTierBenefits(customerId: string, nowISO?: string): Promise<CustomerTierBenefits>;
  getVehicles(query?: GetVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleSearchResult>;
  getVehicleDetail(idOrSlug: string, context?: VehicleQueryContext): Promise<VehicleDetail | null>;
  getFreightDestinations(): Promise<FreightDestination[]>;
  getFreightPorts(): Promise<FreightPort[]>;
  getFreightEstimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse>;
  getBankAccounts(): Promise<BankAccount[]>;
  createEnquiry(request: EnquiryRequest, customerId?: string): Promise<EnquiryResponse>;
  getLeadById(id: string): Promise<LeadRecord | null>;
  listLeads(): Promise<LeadListResponse>;
  listCustomerInquiries(customerId: string): Promise<CustomerInquiryListResponse>;
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
  listCustomerDocuments(customerId: string): Promise<CustomerDocument[]>;
  getCustomerDocument(customerId: string, documentId: string): Promise<CustomerDocument | null>;
  listCustomerNotifications(customerId: string, query?: { status?: 'all' | 'read' | 'unread'; q?: string }): Promise<CustomerNotificationListResponse>;
  markCustomerNotificationRead(customerId: string, notificationId: string): Promise<Notification | null>;
  markAllCustomerNotificationsRead(customerId: string): Promise<MarkNotificationsReadResponse>;
  deleteCustomerNotification(customerId: string, notificationId: string): Promise<boolean>;
  getCustomerProfile(customerId: string, email: string): Promise<CustomerProfile>;
  updateCustomerProfile(customerId: string, email: string, request: UpdateCustomerProfileRequest, nowISO?: string): Promise<CustomerProfile>;
  // Phase 2.5: customer invoice projections (CUST-02, CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-08, RULE-10)
  getCustomerInvoices(customerId: string, query?: ListCustomerInvoicesQuery, nowISO?: string): Promise<CustomerInvoiceListResponse>;
  getCustomerInvoiceById(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDetail | null>;
  getCustomerInvoiceDocument(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDocument | null>;
  listCustomerPaymentAllocations(customerId: string, query?: ListCustomerPaymentAllocationsQuery): Promise<CustomerPaymentAllocationListResponse>;
  getCustomerPaymentAllocation(customerId: string, paymentId: string): Promise<CustomerPaymentAllocationSummary | null>;
  listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse>;
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
  // Phase 2.13: Wishlist and Favourites (D02-P13-T002, CUST-36..40)
  listWishlist(customerId: string): Promise<WishlistListResponse>;
  toggleWishlist(customerId: string, vehicleSlug: string): Promise<WishlistToggleResponse>;
  listFavourites(customerId: string): Promise<FavouriteSearchListResponse>;
  createFavourite(customerId: string, name: string, criteria: FavouriteSearchCriteria, nowISO?: string): Promise<FavouriteSearch>;
  deleteFavourite(customerId: string, id: string): Promise<void>;
  getFavouriteFacets(): Promise<FavouriteSearchFacets>;
  // FRD Additions: Statement and Polymorphic Inquiries
  getCustomerStatement(customerId: string, fromDate?: string, toDate?: string): Promise<CustomerStatementSummary>;
  listCustomerPolymorphicInquiries(customerId: string): Promise<CustomerPolymorphicInquiryListResponse>;
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
  tier: CustomerTier;
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
  tier: CustomerTier;
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

function validateRegisterCustomerRequest(request: RegisterCustomerRequest, countries: readonly CountryOption[]): ValidatedRegistration {
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
    tier: record.tier,
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
    tier: 'Standard',
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

const SEED_CUSTOMER_ACCOUNT_EMAIL = 'prabodha@carchief.com';
// Fixture-only credential bound to the seeded `cust-123` identity so every
// existing Delivery 02 customer suite keeps a working sign-in. Never a
// production secret — mock/dev-only, and only ever stored as its scrypt hash.
const SEED_CUSTOMER_ACCOUNT_PASSWORD = 'Password@1234';

function buildSeedCustomerAccount(): CustomerAccountRecord {
  const { hash, salt } = hashPassword(SEED_CUSTOMER_ACCOUNT_PASSWORD);
  const seedTimestamp = '2026-01-01T00:00:00.000Z';
  return {
    id: 'acct-cust-123',
    customerId: 'cust-123',
    nameWithInitials: 'Prabodha Wijerathne',
    countryCode: 'LK',
    dialCode: '+94',
    mobileNumber: '771234567',
    email: SEED_CUSTOMER_ACCOUNT_EMAIL,
    tier: 'Standard',
    passwordHash: hash,
    passwordSalt: salt,
    status: 'active',
    verificationState: 'unverified',
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    passwordUpdatedAt: seedTimestamp,
  };
}

function buildSeedOtherCustomerAccount(): CustomerAccountRecord {
  const { hash, salt } = hashPassword(SEED_CUSTOMER_ACCOUNT_PASSWORD);
  const seedTimestamp = '2026-01-01T00:00:00.000Z';
  return {
    id: 'acct-user-other-456',
    customerId: 'user-other-456',
    nameWithInitials: 'Amina Njeri',
    countryCode: 'KE',
    dialCode: '+254',
    mobileNumber: '712345678',
    email: 'amina.njeri@example.com',
    tier: 'Silver',
    passwordHash: hash,
    passwordSalt: salt,
    status: 'active',
    verificationState: 'unverified',
    createdAt: seedTimestamp,
    updatedAt: seedTimestamp,
    passwordUpdatedAt: seedTimestamp,
  };
}

function buildSeedTierAccount(
  customerId: string,
  email: string,
  nameWithInitials: string,
  countryCode: string,
  tier: CustomerTier,
): CustomerAccountRecord {
  const { hash, salt } = hashPassword(SEED_CUSTOMER_ACCOUNT_PASSWORD);
  const seedTimestamp = '2026-01-01T00:00:00.000Z';
  return {
    id: `acct-${customerId}`,
    customerId,
    nameWithInitials,
    countryCode,
    dialCode: countryCode === 'KE' ? '+254' : countryCode === 'JP' ? '+81' : '+351',
    mobileNumber: countryCode === 'KE' ? '723456789' : countryCode === 'JP' ? '9012345678' : '912345678',
    email,
    tier,
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
const seedBankAccounts: BankAccount[] = [
  {
    id: 'smbc-usd',
    bankName: 'SUMITOMO MITSUI BANKING CORPORATION',
    swiftCode: 'SMBCJPJT',
    branchName: 'SHINOSAKA BRANCH',
    branchCode: '506',
    bankAddress: '4-1-6, MIYAHARA, YODOGAWA-KU, OSAKA-SHI, OSAKA, 532-0003, JAPAN',
    accountName: 'CAR CHIEF CO.,LTD',
    accountNo: '2015340',
    currency: 'USD',
    type: 'WIRE'
  },
  {
    id: 'smbc-jpy',
    bankName: 'SUMITOMO MITSUI BANKING CORPORATION',
    swiftCode: 'SMBCJPJT',
    branchName: 'SHINOSAKA BRANCH',
    branchCode: '506',
    bankAddress: '4-1-6, MIYAHARA, YODOGAWA-KU, OSAKA-SHI, OSAKA, 532-0003, JAPAN',
    accountName: 'CAR CHIEF CO.,LTD',
    accountNo: '4714441',
    currency: 'JPY',
    type: 'WIRE'
  },
  {
    id: 'mufg-usd',
    bankName: 'MUFG BANK, LTD',
    swiftCode: 'BOTKJPJT',
    branchName: 'OSAKA BRANCH',
    branchCode: '506',
    accountName: 'CAR CHIEF CO.,LTD',
    accountNo: '1234567',
    currency: 'USD',
    type: 'WIRE'
  },
  {
    id: 'paypal',
    bankName: 'PayPal',
    accountName: 'CAR CHIEF CO.,LTD',
    accountNo: 'payments@carchief.co.jp',
    currency: 'USD',
    type: 'PAYPAL'
  }
];

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
    status: 'approved',
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
    status: 'approved',
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
    status: 'approved',
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
        groundedNoAnswer: true,
        message: 'No grounded answer found matching your query. Please contact our support team.',
      };
    }

    return {
      categories,
      items: matched,
      total: categories.length,
      groundedNoAnswer: false,
    };
  }

  return {
    categories,
    items: approvedItems,
    total: categories.length,
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
  public readonly reason?: string;

  constructor(statusCode: number, message: string, field?: string, reason?: string) {
    super(message);
    this.name = 'EnquiryRequestError';
    this.statusCode = statusCode;
    this.field = field;
    this.reason = reason;
  }
}

export interface EnquiryRecord {
  id: string;
  dedupeKey: string;
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
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

/** Wishlist item internal record (D02-P13-T002, CUST-36). */
export interface WishlistItemRecord {
  id: string;
  customerId: string;
  vehicleId: string;
  vehicleSlug: string;
  createdAt: string;
}

/** Favourite search internal record (D02-P13-T002, CUST-38/CUST-39). */
export interface FavouriteSearchRecord {
  id: string;
  customerId: string;
  name: string;
  criteriaJson: string; // Stored as JSON string for easy DB persistence
  createdAt: string;
}

interface PreparedEnquiry {
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
  customerId: string;
}

function requireNonEmptyString(value: unknown, field: string, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new EnquiryRequestError(400, `${label} is required`, field);
  }
  return value.trim();
}

function assertVehicleEnquiryAllowed(
  vehicles: VehicleRecord[],
  invoices: InvoiceRecord[],
  request: EnquiryRequest,
  customerId: string,
): void {
  if (!request.vehicleSlug) return;
  const vehicle = findVehicleRecord(vehicles, request.vehicleSlug);
  if (!vehicle) return;
  const allocatedCustomerId = findAllocatedCustomerId(invoices, vehicle.id);
  if (allocatedCustomerId && allocatedCustomerId !== customerId) {
    throw new EnquiryRequestError(
      409,
      'This vehicle has already been allocated to another customer.',
      'vehicleSlug',
      'allocated_to_another_customer',
    );
  }
}

/**
 * Validates and normalizes an enquiry request, resolving an optional vehicle
 * link and an optional server-side freight rate-lookup snapshot. Throws a
 * field-associated `EnquiryRequestError` (400) for anything invalid — never
 * silently drops or substitutes a value. `customerId` is accepted as a
 * trusted parameter from the route handler (never from the request body).
 */
export function prepareEnquiry(
  vehicles: VehicleRecord[],
  destinations: FreightDestination[],
  ports: FreightPort[],
  records: FreightRateRecord[],
  request: EnquiryRequest,
  nowISO: string,
  customerId: string
): PreparedEnquiry {
  if (!request || typeof request !== 'object') {
    throw new EnquiryRequestError(400, 'A request body is required');
  }
  if (!customerId) {
    throw new EnquiryRequestError(401, 'An authenticated customer is required');
  }

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
    customerId,
  };
}

/**
 * A resubmission is the same enquiry, not a new lead: identical contact
 * identifier (customerId for authenticated submitters, email for anonymous),
 * vehicle, destination/port and message text collapse to one stored record
 * (RULE-08) rather than creating unlimited duplicates from a double-click or
 * retry. This keying prevents two different customers sharing an email from
 * being incorrectly collapsed into one row.
 */
export function buildEnquiryDedupeKey(prepared: PreparedEnquiry): string {
  return [
    prepared.customerId,
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
  'SELECT e.id, e.dedupe_key, e.message, e.consent, e.vehicle_slug, e.destination_code, e.port_code, e.rate_status, e.currency, e.rate_effective_from, e.rate_effective_to, e.estimate_message, e.received_at, e.enquiry_type, e.source, e.duplicate_resubmission_count, e.preferred_make, e.preferred_model, e.preferred_drive_side, e.preferred_year, e.target_price_usd, e.customer_id, ca.name_with_initials AS customer_name, ca.email AS customer_email, ca.mobile_number AS customer_phone';
const ENQUIRY_FROM = ' FROM enquiries e JOIN customer_accounts ca ON ca.customer_id = e.customer_id';

function rowToEnquiryRecord(row: Record<string, unknown>): EnquiryRecord {
  const destinationCode = row.destination_code as string | null;
  const portCode = row.port_code as string | null;
  return {
    id: row.id as string,
    dedupeKey: row.dedupe_key as string,
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
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string,
    customerPhone: row.customer_phone as string,
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
    customerId: record.customerId,
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
    customerId: record.customerId,
    name: record.customerName || record.customerId,
    email: record.customerEmail || `${record.customerId}@example.invalid`,
    phone: record.customerPhone || '',
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

  const nowOnSale = active && v.status === 'Available' && (!activeHold || Boolean(context.customerId && activeHold.customerId === context.customerId));
  const isRequestPrice = Boolean(v.requestPrice || !v.priceUsd || v.priceUsd <= 0);
  const priceState: 'priced' | 'request_price' = isRequestPrice ? 'request_price' : 'priced';

  // Tier Pricing (RULE-06)
  const tier = context.customerTier || (context.audience === 'customer' ? 'Standard' : undefined);
  const tierPricing = tier && v.priceUsd > 0 ? calculateTierPricing(v.priceUsd, tier, context.tierRule?.discountPercent ?? 0) : undefined;

  // Reservation Eligibility (RULE-05, RULE-08, RULE-10)
  let reservationEligibility: VehicleReservationEligibility | undefined = undefined;
  if (context.audience === 'customer' || context.customerId || context.customerTier) {
    if (isSold || !active || !RESERVABLE_VEHICLE_STATUS_SET.has(v.status)) {
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
    modelCode: v.modelCode,
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
    vehicleSubType: v.vehicleSubType,
    engineCc: v.engineCc,
    overdrive: v.overdrive,
    color: v.color,
    exteriorGrade: v.exteriorGrade,
    steering: v.steering,
    stockCountry: v.stockCountry,
    stockLocation: v.stockLocation,
    seats: v.seats,
    loadCapacity: v.loadCapacity,
    features: v.features ? { ...v.features } : undefined,
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
    compliance: (context.destinationCountry || context.customerCountry)
      ? evaluateVehicleCompliance(v, context.destinationCountry || context.customerCountry, new Date(nowISO).getUTCFullYear())
      : undefined,
    tierPricing,
    reservationEligibility,
    inquiryEligibility: buildVehicleInquiryEligibility(v, context),
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

  const nowOnSale = active && v.status === 'Available' && (!activeHold || Boolean(context.customerId && activeHold.customerId === context.customerId));

  // Tier Pricing (RULE-06)
  const tier = context.customerTier || (context.audience === 'customer' ? 'Standard' : undefined);
  const tierPricing = tier && v.priceUsd > 0 ? calculateTierPricing(v.priceUsd, tier, context.tierRule?.discountPercent ?? 0) : undefined;

  // Reservation Eligibility (RULE-05, RULE-08, RULE-10)
  let reservationEligibility: VehicleReservationEligibility | undefined = undefined;
  if (context.audience === 'customer' || context.customerId || context.customerTier) {
    if (isSold || !active || !RESERVABLE_VEHICLE_STATUS_SET.has(v.status)) {
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
    statusLabel: resolveVehicleStatusDefinition(v.status, context.vehicleStatusDefinitions).singularLabel,
    statusLabelPlural: resolveVehicleStatusDefinition(v.status, context.vehicleStatusDefinitions).pluralLabel,
    statusDescription: resolveVehicleStatusDefinition(v.status, context.vehicleStatusDefinitions).description,
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
    compliance: (context.destinationCountry || context.customerCountry)
      ? evaluateVehicleCompliance(v, context.destinationCountry || context.customerCountry, new Date(nowISO).getUTCFullYear())
      : undefined,
    // The demo record carries a single uncategorized `images` array, so only the
    // general gallery is populated. Auction/Japan/Durban categories stay empty
    // with their visibility flags false rather than re-labelling gallery images
    // as a category the source system never asserted (PUB-25).
    media: {
      gallery,
      auctionPictures: [],
      japanPictures: [],
      durbanPictures: [],
      showAuctionPictures: false,
      showJapanPictures: false,
      showDurbanPictures: false,
    },
    active,
    nowOnSale,
    tierPricing,
    reservationEligibility,
    inquiryEligibility: buildVehicleInquiryEligibility(v, context),
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

function calculateFacets(vehicles: VehicleDomainSummary[], catalog: VehicleFeatureCatalogEntry[] = vehicleFeatureCatalog): VehicleFacets {
  const modelCodeMap = new Map<string, number>();
  const modelMap = new Map<string, number>();
  const vehicleTypeMap = new Map<string, number>();
  const vehicleSubTypeMap = new Map<string, number>();
  const makeMap = new Map<string, number>();
  const bodyStyleMap = new Map<string, number>();
  const fuelTypeMap = new Map<string, number>();
  const transmissionMap = new Map<string, number>();
  const driveTrainMap = new Map<string, number>();
  const locationStatusMap = new Map<string, number>();
  const destinationPortMap = new Map<string, number>();
  const overdriveMap = new Map<string, number>();
  const colorMap = new Map<string, number>();
  const exteriorGradeMap = new Map<string, number>();
  const steeringMap = new Map<string, number>();
  const stockCountryMap = new Map<string, number>();
  const stockLocationMap = new Map<string, number>();
  const featureMap = new Map<string, number>();

  let minYear = 2026;
  let maxYear = 1970;
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let minMileage = Infinity;
  let maxMileage = -Infinity;
  let minEngineCc = Infinity;
  let maxEngineCc = -Infinity;
  let minSeats = Infinity;
  let maxSeats = -Infinity;
  let minLoadCapacity = Infinity;
  let maxLoadCapacity = -Infinity;

  vehicles.forEach((v) => {
    if (v.make) makeMap.set(v.make, (makeMap.get(v.make) || 0) + 1);
    if (v.model) modelMap.set(v.model, (modelMap.get(v.model) || 0) + 1);
    if (v.modelCode) modelCodeMap.set(v.modelCode, (modelCodeMap.get(v.modelCode) || 0) + 1);
    if (v.bodyStyle) bodyStyleMap.set(v.bodyStyle, (bodyStyleMap.get(v.bodyStyle) || 0) + 1);
    if (v.bodyStyle) vehicleTypeMap.set(v.bodyStyle, (vehicleTypeMap.get(v.bodyStyle) || 0) + 1);
    if (v.vehicleSubType) vehicleSubTypeMap.set(v.vehicleSubType, (vehicleSubTypeMap.get(v.vehicleSubType) || 0) + 1);
    if (v.fuelType) fuelTypeMap.set(v.fuelType, (fuelTypeMap.get(v.fuelType) || 0) + 1);
    if (v.transmission) transmissionMap.set(v.transmission, (transmissionMap.get(v.transmission) || 0) + 1);
    if (v.driveTrain) driveTrainMap.set(v.driveTrain, (driveTrainMap.get(v.driveTrain) || 0) + 1);
    if (v.locationStatus) locationStatusMap.set(v.locationStatus, (locationStatusMap.get(v.locationStatus) || 0) + 1);
    if (v.destinationPort) destinationPortMap.set(v.destinationPort, (destinationPortMap.get(v.destinationPort) || 0) + 1);
    if (v.overdrive) overdriveMap.set(v.overdrive, (overdriveMap.get(v.overdrive) || 0) + 1);
    if (v.color) colorMap.set(v.color, (colorMap.get(v.color) || 0) + 1);
    if (v.exteriorGrade) exteriorGradeMap.set(v.exteriorGrade, (exteriorGradeMap.get(v.exteriorGrade) || 0) + 1);
    if (v.steering) steeringMap.set(v.steering, (steeringMap.get(v.steering) || 0) + 1);
    if (v.stockCountry) stockCountryMap.set(v.stockCountry, (stockCountryMap.get(v.stockCountry) || 0) + 1);
    if (v.stockLocation) stockLocationMap.set(v.stockLocation, (stockLocationMap.get(v.stockLocation) || 0) + 1);
    Object.entries(v.features || {}).forEach(([feature, enabled]) => {
      if (enabled && catalog.some((entry) => entry.active && entry.key === feature)) featureMap.set(feature, (featureMap.get(feature) || 0) + 1);
    });

    if (v.year) {
      if (v.year < minYear) minYear = v.year;
      if (v.year > maxYear) maxYear = v.year;
    }

    if (v.priceUsd && !v.requestPrice) {
      if (v.priceUsd < minPrice) minPrice = v.priceUsd;
      if (v.priceUsd > maxPrice) maxPrice = v.priceUsd;
    }
    if (v.mileage !== undefined && v.mileage !== null) {
      if (v.mileage < minMileage) minMileage = v.mileage;
      if (v.mileage > maxMileage) maxMileage = v.mileage;
    }
    if (v.engineCc !== undefined && v.engineCc !== null) {
      if (v.engineCc < minEngineCc) minEngineCc = v.engineCc;
      if (v.engineCc > maxEngineCc) maxEngineCc = v.engineCc;
    }
    if (v.seats !== undefined && v.seats !== null) {
      minSeats = Math.min(minSeats, v.seats);
      maxSeats = Math.max(maxSeats, v.seats);
    }
    if (v.loadCapacity !== undefined && v.loadCapacity !== null) {
      minLoadCapacity = Math.min(minLoadCapacity, v.loadCapacity);
      maxLoadCapacity = Math.max(maxLoadCapacity, v.loadCapacity);
    }
  });

  const sortFacets = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    makes: sortFacets(makeMap),
    models: sortFacets(modelMap),
    modelCodes: sortFacets(modelCodeMap),
    vehicleTypes: sortFacets(vehicleTypeMap),
    vehicleSubTypes: sortFacets(vehicleSubTypeMap),
    bodyStyles: sortFacets(bodyStyleMap),
    fuelTypes: sortFacets(fuelTypeMap),
    transmissions: sortFacets(transmissionMap),
    driveTrains: sortFacets(driveTrainMap),
    locationStatuses: sortFacets(locationStatusMap),
    destinationPorts: sortFacets(destinationPortMap),
    overdrives: sortFacets(overdriveMap),
    colors: sortFacets(colorMap),
    exteriorGrades: sortFacets(exteriorGradeMap),
    steerings: sortFacets(steeringMap),
    stockCountries: sortFacets(stockCountryMap),
    stockLocations: sortFacets(stockLocationMap),
    features: catalog
      .filter((entry) => entry.active && featureMap.has(entry.key))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((entry): FeatureFacet => ({ key: entry.key, label: entry.label, count: featureMap.get(entry.key) || 0 })),
    yearRange: {
      min: minYear <= maxYear ? minYear : 2015,
      max: minYear <= maxYear ? maxYear : 2024,
    },
    priceRange: {
      min: minPrice <= maxPrice ? minPrice : 0,
      max: minPrice <= maxPrice ? maxPrice : 50000,
    },
    mileageRange: {
      min: minMileage <= maxMileage ? minMileage : 0,
      max: minMileage <= maxMileage ? maxMileage : 0,
    },
    engineCcRange: {
      min: minEngineCc <= maxEngineCc ? minEngineCc : 0,
      max: minEngineCc <= maxEngineCc ? maxEngineCc : 0,
    },
    seatsRange: { min: minSeats <= maxSeats ? minSeats : 0, max: minSeats <= maxSeats ? maxSeats : 0 },
    loadCapacityRange: { min: minLoadCapacity <= maxLoadCapacity ? minLoadCapacity : 0, max: minLoadCapacity <= maxLoadCapacity ? maxLoadCapacity : 0 },
  };
}

function calculateSearchFacets(
  vehicles: VehicleRecord[],
  query: SearchVehiclesQuery | undefined,
  context: VehicleQueryContext,
  catalog: VehicleFeatureCatalogEntry[] = vehicleFeatureCatalog,
): VehicleFacets {
  // Keep the selected make in the result set, but calculate the Make
  // dropdown from the same scoped/filtered universe without that one
  // constraint. This keeps sibling makes available for switching.
  const facetQuery: SearchVehiclesQuery = {
    ...query,
    make: undefined,
    page: undefined,
    limit: undefined,
  };
  const without = (...keys: Array<keyof SearchVehiclesQuery>) => {
    const next = { ...facetQuery };
    keys.forEach((key) => { delete next[key]; });
    return calculateFacets(filterAndSortVehicles(vehicles, next, context), catalog);
  };
  const base = calculateFacets(filterAndSortVehicles(vehicles, facetQuery, context), catalog);
  const makeFacets = without('make');
  // Model values are dependent on the selected make. Keep that constraint
  // while calculating models, otherwise the UI offers models from unrelated
  // makes in the same filter panel.
  const modelQuery: SearchVehiclesQuery = { ...query, model: undefined, page: undefined, limit: undefined };
  const modelFacets = calculateFacets(filterAndSortVehicles(vehicles, modelQuery, context), catalog);
  const modelCodeFacets = without('modelCode');
  const vehicleTypeFacets = without('bodyStyle');
  const vehicleSubTypeFacets = without('vehicleSubType');
  const bodyStyleFacets = without('bodyStyle');
  const fuelTypeFacets = without('fuelType');
  const transmissionFacets = without('transmission');
  const driveTrainFacets = without('driveTrain');
  const locationFacets = without('locationStatus');
  const portFacets = without('destinationPort');
  const yearFacets = without('yearMin', 'yearMax');
  const priceFacets = without('priceMin', 'priceMax');
  const mileageFacets = without('mileageMin', 'mileageMax');
  const engineFacets = without('engineCcMin', 'engineCcMax');
  const overdriveFacets = without('overdrive');
  const colorFacets = without('color');
  const exteriorGradeFacets = without('exteriorGrade');
  const steeringFacets = without('steering');
  const stockCountryFacets = without('stockCountry');
  const stockLocationFacets = without('stockLocation');
  const seatsFacets = without('seatsMin', 'seatsMax');
  const loadCapacityFacets = without('loadCapacityMin', 'loadCapacityMax');
  const featureFacets = without('features');
  return {
    ...base,
    makes: makeFacets.makes,
    models: modelFacets.models,
    modelCodes: modelCodeFacets.modelCodes,
    vehicleTypes: vehicleTypeFacets.vehicleTypes,
    vehicleSubTypes: vehicleSubTypeFacets.vehicleSubTypes,
    bodyStyles: bodyStyleFacets.bodyStyles,
    fuelTypes: fuelTypeFacets.fuelTypes,
    transmissions: transmissionFacets.transmissions,
    driveTrains: driveTrainFacets.driveTrains,
    locationStatuses: locationFacets.locationStatuses,
    destinationPorts: portFacets.destinationPorts,
    yearRange: yearFacets.yearRange,
    priceRange: priceFacets.priceRange,
    mileageRange: mileageFacets.mileageRange,
    engineCcRange: engineFacets.engineCcRange,
    overdrives: overdriveFacets.overdrives,
    colors: colorFacets.colors,
    exteriorGrades: exteriorGradeFacets.exteriorGrades,
    steerings: steeringFacets.steerings,
    stockCountries: stockCountryFacets.stockCountries,
    stockLocations: stockLocationFacets.stockLocations,
    features: featureFacets.features,
    seatsRange: seatsFacets.seatsRange,
    loadCapacityRange: loadCapacityFacets.loadCapacityRange,
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
    const category = normalizeReferenceKey(query.category);
    list = list.filter((v) => v.category?.split(',').some((value) => normalizeReferenceKey(value) === category));
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
        (v.modelCode && v.modelCode.toLowerCase().includes(q)) ||
        v.chassisNumber.toLowerCase().includes(q) ||
        (v.bodyStyle && v.bodyStyle.toLowerCase().includes(q)) ||
        (v.vehicleSubType && v.vehicleSubType.toLowerCase().includes(q)) ||
        (v.color && v.color.toLowerCase().includes(q)) ||
        (v.exteriorGrade && v.exteriorGrade.toLowerCase().includes(q)) ||
        (v.steering && v.steering.toLowerCase().includes(q)) ||
        (v.stockCountry && v.stockCountry.toLowerCase().includes(q)) ||
        (v.stockLocation && v.stockLocation.toLowerCase().includes(q)) ||
        Object.keys(v.features || {}).some((feature) => feature.toLowerCase().includes(q)) ||
        (v.destinationPort && v.destinationPort.toLowerCase().includes(q))
    );
  }

  // Faceted query filters
  if (query?.make) {
    const makeVal = normalizeReferenceKey(query.make);
    list = list.filter((v) => normalizeReferenceKey(v.make) === makeVal);
  }

  if (query?.model) {
    const modelVal = normalizeReferenceKey(query.model);
    list = list.filter((v) => normalizeReferenceKey(v.model).includes(modelVal));
  }

  if (query?.modelCode) list = list.filter((v) => v.modelCode?.toLowerCase() === query.modelCode!.trim().toLowerCase());

  if (query?.bodyStyle) {
    const bodyVal = normalizeReferenceKey(query.bodyStyle);
    list = list.filter((v) => v.bodyStyle && normalizeReferenceKey(v.bodyStyle) === bodyVal);
  }

  if (query?.fuelType) {
    const fuelVal = normalizeReferenceKey(query.fuelType);
    list = list.filter((v) => v.fuelType && normalizeReferenceKey(v.fuelType) === fuelVal);
  }

  if (query?.transmission) {
    const transVal = normalizeReferenceKey(query.transmission);
    list = list.filter((v) => v.transmission && normalizeReferenceKey(v.transmission) === transVal);
  }

  if (query?.driveTrain) {
    const dtVal = normalizeReferenceKey(query.driveTrain);
    list = list.filter((v) => v.driveTrain && normalizeReferenceKey(v.driveTrain) === dtVal);
  }

  if (query?.vehicleSubType) list = list.filter((v) => v.vehicleSubType && normalizeReferenceKey(v.vehicleSubType) === normalizeReferenceKey(query.vehicleSubType!));
  if (query?.overdrive) list = list.filter((v) => v.overdrive && normalizeReferenceKey(v.overdrive) === normalizeReferenceKey(query.overdrive!));
  if (query?.color) list = list.filter((v) => v.color && normalizeReferenceKey(v.color) === normalizeReferenceKey(query.color!));
  if (query?.exteriorGrade) list = list.filter((v) => v.exteriorGrade && normalizeReferenceKey(v.exteriorGrade) === normalizeReferenceKey(query.exteriorGrade!));
  if (query?.steering) list = list.filter((v) => v.steering && normalizeReferenceKey(v.steering) === normalizeReferenceKey(query.steering!));
  if (query?.stockCountry) list = list.filter((v) => v.stockCountry && normalizeReferenceKey(v.stockCountry) === normalizeReferenceKey(query.stockCountry!));
  if (query?.stockLocation) list = list.filter((v) => v.stockLocation && normalizeReferenceKey(v.stockLocation) === normalizeReferenceKey(query.stockLocation!));
  if (query?.seatsMin !== undefined) list = list.filter((v) => v.seats !== undefined && v.seats >= Number(query.seatsMin));
  if (query?.seatsMax !== undefined) list = list.filter((v) => v.seats !== undefined && v.seats <= Number(query.seatsMax));
  if (query?.loadCapacityMin !== undefined) list = list.filter((v) => v.loadCapacity !== undefined && v.loadCapacity >= Number(query.loadCapacityMin));
  if (query?.loadCapacityMax !== undefined) list = list.filter((v) => v.loadCapacity !== undefined && v.loadCapacity <= Number(query.loadCapacityMax));
  const requestedFeatures = typeof (query as any)?.features === 'string'
    ? String((query as any).features).split(',').filter(Boolean)
    : (query?.features || []);
  if (requestedFeatures.length) list = list.filter((v) => requestedFeatures.every((feature) => v.features?.[feature] === true));

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

  if (query?.destinationPort) {
    list = list.filter((v) => v.destinationPort && normalizeReferenceKey(v.destinationPort) === normalizeReferenceKey(query.destinationPort!));
  }

  if (query?.mileageMin !== undefined) {
    list = list.filter((v) => v.mileage !== undefined && v.mileage >= Number(query.mileageMin));
  }

  if (query?.mileageMax !== undefined) {
    list = list.filter((v) => v.mileage !== undefined && v.mileage <= Number(query.mileageMax));
  }

  if (query?.discountMin !== undefined) {
    const minD = Number(query.discountMin);
    list = list.filter((v) => (v.discountPercent !== undefined && v.discountPercent >= minD));
  }

  if (query?.engineCcMin !== undefined) list = list.filter((v) => v.engineCc !== undefined && v.engineCc >= Number(query.engineCcMin));
  if (query?.engineCcMax !== undefined) list = list.filter((v) => v.engineCc !== undefined && v.engineCc <= Number(query.engineCcMax));

  // Country Import Compliance Filtering (D02-P14-T005)
  const destCountry = (query?.destinationCountry || context?.destinationCountry || (effectiveAudience === 'customer' ? context?.customerCountry : undefined))?.trim();
  if (destCountry) {
    const complianceOnly = (query as any)?.complianceOnly !== false && (query as any)?.complianceOnly !== 'false';
    const refYear = new Date(now).getUTCFullYear();
    if (complianceOnly) {
      list = list.filter((v) => isVehicleCompliantForCountry(v, destCountry, refYear));
    }
    list = list.map((v) => ({
      ...v,
      compliance: evaluateVehicleCompliance(v, destCountry, refYear),
    }));
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
    customerEmail: 'amina.njeri@example.com',
    createdAt: '2026-08-09T10:00:00.000Z',
    expiresAt: '2026-08-11T10:00:00.000Z', // Active relative to 2026-08-10 reference date (48-hour hold)
    holdHours: 48,
  },
  {
    id: 'res-seed-active-cust-1',
    vehicleId: 'veh-6',
    vehicleSlug: '2024-toyota-land-cruiser-250-veh-6',
    customerId: 'cust-123',
    customerEmail: 'customer@example.com',
    createdAt: '2026-08-10T08:00:00.000Z',
    expiresAt: '2026-08-12T08:00:00.000Z', // Active relative to 2026-08-10 reference date (48-hour hold)
    holdHours: 48,
  },
  {
    id: 'res-seed-active-cust-2',
    vehicleId: 'veh-7',
    vehicleSlug: '2024-toyota-raize-veh-7',
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
    customerEmail: 'amina.njeri@example.com',
    createdAt: '2026-08-06T10:00:00.000Z',
    expiresAt: '2026-08-08T10:00:00.000Z', // Expired relative to 2026-08-10 reference date
    holdHours: 48,
  },
];

// Legacy-search sample attributes are materialized for every seed vehicle so
// both the in-memory and PostgreSQL stores expose complete facet data.
const preparedSeedVehicles = seedVehicles.map((vehicle, index) => ({
  ...vehicle,
  modelCode: vehicle.modelCode || `${vehicle.make.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
  vehicleSubType: vehicle.vehicleSubType || vehicle.bodyStyle,
  engineCc: vehicle.engineCc || 1500 + (index % 5) * 500,
  overdrive: vehicle.overdrive || (index % 2 === 0 ? 'Yes' : 'No'),
  color: vehicle.color || 'White',
  exteriorGrade: vehicle.exteriorGrade || (index % 3 === 0 ? '4.5' : '4'),
  steering: vehicle.steering || (index % 2 === 0 ? 'Right' : 'Left'),
  stockCountry: vehicle.stockCountry || 'Japan',
  stockLocation: vehicle.stockLocation || vehicle.locationStatus || 'In Japan',
  seats: vehicle.seats || (index % 3 === 0 ? 7 : 5),
  loadCapacity: vehicle.loadCapacity || 500 + (index % 4) * 250,
  features: vehicle.features || {
    abs: index % 2 === 0,
    airbag: true,
    sunRoof: index % 3 === 0,
    leatherSeat: index % 4 === 0,
    alloyWheels: index % 2 === 0,
    powerWindow: true,
    airConditioning: true,
    backCamera: index % 2 === 0,
    navigation: index % 3 === 0,
    turbo: index % 4 === 0,
    oneOwner: index % 5 !== 0,
    nonSmoker: true,
  },
}));

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
  vehicleItems?: InvoiceVehicleItemRecord[];
}

interface InvoiceVehicleItemRecord {
  vehicleId: string;
  make: string;
  model: string;
  year: number;
  chassisNumber: string;
  stockNumber: string;
  amountUsd: number;
}

function findAllocatedCustomerId(invoices: InvoiceRecord[], vehicleId: string): string | undefined {
  return invoices.find((invoice) => invoiceIncludesVehicle(invoice, vehicleId) && invoice.status !== 'Draft')?.customerId;
}

function invoiceIncludesVehicle(invoice: InvoiceRecord, vehicleId: string): boolean {
  return invoice.vehicleId === vehicleId || Boolean(invoice.vehicleItems?.some((item) => item.vehicleId === vehicleId));
}

function getInvoiceVehicleAmount(invoice: InvoiceRecord, vehicleId: string): number {
  const item = invoice.vehicleItems?.find((candidate) => candidate.vehicleId === vehicleId);
  return Math.max(0, item?.amountUsd ?? (invoice.vehicleId === vehicleId ? invoice.totalAmountUsd : 0));
}

function findCanonicalInvoice(invoices: InvoiceRecord[], customerId: string, vehicleId: string): InvoiceRecord | undefined {
  return invoices
    .filter((invoice) => invoice.customerId === customerId && invoice.status !== 'Draft' && invoiceIncludesVehicle(invoice, vehicleId))
    .sort((a, b) => {
      const aBulk = a.vehicleItems?.some((item) => item.vehicleId === vehicleId) ? 1 : 0;
      const bBulk = b.vehicleItems?.some((item) => item.vehicleId === vehicleId) ? 1 : 0;
      return bBulk - aBulk || new Date(b.invoicedAt).getTime() - new Date(a.invoicedAt).getTime();
    })[0];
}

function buildVehicleInquiryEligibility(
  vehicle: VehicleRecord,
  context: VehicleQueryContext,
): VehicleDomainSummary['inquiryEligibility'] {
  if (!context.customerId) return undefined;
  if (context.allocatedCustomerId && context.allocatedCustomerId !== context.customerId) {
    return { eligible: false, reason: 'allocated_to_another_customer' };
  }
  if (vehicle.status !== 'Available' && !context.allocatedCustomerId) {
    return { eligible: false, reason: 'not_available' };
  }
  return { eligible: true };
}

export interface AllocationRecord {
  id: string;
  customerId: string;
  paymentId: string;
  invoiceId: string;
  /** The specific vehicle receiving the TT allocation; legacy rows fall back to the invoice vehicle. */
  vehicleId?: string;
  purpose?: 'Advance' | 'Balance';
  amountUsd: number;
  allocatedAt: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  invoiceId?: string;
  amountUsd: number;
  paidAt: string;
  status: 'Pending' | 'Held' | 'Resubmitted' | 'Approved' | 'Rejected';
  holdReason?: string;
  financeNote?: string;
  reference?: string;
  bankName?: string;
  currency?: string;
  paymentDate?: string;
  remarks?: string;
  proof?: CreateCustomerPaymentRequest['proof'];
  idempotencyKey?: string;
  createdAt?: string;
  customerName?: string;
  depositorName?: string;
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
  name: string;
  companyName: string;
  phone: string;
  deliveryAddress: string;
  version: number;
  updatedAt: string;
}

export class DatabaseRequiredError extends Error {
  readonly statusCode = 503;

  constructor() {
    super('Customer statement data requires the PostgreSQL database');
    this.name = 'DatabaseRequiredError';
  }
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
  // One TT can fund multiple vehicles while producing one commercial invoice.
  { id: 'inv-bulk-001', customerId: 'cust-123', vehicleId: 'veh-inv-1', vehicleSlug: '2021-toyota-corolla-fielder-veh-inv-1', make: 'Toyota', model: 'Corolla Fielder', year: 2021, totalAmountUsd: 25200.00, invoicedAt: '2026-08-14T09:00:00.000Z', status: 'Paid', vehicleItems: [
    { vehicleId: 'veh-inv-1', make: 'Toyota', model: 'Corolla Fielder', year: 2021, chassisNumber: '', stockNumber: 'veh-inv-1', amountUsd: 17360 },
    { vehicleId: 'veh-inv-2', make: 'Mazda', model: 'Demio', year: 2013, chassisNumber: '', stockNumber: 'veh-inv-2', amountUsd: 7840 },
  ] },
  // Additional multi-vehicle examples: one fully allocated TT and one partial TT.
  { id: 'inv-bulk-002', customerId: 'cust-123', vehicleId: 'veh-inv-7', vehicleSlug: '2013-volvo-v40-veh-inv-7', make: 'Volvo', model: 'V40', year: 2013, totalAmountUsd: 23200.00, invoicedAt: '2026-08-16T09:00:00.000Z', status: 'Issued', vehicleItems: [
    { vehicleId: 'veh-inv-7', make: 'Volvo', model: 'V40', year: 2013, chassisNumber: '', stockNumber: 'veh-inv-7', amountUsd: 10800 },
    { vehicleId: 'veh-inv-9', make: 'Toyota', model: 'Corolla Fielder', year: 2013, chassisNumber: '', stockNumber: 'veh-inv-9', amountUsd: 12400 },
  ] },
  { id: 'inv-bulk-003', customerId: 'cust-123', vehicleId: 'veh-inv-10', vehicleSlug: '2013-toyota-premio-veh-inv-10', make: 'Toyota', model: 'Premio', year: 2013, totalAmountUsd: 15940.00, invoicedAt: '2026-08-17T09:00:00.000Z', status: 'Issued', vehicleItems: [
    { vehicleId: 'veh-inv-10', make: 'Toyota', model: 'Premio', year: 2013, chassisNumber: '', stockNumber: 'veh-inv-10', amountUsd: 9440 },
    { vehicleId: 'veh-inv-15', make: 'Mazda', model: 'Demio', year: 2012, chassisNumber: '', stockNumber: 'veh-inv-15', amountUsd: 6500 },
  ] },
  // 16 Invoiced vehicles for cust-123 (matching Image 2)
  { id: 'inv-001', customerId: 'cust-123', vehicleId: 'veh-inv-1', vehicleSlug: '2021-toyota-corolla-fielder-veh-inv-1', make: 'Toyota', model: 'Corolla Fielder', year: 2021, totalAmountUsd: 17360.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-002', customerId: 'cust-123', vehicleId: 'veh-inv-2', vehicleSlug: '2013-mazda-demio-veh-inv-2', make: 'Mazda', model: 'Demio', year: 2013, totalAmountUsd: 7840.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-003', customerId: 'cust-123', vehicleId: 'veh-inv-3', vehicleSlug: '2013-toyota-premio-veh-inv-3', make: 'Toyota', model: 'Premio', year: 2013, totalAmountUsd: 9690.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-005', customerId: 'cust-123', vehicleId: 'veh-inv-5', vehicleSlug: '2019-suzuki-alto-veh-inv-5', make: 'Suzuki', model: 'Alto', year: 2019, totalAmountUsd: 12780.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-006', customerId: 'cust-123', vehicleId: 'veh-inv-6', vehicleSlug: '2019-toyota-succeed-van-veh-inv-6', make: 'Toyota', model: 'Succeed Van', year: 2019, totalAmountUsd: 13770.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-007', customerId: 'cust-123', vehicleId: 'veh-inv-7', vehicleSlug: '2013-volvo-v40-veh-inv-7', make: 'Volvo', model: 'V40', year: 2013, totalAmountUsd: 10800.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-008', customerId: 'cust-123', vehicleId: 'veh-inv-8', vehicleSlug: '2013-volvo-v40-veh-inv-8', make: 'Volvo', model: 'V40', year: 2013, totalAmountUsd: 10800.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-009', customerId: 'cust-123', vehicleId: 'veh-inv-9', vehicleSlug: '2013-toyota-corolla-fielder-veh-inv-9', make: 'Toyota', model: 'Corolla Fielder', year: 2013, totalAmountUsd: 12400.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-010', customerId: 'cust-123', vehicleId: 'veh-inv-10', vehicleSlug: '2013-toyota-premio-veh-inv-10', make: 'Toyota', model: 'Premio', year: 2013, totalAmountUsd: 9690.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-011', customerId: 'cust-123', vehicleId: 'veh-inv-11', vehicleSlug: '2023-audi-r8-coupe-v10-performance-veh-inv-11', make: 'Audi', model: 'R8 Coupe V10 Performance', year: 2023, totalAmountUsd: 145000.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-012', customerId: 'cust-123', vehicleId: 'veh-inv-12', vehicleSlug: '2024-porsche-911-gt3-rs-veh-inv-12', make: 'Porsche', model: '911 GT3 RS', year: 2024, totalAmountUsd: 220000.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-013', customerId: 'cust-123', vehicleId: 'veh-inv-13', vehicleSlug: '2023-tesla-model-s-plaid-veh-inv-13', make: 'Tesla', model: 'Model S Plaid', year: 2023, totalAmountUsd: 89000.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-014', customerId: 'cust-123', vehicleId: 'veh-inv-14', vehicleSlug: '2024-land-rover-range-rover-sport-sv-veh-inv-14', make: 'Land Rover', model: 'Range Rover Sport SV', year: 2024, totalAmountUsd: 130000.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-015', customerId: 'cust-123', vehicleId: 'veh-inv-15', vehicleSlug: '2012-mazda-demio-veh-inv-15', make: 'Mazda', model: 'Demio', year: 2012, totalAmountUsd: 6500.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
  { id: 'inv-016', customerId: 'cust-123', vehicleId: 'veh-2', vehicleSlug: '2020-toyota-hiace-van-veh-2', make: 'Toyota', model: 'HiAce Van', year: 2020, totalAmountUsd: 14200.00, invoicedAt: '2026-08-09T14:30:00.000Z', status: 'Issued' },
  { id: 'inv-017', customerId: 'cust-123', vehicleId: 'veh-inv-4', vehicleSlug: '2013-volkswagen-golf-veh-inv-4', make: 'Volkswagen', model: 'Golf', year: 2013, totalAmountUsd: 11200.00, invoicedAt: '2026-08-10T10:00:00.000Z', status: 'Issued' },
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
    id: 'alloc-bulk-001', customerId: 'cust-123', paymentId: 'pay-bulk-001', invoiceId: 'inv-bulk-001', vehicleId: 'veh-inv-1', purpose: 'Balance', amountUsd: 17360.00, allocatedAt: '2026-08-14T09:00:00.000Z', status: 'Approved',
  },
  {
    id: 'alloc-bulk-002', customerId: 'cust-123', paymentId: 'pay-bulk-001', invoiceId: 'inv-bulk-001', vehicleId: 'veh-inv-2', purpose: 'Balance', amountUsd: 7840.00, allocatedAt: '2026-08-14T09:00:00.000Z', status: 'Approved',
  },
  {
    id: 'alloc-partial-001', customerId: 'cust-123', paymentId: 'pay-partial-001', invoiceId: 'inv-003', vehicleId: 'veh-inv-3', purpose: 'Balance', amountUsd: 2000.00, allocatedAt: '2026-08-15T09:00:00.000Z', status: 'Approved',
  },
  {
    id: 'alloc-bulk-002-001', customerId: 'cust-123', paymentId: 'pay-bulk-002', invoiceId: 'inv-bulk-002', vehicleId: 'veh-inv-7', purpose: 'Advance', amountUsd: 9000.00, allocatedAt: '2026-08-16T09:00:00.000Z', status: 'Approved',
  },
  {
    id: 'alloc-bulk-002-002', customerId: 'cust-123', paymentId: 'pay-bulk-002', invoiceId: 'inv-bulk-002', vehicleId: 'veh-inv-9', purpose: 'Advance', amountUsd: 9000.00, allocatedAt: '2026-08-16T09:00:00.000Z', status: 'Approved',
  },
  {
    id: 'alloc-partial-002-001', customerId: 'cust-123', paymentId: 'pay-partial-002', invoiceId: 'inv-bulk-003', vehicleId: 'veh-inv-10', purpose: 'Balance', amountUsd: 8000.00, allocatedAt: '2026-08-17T09:00:00.000Z', status: 'Approved',
  },
  {
    id: 'alloc-partial-002-002', customerId: 'cust-123', paymentId: 'pay-partial-002', invoiceId: 'inv-bulk-003', vehicleId: 'veh-inv-15', purpose: 'Balance', amountUsd: 4000.00, allocatedAt: '2026-08-17T09:00:00.000Z', status: 'Approved',
  },
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
  {
    id: 'alloc-004',
    customerId: 'cust-123',
    paymentId: 'pay-006',
    invoiceId: 'inv-005',
    amountUsd: 12780.00,
    allocatedAt: '2026-08-12T14:00:00.000Z',
    status: 'Approved',
  },
  {
    id: 'alloc-005',
    customerId: 'cust-123',
    paymentId: 'pay-007',
    invoiceId: 'inv-016',
    amountUsd: 7100.00,
    allocatedAt: '2026-08-12T14:00:00.000Z',
    status: 'Approved',
  },
];

// Seed data for payments (D02-P02-T001)
const seedPayments: PaymentRecord[] = [
  {
    id: 'pay-bulk-001', customerId: 'cust-123', invoiceId: 'inv-bulk-001', amountUsd: 25200.00, paidAt: '2026-08-14T08:00:00.000Z', paymentDate: '2026-08-14T08:00:00.000Z', status: 'Approved', reference: 'TT-2026-BULK-25200', bankName: 'Sumitomo Mitsui Banking Corp', currency: 'USD', remarks: 'Final balance TT allocated to two vehicles', idempotencyKey: 'seed-pay-bulk-001',
  },
  {
    id: 'pay-partial-001', customerId: 'cust-123', invoiceId: 'inv-003', amountUsd: 6000.00, paidAt: '2026-08-15T08:00:00.000Z', paymentDate: '2026-08-15T08:00:00.000Z', status: 'Approved', reference: 'TT-2026-PARTIAL-6000', bankName: 'MUFG Bank Tokyo', currency: 'USD', remarks: 'Balance TT pending further allocation', idempotencyKey: 'seed-pay-partial-001',
  },
  {
    id: 'pay-bulk-002', customerId: 'cust-123', invoiceId: 'inv-bulk-002', amountUsd: 18000.00, paidAt: '2026-08-16T08:00:00.000Z', paymentDate: '2026-08-16T08:00:00.000Z', status: 'Approved', reference: 'TT-2026-BULK-18000', bankName: 'Sumitomo Mitsui Banking Corp', currency: 'USD', remarks: 'Advance TT fully allocated across two vehicles', idempotencyKey: 'seed-pay-bulk-002',
  },
  {
    id: 'pay-partial-002', customerId: 'cust-123', invoiceId: 'inv-bulk-003', amountUsd: 24000.00, paidAt: '2026-08-17T08:00:00.000Z', paymentDate: '2026-08-17T08:00:00.000Z', status: 'Approved', reference: 'TT-2026-PARTIAL-24000', bankName: 'MUFG Bank Tokyo', currency: 'USD', remarks: 'Balance TT partially allocated across two vehicles', idempotencyKey: 'seed-pay-partial-002',
  },
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
  // Active customer: finance review states used by the payment journal filters
  {
    id: 'pay-cust123-hold-001',
    customerId: 'cust-123',
    invoiceId: 'inv-003',
    amountUsd: 4200.00,
    paidAt: '2026-08-14T10:30:00.000Z',
    status: 'Held',
    holdReason: 'Awaiting additional bank confirmation',
    financeNote: 'Finance is verifying the beneficiary bank confirmation before releasing this payment.',
    reference: 'TT-2026-4200-HOLD',
    bankName: 'Standard Chartered Bank',
    currency: 'USD',
    remarks: 'Payment temporarily held for finance review',
    idempotencyKey: 'seed-pay-cust123-hold-001',
  },
  {
    id: 'pay-cust123-rejected-001',
    customerId: 'cust-123',
    invoiceId: 'inv-003',
    amountUsd: 2800.00,
    paidAt: '2026-08-15T11:15:00.000Z',
    status: 'Rejected',
    financeNote: 'The uploaded payment proof did not include a verifiable bank reference. Please submit a corrected document.',
    reference: 'TT-2026-2800-REJECTED',
    bankName: 'MUFG Bank Tokyo',
    currency: 'USD',
    remarks: 'Payment proof rejected because the reference was incomplete',
    idempotencyKey: 'seed-pay-cust123-rejected-001',
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
    vehicleId: 'veh-inv-1',
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
    vehicleId: 'veh-inv-2',
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
    related: { kind: 'Shipment', id: 'ship-001', href: '/customer/vehicles' },
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
    name: 'Prabodha Wijerathne',
    companyName: 'Prabodha Wijerathne',
    phone: '+94 77 123 4567',
    deliveryAddress: 'No.414, Polhengoda Road, Colombo 05',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
  {
    customerId: 'user-other-456',
    name: 'Amina Njeri',
    companyName: 'Njeri Auto Imports',
    phone: '+254 712 345 678',
    deliveryAddress: 'Westlands Road, Nairobi, Kenya',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
  {
    customerId: 'cust-silver-789',
    name: 'Daniel Mwangi',
    companyName: 'Mwangi Mobility Ltd.',
    phone: '+254 723 456 789',
    deliveryAddress: 'Mombasa Road, Nairobi, Kenya',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
  {
    customerId: 'cust-gold-012',
    name: 'Haruto Sato',
    companyName: 'Sato Trading Co.',
    phone: '+81 90 1234 5678',
    deliveryAddress: 'Chiyoda-ku, Tokyo, Japan',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
  {
    customerId: 'cust-platinum-345',
    name: 'Sofia Almeida',
    companyName: 'Almeida Motors',
    phone: '+351 912 345 678',
    deliveryAddress: 'Avenida da Liberdade, Lisbon, Portugal',
    version: 1,
    updatedAt: '2026-08-14T08:00:00.000Z',
  },
  {
    customerId: 'cust-exception-001',
    name: 'Exception Customer',
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
  paidAmountUsd: number;
  issuedAt: string;
  paymentDeadline: string;
  status: 'Issued' | 'Expired' | 'Cancelled';
}

const seedProformaInvoices: ProformaInvoiceRecord[] = [
  {
    id: 'pi-001',
    customerId: 'cust-123',
    vehicleId: 'veh-pi-1',
    vehicleSlug: '2013-volvo-v40-veh-pi-1',
    make: 'Volvo',
    model: 'V40',
    year: 2013,
    totalAmountUsd: 10800.00,
    paidAmountUsd: 2160.00,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-15T10:00:00.000Z',
    status: 'Issued',
  },
  {
    id: 'pi-002',
    customerId: 'cust-123',
    vehicleId: 'veh-pi-2',
    vehicleSlug: '2019-mazda-cx-8-veh-pi-2',
    make: 'Mazda',
    model: 'CX-8',
    year: 2019,
    totalAmountUsd: 10192.00,
    paidAmountUsd: 3567.20,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-15T10:00:00.000Z',
    status: 'Issued',
  },
  {
    id: 'pi-003',
    customerId: 'cust-123',
    vehicleId: 'veh-pi-3',
    vehicleSlug: '2019-subaru-impreza-wagon-veh-pi-3',
    make: 'Subaru',
    model: 'Impreza Wagon',
    year: 2019,
    totalAmountUsd: 12480.00,
    paidAmountUsd: 6240.00,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-15T10:00:00.000Z',
    status: 'Issued',
  },
  {
    id: 'pi-004',
    customerId: 'cust-123',
    vehicleId: 'veh-pi-4',
    vehicleSlug: '2013-volvo-v40-veh-pi-4',
    make: 'Volvo',
    model: 'V40',
    year: 2013,
    totalAmountUsd: 10800.00,
    paidAmountUsd: 2700.00,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-15T10:00:00.000Z',
    status: 'Issued',
  },
  {
    id: 'pi-005',
    customerId: 'cust-123',
    vehicleId: 'veh-pi-5',
    vehicleSlug: '2019-suzuki-alto-veh-pi-5',
    make: 'Suzuki',
    model: 'Alto',
    year: 2019,
    totalAmountUsd: 12480.00,
    paidAmountUsd: 4992.00,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-15T10:00:00.000Z',
    status: 'Issued',
  },
  {
    id: 'pi-006',
    customerId: 'cust-123',
    vehicleId: 'veh-pi-6',
    vehicleSlug: '2015-mazda-cx-3-veh-pi-6',
    make: 'Mazda',
    model: 'CX-3',
    year: 2015,
    totalAmountUsd: 8624.00,
    paidAmountUsd: 2587.20,
    issuedAt: '2026-08-10T10:00:00.000Z',
    paymentDeadline: '2026-08-15T10:00:00.000Z',
    status: 'Issued',
  },
];

/**
 * Builds customer fleet vehicle projections from linked mock records (CUST-10, CUST-11, CUST-12, CUST-13, RULE-04, RULE-07, RULE-08, RULE-09).
 * Ensures:
 * 1. Strict customer scoping (RULE-04)
 * 2. Zero duplicate vehicle listings across categories (RULE-08)
 * 3. Server-computed 30% deposit calculations (RULE-07)
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
  nowISO: string = '2026-08-10T10:00:00.000Z',
  vehicleStatusDefinitions: VehicleStatusDefinition[] = seedVehicleStatusDefinitions
): CustomerVehicleDetail[] {
  const relevantVehicleIds = new Set<string>();

  for (const inv of invoices) {
    if (inv.customerId !== customerId) continue;
    relevantVehicleIds.add(inv.vehicleId);
    for (const item of inv.vehicleItems || []) relevantVehicleIds.add(item.vehicleId);
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
    const inv = findCanonicalInvoice(invoices, customerId, vId);
    const shipment = shipments.find((s) => s.customerId === customerId && s.vehicleId === vId);
    const invoiceTotalAmountUsd = inv ? getInvoiceVehicleAmount(inv, vId) : (pi?.totalAmountUsd ?? 0);
    const customerAllocs = inv
      ? allocations.filter((a) => (
        a.customerId === customerId &&
        a.invoiceId === inv.id &&
        (a.vehicleId || inv.vehicleId) === vId &&
        a.status === 'Approved'
      ))
      : [];
    const paidAmountUsd = inv
      ? Math.min(invoiceTotalAmountUsd, customerAllocs.reduce((sum, a) => sum + a.amountUsd, 0))
      : Math.max(0, Math.min(pi?.paidAmountUsd ?? 0, pi?.totalAmountUsd ?? 0));

    const priceUsd = vehicle.priceUsd;
    const totalAmountUsd = inv ? invoiceTotalAmountUsd : (pi ? pi.totalAmountUsd : priceUsd);
    const balanceAmountUsd = Math.max(0, totalAmountUsd - paidAmountUsd);
    const paymentStatus: CustomerVehiclePaymentStatus = paidAmountUsd <= 0
      ? 'Unpaid'
      : balanceAmountUsd > 0
        ? 'PartiallyPaid'
        : 'Paid';
    const invoiceFullyPaid = Boolean(inv && invoiceTotalAmountUsd > 0 && paymentStatus === 'Paid');

    // Determine status
    let status: CustomerVehicleStatus;
    if (invoiceFullyPaid && (shipment?.status === 'Delivered' || vehicle.status === 'Sold')) {
      status = 'Delivered';
    } else if (invoiceFullyPaid && (shipment?.status === 'InTransit' || vehicle.locationStatus === 'In Transit')) {
      status = 'In Transit';
    } else if (invoiceFullyPaid || (!inv && shipment?.status === 'Ready')) {
      status = 'Confirmed';
    } else if (inv || activePi || (vehicle.status === 'ReservedWithPI' && !piExpired)) {
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
        notes: piExpired ? '72-hour PI hold expired; vehicle returned to Now On Sale' : 'Proforma invoice issued with 30% deposit requirement',
      });
    }

    if (invoiceFullyPaid || status === 'In Transit' || status === 'Delivered') {
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
        issuedAt: pi.issuedAt,
      });
    }
    if (inv) {
      docs.push({
        id: `doc-inv-${vId}`,
        type: 'CommercialInvoice',
        title: `Commercial Invoice ${inv.id.toUpperCase()}`,
        status: 'Available',
        issuedAt: inv.invoicedAt,
      });
    }
    if (shipment) {
      docs.push({
        id: `doc-bl-${vId}`,
        type: 'BillOfLading',
        title: 'Bill of Lading BL-789012',
        status: shipment.status === 'InTransit' || shipment.status === 'Delivered' ? 'Available' : 'Pending',
      });
      docs.push({
        id: `doc-ec-${vId}`,
        type: 'ExportCertificate',
        title: 'Japan Export Certificate',
        status: 'Available',
      });
      docs.push({
        id: `doc-ic-${vId}`,
        type: 'InspectionCertificate',
        title: 'JEVIC Pre-Shipment Inspection Certificate',
        status: 'Available',
      });
    }

    // Commercial bill calculation for invoiced vehicles
    let commercialBill: CustomerCommercialBillInfo | undefined;
    if (inv) {
      const soldAmountUsd = totalAmountUsd;
      commercialBill = {
        soldAmountUsd,
        paidAmountUsd,
        balanceAmountUsd,
      };
    }

    const stockNumber = vehicle.stockNumber || `STK: ${vehicle.chassisNumber.slice(0, 6)}`;
    const color = vehicle.color || 'White';
    const colorSpec = vehicle.spec || vehicle.color || 'White';
    const mileage = vehicle.mileage || 50000;
    const logisticsStatus = vehicle.logisticsStatus || (status === 'Delivered' ? 'DELIVERED' : status === 'In Transit' ? 'IN TRANSIT' : status === 'Confirmed' ? 'INSPECTION' : 'RESERVED');
    const piRef = pi ? `PI-${stockNumber.replace(/^STK:\s*/, '')}` : (status === 'Under Negotiation With PI' ? `PI-${stockNumber.replace(/^STK:\s*/, '')}` : undefined);
    const shippingStage = status === 'Delivered' ? 'Delivered' : status === 'In Transit' ? 'In Transit' : status === 'Confirmed' ? 'Inspection' : 'Reserved';
    // A live reservation overlays an otherwise available vehicle for the
    // customer projection. Resolve its display label from the Reserved
    // catalogue row while retaining the raw vehicle status code separately.
    const displayStatusCode = status === 'Under Negotiation'
      ? 'Reserved'
      : status === 'Under Negotiation With PI'
        ? 'ReservedWithPI'
        : status === 'Confirmed' || status === 'In Transit' || status === 'Delivered'
          ? 'Invoiced'
          : vehicle.status;
    const statusDefinition = resolveVehicleStatusDefinition(displayStatusCode, vehicleStatusDefinitions);

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
      stockType: vehicle.stockType,
      priceUsd,
      totalAmountUsd,
      status,
      paymentStatus,
      paidAmountUsd,
      balanceAmountUsd,
      invoiceTotalAmountUsd: inv ? invoiceTotalAmountUsd : undefined,
      vehicleStatusCode: statusDefinition.code,
      statusLabel: statusDefinition.singularLabel,
      statusLabelPlural: statusDefinition.pluralLabel,
      statusDescription: statusDefinition.description,
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
      mileage,
      engineSize: vehicle.engineCc !== undefined ? `${vehicle.engineCc} cc` : undefined,
      steering: vehicle.steering,
      seats: vehicle.seats,
      loadCapacity: vehicle.loadCapacity,
      invoiceId: inv?.id,
      shipmentId: shipment?.id,
      vesselName: shipment ? 'Global Highway' : undefined,
      etd: vehicle.etd,
      eta: vehicle.eta,
      billOfLadingNo: shipment ? 'BL-789012' : undefined,
      stockNumber,
      color,
      colorSpec,
      logisticsStatus,
      piRef,
      commercialBill,
      shippingStage,
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
  query?: ListCustomerVehiclesQuery,
  vehicleStatusDefinitions: VehicleStatusDefinition[] = seedVehicleStatusDefinitions
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
    if (s === 'reserved' || s === 'under negotiation' || s === 'undernegotiation') {
      filtered = filtered.filter((v) => v.status === 'Under Negotiation');
    } else if (s === 'with pi' || s === 'reserved with pi' || s === 'withpi' || s === 'under negotiation with pi' || s === 'undernegotiationwithpi') {
      filtered = filtered.filter((v) => v.status === 'Under Negotiation With PI');
    } else if (s === 'invoiced') {
      filtered = filtered.filter((v) => v.status === 'Confirmed' || v.status === 'In Transit' || v.status === 'Delivered');
    } else {
      filtered = filtered.filter((v) => v.status.toLowerCase() === s);
    }
  }

  if (query?.query) {
    const q = query.query.trim().toLowerCase();
    filtered = filtered.filter((v) =>
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.chassisNumber.toLowerCase().includes(q) ||
      (v.stockNumber && v.stockNumber.toLowerCase().includes(q)) ||
      (v.color && v.color.toLowerCase().includes(q)) ||
      String(v.year).includes(q)
    );
  }

  const page = Math.max(1, query?.page || 1);
  const limit = Math.max(1, Math.min(100, query?.limit || 100));
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
    paymentStatus: d.paymentStatus,
    paidAmountUsd: d.paidAmountUsd,
    balanceAmountUsd: d.balanceAmountUsd,
    invoiceTotalAmountUsd: d.invoiceTotalAmountUsd,
    invoiceId: d.invoiceId,
    vehicleStatusCode: d.vehicleStatusCode,
    statusLabel: d.statusLabel,
    statusLabelPlural: d.statusLabelPlural,
    statusDescription: d.statusDescription,
    locationStatus: d.locationStatus,
    destinationPort: d.destinationPort,
    reservationExpiresAt: d.reservationExpiresAt,
    proformaInvoiceId: d.proformaInvoiceId,
    paymentDeadline: d.paymentDeadline,
    deposit: d.deposit,
    stockNumber: d.stockNumber,
    color: d.color,
    colorSpec: d.colorSpec,
    mileage: d.mileage,
    logisticsStatus: d.logisticsStatus,
    piRef: d.piRef,
    commercialBill: d.commercialBill,
    shippingStage: d.shippingStage,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  return {
    items,
    total: filtered.length,
    countsByStatus,
    statusDefinitions: vehicleStatusDefinitions.filter((definition) => definition.active).sort((a, b) => a.sortOrder - b.sortOrder),
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
  nowISO: string = '2026-08-10T10:00:00.000Z'
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
      status,
      issuedAt: pi.issuedAt,
      dueDate: paymentDeadline,
      paymentDeadline,
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

    const allocationItems: CustomerInvoiceAllocationItem[] = customerAllocs.map((a) => ({
      id: a.id,
      paymentId: a.paymentId,
      amountUsd: a.amountUsd,
      allocatedAt: a.allocatedAt,
      status: a.status,
    }));

    const dueDate = new Date(new Date(inv.invoicedAt).getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString();
    const invoiceVehicles = Array.from(new Set(customerAllocs.map((allocation) => allocation.vehicleId || inv.vehicleId)))
      .map((vehicleId) => vehicles.find((candidate) => candidate.id === vehicleId))
      .filter((candidate): candidate is VehicleRecord => Boolean(candidate))
      .map((candidate) => ({
        id: candidate.id,
        chassisNumber: candidate.chassisNumber,
        make: candidate.make,
        model: candidate.model,
        year: candidate.year,
        slug: generateVehicleSlug(candidate.year, candidate.make, candidate.model, candidate.id),
        primaryImage: candidate.images?.[0],
      }));

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
      depositRequiredUsd: Math.round(totalAmountUsd * 0.3),
      status,
      issuedAt: inv.invoicedAt,
      dueDate,
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
      vehicles: invoiceVehicles.length > 0 ? invoiceVehicles : undefined,
      lineItems: [],
      allocations: allocationItems,
      bankDetails: undefined,
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
    status: d.status,
    issuedAt: d.issuedAt,
    dueDate: d.dueDate,
    paymentDeadline: d.paymentDeadline,
    currency: d.currency,
  }));

  return {
    items,
    total: filtered.length,
    page,
    limit,
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
        ${(invoice.vehicles && invoice.vehicles.length > 0 ? invoice.vehicles : [invoice.vehicle]).map((vehicle) =>
          `<p>${vehicle.year} ${vehicle.make} ${vehicle.model} (Chassis: ${vehicle.chassisNumber})</p>`
        ).join('')}
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
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    type: invoice.type,
    title: `${invoice.type === 'Proforma' ? 'Proforma Invoice' : 'Commercial Invoice'} ${invoice.invoiceNumber}`,
    contentHtml,
    status: 'Available',
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
  nowISO: string,
  maxActiveReservations: number,
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
  if (activeCountForCustomer >= maxActiveReservations) {
    throw new ReservationRequestError(
      409,
      `You already have ${maxActiveReservations} active reservations, the maximum allowed at once`,
      undefined,
      'limit_exceeded'
    );
  }
}

function releaseExpiredReservationStatus(
  vehicle: VehicleRecord,
  reservations: ReservationRecord[],
  nowISO: string,
): void {
  if (vehicle.status !== 'Reserved') return;
  const vehicleReservations = reservations.filter((reservation) => reservation.vehicleId === vehicle.id);
  const hasExpiredHold = vehicleReservations.some((reservation) => !isReservationActive(reservation, nowISO));
  const hasActiveHold = vehicleReservations.some((reservation) => isReservationActive(reservation, nowISO));
  if (hasExpiredHold && !hasActiveHold) vehicle.status = 'Available';
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
    name: record.name || email.split('@')[0] || 'Customer',
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

function toCustomerPayment(record: PaymentRecord, invoices: InvoiceRecord[] = [], allocations: AllocationRecord[] = [], customerName?: string): CustomerPayment {
  const invoice = invoices.find((candidate) => candidate.id === record.invoiceId && candidate.customerId === record.customerId);
  const allocatedAmountUsd = allocations
    .filter((allocation) => allocation.customerId === record.customerId && allocation.paymentId === record.id && allocation.status === 'Approved')
    .reduce((sum, allocation) => sum + allocation.amountUsd, 0);
  return {
    id: record.id,
    customerId: record.customerId,
    invoiceId: record.invoiceId,
    reference: record.reference || record.id.toUpperCase(),
    bankName: record.bankName || 'Unspecified bank',
    currency: record.currency || 'USD',
    amountUsd: record.amountUsd,
    allocatedAmountUsd,
    remainingBalanceUsd: Math.max(record.amountUsd - allocatedAmountUsd, 0),
    customerName: record.customerName || customerName || record.customerId,
    depositorName: record.depositorName || customerName || record.customerId,
    ...(record.status === 'Approved' ? { approvedDate: record.paidAt } : {}),
    ...(record.financeNote ? { financeNote: record.financeNote } : {}),
    paymentDate: record.paymentDate || record.paidAt,
    remarks: record.remarks,
    status: record.status,
    holdReason: record.holdReason,
    proof: record.proof,
    idempotencyKey: record.idempotencyKey || record.id,
    createdAt: record.createdAt || record.paidAt,
  };
}

/** Customer-safe TT-to-vehicle projection.  Allocation ownership is always
 * derived from the payment/customer rows, never from caller-supplied IDs. */
function buildCustomerPaymentAllocationSummaries(
  customerId: string,
  payments: PaymentRecord[],
  allocations: AllocationRecord[],
  invoices: InvoiceRecord[],
  vehicles: VehicleRecord[],
): CustomerPaymentAllocationSummary[] {
  return payments
    .filter((payment) => payment.customerId === customerId)
    .map((payment) => {
      const rows = allocations.filter((allocation) => allocation.customerId === customerId && allocation.paymentId === payment.id);
      const approved = rows.filter((row) => row.status === 'Approved');
      const allocatedAmountUsd = approved.reduce((total, row) => total + row.amountUsd, 0);
      const vehicleIds = new Set(rows.map((row) => row.vehicleId || invoices.find((invoice) => invoice.id === row.invoiceId)?.vehicleId).filter(Boolean));
      const invoiceId = rows.find((row) => row.invoiceId)?.invoiceId || payment.invoiceId;
      const invoice = invoiceId ? invoices.find((candidate) => candidate.id === invoiceId && candidate.customerId === customerId) : undefined;
      const invoicePaid = invoice
        ? allocations.filter((row) => row.customerId === customerId && row.invoiceId === invoice.id && row.status === 'Approved').reduce((total, row) => total + row.amountUsd, 0)
        : 0;
      const allocationStatus: CustomerPaymentAllocationSummary['allocationStatus'] = allocatedAmountUsd <= 0
        ? 'Unallocated'
        : allocatedAmountUsd >= payment.amountUsd ? 'FullyAllocated' : 'PartiallyAllocated';
      const allocationLines = rows.map((row) => {
        const vehicle = vehicles.find((candidate) => candidate.id === (row.vehicleId || invoice?.vehicleId));
        if (!vehicle) return null;
        const rowInvoice = invoices.find((candidate) => candidate.id === row.invoiceId && candidate.customerId === customerId);
        const allocationVehicleId = row.vehicleId || rowInvoice?.vehicleId;
        const invoiceItem = rowInvoice?.vehicleItems?.find((item) => item.vehicleId === allocationVehicleId);
        const vehicleTotalAmountUsd = invoiceItem?.amountUsd
          ?? (rowInvoice?.vehicleItems?.length ? 0 : rowInvoice?.totalAmountUsd ?? 0);
        const vehicleAllocatedAmountUsd = rowInvoice
          ? allocations
            .filter((allocation) => allocation.customerId === customerId
              && allocation.invoiceId === rowInvoice.id
              && (allocation.vehicleId || rowInvoice.vehicleId) === allocationVehicleId
              && allocation.status === 'Approved')
            .reduce((total, allocation) => total + allocation.amountUsd, 0)
          : 0;
        return {
          id: row.id,
          vehicle: {
            id: vehicle.id,
            slug: generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id),
            stockNumber: vehicle.stockNumber || vehicle.id,
            chassisNumber: vehicle.chassisNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            primaryImage: vehicle.images?.[0],
          },
          ...(rowInvoice ? { invoiceId: rowInvoice.id, invoiceNumber: `INV-${rowInvoice.id.replace(/^inv-?/i, '').padStart(4, '0')}` } : {}),
          amountUsd: row.amountUsd,
          vehicleTotalAmountUsd,
          vehicleAllocatedAmountUsd,
          vehicleBalanceAmountUsd: Math.max(vehicleTotalAmountUsd - vehicleAllocatedAmountUsd, 0),
          purpose: row.purpose || 'Balance',
          status: row.status,
          allocatedAt: row.allocatedAt,
        };
      }).filter((row): row is NonNullable<typeof row> => Boolean(row));
      return {
        id: payment.id,
        reference: payment.reference || payment.id.toUpperCase(),
        bankName: payment.bankName || 'Unspecified bank',
        currency: payment.currency || 'USD',
        amountUsd: payment.amountUsd,
        paymentDate: payment.paymentDate || payment.paidAt,
        paymentStatus: payment.status,
        allocationStatus,
        allocatedAmountUsd,
        unallocatedAmountUsd: Math.max(payment.amountUsd - allocatedAmountUsd, 0),
        allocationPercent: payment.amountUsd > 0 ? Math.round((allocatedAmountUsd / payment.amountUsd) * 100) : 0,
        vehicleCount: vehicleIds.size,
        allocations: allocationLines,
        ...(invoice ? {
          invoice: {
            id: invoice.id,
            invoiceNumber: `INV-${invoice.id.replace(/^inv-?/i, '').padStart(4, '0')}`,
            issuedAt: invoice.invoicedAt,
            totalAmountUsd: invoice.totalAmountUsd,
            paidAmountUsd: invoicePaid,
            outstandingAmountUsd: Math.max(invoice.totalAmountUsd - invoicePaid, 0),
            status: (invoicePaid >= invoice.totalAmountUsd ? 'Paid' : invoicePaid > 0 ? 'PartiallyPaid' : 'Issued') as CustomerInvoiceStatus,
            vehicleCount: new Set(allocations.filter((row) => row.invoiceId === invoice.id).map((row) => row.vehicleId || invoice.vehicleId)).size,
            documentAvailable: true,
          },
        } : {}),
      };
    })
    .sort((left, right) => right.paymentDate.localeCompare(left.paymentDate));
}

function queryCustomerPaymentAllocations(
  summaries: CustomerPaymentAllocationSummary[],
  query?: ListCustomerPaymentAllocationsQuery,
): CustomerPaymentAllocationListResponse {
  let filtered = summaries;
  const term = query?.query?.trim().toLowerCase();
  if (term) filtered = filtered.filter((item) => `${item.reference} ${item.bankName} ${item.invoice?.invoiceNumber || ''} ${item.allocations.map((row) => `${row.vehicle.make} ${row.vehicle.model} ${row.vehicle.stockNumber}`).join(' ')}`.toLowerCase().includes(term));
  if (query?.paymentStatus) filtered = filtered.filter((item) => item.paymentStatus === query.paymentStatus);
  if (query?.allocationStatus) filtered = filtered.filter((item) => item.allocationStatus === query.allocationStatus);
  if (query?.purpose) filtered = filtered.filter((item) => item.allocations.some((row) => row.purpose === query.purpose));
  if (query?.scope === 'SingleVehicle') filtered = filtered.filter((item) => item.vehicleCount === 1);
  if (query?.scope === 'MultipleVehicles') filtered = filtered.filter((item) => item.vehicleCount > 1);
  if (query?.from) filtered = filtered.filter((item) => item.paymentDate >= query.from!);
  if (query?.to) filtered = filtered.filter((item) => item.paymentDate <= `${query.to}T23:59:59.999Z`);
  const page = Math.max(1, Number(query?.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
  const totals = filtered.reduce((result, item) => ({
    totalAmountUsd: result.totalAmountUsd + item.amountUsd,
    allocatedAmountUsd: result.allocatedAmountUsd + item.allocatedAmountUsd,
    unallocatedAmountUsd: result.unallocatedAmountUsd + item.unallocatedAmountUsd,
    invoiceCount: result.invoiceCount + (item.invoice ? 1 : 0),
  }), { totalAmountUsd: 0, allocatedAmountUsd: 0, unallocatedAmountUsd: 0, invoiceCount: 0 });
  return { items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit, totals };
}

function toCustomerPaymentNotification(record: PaymentNotificationRecord): CustomerPaymentNotification {
  return {
    id: record.id,
    customerId: record.customerId,
    paymentId: record.paymentId,
    invoiceId: record.invoiceId,
    event: record.event,
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
    payment.financeNote = request.reason.trim();
  } else if (request.event === 'PaymentResubmitted') {
    if (current !== 'Held') throw new PaymentWorkflowError(409, 'Only a held payment can be resubmitted');
    payment.status = 'Resubmitted';
  } else if (request.event === 'PaymentApproved') {
    if (!['Pending', 'Held', 'Resubmitted'].includes(current)) throw new PaymentWorkflowError(409, 'Payment cannot be approved from its current state');
    payment.status = 'Approved';
  } else if (request.event === 'PaymentAllocated') {
    if (current !== 'Approved') throw new PaymentWorkflowError(409, 'Only an approved payment can be allocated');
    if (!payment.invoiceId) throw new PaymentWorkflowError(409, 'Sales allocation requires an invoice to be issued first');
    const alreadyAllocated = allocations.filter((item) => item.paymentId === payment.id && item.status === 'Approved').reduce((sum, item) => sum + item.amountUsd, 0);
    const amount = request.allocationAmountUsd ?? payment.amountUsd;
    const invoice = seedInvoices.find((item) => item.id === payment.invoiceId && item.customerId === payment.customerId);
    const allocationVehicleId = invoice?.vehicleId;
    const invoiceVehicleTotal = invoice && allocationVehicleId ? getInvoiceVehicleAmount(invoice, allocationVehicleId) : invoice?.totalAmountUsd || 0;
    const invoiceRemaining = invoice ? Math.max(invoiceVehicleTotal - allocations
      .filter((item) => item.invoiceId === payment.invoiceId && item.status === 'Approved' && (!allocationVehicleId || (item.vehicleId || invoice.vehicleId) === allocationVehicleId))
      .reduce((sum, item) => sum + item.amountUsd, 0), 0) : 0;
    if (!Number.isFinite(amount) || amount <= 0 || amount > payment.amountUsd - alreadyAllocated || amount > invoiceRemaining) throw new PaymentWorkflowError(409, 'Allocation exceeds the available payment or invoice balance');
    allocations.push({ id: `alloc-${payment.id}`, customerId: payment.customerId, paymentId: payment.id, invoiceId: payment.invoiceId, vehicleId: allocationVehicleId, amountUsd: amount, allocatedAt: nowISO, status: 'Approved' });
    payment.status = 'Approved';
  }

  const record: PaymentNotificationRecord = {
    id: `pay-event-${notifications.length + 1}`, customerId: payment.customerId, paymentId: payment.id,
    invoiceId: payment.invoiceId || 'unallocated', event: request.event, deliveryStatus: 'Queued', createdAt: nowISO,
  };
  notifications.push(record);
  return record;
}

const SUPPORTED_PAYMENT_CURRENCIES_SET = new Set([
  'USD',
  'JPY',
  'EUR',
  'GBP',
  'KES',
  'AED',
  'AUD',
  'CAD',
  'NZD',
  'SGD',
]);

function validatePaymentRequest(request: CreateCustomerPaymentRequest): void {
  if (!request || !request.reference || !request.bankName || !SUPPORTED_PAYMENT_CURRENCIES_SET.has(request.currency)) throw new Error('Invalid payment reference');
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
  let invoice = request.invoiceId ? invoices.find((candidate) => candidate.id === request.invoiceId) : undefined;
  if (!invoice && (request.invoiceId === 'INV-GENERAL' || request.invoiceId === 'GENERAL')) {
    invoice = invoices.find((candidate) => candidate.customerId === customerId);
  }
  if (request.invoiceId && !invoice) {
    throw new Error('Invoice not found or not owned by customer');
  }
  const duplicate = existing.find((payment) => payment.customerId === customerId && payment.idempotencyKey === request.idempotencyKey);
  if (duplicate) return duplicate;
  const record: PaymentRecord = {
    id: `pay-${Date.now()}-${existing.length + 1}`,
    customerId,
    invoiceId: invoice?.id,
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
  private bankAccounts = seedBankAccounts.map((b) => ({ ...b }));
  private config = { ...seedConfig };
  private vehicleStatusDefinitions = seedVehicleStatusDefinitions.map((definition) => ({ ...definition }));
  private vehicles = preparedSeedVehicles.map((vehicle) => canonicalizeVehicle({ ...vehicle }));
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
  private customerAccounts: CustomerAccountRecord[] = [
    buildSeedCustomerAccount(),
    buildSeedOtherCustomerAccount(),
    buildSeedTierAccount('cust-silver-789', 'daniel.mwangi@example.com', 'Daniel Mwangi', 'KE', 'Silver'),
    buildSeedTierAccount('cust-gold-012', 'haruto.sato@example.com', 'Haruto Sato', 'JP', 'Gold'),
    buildSeedTierAccount('cust-platinum-345', 'sofia.almeida@example.com', 'Sofia Almeida', 'PT', 'Platinum'),
  ];
  private tierRules = new Map<CustomerTier, CustomerTierRule>(seedTierRules.map((rule) => [rule.tier, { ...rule }]));
  private passwordResetOutbox: PasswordResetOutboxRecord[] = [];
  private wishlistItems: WishlistItemRecord[] = [];
  private wishlistSeq = 0;
  private favourites: FavouriteSearchRecord[] = [];
  private favouriteSeq = 0;

  ready(): Promise<void> {
    return Promise.resolve();
  }

  getConfig(): Promise<PublicConfig> {
    return Promise.resolve({ ...this.config });
  }

  getCustomerTier(customerId: string): Promise<CustomerTier> {
    return Promise.resolve(this.customerAccounts.find((account) => account.customerId === customerId)?.tier || 'Standard');
  }

  async getCustomerTierBenefits(customerId: string, nowISO = new Date().toISOString()): Promise<CustomerTierBenefits> {
    const tier = await this.getCustomerTier(customerId);
    const rule = this.tierRules.get(tier) || this.tierRules.get('Standard')!;
    const activeReservations = this.reservations.filter((reservation) => reservation.customerId === customerId && isReservationActive(reservation, nowISO)).length;
    return {
      tier,
      discountPercent: rule.discountPercent,
      maxActiveReservations: rule.maxActiveReservations,
      activeReservations,
      remainingReservations: Math.max(0, rule.maxActiveReservations - activeReservations),
      description: rule.description,
    };
  }

  getBankAccounts(): Promise<BankAccount[]> {
    return Promise.resolve(seedBankAccounts);
  }

  async getVehicles(query?: GetVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleSearchResult> {
    const effectiveTier = context?.customerId ? await this.getCustomerTier(context.customerId) : (context?.customerTier || query?.tier);
    const tierRule = this.tierRules.get(effectiveTier as CustomerTier);
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations: this.reservations,
      customerTier: effectiveTier as CustomerTier,
      tierRule,
    };
    const filteredList = filterAndSortVehicles(this.vehicles, query, mergedContext);
    const facets = calculateSearchFacets(this.vehicles, query, mergedContext);

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
    const record = findVehicleRecord(this.vehicles, idOrSlug);
    if (!record) return null;
    if ((context?.audience || 'public') !== 'salesperson' && record.status === 'Draft') {
      return null;
    }
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations: this.reservations,
      customerTier: context?.customerId ? await this.getCustomerTier(context.customerId) : context?.customerTier,
      allocatedCustomerId: findAllocatedCustomerId(this.invoices, record.id),
      vehicleStatusDefinitions: this.vehicleStatusDefinitions,
    };
    mergedContext.tierRule = mergedContext.customerTier ? this.tierRules.get(mergedContext.customerTier) : undefined;
    return buildVehicleDetail(record, mergedContext);
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

  async createEnquiry(request: EnquiryRequest, customerId = 'cust-123'): Promise<EnquiryResponse> {
    assertVehicleEnquiryAllowed(this.vehicles, this.invoices, request, customerId);
    const prepared = prepareEnquiry(this.vehicles, freightDestinations, freightPorts, freightRateRecords, request, FREIGHT_REFERENCE_DATE, customerId);
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

  listCustomerInquiries(customerId: string): Promise<CustomerInquiryListResponse> {
    const enquiries = this.enquiries.filter((e) => e.customerId === customerId && e.enquiryType === 'price-request');
    const vehicleSlugs = [...new Set(enquiries.map((e) => e.vehicleSlug).filter(Boolean))];
    const customerTier = this.customerAccounts.find((account) => account.customerId === customerId)?.tier || 'Standard';
    const tierRule = this.tierRules.get(customerTier);

    const items: CustomerInquirySummary[] = vehicleSlugs.map((slug) => {
      const enquiry = enquiries.find((e) => e.vehicleSlug === slug)!;
      const vehicle = this.vehicles.find((v) => generateVehicleSlug(v.year, v.make, v.model, v.id) === slug);
      const projection = vehicle
        ? projectVehicle(vehicle, { audience: 'customer', customerId, customerTier, tierRule })
        : undefined;
      const inquirerCount = this.enquiries.filter((e) => e.vehicleSlug === slug && e.enquiryType === 'price-request').reduce((acc, e) => {
        const key = e.customerId;
        const seen = new Set(acc.map((x) => x));
        if (!seen.has(key)) {
          seen.add(key);
        }
        return Array.from(seen);
      }, [] as string[]).length;

      return {
        vehicleSlug: slug!,
        vehicleId: vehicle?.id || '',
        vehicleTitle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle',
        requestedAt: enquiry.receivedAt,
        inquirerCount,
        stockNumber: vehicle?.stockNumber,
        chassisNumber: vehicle?.chassisNumber,
        imageUrl: projection?.images?.[0],
        engineCc: projection?.engineCc,
        mileage: projection?.mileage,
        fuelType: projection?.fuelType,
        transmission: projection?.transmission,
        color: projection?.color,
        priceState: projection?.priceState,
        priceUsd: projection?.priceState === 'priced' ? projection.priceUsd : undefined,
        tierPricing: projection?.tierPricing,
      };
    });

    return Promise.resolve({ items });
  }

  // No `await` between the eligibility check and the mutation below, so two
  // concurrent calls (e.g. `Promise.all([...])`) resolve this async function
  // body to completion, one after the other, without interleaving — the
  // second call always observes the first call's already-applied mutation
  // (RULE-08's "never both succeed" transactional requirement for a single
  // Node.js event loop).
  async createReservation(customerId: string, customerEmail: string, request: ReservationRequest, nowISO: string = new Date().toISOString()): Promise<ReservationResponse> {
    const vehicle = resolveReservationVehicle(this.vehicles, request);
    releaseExpiredReservationStatus(vehicle, this.reservations, nowISO);
    const tier = await this.getCustomerTier(customerId);
    const tierRule = this.tierRules.get(tier) || this.tierRules.get('Standard')!;
    checkReservationEligibility(vehicle, this.reservations, customerId, nowISO, tierRule.maxActiveReservations);

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
    this.ensureCustomerFleetInMemory(customerId);
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
    const customerPayments = this.payments.filter((p) => p.customerId === customerId && Boolean(p.invoiceId) && customerInvoiceIds.has(p.invoiceId!));
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

    return Promise.resolve({
      customerId,
      customerEmail,
      creditLimitUsd,
      outstandingBalanceUsd,
      creditUtilisationPercent: Math.round(creditUtilisationPercent * 10) / 10, // Round to 1 decimal place
      vehicleCountReserved: reservedVehicleIds.size,
      vehicleCountInvoiced: invoicedVehicleIds.size,
      vehicleCountDelivered: deliveredVehicleIds.size,
      paymentStatusSummary,
      shipmentStatusSummary,
      documentAvailabilityCount,
      notificationUnreadCount,
    });
  }

  private ensureCustomerFleetInMemory(customerId: string): void {
    if (customerId.startsWith('cust-exception')) return;
    const isRegistered = this.customerAccounts.some((a) => a.customerId === customerId) || customerId === 'cust-123';
    if (!isRegistered) return;
    const hasInvoices = this.invoices.some((i) => i.customerId === customerId);
    const hasPIs = this.proformaInvoices.some((p) => p.customerId === customerId);
    const hasReservations = this.reservations.some((r) => r.customerId === customerId);

    if (!hasPIs) {
      for (const pi of seedProformaInvoices) {
        this.proformaInvoices.push({
          ...pi,
          id: `pi-${customerId}-${pi.id.replace(/^pi-/, '')}`,
          customerId,
          paymentDeadline: '2029-01-01T00:00:00.000Z',
        });
      }
    }
    if (!hasInvoices) {
      for (const inv of seedInvoices) {
        if (inv.customerId === 'cust-123') {
          this.invoices.push({
            ...inv,
            id: `inv-${customerId}-${inv.id.replace(/^inv-/, '')}`,
            customerId,
          });
        }
      }
      for (const a of seedAllocations) {
        if (a.customerId === 'cust-123') {
          this.allocations.push({
            ...a,
            id: `alloc-${customerId}-${a.id.replace(/^alloc-/, '')}`,
            customerId,
            invoiceId: `inv-${customerId}-${a.invoiceId.replace(/^inv-/, '')}`,
            paymentId: `pay-${customerId}-${a.paymentId.replace(/^pay-/, '')}`,
          });
        }
      }
      for (const s of seedShipments) {
        if (s.customerId === 'cust-123') {
          this.shipments.push({
            ...s,
            id: `ship-${customerId}-${s.id.replace(/^ship-/, '')}`,
            customerId,
          });
        }
      }
      for (const d of seedDocuments) {
        if (d.customerId === 'cust-123') {
          this.documents.push({
            ...d,
            id: `doc-${customerId}-${d.id.replace(/^doc-/, '')}`,
            customerId,
            shipmentId: d.shipmentId ? `ship-${customerId}-${d.shipmentId.replace(/^ship-/, '')}` : undefined,
          });
        }
      }
    }
    if (!hasReservations) {
      this.reservations.push(
        {
          id: `res-${customerId}-1`,
          vehicleId: 'veh-1',
          vehicleSlug: '2021-toyota-corolla-axio-veh-1',
          customerId,
          customerEmail: `${customerId}@example.com`,
          createdAt: '2026-08-10T10:00:00.000Z',
          expiresAt: '2029-01-01T00:00:00.000Z',
          holdHours: 48,
        },
        {
          id: `res-${customerId}-2`,
          vehicleId: 'veh-5',
          vehicleSlug: '2021-honda-fit-hybrid-veh-5',
          customerId,
          customerEmail: `${customerId}@example.com`,
          createdAt: '2026-08-10T10:00:00.000Z',
          expiresAt: '2029-01-01T00:00:00.000Z',
          holdHours: 48,
        },
        {
          id: `res-${customerId}-3`,
          vehicleId: 'veh-7',
          vehicleSlug: '2023-lexus-rx450h-veh-7',
          customerId,
          customerEmail: `${customerId}@example.com`,
          createdAt: '2026-08-10T10:00:00.000Z',
          expiresAt: '2029-01-01T00:00:00.000Z',
          holdHours: 48,
        },
        {
          id: `res-${customerId}-4`,
          vehicleId: 'veh-9',
          vehicleSlug: '2019-mercedes-benz-c200-amg-line-veh-9',
          customerId,
          customerEmail: `${customerId}@example.com`,
          createdAt: '2026-08-10T10:00:00.000Z',
          expiresAt: '2029-01-01T00:00:00.000Z',
          holdHours: 48,
        },
        {
          id: `res-${customerId}-5`,
          vehicleId: 'veh-10',
          vehicleSlug: '2021-bmw-x3-xdrive20d-veh-10',
          customerId,
          customerEmail: `${customerId}@example.com`,
          createdAt: '2026-08-10T10:00:00.000Z',
          expiresAt: '2029-01-01T00:00:00.000Z',
          holdHours: 48,
        }
      );
    }
  }

  getCustomerVehicles(customerId: string, query?: ListCustomerVehiclesQuery, nowISO?: string): Promise<CustomerVehicleListResponse> {
    this.ensureCustomerFleetInMemory(customerId);
    const all = buildCustomerVehicleProjections(
      customerId,
      this.vehicles,
      this.reservations,
      this.proformaInvoices,
      this.invoices,
      this.allocations,
      this.shipments,
      this.documents,
      nowISO,
      this.vehicleStatusDefinitions
    );
    return Promise.resolve(queryCustomerVehicles(all, query, this.vehicleStatusDefinitions));
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
      nowISO,
      this.vehicleStatusDefinitions
    );
    const target = all.find((v) => v.id === idOrSlug || v.vehicleId === idOrSlug || v.slug === idOrSlug);
    return Promise.resolve(target || null);
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

  deleteCustomerNotification(customerId: string, notificationId: string): Promise<boolean> {
    const index = this.notifications.findIndex((candidate) => candidate.customerId === customerId && candidate.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
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
      nowISO
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
      nowISO
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
      nowISO
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    if (!target) return Promise.resolve(null);
    return Promise.resolve(buildCustomerInvoiceDocument(target));
  }

  listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse> {
    const customerName = this.customerAccounts.find((account) => account.customerId === customerId)?.nameWithInitials;
    const items = this.payments.filter((payment) => payment.customerId === customerId).map((payment) => toCustomerPayment(payment, this.invoices, this.allocations, customerName));
    return Promise.resolve({ items, total: items.length });
  }

  listCustomerPaymentAllocations(customerId: string, query?: ListCustomerPaymentAllocationsQuery): Promise<CustomerPaymentAllocationListResponse> {
    this.ensureCustomerFleetInMemory(customerId);
    return Promise.resolve(queryCustomerPaymentAllocations(
      buildCustomerPaymentAllocationSummaries(customerId, this.payments, this.allocations, this.invoices, this.vehicles),
      query,
    ));
  }

  getCustomerPaymentAllocation(customerId: string, paymentId: string): Promise<CustomerPaymentAllocationSummary | null> {
    this.ensureCustomerFleetInMemory(customerId);
    return Promise.resolve(buildCustomerPaymentAllocationSummaries(customerId, this.payments, this.allocations, this.invoices, this.vehicles)
      .find((item) => item.id === paymentId) || null);
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
      name: record.nameWithInitials,
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

  // --- Phase 2.13: Wishlist and Favourites (D02-P13-T002) ---

  async listWishlist(customerId: string): Promise<WishlistListResponse> {
    const items = this.wishlistItems
      .filter((w) => w.customerId === customerId)
      .map((w) => ({ ...w }));
    return { items };
  }

  async toggleWishlist(customerId: string, vehicleSlug: string): Promise<WishlistToggleResponse> {
    // Find the vehicle to ensure it exists and get its ID
    const vehicle = findVehicleRecord(this.vehicles, vehicleSlug);
    if (!vehicle) {
      throw { statusCode: 404, message: `Vehicle '${vehicleSlug}' not found` };
    }

    // Check if already in wishlist
    const existing = this.wishlistItems.find(
      (w) => w.customerId === customerId && w.vehicleSlug === vehicleSlug
    );

    if (existing) {
      // Remove from wishlist
      const index = this.wishlistItems.indexOf(existing);
      this.wishlistItems.splice(index, 1);
      return { wishlisted: false };
    } else {
      // Add to wishlist
      const id = `wish-${Date.now()}-${this.wishlistSeq++}`;
      const item: WishlistItemRecord = {
        id,
        customerId,
        vehicleId: vehicle.id,
        vehicleSlug,
        createdAt: new Date().toISOString(),
      };
      this.wishlistItems.push(item);
      return { wishlisted: true, item };
    }
  }

  async listFavourites(customerId: string): Promise<FavouriteSearchListResponse> {
    const items = this.favourites
      .filter((f) => f.customerId === customerId)
      .map((f) => ({
        id: f.id,
        customerId: f.customerId,
        name: f.name,
        criteria: JSON.parse(f.criteriaJson),
        createdAt: f.createdAt,
      }));
    return { items, limit: 25 };
  }

  async createFavourite(
    customerId: string,
    name: string,
    criteria: FavouriteSearchCriteria,
    nowISO?: string
  ): Promise<FavouriteSearch> {
    // Validate: at least one non-empty criteria field (D02-ASM-010)
    const hasAtLeastOne = Object.values(criteria).some((v) => v != null && v !== '' && v !== 0 && v !== false);
    if (!hasAtLeastOne) {
      throw { statusCode: 400, message: 'At least one criteria field is required' };
    }

    // Check 25-favourite cap (CUST-40)
    const count = this.favourites.filter((f) => f.customerId === customerId).length;
    if (count >= 25) {
      throw { statusCode: 409, message: 'Favourite limit exceeded', reason: 'limit_exceeded' };
    }

    const id = `fav-${Date.now()}-${this.favouriteSeq++}`;
    const createdAt = nowISO || new Date().toISOString();
    const record: FavouriteSearchRecord = {
      id,
      customerId,
      name,
      criteriaJson: JSON.stringify(criteria),
      createdAt,
    };
    this.favourites.push(record);

    return {
      id,
      customerId,
      name,
      criteria,
      createdAt,
    };
  }

  async deleteFavourite(customerId: string, id: string): Promise<void> {
    const index = this.favourites.findIndex((f) => f.id === id && f.customerId === customerId);
    if (index === -1) {
      throw { statusCode: 404, message: 'Favourite not found' };
    }
    this.favourites.splice(index, 1);
  }

  async getFavouriteFacets(): Promise<FavouriteSearchFacets> {
    const vehicles = this.vehicles.filter((v) => v.status !== 'Draft');

    const makeMap = new Map<string, number>();
    const modelMap = new Map<string, number>();
    const fuelTypeMap = new Map<string, number>();
    const driveTrainMap = new Map<string, number>();
    const transmissionMap = new Map<string, number>();

    let minYear = 2026;
    let maxYear = 1970;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minMileage = Infinity;
    let maxMileage = -Infinity;

    vehicles.forEach((v) => {
      if (v.make) makeMap.set(v.make, (makeMap.get(v.make) || 0) + 1);
      if (v.model) modelMap.set(v.model, (modelMap.get(v.model) || 0) + 1);
      if (v.fuelType) fuelTypeMap.set(v.fuelType, (fuelTypeMap.get(v.fuelType) || 0) + 1);
      if (v.driveTrain) driveTrainMap.set(v.driveTrain, (driveTrainMap.get(v.driveTrain) || 0) + 1);
      if (v.transmission) transmissionMap.set(v.transmission, (transmissionMap.get(v.transmission) || 0) + 1);

      if (v.year) {
        if (v.year < minYear) minYear = v.year;
        if (v.year > maxYear) maxYear = v.year;
      }

      if (v.priceUsd && !v.requestPrice) {
        if (v.priceUsd < minPrice) minPrice = v.priceUsd;
        if (v.priceUsd > maxPrice) maxPrice = v.priceUsd;
      }

      if (v.mileage !== undefined && v.mileage !== null) {
        if (v.mileage < minMileage) minMileage = v.mileage;
        if (v.mileage > maxMileage) maxMileage = v.mileage;
      }
    });

    const sortFacets = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      makes: sortFacets(makeMap),
      models: sortFacets(modelMap),
      fuelTypes: sortFacets(fuelTypeMap),
      driveTrains: sortFacets(driveTrainMap),
      transmissions: sortFacets(transmissionMap),
      yearRange: {
        min: minYear <= maxYear ? minYear : 2015,
        max: minYear <= maxYear ? maxYear : 2024,
      },
      priceRange: {
        min: minPrice <= maxPrice ? minPrice : 0,
        max: minPrice <= maxPrice ? maxPrice : 50000,
      },
      mileageRange: {
        min: minMileage <= maxMileage ? minMileage : 0,
        max: minMileage <= maxMileage ? maxMileage : 100000,
      },
      // D02-ASM-008: these four fields have no backing columns today
      modelCodes: [],
      engineCcOptions: [],
      colors: [],
      steeringOptions: [],
    };
  }

  getCustomerStatement(_customerId: string, _fromDate?: string, _toDate?: string): Promise<CustomerStatementSummary> {
    return Promise.reject(new DatabaseRequiredError());
  }

  listCustomerPolymorphicInquiries(customerId: string): Promise<CustomerPolymorphicInquiryListResponse> {
    const items: CustomerPolymorphicInquiry[] = [
      {
        id: 'inq-1',
        customerId,
        inquiryNumber: 'IN-0003',
        source: 'Stock',
        status: 'Pending Reply',
        inquiryDate: '26th Sep, 2024 13:45:00',
        make: 'Toyota',
        model: 'Corolla Fielder 1.5G',
        yom: '2021',
        vehicleSlug: '2021-toyota-corolla-fielder-veh-inv-1',
        vehicleId: 'veh-inv-1',
        stockNumber: 'J240111111',
        chassisNumber: 'NRE161-0091995',
        viewsCount: 12,
        message: 'Could you please confirm the earliest vessel departure schedule for Mombasa?',
        fobPriceUsd: 1400,
        cfPriceUsd: 2400,
        deliveryLocation: 'Kenya-Mombasa',
        inquirerCount: 4,
        imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
      },
      {
        id: 'inq-2',
        customerId,
        inquiryNumber: 'IN-0002',
        source: 'Auction',
        status: 'Replied',
        inquiryDate: '26th Sep, 2024 13:45:00',
        make: 'Toyota',
        model: 'Raize Z 4WD',
        yom: '2024',
        vehicleSlug: '2024-toyota-raize-veh-7',
        vehicleId: 'veh-7',
        lotNumber: '36071',
        chassisModel: 'A210A',
        viewsCount: 8,
        message: 'Inspection grade request and maximum auction bidding cap confirmation.',
        replyMessage: 'Grade 5.0 A condition verified. Starting bid placed at JAAI Yokohama.',
        repliedAt: '26th Sep, 2024 15:30:00',
        startPriceUsd: 1400,
        auctionRemaining: '2 hr 45 min',
        auctionFinished: false,
        deliveryLocation: 'Kenya',
        imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
      },
      {
        id: 'inq-3',
        customerId,
        inquiryNumber: 'IN-0001',
        source: 'General',
        status: 'Replied',
        inquiryDate: '26th Sep, 2024 13:45:00',
        make: 'Toyota',
        model: 'Land Cruiser 250 ZX',
        yom: '2024',
        vehicleSlug: '2024-toyota-land-cruiser-250-veh-6',
        vehicleId: 'veh-6',
        message: 'Looking for 2024 Land Cruiser 250 with sunroof, leather interior, and 7 seats.',
        replyMessage: 'We have reserved 2 units arriving at Yokohama port this week.',
        repliedAt: '26th Sep, 2024 16:00:00',
        driveType: 'RHD 4WD',
        mfgYearRange: '2022 To 2024',
        minFobUsd: 1400,
        maxFobUsd: 3400,
        deliveryLocation: 'Kenya',
      },
    ];

    const customerAccount = this.customerAccounts.find((account) => account.customerId === customerId);
    const customerTier = customerAccount?.tier || 'Standard';
    const tierRule = this.tierRules.get(customerTier);
    const enrichedItems = items.map((item) => {
      if (!item.vehicleSlug) return item;
      const vehicle = findVehicleRecord(this.vehicles, item.vehicleSlug);
      if (!vehicle) return item;
      const projection = projectVehicle(vehicle, {
        audience: 'customer',
        customerId,
        customerTier,
        tierRule,
      });
      return {
        ...item,
        vehicleSlug: projection.slug,
        vehicleId: projection.id,
        stockNumber: item.stockNumber || vehicle.stockNumber,
        chassisNumber: item.chassisNumber || projection.chassisNumber,
        imageUrl: item.imageUrl || projection.images?.[0],
        engineCc: projection.engineCc,
        mileage: projection.mileage,
        fuelType: projection.fuelType,
        transmission: projection.transmission,
        color: projection.color,
        priceState: projection.priceState,
        priceUsd: projection.priceState === 'priced' ? projection.priceUsd : undefined,
        tierPricing: projection.tierPricing,
      };
    });

    return Promise.resolve({
      items: enrichedItems,
      total: enrichedItems.length,
    });
  }

  reset(): Promise<void> {
    this.config = { ...seedConfig };
    this.vehicleStatusDefinitions = seedVehicleStatusDefinitions.map((definition) => ({ ...definition }));
    this.vehicles = preparedSeedVehicles.map((vehicle) => canonicalizeVehicle({ ...vehicle }));
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
    this.customerAccounts = [
      buildSeedCustomerAccount(),
      buildSeedOtherCustomerAccount(),
      buildSeedTierAccount('cust-silver-789', 'daniel.mwangi@example.com', 'Daniel Mwangi', 'KE', 'Silver'),
      buildSeedTierAccount('cust-gold-012', 'haruto.sato@example.com', 'Haruto Sato', 'JP', 'Gold'),
      buildSeedTierAccount('cust-platinum-345', 'sofia.almeida@example.com', 'Sofia Almeida', 'PT', 'Platinum'),
    ];
    this.tierRules = new Map(seedTierRules.map((rule) => [rule.tier, { ...rule }]));
    this.passwordResetOutbox = [];
    this.wishlistItems = [];
    this.favourites = [];
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

  private referenceId(table: string, normalizedKey: string): string {
    return `${table}-${Buffer.from(normalizedKey).toString('base64url')}`;
  }

  private async ensureVehicleReference(table: string, value: string): Promise<string> {
    const displayName = canonicalReferenceValue(value);
    if (!displayName) throw new Error(`Cannot create an empty vehicle reference in ${table}`);
    const normalizedKey = normalizeReferenceKey(displayName);
    const id = this.referenceId(table, normalizedKey);
    await this.pool.query(
      `INSERT INTO ${table} (id, display_name, normalized_key) VALUES ($1, $2, $3)
       ON CONFLICT (normalized_key) DO UPDATE SET display_name = ${table}.display_name`,
      [id, displayName, normalizedKey],
    );
    const result = await this.pool.query(`SELECT id FROM ${table} WHERE normalized_key = $1`, [normalizedKey]);
    return result.rows[0].id as string;
  }

  private async ensureVehicleModel(makeId: string, value: string): Promise<string> {
    const displayName = canonicalReferenceValue(value);
    if (!displayName) throw new Error('Cannot create an empty vehicle model');
    const normalizedKey = normalizeReferenceKey(displayName);
    const id = this.referenceId(vehicleReferenceTables.model, `${makeId}:${normalizedKey}`);
    await this.pool.query(
      `INSERT INTO vehicle_models (id, make_id, display_name, normalized_key) VALUES ($1, $2, $3, $4)
       ON CONFLICT (make_id, normalized_key) DO UPDATE SET display_name = vehicle_models.display_name`,
      [id, makeId, displayName, normalizedKey],
    );
    const result = await this.pool.query('SELECT id FROM vehicle_models WHERE make_id = $1 AND normalized_key = $2', [makeId, normalizedKey]);
    return result.rows[0].id as string;
  }

  private async backfillVehicleReferences(): Promise<void> {
    const result = await this.pool.query('SELECT * FROM vehicles ORDER BY id');
    for (const row of result.rows) {
      const makeId = await this.ensureVehicleReference(vehicleReferenceTables.make, row.make);
      const modelId = await this.ensureVehicleModel(makeId, row.model);
      const ids: Record<string, string | null> = { make_id: makeId, model_id: modelId };
      const fields: Array<[VehicleReferenceKind, string]> = [
        ['bodyStyle', 'body_style'], ['vehicleSubType', 'vehicle_sub_type'], ['fuelType', 'fuel_type'],
        ['transmission', 'transmission'], ['driveTrain', 'drive_train'], ['overdrive', 'overdrive'],
        ['color', 'color'], ['exteriorGrade', 'exterior_grade'], ['steering', 'steering'],
        ['stockCountry', 'stock_country'], ['stockLocation', 'stock_location'], ['destinationPort', 'destination_port'],
      ];
      for (const [kind, column] of fields) {
        if (row[column]) ids[`${column === 'steering' ? 'steering_type' : column}_id`] = await this.ensureVehicleReference(vehicleReferenceTables[kind], row[column]);
      }
      await this.pool.query(
        `UPDATE vehicles SET make_id=$1, model_id=$2, body_style_id=$3, vehicle_sub_type_id=$4,
          fuel_type_id=$5, transmission_id=$6, drive_train_id=$7, overdrive_id=$8, color_id=$9,
          exterior_grade_id=$10, steering_type_id=$11, stock_country_id=$12, stock_location_id=$13,
          destination_port_id=$14 WHERE id=$15`,
        [ids.make_id, ids.model_id, ids.body_style_id || null, ids.vehicle_sub_type_id || null, ids.fuel_type_id || null,
          ids.transmission_id || null, ids.drive_train_id || null, ids.overdrive_id || null, ids.color_id || null,
          ids.exterior_grade_id || null, ids.steering_type_id || null, ids.stock_country_id || null,
          ids.stock_location_id || null, ids.destination_port_id || null, row.id],
      );

      await this.pool.query('DELETE FROM vehicle_category_assignments WHERE vehicle_id = $1', [row.id]);
      for (const rawCategory of String(row.category || '').split(',').map((v) => v.trim()).filter(Boolean)) {
        const categoryId = await this.ensureVehicleReference('vehicle_categories', rawCategory);
        await this.pool.query('INSERT INTO vehicle_category_assignments (vehicle_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [row.id, categoryId]);
      }
      await this.pool.query('DELETE FROM vehicle_feature_assignments WHERE vehicle_id = $1', [row.id]);
      const features = row.features ? JSON.parse(row.features) as Record<string, boolean> : {};
      for (const [featureKey, enabled] of Object.entries(features)) {
        if (!enabled) continue;
        const known = await this.pool.query('SELECT 1 FROM vehicle_feature_catalog WHERE feature_key = $1', [featureKey]);
        if (known.rowCount !== 1) throw new Error(`Unknown vehicle feature: ${featureKey}`);
        await this.pool.query('INSERT INTO vehicle_feature_assignments (vehicle_id, feature_key) VALUES ($1, $2) ON CONFLICT DO NOTHING', [row.id, featureKey]);
      }
    }
    const fkColumns: Array<[string, string]> = [
      ['make_id', 'vehicle_makes'], ['model_id', 'vehicle_models'], ['body_style_id', 'vehicle_body_styles'],
      ['vehicle_sub_type_id', 'vehicle_sub_types'], ['fuel_type_id', 'vehicle_fuel_types'], ['transmission_id', 'vehicle_transmissions'],
      ['drive_train_id', 'vehicle_drive_trains'], ['overdrive_id', 'vehicle_overdrives'], ['color_id', 'vehicle_colors'],
      ['exterior_grade_id', 'vehicle_exterior_grades'], ['steering_type_id', 'vehicle_steering_types'],
      ['stock_country_id', 'vehicle_stock_countries'], ['stock_location_id', 'vehicle_stock_locations'], ['destination_port_id', 'vehicle_destination_ports'],
    ];
    for (const [column, table] of fkColumns) {
      await this.pool.query(`CREATE INDEX IF NOT EXISTS vehicles_${column}_idx ON vehicles(${column})`);
      await this.pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_${column}_fkey') THEN ALTER TABLE vehicles ADD CONSTRAINT vehicles_${column}_fkey FOREIGN KEY (${column}) REFERENCES ${table}(id); END IF; END $$`);
    }
    await this.pool.query('CREATE UNIQUE INDEX IF NOT EXISTS vehicles_chassis_number_lower_idx ON vehicles (lower(trim(chassis_number)))');
    await this.pool.query('ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_valid');
    await this.pool.query(`ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_location_status_valid CHECK (location_status IS NULL OR location_status IN ('In Japan', 'In Transit', 'In Port')),
      ADD CONSTRAINT vehicles_stock_type_valid CHECK (stock_type IS NULL OR stock_type IN ('J', 'CRFO')),
      ADD CONSTRAINT vehicles_price_nonnegative CHECK (price_usd >= 0),
      ADD CONSTRAINT vehicles_discount_valid CHECK (discount_percent IS NULL OR discount_percent BETWEEN 0 AND 100),
      ADD CONSTRAINT vehicles_mileage_nonnegative CHECK (mileage IS NULL OR mileage >= 0),
      ADD CONSTRAINT vehicles_engine_cc_nonnegative CHECK (engine_cc IS NULL OR engine_cc >= 0),
      ADD CONSTRAINT vehicles_seats_nonnegative CHECK (seats IS NULL OR seats >= 0),
      ADD CONSTRAINT vehicles_load_capacity_nonnegative CHECK (load_capacity IS NULL OR load_capacity >= 0),
      ADD CONSTRAINT vehicles_year_valid CHECK (year BETWEEN 1886 AND 2200)
    `).catch((error: any) => { if (error?.code !== '42710') throw error; });
    await this.pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_status_fkey') THEN ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_fkey FOREIGN KEY (status) REFERENCES vehicle_statuses(code); END IF; END $$`);
    await this.pool.query('CREATE INDEX IF NOT EXISTS vehicles_status_idx ON vehicles(status)');
  }

  private async addRelationalConstraints(): Promise<void> {
    const relations: Array<[string, string, string, string]> = [
      ['reservations', 'customer_id', 'customer_accounts', 'customer_id'],
      ['reservations', 'vehicle_id', 'vehicles', 'id'],
      ['wishlist_items', 'customer_id', 'customer_accounts', 'customer_id'],
      ['wishlist_items', 'vehicle_id', 'vehicles', 'id'],
      ['favourite_searches', 'customer_id', 'customer_accounts', 'customer_id'],
      ['proforma_invoices', 'customer_id', 'customer_accounts', 'customer_id'],
      ['proforma_invoices', 'vehicle_id', 'vehicles', 'id'],
      ['invoices', 'customer_id', 'customer_accounts', 'customer_id'],
      ['invoices', 'vehicle_id', 'vehicles', 'id'],
      ['allocations', 'customer_id', 'customer_accounts', 'customer_id'],
      ['allocations', 'payment_id', 'payments', 'id'],
      ['allocations', 'invoice_id', 'invoices', 'id'],
      ['allocations', 'vehicle_id', 'vehicles', 'id'],
      ['shipments', 'customer_id', 'customer_accounts', 'customer_id'],
      ['shipments', 'vehicle_id', 'vehicles', 'id'],
      ['documents', 'customer_id', 'customer_accounts', 'customer_id'],
      ['documents', 'shipment_id', 'shipments', 'id'],
      ['documents', 'vehicle_id', 'vehicles', 'id'],
      ['payments', 'customer_id', 'customer_accounts', 'customer_id'],
      ['payments', 'invoice_id', 'invoices', 'id'],
      ['payment_notifications', 'customer_id', 'customer_accounts', 'customer_id'],
      ['payment_notifications', 'payment_id', 'payments', 'id'],
      ['payment_notifications', 'invoice_id', 'invoices', 'id'],
      ['notifications', 'customer_id', 'customer_accounts', 'customer_id'],
      ['customer_statement_transactions', 'customer_id', 'customer_accounts', 'customer_id'],
      ['faq_items', 'category_id', 'faq_categories', 'id'],
    ];
    for (const [table, column, target, targetColumn] of relations) {
      const constraint = `${table}_${column}_fkey`;
      await this.pool.query(`CREATE INDEX IF NOT EXISTS ${table}_${column}_idx ON ${table}(${column})`);
      await this.pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${constraint}') THEN ALTER TABLE ${table} ADD CONSTRAINT ${constraint} FOREIGN KEY (${column}) REFERENCES ${target}(${targetColumn}); END IF; END $$`);
    }
  }

  async ready(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS public_config (id integer PRIMARY KEY, site_name text NOT NULL, currency text NOT NULL, contact_phone text NOT NULL, tier_descriptions jsonb NOT NULL DEFAULT '{}'::jsonb);`
    );
    await this.pool.query(`ALTER TABLE public_config ADD COLUMN IF NOT EXISTS tier_descriptions jsonb NOT NULL DEFAULT '{}'::jsonb`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS vehicle_statuses (
      code text PRIMARY KEY,
      singular_label text NOT NULL,
      plural_label text NOT NULL,
      description text NOT NULL DEFAULT '',
      active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0
    );`);
    for (const definition of seedVehicleStatusDefinitions) {
      await this.pool.query(
        `INSERT INTO vehicle_statuses (code, singular_label, plural_label, description, active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO UPDATE SET singular_label = EXCLUDED.singular_label,
           plural_label = EXCLUDED.plural_label, description = EXCLUDED.description,
           active = EXCLUDED.active, sort_order = EXCLUDED.sort_order`,
        [definition.code, definition.singularLabel, definition.pluralLabel, definition.description, definition.active, definition.sortOrder]
      );
    }
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS vehicles (
        id text PRIMARY KEY,
        chassis_number text NOT NULL,
        make text NOT NULL,
        model text NOT NULL,
        model_code text,
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
        vehicle_sub_type text,
        engine_cc integer,
        fuel_type text,
        transmission text,
        drive_train text,
        overdrive text,
        color text,
        exterior_grade text,
        steering text,
        stock_country text,
        stock_location text,
        seats integer,
        load_capacity integer,
        features text,
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
        ADD COLUMN IF NOT EXISTS model_code text,
        ADD COLUMN IF NOT EXISTS vehicle_sub_type text,
        ADD COLUMN IF NOT EXISTS engine_cc integer,
        ADD COLUMN IF NOT EXISTS fuel_type text,
        ADD COLUMN IF NOT EXISTS transmission text,
        ADD COLUMN IF NOT EXISTS drive_train text,
        ADD COLUMN IF NOT EXISTS overdrive text,
        ADD COLUMN IF NOT EXISTS color text,
        ADD COLUMN IF NOT EXISTS exterior_grade text,
        ADD COLUMN IF NOT EXISTS steering text,
        ADD COLUMN IF NOT EXISTS stock_country text,
        ADD COLUMN IF NOT EXISTS stock_location text,
        ADD COLUMN IF NOT EXISTS seats integer,
        ADD COLUMN IF NOT EXISTS load_capacity integer,
        ADD COLUMN IF NOT EXISTS features text,
        ADD COLUMN IF NOT EXISTS mileage integer,
        ADD COLUMN IF NOT EXISTS etd text,
        ADD COLUMN IF NOT EXISTS eta text,
        ADD COLUMN IF NOT EXISTS request_price boolean;`
    );
    // Vehicle filters are persisted as controlled references. The legacy text
    // columns remain during the one-time backfill so existing databases can be
    // upgraded safely; reads use the normalized IDs below.
    for (const table of Object.values(vehicleReferenceTables).filter((table) => table !== vehicleReferenceTables.model)) {
      await this.pool.query(`CREATE TABLE IF NOT EXISTS ${table} (
        id text PRIMARY KEY,
        display_name text NOT NULL,
        normalized_key text NOT NULL UNIQUE
      );`);
    }
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_models (
        id text PRIMARY KEY,
        make_id text NOT NULL REFERENCES vehicle_makes(id),
        display_name text NOT NULL,
        normalized_key text NOT NULL,
        UNIQUE (make_id, normalized_key)
      );
    `);
    await this.pool.query(`ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS make_id text,
      ADD COLUMN IF NOT EXISTS model_id text,
      ADD COLUMN IF NOT EXISTS body_style_id text,
      ADD COLUMN IF NOT EXISTS vehicle_sub_type_id text,
      ADD COLUMN IF NOT EXISTS fuel_type_id text,
      ADD COLUMN IF NOT EXISTS transmission_id text,
      ADD COLUMN IF NOT EXISTS drive_train_id text,
      ADD COLUMN IF NOT EXISTS overdrive_id text,
      ADD COLUMN IF NOT EXISTS color_id text,
      ADD COLUMN IF NOT EXISTS exterior_grade_id text,
      ADD COLUMN IF NOT EXISTS steering_type_id text,
      ADD COLUMN IF NOT EXISTS stock_country_id text,
      ADD COLUMN IF NOT EXISTS stock_location_id text,
      ADD COLUMN IF NOT EXISTS destination_port_id text;
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_categories (
        id text PRIMARY KEY,
        display_name text NOT NULL,
        normalized_key text NOT NULL UNIQUE
      );
      CREATE TABLE IF NOT EXISTS vehicle_category_assignments (
        vehicle_id text NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        category_id text NOT NULL REFERENCES vehicle_categories(id),
        PRIMARY KEY (vehicle_id, category_id)
      );
      CREATE INDEX IF NOT EXISTS vehicle_category_assignments_category_idx
        ON vehicle_category_assignments(category_id);
    `);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS vehicle_feature_catalog (
        feature_key text PRIMARY KEY,
        display_name text NOT NULL,
        sort_order integer NOT NULL,
        active boolean NOT NULL DEFAULT true
      );`
    );
    for (const feature of vehicleFeatureCatalog) {
      await this.pool.query(
        `INSERT INTO vehicle_feature_catalog (feature_key, display_name, sort_order, active)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (feature_key) DO UPDATE SET display_name = EXCLUDED.display_name, sort_order = EXCLUDED.sort_order, active = EXCLUDED.active`,
        [feature.key, feature.label, feature.sortOrder, feature.active],
      );
    }
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_feature_assignments (
        vehicle_id text NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        feature_key text NOT NULL REFERENCES vehicle_feature_catalog(feature_key),
        PRIMARY KEY (vehicle_id, feature_key)
      );
      CREATE INDEX IF NOT EXISTS vehicle_feature_assignments_feature_idx
        ON vehicle_feature_assignments(feature_key);
    `);
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
    await this.pool.query(
      `ALTER TABLE enquiries
        ADD COLUMN IF NOT EXISTS enquiry_type text,
        ADD COLUMN IF NOT EXISTS source text,
        ADD COLUMN IF NOT EXISTS duplicate_resubmission_count integer;`
    );
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
      `ALTER TABLE enquiries
        ADD COLUMN IF NOT EXISTS customer_id text;`
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
      `CREATE TABLE IF NOT EXISTS wishlist_items (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        vehicle_id text NOT NULL,
        vehicle_slug text NOT NULL,
        created_at text NOT NULL,
        UNIQUE(customer_id, vehicle_id)
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS favourite_searches (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        name text NOT NULL,
        criteria_json text NOT NULL,
        created_at text NOT NULL
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
    await this.pool.query('ALTER TABLE faq_categories ADD COLUMN IF NOT EXISTS normalized_name text');
    const faqCategoryRows = await this.pool.query('SELECT id, name FROM faq_categories ORDER BY id');
    const faqCategoryIds = new Map<string, string>();
    for (const category of faqCategoryRows.rows) {
      const normalized = normalizeReferenceKey(category.name);
      const existing = faqCategoryIds.get(normalized);
      if (existing && existing !== category.id) {
        await this.pool.query('UPDATE faq_items SET category_id = $1 WHERE category_id = $2', [existing, category.id]);
        await this.pool.query('DELETE FROM faq_categories WHERE id = $1', [category.id]);
      } else {
        faqCategoryIds.set(normalized, category.id);
        await this.pool.query('UPDATE faq_categories SET name = $1, normalized_name = $2 WHERE id = $3', [canonicalReferenceValue(category.name), normalized, category.id]);
      }
    }
    await this.pool.query('CREATE UNIQUE INDEX IF NOT EXISTS faq_categories_normalized_name_idx ON faq_categories(normalized_name)');
    await this.pool.query('ALTER TABLE faq_items DROP COLUMN IF EXISTS category_name');
    await this.pool.query('CREATE UNIQUE INDEX IF NOT EXISTS faq_items_slug_idx ON faq_items(slug)');
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
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS customer_accounts (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        name_with_initials text NOT NULL,
        country_code text NOT NULL,
        dial_code text NOT NULL,
        mobile_number text NOT NULL,
        email text NOT NULL,
        tier text NOT NULL DEFAULT 'Standard',
        password_hash text NOT NULL,
        password_salt text NOT NULL,
        status text NOT NULL,
        verification_state text NOT NULL,
        created_at text NOT NULL,
        updated_at text NOT NULL,
        password_updated_at text NOT NULL,
        company_name text NOT NULL DEFAULT '',
        profile_phone text NOT NULL DEFAULT '',
        delivery_address text NOT NULL DEFAULT '',
        profile_version integer NOT NULL DEFAULT 1
      );`
    );
    await this.pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'Standard'`);
    await this.pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS company_name text NOT NULL DEFAULT ''`);
    await this.pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS profile_phone text NOT NULL DEFAULT ''`);
    await this.pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS delivery_address text NOT NULL DEFAULT ''`);
    await this.pool.query(`ALTER TABLE customer_accounts ADD COLUMN IF NOT EXISTS profile_version integer NOT NULL DEFAULT 1`);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS customer_tier_rules (
        tier text PRIMARY KEY,
        discount_percent numeric NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
        max_active_reservations integer NOT NULL CHECK (max_active_reservations > 0),
        description text NOT NULL,
        active boolean NOT NULL DEFAULT true
      );`
    );
    for (const rule of seedTierRules) {
      await this.pool.query(
        `INSERT INTO customer_tier_rules (tier, discount_percent, max_active_reservations, description, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tier) DO UPDATE SET discount_percent = EXCLUDED.discount_percent,
           max_active_reservations = EXCLUDED.max_active_reservations,
           description = EXCLUDED.description, active = EXCLUDED.active`,
        [rule.tier, rule.discountPercent, rule.maxActiveReservations, rule.description, rule.active],
      );
    }
    await this.pool.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_accounts_tier_fkey') THEN
        ALTER TABLE customer_accounts ADD CONSTRAINT customer_accounts_tier_fkey FOREIGN KEY (tier) REFERENCES customer_tier_rules(tier);
      END IF;
    END $$`);
    await this.pool.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS customer_accounts_email_lower_idx ON customer_accounts (lower(email));'
    );
    await this.pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_accounts_customer_id_key') THEN
          ALTER TABLE customer_accounts ADD CONSTRAINT customer_accounts_customer_id_key UNIQUE (customer_id);
        END IF;
      END $$
    `);
    // Enquiries are customer-owned. Backfill legacy contact-column rows before
    // removing the duplicated contact data and enforcing the relationship.
    // Older databases still have the duplicated email column and can be
    // backfilled. Databases already migrated to customer ownership do not;
    // avoid parsing a reference to the removed column in that case.
    await this.pool.query(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'enquiries' AND column_name = 'email'
        ) THEN
          EXECUTE 'UPDATE enquiries e SET customer_id = ca.customer_id FROM customer_accounts ca WHERE e.customer_id IS NULL AND lower(e.email) = lower(ca.email)';
        END IF;
      END $$;
    `);
    await this.pool.query('DELETE FROM enquiries WHERE customer_id IS NULL');
    await this.pool.query(`
      ALTER TABLE enquiries
        DROP COLUMN IF EXISTS name,
        DROP COLUMN IF EXISTS email,
        DROP COLUMN IF EXISTS phone,
        ALTER COLUMN customer_id SET NOT NULL
    `);
    await this.pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enquiries_customer_id_fkey') THEN
          ALTER TABLE enquiries ADD CONSTRAINT enquiries_customer_id_fkey
            FOREIGN KEY (customer_id) REFERENCES customer_accounts(customer_id);
        END IF;
      END $$
    `);
    await this.pool.query('CREATE INDEX IF NOT EXISTS enquiries_customer_id_idx ON enquiries (customer_id)');
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS password_reset_outbox (
        token text PRIMARY KEY,
        email text NOT NULL,
        issued_at text NOT NULL,
        expires_at text NOT NULL,
        consumed boolean NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS proforma_invoices (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        vehicle_id text NOT NULL,
        vehicle_slug text NOT NULL,
        make text NOT NULL,
        model text NOT NULL,
        year integer NOT NULL,
        total_amount_usd numeric NOT NULL,
        paid_amount_usd numeric NOT NULL DEFAULT 0,
        issued_at text NOT NULL,
        payment_deadline text NOT NULL,
        status text NOT NULL
      );`
    );
    await this.pool.query(`ALTER TABLE proforma_invoices ADD COLUMN IF NOT EXISTS paid_amount_usd numeric NOT NULL DEFAULT 0;`);
    await this.pool.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'proforma_invoices_paid_amount_valid') THEN
        ALTER TABLE proforma_invoices ADD CONSTRAINT proforma_invoices_paid_amount_valid
          CHECK (paid_amount_usd >= 0 AND paid_amount_usd <= total_amount_usd);
      END IF;
    END $$`);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS invoices (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        vehicle_id text NOT NULL,
        vehicle_slug text NOT NULL,
        make text NOT NULL,
        model text NOT NULL,
        year integer NOT NULL,
        total_amount_usd numeric NOT NULL,
        invoiced_at text NOT NULL,
        due_date text,
        status text NOT NULL,
        currency text,
        type text,
        document_status text
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS allocations (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        payment_id text NOT NULL,
        invoice_id text NOT NULL,
        amount_usd numeric NOT NULL,
        allocated_at text NOT NULL,
        status text NOT NULL
      );`
    );
    // Payment allocation is a many-to-many business record: one TT can be
    // distributed across vehicles, while an invoice can contain several
    // vehicle lines.  Legacy rows are backfilled from their invoice vehicle.
    await this.pool.query(`ALTER TABLE allocations ADD COLUMN IF NOT EXISTS vehicle_id text;`);
    await this.pool.query(`ALTER TABLE allocations ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'Balance';`);
    await this.pool.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_total_amount_positive') THEN
        ALTER TABLE invoices ADD CONSTRAINT invoices_total_amount_positive CHECK (total_amount_usd > 0) NOT VALID;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'allocations_amount_positive') THEN
        ALTER TABLE allocations ADD CONSTRAINT allocations_amount_positive CHECK (amount_usd > 0) NOT VALID;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'allocations_purpose_valid') THEN
        ALTER TABLE allocations ADD CONSTRAINT allocations_purpose_valid CHECK (purpose IN ('Advance', 'Balance')) NOT VALID;
      END IF;
    END $$`).catch(() => undefined);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS invoice_vehicle_items (
        id text PRIMARY KEY,
        invoice_id text NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        vehicle_id text NOT NULL REFERENCES vehicles(id),
        make text NOT NULL,
        model text NOT NULL,
        year integer NOT NULL,
        chassis_number text NOT NULL,
        stock_number text NOT NULL,
        amount_usd numeric NOT NULL CHECK (amount_usd > 0),
        UNIQUE (invoice_id, vehicle_id)
      );`
    );
    await this.pool.query(`CREATE INDEX IF NOT EXISTS allocations_customer_payment_idx ON allocations(customer_id, payment_id);`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS allocations_invoice_vehicle_idx ON allocations(invoice_id, vehicle_id);`);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS shipments (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        vehicle_id text NOT NULL,
        status text NOT NULL,
        shipped_at text,
        delivered_at text,
        eta text,
        location text,
        freshness text,
        ship_ok_status text,
        ship_ok_rejection_reason text,
        document_release_status text,
        document_release_rejection_reason text
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS documents (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        shipment_id text,
        vehicle_id text,
        type text NOT NULL,
        status text NOT NULL,
        created_at text NOT NULL,
        release_approved boolean NOT NULL,
        visible_to_customer boolean NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS payments (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        invoice_id text NOT NULL,
        amount_usd numeric NOT NULL,
        paid_at text NOT NULL,
        status text NOT NULL
      );`
    );
    await this.pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference text;`);
    await this.pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_name text;`);
    await this.pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency text;`);
    await this.pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS remarks text;`);
    await this.pool.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS finance_note text;`);
    await this.pool.query(`ALTER TABLE payments ALTER COLUMN invoice_id DROP NOT NULL;`);
    await this.pool.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_valid;`);
    await this.pool.query(`ALTER TABLE payments ADD CONSTRAINT payments_status_valid CHECK (status IN ('Pending', 'Held', 'Resubmitted', 'Approved', 'Rejected'));`);
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS payment_notifications (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        payment_id text NOT NULL,
        invoice_id text NOT NULL,
        event text NOT NULL,
        delivery_status text NOT NULL,
        created_at text NOT NULL
      );`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS notifications (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        title text,
        message text NOT NULL,
        type text NOT NULL,
        is_read boolean NOT NULL DEFAULT false,
        created_at text NOT NULL,
        related_kind text,
        related_id text,
        related_href text
      );`
    );
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS customer_statement_transactions (
        id text PRIMARY KEY,
        customer_id text NOT NULL,
        entry_date date NOT NULL,
        entry_type text NOT NULL,
        description text NOT NULL,
        reference_no text,
        debit_usd numeric NOT NULL DEFAULT 0,
        credit_usd numeric NOT NULL DEFAULT 0,
        opening_balance_usd numeric NOT NULL DEFAULT 0,
        is_opening_balance boolean NOT NULL DEFAULT false,
        source_type text,
        source_id text,
        created_at timestamptz NOT NULL,
        CONSTRAINT customer_statement_entry_type_valid CHECK (entry_type IN ('OpeningBalance', 'Invoice', 'DebitNote', 'CreditNote', 'Payment')),
        CONSTRAINT customer_statement_amounts_nonnegative CHECK (debit_usd >= 0 AND credit_usd >= 0),
        CONSTRAINT customer_statement_opening_nonnegative CHECK (opening_balance_usd >= 0),
        CONSTRAINT customer_statement_single_side CHECK (debit_usd = 0 OR credit_usd = 0),
        CONSTRAINT customer_statement_opening_shape CHECK (NOT is_opening_balance OR (debit_usd = 0 AND credit_usd = 0))
      );
      ALTER TABLE customer_statement_transactions
        ADD COLUMN IF NOT EXISTS opening_balance_usd numeric NOT NULL DEFAULT 0;
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customer_statement_opening_nonnegative') THEN
          ALTER TABLE customer_statement_transactions
            ADD CONSTRAINT customer_statement_opening_nonnegative CHECK (opening_balance_usd >= 0);
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS customer_statement_customer_date_idx
        ON customer_statement_transactions(customer_id, entry_date, created_at, id);
    `);

    // Always upsert all seed vehicles into the database
    for (const vehicle of preparedSeedVehicles) {
      await this.pool.query(
        `INSERT INTO vehicles (id, chassis_number, make, model, model_code, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, internal_notes, staff_owner_id, body_style, vehicle_sub_type, engine_cc, fuel_type, transmission, drive_train, overdrive, color, exterior_grade, steering, stock_country, stock_location, seats, load_capacity, features, mileage, etd, eta, request_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37)
         ON CONFLICT (id) DO UPDATE SET
           chassis_number = EXCLUDED.chassis_number,
           make = EXCLUDED.make,
           model = EXCLUDED.model,
           model_code = EXCLUDED.model_code,
           year = EXCLUDED.year,
           price_usd = EXCLUDED.price_usd,
           status = EXCLUDED.status,
           category = EXCLUDED.category,
           location_status = EXCLUDED.location_status,
           images = EXCLUDED.images,
           featured = EXCLUDED.featured,
           stock_type = EXCLUDED.stock_type,
           destination_port = EXCLUDED.destination_port,
           discount_percent = EXCLUDED.discount_percent,
           internal_notes = EXCLUDED.internal_notes,
           staff_owner_id = EXCLUDED.staff_owner_id,
           body_style = EXCLUDED.body_style,
           vehicle_sub_type = EXCLUDED.vehicle_sub_type,
           engine_cc = EXCLUDED.engine_cc,
           fuel_type = EXCLUDED.fuel_type,
           transmission = EXCLUDED.transmission,
           drive_train = EXCLUDED.drive_train,
           overdrive = EXCLUDED.overdrive,
           color = EXCLUDED.color,
           exterior_grade = EXCLUDED.exterior_grade,
           steering = EXCLUDED.steering,
           stock_country = EXCLUDED.stock_country,
           stock_location = EXCLUDED.stock_location,
           seats = EXCLUDED.seats,
           load_capacity = EXCLUDED.load_capacity,
           features = EXCLUDED.features,
           mileage = EXCLUDED.mileage,
           etd = EXCLUDED.etd,
           eta = EXCLUDED.eta,
           request_price = EXCLUDED.request_price;`,
        [
          vehicle.id,
          vehicle.chassisNumber,
          vehicle.make,
          vehicle.model,
          vehicle.modelCode || null,
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
          vehicle.vehicleSubType || null,
          vehicle.engineCc || null,
          vehicle.fuelType || null,
          vehicle.transmission || null,
          vehicle.driveTrain || null,
          vehicle.overdrive || null,
          vehicle.color || null,
          vehicle.exteriorGrade || null,
          vehicle.steering || null,
          vehicle.stockCountry || null,
          vehicle.stockLocation || null,
          vehicle.seats || null,
          vehicle.loadCapacity || null,
          vehicle.features ? JSON.stringify(vehicle.features) : null,
          vehicle.mileage || null,
          vehicle.etd || null,
          vehicle.eta || null,
          vehicle.requestPrice ?? false,
        ]
      );
    }

    const seededAccountResult = await this.pool.query('SELECT id FROM customer_accounts WHERE id = $1', ['acct-cust-123']);
    if (seededAccountResult.rows.length === 0) {
      const seed = buildSeedCustomerAccount();
      await this.pool.query(
        `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, tier, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          seed.id,
          seed.customerId,
          seed.nameWithInitials,
          seed.countryCode,
          seed.dialCode,
          seed.mobileNumber,
          seed.email,
          seed.tier,
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
    await this.ensureSeedCustomerAccountsInPostgres();

    const configResult = await this.pool.query('SELECT id FROM public_config WHERE id = 1');
    if (configResult.rows.length === 0) {
      await this.pool.query(
        'INSERT INTO public_config (id, site_name, currency, contact_phone, tier_descriptions) VALUES (1, $1, $2, $3, $4)',
        [seedConfig.siteName, seedConfig.currency, seedConfig.contactPhone, JSON.stringify(seedConfig.tierDescriptions)]
      );
      for (const cat of seedFaqCategories) {
        await this.pool.query('INSERT INTO faq_categories (id, name, description, sort_order) VALUES ($1, $2, $3, $4)', [cat.id, cat.name, cat.description || null, cat.order]);
      }
      for (const item of seedFaqItems) {
        await this.pool.query('INSERT INTO faq_items (id, category_id, question, answer, slug, featured, sort_order, owner, status, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [item.id, item.categoryId, item.question, item.answer, item.slug, item.featured ?? false, item.order || 1, item.owner, item.status, item.updatedAt]);
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
        await this.pool.query('INSERT INTO branch_content (id, name, code, destination_port, introduction, welcome_banner, contact_banner, team_members, meet_and_greet_info, contact_details, content_owner, status, latest_arrivals_query, recently_discounted_query) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)', [branch.id, branch.name, branch.code, branch.destinationPort, branch.introduction, branch.welcomeBanner, branch.contactBanner, JSON.stringify(branch.teamMembers), branch.meetAndGreetInfo, JSON.stringify(branch.contactDetails), 'BranchContentSeed', branch.status, null, null]);
      }
    }
    await this.pool.query(
      `UPDATE public_config SET tier_descriptions = $1 WHERE id = 1 AND (tier_descriptions IS NULL OR tier_descriptions = '{}'::jsonb)`,
      [JSON.stringify(seedConfig.tierDescriptions)],
    );

    // Ensure fleet seed data in PostgreSQL for all registered accounts
    const allAccounts = await this.pool.query('SELECT customer_id, email FROM customer_accounts');
    for (const acct of allAccounts.rows) {
      await this.ensureCustomerFleetDataInPostgres(acct.customer_id, acct.email);
    }
    await this.backfillVehicleReferences();
    await this.ensureMockRelationalFixtures();
    await this.addRelationalConstraints();
  }

  private async ensureSeedCustomerAccountsInPostgres(): Promise<void> {
    const accounts = [
      buildSeedCustomerAccount(),
      buildSeedOtherCustomerAccount(),
      buildSeedTierAccount('cust-silver-789', 'daniel.mwangi@example.com', 'Daniel Mwangi', 'KE', 'Silver'),
      buildSeedTierAccount('cust-gold-012', 'haruto.sato@example.com', 'Haruto Sato', 'JP', 'Gold'),
      buildSeedTierAccount('cust-platinum-345', 'sofia.almeida@example.com', 'Sofia Almeida', 'PT', 'Platinum'),
    ];
    for (const account of accounts) {
      await this.pool.query(
        `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, tier, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT (customer_id) DO UPDATE SET name_with_initials = EXCLUDED.name_with_initials,
           country_code = EXCLUDED.country_code, dial_code = EXCLUDED.dial_code,
           mobile_number = EXCLUDED.mobile_number, email = EXCLUDED.email, tier = EXCLUDED.tier,
           password_hash = EXCLUDED.password_hash, password_salt = EXCLUDED.password_salt,
           status = EXCLUDED.status, verification_state = EXCLUDED.verification_state,
           updated_at = EXCLUDED.updated_at, password_updated_at = EXCLUDED.password_updated_at`,
        [account.id, account.customerId, account.nameWithInitials, account.countryCode, account.dialCode, account.mobileNumber,
          account.email, account.tier, account.passwordHash, account.passwordSalt, account.status, account.verificationState, account.createdAt,
          account.updatedAt, account.passwordUpdatedAt],
      );
    }
    for (const profile of seedCustomerProfiles) {
      await this.pool.query(
        `UPDATE customer_accounts
         SET company_name = $2, profile_phone = $3, delivery_address = $4,
             profile_version = $5, updated_at = $6
         WHERE customer_id = $1`,
        [profile.customerId, profile.companyName, profile.phone, profile.deliveryAddress, profile.version, profile.updatedAt],
      );
    }
  }

  private async ensureMockRelationalFixtures(): Promise<void> {
    for (const row of statementSeedRows) {
      await this.pool.query(
        `INSERT INTO customer_statement_transactions
          (id, customer_id, entry_date, entry_type, description, reference_no, debit_usd, credit_usd,
           opening_balance_usd, is_opening_balance, source_type, source_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           customer_id = EXCLUDED.customer_id,
           entry_date = EXCLUDED.entry_date,
           entry_type = EXCLUDED.entry_type,
           description = EXCLUDED.description,
           reference_no = EXCLUDED.reference_no,
           debit_usd = EXCLUDED.debit_usd,
           credit_usd = EXCLUDED.credit_usd,
           opening_balance_usd = EXCLUDED.opening_balance_usd,
           is_opening_balance = EXCLUDED.is_opening_balance,
           source_type = EXCLUDED.source_type,
           source_id = EXCLUDED.source_id,
           created_at = EXCLUDED.created_at`,
        [row.id, row.customerId, row.entryDate, row.entryType, row.description, row.referenceNo || null,
          row.debitUsd, row.creditUsd, row.openingBalanceUsd || 0, row.isOpeningBalance ?? false,
          row.sourceType || null, row.sourceId || null, row.createdAt],
      );
    }
    // Complete deterministic fixture rows before validating the new
    // relational constraints on an upgraded database.
    await this.pool.query(
      `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
       VALUES
         ('pay-006', 'cust-123', 'inv-005', 12780, '2026-08-12T14:00:00.000Z', 'Approved', 'TT-2026-12780-DIRECT', 'Direct Wire Transfer', 'USD', 'Allocated to 2019 SUZUKI ALTO'),
         ('pay-007', 'cust-123', 'inv-016', 7100, '2026-08-12T14:00:00.000Z', 'Approved', 'TT-2026-7100-DIRECT', 'Direct Wire Transfer', 'USD', 'Allocated to 2020 TOYOTA HIACE VAN')
       ON CONFLICT (id) DO NOTHING`,
    );
    await this.pool.query(
      `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks, finance_note)
       VALUES
         ('pay-cust123-hold-001', 'cust-123', 'inv-003', 4200, '2026-08-14T10:30:00.000Z', 'Held', 'TT-2026-4200-HOLD', 'Standard Chartered Bank', 'USD', 'Payment temporarily held for finance review', 'Finance is verifying the beneficiary bank confirmation before releasing this payment.'),
         ('pay-cust123-rejected-001', 'cust-123', 'inv-003', 2800, '2026-08-15T11:15:00.000Z', 'Rejected', 'TT-2026-2800-REJECTED', 'MUFG Bank Tokyo', 'USD', 'Payment proof rejected because the reference was incomplete', 'The uploaded payment proof did not include a verifiable bank reference. Please submit a corrected document.')
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         reference = EXCLUDED.reference,
         bank_name = EXCLUDED.bank_name,
         currency = EXCLUDED.currency,
         remarks = EXCLUDED.remarks,
         finance_note = EXCLUDED.finance_note`,
    );
    await this.pool.query(
      `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
       VALUES ('pay-004', 'cust-123', 'inv-003', 5000, '2026-08-13T09:00:00.000Z', 'Pending', 'PAY-004', 'Sumitomo Mitsui Banking Corp (USD)', 'USD', 'Wire Remittance')
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         reference = COALESCE(payments.reference, EXCLUDED.reference),
         bank_name = COALESCE(payments.bank_name, EXCLUDED.bank_name),
         currency = COALESCE(payments.currency, EXCLUDED.currency),
         remarks = COALESCE(payments.remarks, EXCLUDED.remarks)`,
    );
    // Keep the multi-vehicle TT examples available on an existing PostgreSQL
    // database as well as after a full reset. These rows are intentionally
    // idempotent so startup can safely repair an older fixture set.
    await this.pool.query(
      `INSERT INTO invoices (id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, invoiced_at, due_date, status, currency, type, document_status)
       VALUES
         ('inv-bulk-002', 'cust-123', 'veh-inv-7', '2013-volvo-v40-veh-inv-7', 'Volvo', 'V40', 2013, 23200, '2026-08-16T09:00:00.000Z', NULL, 'Issued', 'USD', 'Commercial', 'Issued'),
         ('inv-bulk-003', 'cust-123', 'veh-inv-10', '2013-toyota-premio-veh-inv-10', 'Toyota', 'Premio', 2013, 15940, '2026-08-17T09:00:00.000Z', NULL, 'Issued', 'USD', 'Commercial', 'Issued')
       ON CONFLICT (id) DO NOTHING`,
    );
    await this.pool.query(
      `UPDATE invoices SET total_amount_usd = CASE id
         WHEN 'inv-bulk-001' THEN 25200
         WHEN 'inv-bulk-002' THEN 23200
         WHEN 'inv-bulk-003' THEN 15940
         ELSE total_amount_usd
       END
       WHERE id IN ('inv-bulk-001', 'inv-bulk-002', 'inv-bulk-003')`,
    );
    await this.pool.query(
      `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
       VALUES
         ('pay-bulk-002', 'cust-123', 'inv-bulk-002', 18000, '2026-08-16T08:00:00.000Z', 'Approved', 'TT-2026-BULK-18000', 'Sumitomo Mitsui Banking Corp', 'USD', 'Advance TT fully allocated across two vehicles'),
         ('pay-partial-002', 'cust-123', 'inv-bulk-003', 24000, '2026-08-17T08:00:00.000Z', 'Approved', 'TT-2026-PARTIAL-24000', 'MUFG Bank Tokyo', 'USD', 'Balance TT partially allocated across two vehicles')
       ON CONFLICT (id) DO NOTHING`,
    );
    await this.pool.query(
      `INSERT INTO allocations (id, customer_id, payment_id, invoice_id, vehicle_id, purpose, amount_usd, allocated_at, status)
       VALUES
         ('alloc-bulk-002-001', 'cust-123', 'pay-bulk-002', 'inv-bulk-002', 'veh-inv-7', 'Advance', 9000, '2026-08-16T09:00:00.000Z', 'Approved'),
         ('alloc-bulk-002-002', 'cust-123', 'pay-bulk-002', 'inv-bulk-002', 'veh-inv-9', 'Advance', 9000, '2026-08-16T09:00:00.000Z', 'Approved'),
         ('alloc-partial-002-001', 'cust-123', 'pay-partial-002', 'inv-bulk-003', 'veh-inv-10', 'Balance', 8000, '2026-08-17T09:00:00.000Z', 'Approved'),
         ('alloc-partial-002-002', 'cust-123', 'pay-partial-002', 'inv-bulk-003', 'veh-inv-15', 'Balance', 4000, '2026-08-17T09:00:00.000Z', 'Approved')
       ON CONFLICT (id) DO NOTHING`,
    );
    await this.pool.query(
      `INSERT INTO invoice_vehicle_items (id, invoice_id, vehicle_id, make, model, year, chassis_number, stock_number, amount_usd)
       SELECT item.id, item.invoice_id, item.vehicle_id, v.make, v.model, v.year, v.chassis_number, v.id, item.amount_usd
       FROM (VALUES
         ('inv-item-inv-bulk-002-veh-inv-7', 'inv-bulk-002', 'veh-inv-7', 9000::numeric),
         ('inv-item-inv-bulk-002-veh-inv-9', 'inv-bulk-002', 'veh-inv-9', 9000::numeric),
         ('inv-item-inv-bulk-003-veh-inv-10', 'inv-bulk-003', 'veh-inv-10', 8000::numeric),
         ('inv-item-inv-bulk-003-veh-inv-15', 'inv-bulk-003', 'veh-inv-15', 4000::numeric)
       ) AS item(id, invoice_id, vehicle_id, amount_usd)
       JOIN vehicles v ON v.id = item.vehicle_id
       ON CONFLICT (invoice_id, vehicle_id) DO UPDATE SET amount_usd = EXCLUDED.amount_usd`,
    );
    await this.pool.query(
      `UPDATE invoice_vehicle_items SET amount_usd = CASE invoice_id || ':' || vehicle_id
         WHEN 'inv-bulk-001:veh-inv-1' THEN 17360
         WHEN 'inv-bulk-001:veh-inv-2' THEN 7840
         WHEN 'inv-bulk-002:veh-inv-7' THEN 10800
         WHEN 'inv-bulk-002:veh-inv-9' THEN 12400
         WHEN 'inv-bulk-003:veh-inv-10' THEN 9440
         WHEN 'inv-bulk-003:veh-inv-15' THEN 6500
         ELSE amount_usd
       END
       WHERE invoice_id IN ('inv-bulk-001', 'inv-bulk-002', 'inv-bulk-003')`,
    );
    await this.pool.query(
      `UPDATE allocations SET amount_usd = CASE id
         WHEN 'alloc-bulk-001' THEN 17360
         WHEN 'alloc-bulk-002' THEN 7840
         ELSE amount_usd
       END,
       purpose = CASE id
         WHEN 'alloc-bulk-001' THEN 'Balance'
         WHEN 'alloc-bulk-002' THEN 'Balance'
         ELSE purpose
       END
       WHERE id IN ('alloc-bulk-001', 'alloc-bulk-002')`,
    );
    await this.pool.query(
      `UPDATE payments SET amount_usd = 25200, reference = 'TT-2026-BULK-25200', remarks = 'Final balance TT allocated to two vehicles'
       WHERE id = 'pay-bulk-001'`,
    );
    await this.pool.query(
      `UPDATE invoices i SET status = CASE
         WHEN COALESCE((SELECT SUM(a.amount_usd) FROM allocations a WHERE a.invoice_id = i.id AND a.status = 'Approved'), 0) >= i.total_amount_usd
           AND i.total_amount_usd > 0 THEN 'Paid'
         ELSE 'Issued'
       END
       WHERE i.customer_id = 'cust-123' AND i.status <> 'Draft'`,
    );
    await this.pool.query(
      `INSERT INTO invoices (id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, invoiced_at, due_date, status, currency, type, document_status)
       VALUES ('inv-user-other-456-004', 'user-other-456', 'veh-4', '2021-honda-civic-veh-4', 'Honda', 'Civic', 2021, 9500, '2026-08-12T10:00:00.000Z', NULL, 'Issued', 'USD', 'Commercial', 'Issued')
       ON CONFLICT (id) DO NOTHING`,
    );
  }

  private async ensureCustomerFleetDataInPostgres(customerId: string, customerEmail?: string): Promise<void> {
    if (customerId.startsWith('cust-exception')) return;
    if (customerId !== 'cust-123') {
      const acctResult = await this.pool.query('SELECT email FROM customer_accounts WHERE customer_id = $1', [customerId]);
      if (acctResult.rows.length === 0) return;
      if (!customerEmail) customerEmail = acctResult.rows[0].email;
    }

    // 1. Proforma Invoices (Reserved with PI)
    const piCountResult = await this.pool.query('SELECT count(*) FROM proforma_invoices WHERE customer_id = $1', [customerId]);
    if (Number(piCountResult.rows[0]?.count || 0) === 0) {
      for (const pi of seedProformaInvoices) {
        const deadline = customerId === 'cust-123' ? pi.paymentDeadline : '2029-01-01T00:00:00.000Z';
        const id = customerId === 'cust-123' ? pi.id : `pi-${customerId}-${pi.id.replace(/^pi-/, '')}`;
        await this.pool.query(
          `INSERT INTO proforma_invoices (id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, paid_amount_usd, issued_at, payment_deadline, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING;`,
          [id, customerId, pi.vehicleId, pi.vehicleSlug, pi.make, pi.model, pi.year, pi.totalAmountUsd, pi.paidAmountUsd, pi.issuedAt, deadline, pi.status]
        );
      }
    }

    // 2. Commercial Invoices
    const invCountResult = await this.pool.query('SELECT count(*) FROM invoices WHERE customer_id = $1', [customerId]);
    if (Number(invCountResult.rows[0]?.count || 0) === 0) {
      for (const inv of seedInvoices) {
        if (inv.customerId === 'cust-123' || inv.customerId === customerId) {
          const id = customerId === 'cust-123' ? inv.id : `inv-${customerId}-${inv.id.replace(/^inv-/, '')}`;
          await this.pool.query(
            `INSERT INTO invoices (id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, invoiced_at, due_date, status, currency, type, document_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING;`,
            [id, customerId, inv.vehicleId, inv.vehicleSlug, inv.make, inv.model, inv.year, inv.totalAmountUsd, inv.invoicedAt, (inv as any).dueDate || null, inv.status, (inv as any).currency || 'USD', (inv as any).type || 'Commercial', (inv as any).documentStatus || 'Issued']
          );
        }
      }
    }

    // Backfill the invoice's legacy primary vehicle as a durable invoice item.
    // Bulk invoices receive additional rows when their allocations are seeded.
    await this.pool.query(
      `INSERT INTO invoice_vehicle_items (id, invoice_id, vehicle_id, make, model, year, chassis_number, stock_number, amount_usd)
       SELECT 'inv-item-' || i.id || '-' || i.vehicle_id, i.id, i.vehicle_id, i.make, i.model, i.year, v.chassis_number, v.id, i.total_amount_usd
       FROM invoices i JOIN vehicles v ON v.id = i.vehicle_id
       WHERE i.customer_id = $1
       ON CONFLICT (invoice_id, vehicle_id) DO NOTHING`,
      [customerId],
    );
    await this.pool.query(
      `UPDATE allocations a SET vehicle_id = i.vehicle_id FROM invoices i
       WHERE a.invoice_id = i.id AND a.customer_id = $1 AND a.vehicle_id IS NULL`,
      [customerId],
    );

    // 3. Payment Allocations
    const allocCountResult = await this.pool.query('SELECT count(*) FROM allocations WHERE customer_id = $1', [customerId]);
    if (Number(allocCountResult.rows[0]?.count || 0) === 0) {
      for (const a of seedAllocations) {
        if (a.customerId === 'cust-123' || a.customerId === customerId) {
          const id = customerId === 'cust-123' ? a.id : `alloc-${customerId}-${a.id.replace(/^alloc-/, '')}`;
          const invoiceId = customerId === 'cust-123' ? a.invoiceId : `inv-${customerId}-${a.invoiceId.replace(/^inv-/, '')}`;
          const paymentId = customerId === 'cust-123' ? a.paymentId : `pay-${customerId}-${a.paymentId.replace(/^pay-/, '')}`;
          const paymentSeed = seedPayments.find((payment) => payment.id === a.paymentId);
          // Older databases may contain the invoice but not the payment rows
          // referenced by the allocation seed. Create the minimal payment
          // snapshot first so the payment FK is valid before inserting the
          // allocation; the full payment fixture is completed below.
          await this.pool.query(
            `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
             VALUES ($1, $2, $3, $4, $5, 'Approved', $6, 'Direct Wire Transfer', 'USD', 'Seed allocation payment')
             ON CONFLICT (id) DO NOTHING;`,
            [paymentId, customerId, invoiceId, paymentSeed?.amountUsd ?? a.amountUsd, paymentSeed?.paymentDate ?? a.allocatedAt, paymentSeed?.reference ?? `SEED-${paymentId}`]
          );
          await this.pool.query(
          `INSERT INTO allocations (id, customer_id, payment_id, invoice_id, vehicle_id, purpose, amount_usd, allocated_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING;`,
            [id, customerId, paymentId, invoiceId, a.vehicleId || null, a.purpose || 'Balance', a.amountUsd, a.allocatedAt, a.status]
          );
        }
      }
    }
    await this.pool.query(
      `INSERT INTO invoice_vehicle_items (id, invoice_id, vehicle_id, make, model, year, chassis_number, stock_number, amount_usd)
       SELECT 'inv-item-' || a.invoice_id || '-' || a.vehicle_id, a.invoice_id, a.vehicle_id, v.make, v.model, v.year, v.chassis_number, v.id,
              SUM(a.amount_usd)
       FROM allocations a JOIN vehicles v ON v.id = a.vehicle_id
       WHERE a.customer_id = $1 AND a.vehicle_id IS NOT NULL
       GROUP BY a.invoice_id, a.vehicle_id, v.make, v.model, v.year, v.chassis_number, v.id
       ON CONFLICT (invoice_id, vehicle_id) DO NOTHING`,
      [customerId],
    );
    // Allocation rows represent money received, not the historical price of
    // an invoice line. Repair legacy single-vehicle lines that may have been
    // incorrectly overwritten by an older allocation backfill. Multi-vehicle
    // invoices are excluded because their item snapshots are authoritative.
    await this.pool.query(
      `UPDATE invoice_vehicle_items item
       SET amount_usd = i.total_amount_usd
       FROM invoices i
       WHERE item.invoice_id = i.id
         AND item.vehicle_id = i.vehicle_id
         AND NOT EXISTS (
           SELECT 1 FROM invoice_vehicle_items sibling
           WHERE sibling.invoice_id = item.invoice_id
             AND sibling.vehicle_id <> item.vehicle_id
         )`,
    );

    // 4. Shipments
    const shipCountResult = await this.pool.query('SELECT count(*) FROM shipments WHERE customer_id = $1', [customerId]);
    if (Number(shipCountResult.rows[0]?.count || 0) === 0) {
      for (const s of seedShipments) {
        if (s.customerId === 'cust-123' || s.customerId === customerId) {
          const id = customerId === 'cust-123' ? s.id : `ship-${customerId}-${s.id.replace(/^ship-/, '')}`;
          await this.pool.query(
            `INSERT INTO shipments (id, customer_id, vehicle_id, status, shipped_at, delivered_at, eta, location, freshness, ship_ok_status, ship_ok_rejection_reason, document_release_status, document_release_rejection_reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO NOTHING;`,
            [id, customerId, s.vehicleId, s.status, s.shippedAt || null, s.deliveredAt || null, s.eta || null, s.location || null, s.freshness || null, s.shipOkStatus || null, s.shipOkRejectionReason || null, s.documentReleaseStatus || null, s.documentReleaseRejectionReason || null]
          );
        }
      }
    }

    // 5. Documents
    const docCountResult = await this.pool.query('SELECT count(*) FROM documents WHERE customer_id = $1', [customerId]);
    if (Number(docCountResult.rows[0]?.count || 0) === 0) {
      for (const d of seedDocuments) {
        if (d.customerId === 'cust-123' || d.customerId === customerId) {
          const id = customerId === 'cust-123' ? d.id : `doc-${customerId}-${d.id.replace(/^doc-/, '')}`;
          const shipmentId = d.shipmentId ? (customerId === 'cust-123' ? d.shipmentId : `ship-${customerId}-${d.shipmentId.replace(/^ship-/, '')}`) : null;
          await this.pool.query(
            `INSERT INTO documents (id, customer_id, shipment_id, vehicle_id, type, status, created_at, release_approved, visible_to_customer)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING;`,
            [id, customerId, shipmentId, d.vehicleId || null, d.type, d.status, d.createdAt, d.releaseApproved, d.visibleToCustomer]
          );
        }
      }
    }

    // 6. Reservations (Reserved Vehicles)
    const resCountResult = await this.pool.query('SELECT count(*) FROM reservations WHERE customer_id = $1', [customerId]);
    if (Number(resCountResult.rows[0]?.count || 0) === 0) {
      const email = customerEmail || (customerId === 'cust-123' ? SEED_CUSTOMER_ACCOUNT_EMAIL : `${customerId}@example.com`);
      if (customerId === 'cust-123') {
        for (const res of seedReservations) {
          if (res.customerId === 'cust-123') {
            await this.pool.query(
              `INSERT INTO reservations (id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (id) DO NOTHING;`,
              [res.id, res.vehicleId, res.vehicleSlug, res.customerId, res.customerEmail, res.createdAt, res.expiresAt, res.holdHours]
            );
          }
        }
      } else {
        const reservedVehicles = [
          { id: 'veh-1', slug: '2021-toyota-corolla-axio-veh-1' },
          { id: 'veh-5', slug: '2021-honda-fit-hybrid-veh-5' },
          { id: 'veh-7', slug: '2023-lexus-rx450h-veh-7' },
          { id: 'veh-9', slug: '2019-mercedes-benz-c200-amg-line-veh-9' },
          { id: 'veh-10', slug: '2021-bmw-x3-xdrive20d-veh-10' },
        ].slice(0, (await this.getTierRule(await this.getCustomerTier(customerId))).maxActiveReservations);
        let seq = 1;
        for (const v of reservedVehicles) {
          await this.pool.query(
            `INSERT INTO reservations (id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (id) DO NOTHING;`,
            [`res-${customerId}-${seq++}`, v.id, v.slug, customerId, email, '2026-08-10T10:00:00.000Z', '2029-01-01T00:00:00.000Z', 48]
          );
        }
      }
    }

    // 7. Payments
    const payCountResult = await this.pool.query('SELECT count(*) FROM payments WHERE customer_id = $1', [customerId]);
    if (Number(payCountResult.rows[0]?.count || 0) < 5) {
      if (customerId === 'cust-123') {
        for (const p of seedPayments) {
          if (p.customerId === 'cust-123') {
            await this.pool.query(
              `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
               ON CONFLICT (id) DO NOTHING;`,
              [p.id, p.customerId, p.invoiceId, p.amountUsd, p.paidAt, p.status, p.reference || p.id.toUpperCase(), p.bankName || 'Sumitomo Mitsui Banking Corp (USD)', p.currency || 'USD', p.remarks || 'Wire Remittance']
            );
          }
        }
      } else {
        const customPayments = [
          { id: `pay-${customerId}-001`, invoiceId: `inv-${customerId}-001`, amountUsd: 80550, paidAt: '2026-07-22T10:00:00.000Z', status: 'Approved', reference: 'TT-2026-80550-SMBC', bankName: 'Sumitomo Mitsui Banking Corp', currency: 'USD', remarks: 'Fleet Pre-payment Deposit' },
          { id: `pay-${customerId}-002`, invoiceId: `inv-${customerId}-001`, amountUsd: 5000, paidAt: '2026-07-21T11:00:00.000Z', status: 'Approved', reference: 'TT-2026-5000-MUFG', bankName: 'MUFG Bank Tokyo', currency: 'USD', remarks: 'Deposit for Corolla Fielder' },
          { id: `pay-${customerId}-003`, invoiceId: `inv-${customerId}-002`, amountUsd: 100000, paidAt: '2026-07-15T14:00:00.000Z', status: 'Approved', reference: 'TT-2026-100000-SCB', bankName: 'Standard Chartered / SWIFT', currency: 'USD', remarks: 'Commercial Consignment Escrow' },
          { id: `pay-${customerId}-004`, invoiceId: `inv-${customerId}-003`, amountUsd: 75750, paidAt: '2026-07-21T09:00:00.000Z', status: 'Approved', reference: 'TT-2026-75750-BARC', bankName: 'Barclays Bank PLC', currency: 'USD', remarks: 'Advance Remittance for Demio & Premio' },
          { id: `pay-${customerId}-005`, invoiceId: `inv-${customerId}-004`, amountUsd: 15000, paidAt: '2026-07-30T10:00:00.000Z', status: 'Approved', reference: 'TT-2026-15000-JPY', bankName: 'Mizuho Bank / SWIFT', currency: 'JPY', remarks: 'Salesperson Bulk TT Remittance Deposit' },
          { id: `pay-${customerId}-006`, invoiceId: `inv-${customerId}-005`, amountUsd: 12780, paidAt: '2026-07-21T12:00:00.000Z', status: 'Approved', reference: 'TT-2026-12780-DIRECT', bankName: 'Direct Wire Transfer', currency: 'USD', remarks: 'Allocated to 2019 SUZUKI ALTO' },
          { id: `pay-${customerId}-007`, invoiceId: `inv-${customerId}-016`, amountUsd: 7100, paidAt: '2026-07-17T15:00:00.000Z', status: 'Approved', reference: 'TT-2026-7100-DIRECT', bankName: 'Direct Wire Transfer', currency: 'USD', remarks: 'Allocated to 2020 TOYOTA HIACE VAN' },
          { id: `pay-${customerId}-008`, invoiceId: `inv-${customerId}-007`, amountUsd: 50000, paidAt: '2026-07-21T08:30:00.000Z', status: 'Approved', reference: 'TT-2026-50000-SMBC', bankName: 'Sumitomo Mitsui Banking Corp', currency: 'USD', remarks: 'Prestige Vehicle Sourcing Wire' },
          { id: `pay-${customerId}-009`, invoiceId: `inv-${customerId}-008`, amountUsd: 30000, paidAt: '2026-07-23T14:20:00.000Z', status: 'Approved', reference: 'TT-2026-30000-SCB', bankName: 'Standard Chartered / SWIFT', currency: 'USD', remarks: 'Escrow Advance for Supercars' },
          { id: `pay-${customerId}-010`, invoiceId: `inv-${customerId}-009`, amountUsd: 55000, paidAt: '2026-07-27T16:00:00.000Z', status: 'Approved', reference: 'TT-2026-55000-STAN', bankName: 'Standard Chartered / SWIFT', currency: 'USD', remarks: 'Salesperson Bulk TT Remittance Deposit' },
          { id: `pay-${customerId}-011`, invoiceId: `inv-${customerId}-010`, amountUsd: 40000, paidAt: '2026-07-23T11:45:00.000Z', status: 'Approved', reference: 'TT-2026-40000-SMBC', bankName: 'Sumitomo Mitsui Banking Corp', currency: 'USD', remarks: 'Logistics and Container Surcharge' },
          { id: `pay-${customerId}-012`, invoiceId: `inv-${customerId}-011`, amountUsd: 200000, paidAt: '2026-07-15T09:15:00.000Z', status: 'Approved', reference: 'TT-2026-200000-SWIFT', bankName: 'SWIFT International Wire', currency: 'USD', remarks: 'Bulk Commercial Portfolio Deposit' },
          { id: `pay-${customerId}-013`, invoiceId: `inv-${customerId}-012`, amountUsd: 149999, paidAt: '2026-07-22T13:00:00.000Z', status: 'Rejected', reference: 'TT-2026-149999-REJ', bankName: 'Commercial Bank of Africa', currency: 'USD', remarks: 'Invalid swift document reference rejected by compliance' },
          { id: `pay-${customerId}-014`, invoiceId: `inv-${customerId}-013`, amountUsd: 45000, paidAt: '2026-08-14T10:00:00.000Z', status: 'Pending', reference: 'TT-2026-45000-REV', bankName: 'Barclays Bank International', currency: 'USD', remarks: 'Under finance verification review' },
          { id: `pay-${customerId}-015`, invoiceId: `inv-${customerId}-014`, amountUsd: 25000, paidAt: '2026-08-15T11:30:00.000Z', status: 'Pending', reference: 'TT-2026-25000-REV', bankName: 'Standard Chartered Bank', currency: 'USD', remarks: 'Awaiting correspondent bank clearance' },
        ];

        for (const p of customPayments) {
          await this.pool.query(
            `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO UPDATE SET
               amount_usd = EXCLUDED.amount_usd,
               paid_at = EXCLUDED.paid_at,
               status = EXCLUDED.status,
               reference = EXCLUDED.reference,
               bank_name = EXCLUDED.bank_name,
               currency = EXCLUDED.currency,
               remarks = EXCLUDED.remarks;`,
            [p.id, customerId, p.invoiceId, p.amountUsd, p.paidAt, p.status, p.reference, p.bankName, p.currency, p.remarks]
          );
        }
      }
    }

    // 8. Notifications
    const notifCountResult = await this.pool.query('SELECT count(*) FROM notifications WHERE customer_id = $1', [customerId]);
    if (Number(notifCountResult.rows[0]?.count || 0) < 5) {
      const clientName = customerEmail ? (customerEmail.includes('@') ? customerEmail.split('@')[0] : customerEmail) : 'Charith Wellage';
      const displayName = customerId === 'cust-123' ? 'Demo Customer' : (clientName.includes('.') ? clientName.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Charith Wellage');

      const defaultNotifs = [
        {
          id: `notif-${customerId}-pmt-001`,
          customerId,
          title: 'TT WIRE PAYMENT APPROVED',
          message: `Dear ${displayName}, your wire transfer payment of $15,000 USD (Ref / Swift Code: 112310036) for Invoice INV-31644 has been audited and approved by the Finance Team. Your invoice allocation has been updated successfully.`,
          type: 'Payment',
          isRead: false,
          createdAt: '2026-07-15T16:34:22.000Z',
          related: { kind: 'Invoice', id: 'inv-31644', href: '/customer/invoices/inv-31644' },
        },
        {
          id: `notif-${customerId}-pmt-002`,
          customerId,
          title: 'TT WIRE PAYMENT APPROVED ✔',
          message: `Dear ${displayName}, your Telegraphic Transfer (TT) wire transfer payment of ¥10,000 JPY (Ref / Swift Code: 112310036) has been audited and approved by the Finance Team. Allocated to Invoice: BULK ALLOCATION.`,
          type: 'Payment',
          isRead: false,
          createdAt: '2026-07-30T13:31:19.000Z',
          related: { kind: 'Payment', id: 'pay-bulk-1', href: '/customer/payments' },
        },
        {
          id: `notif-${customerId}-pmt-003`,
          customerId,
          title: 'TT WIRE PAYMENT APPROVED',
          message: `Dear ${displayName}, your wire transfer payment of $50,000 USD (Reference Code: ffgff) for Invoice INV-31644 has been audited and approved by the Finance Team. Your invoice allocation has been updated successfully.`,
          type: 'Payment',
          isRead: true,
          createdAt: '2026-07-21T22:01:21.000Z',
          related: { kind: 'Invoice', id: 'inv-31644', href: '/customer/invoices/inv-31644' },
        },
        {
          id: `notif-${customerId}-pmt-004`,
          customerId,
          title: 'TT WIRE PAYMENT APPROVED',
          message: `Dear ${displayName}, your wire transfer payment of $4,700 USD (Reference Code: TEST) for Invoice INV-79873 has been audited and approved by the Finance Team. Your invoice allocation has been updated successfully.`,
          type: 'Payment',
          isRead: true,
          createdAt: '2026-07-21T21:45:47.000Z',
          related: { kind: 'Invoice', id: 'inv-79873', href: '/customer/invoices/inv-79873' },
        },
        {
          id: `notif-${customerId}-pmt-005`,
          customerId,
          title: 'TT WIRE PAYMENT APPROVED ✔',
          message: `Dear ${displayName}, your Telegraphic Transfer (TT) wire transfer payment of $15,000 USD (Ref / Swift Code: charith wellage) has been audited and approved by the Finance Team. Available TT deposit balance: $15,000 USD.`,
          type: 'Payment',
          isRead: true,
          createdAt: '2026-07-23T13:52:26.000Z',
          related: { kind: 'Payment', id: 'pay-deposit-1', href: '/customer/payments' },
        },
      ];

      for (const n of defaultNotifs) {
        await this.pool.query(
          `INSERT INTO notifications (id, customer_id, title, message, type, is_read, created_at, related_kind, related_id, related_href)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING;`,
          [n.id, n.customerId, n.title, n.message, n.type, n.isRead, n.createdAt, n.related?.kind || null, n.related?.id || null, n.related?.href || null]
        );
      }
    }
  }

  private async getRawReservations(): Promise<ReservationRecord[]> {
    const result = await this.pool.query(
      'SELECT id, vehicle_id, vehicle_slug, customer_id, customer_email, created_at, expires_at, hold_hours FROM reservations'
    );
    return result.rows.map(PostgresStore.rowToReservationRecord);
  }

  private async getRawProformaInvoices(customerId?: string): Promise<ProformaInvoiceRecord[]> {
    const query = customerId
      ? 'SELECT id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, paid_amount_usd, issued_at, payment_deadline, status FROM proforma_invoices WHERE customer_id = $1'
      : 'SELECT id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, paid_amount_usd, issued_at, payment_deadline, status FROM proforma_invoices';
    const params = customerId ? [customerId] : [];
    const result = await this.pool.query(query, params);
    if (result.rows.length === 0 && customerId === 'cust-123') {
      return seedProformaInvoices;
    }
    return result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      vehicleSlug: row.vehicle_slug,
      make: row.make,
      model: row.model,
      modelCode: row.model_code,
      year: Number(row.year),
      totalAmountUsd: Number(row.total_amount_usd),
      paidAmountUsd: Number(row.paid_amount_usd || 0),
      issuedAt: row.issued_at,
      paymentDeadline: row.payment_deadline,
      status: row.status as 'Issued' | 'Expired' | 'Cancelled',
    }));
  }

  private async getRawInvoices(customerId?: string): Promise<InvoiceRecord[]> {
    const query = customerId
      ? 'SELECT id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, invoiced_at, due_date, status, currency, type, document_status FROM invoices WHERE customer_id = $1'
      : 'SELECT id, customer_id, vehicle_id, vehicle_slug, make, model, year, total_amount_usd, invoiced_at, due_date, status, currency, type, document_status FROM invoices';
    const params = customerId ? [customerId] : [];
    const result = await this.pool.query(query, params);
    if (result.rows.length === 0 && (!customerId || customerId === 'cust-123' || customerId === 'cust-exception-001')) {
      return customerId ? seedInvoices.filter((i) => i.customerId === customerId) : seedInvoices;
    }
    const invoiceRecords = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      vehicleSlug: row.vehicle_slug,
      make: row.make,
      model: row.model,
      year: Number(row.year),
      totalAmountUsd: Number(row.total_amount_usd),
      invoicedAt: row.invoiced_at,
      status: row.status as 'Draft' | 'Issued' | 'Paid' | 'Overdue',
    }));
    if (invoiceRecords.length === 0) return invoiceRecords;
    const itemResult = await this.pool.query(
      `SELECT invoice_id, vehicle_id, make, model, year, chassis_number, stock_number, amount_usd
       FROM invoice_vehicle_items WHERE invoice_id = ANY($1::text[])`,
      [invoiceRecords.map((invoice) => invoice.id)],
    );
    const itemsByInvoice = new Map<string, InvoiceVehicleItemRecord[]>();
    for (const row of itemResult.rows) {
      const items = itemsByInvoice.get(row.invoice_id) || [];
      items.push({
        vehicleId: row.vehicle_id,
        make: row.make,
        model: row.model,
        year: Number(row.year),
        chassisNumber: row.chassis_number,
        stockNumber: row.stock_number,
        amountUsd: Number(row.amount_usd),
      });
      itemsByInvoice.set(row.invoice_id, items);
    }
    return invoiceRecords.map((invoice) => ({
      ...invoice,
      ...(itemsByInvoice.has(invoice.id) ? { vehicleItems: itemsByInvoice.get(invoice.id) } : {}),
    }));
  }

  private async getRawAllocations(customerId?: string): Promise<AllocationRecord[]> {
    const query = customerId
      ? 'SELECT id, customer_id, payment_id, invoice_id, vehicle_id, purpose, amount_usd, allocated_at, status FROM allocations WHERE customer_id = $1'
      : 'SELECT id, customer_id, payment_id, invoice_id, vehicle_id, purpose, amount_usd, allocated_at, status FROM allocations';
    const params = customerId ? [customerId] : [];
    const result = await this.pool.query(query, params);
    if (result.rows.length === 0 && (!customerId || customerId === 'cust-123')) {
      return customerId ? seedAllocations.filter((a) => a.customerId === customerId) : seedAllocations;
    }
    return result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      paymentId: row.payment_id,
      invoiceId: row.invoice_id,
      vehicleId: row.vehicle_id || undefined,
      purpose: (row.purpose || 'Balance') as 'Advance' | 'Balance',
      amountUsd: Number(row.amount_usd),
      allocatedAt: row.allocated_at,
      status: row.status as 'Approved' | 'Pending' | 'Rejected',
    }));
  }

  private async getRawShipments(customerId?: string): Promise<ShipmentRecord[]> {
    const query = customerId
      ? 'SELECT id, customer_id, vehicle_id, status, shipped_at, delivered_at, eta, location, freshness, ship_ok_status, ship_ok_rejection_reason, document_release_status, document_release_rejection_reason FROM shipments WHERE customer_id = $1'
      : 'SELECT id, customer_id, vehicle_id, status, shipped_at, delivered_at, eta, location, freshness, ship_ok_status, ship_ok_rejection_reason, document_release_status, document_release_rejection_reason FROM shipments';
    const params = customerId ? [customerId] : [];
    const result = await this.pool.query(query, params);
    if (result.rows.length === 0 && (!customerId || customerId === 'cust-123' || customerId === 'cust-exception-001')) {
      return customerId ? seedShipments.filter((s) => s.customerId === customerId) : seedShipments;
    }
    return result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      status: row.status as 'Purchased' | 'Inspection' | 'Ready' | 'InTransit' | 'Delivered',
      shippedAt: row.shipped_at || '',
      deliveredAt: row.delivered_at || undefined,
      eta: row.eta || undefined,
      location: row.location || undefined,
      freshness: row.freshness as any,
      shipOkStatus: row.ship_ok_status as any,
      shipOkRejectionReason: row.ship_ok_rejection_reason || undefined,
      documentReleaseStatus: row.document_release_status as any,
      documentReleaseRejectionReason: row.document_release_rejection_reason || undefined,
    }));
  }

  private async getRawDocuments(customerId?: string): Promise<DocumentRecord[]> {
    const query = customerId
      ? 'SELECT id, customer_id, shipment_id, vehicle_id, type, status, created_at, release_approved, visible_to_customer FROM documents WHERE customer_id = $1'
      : 'SELECT id, customer_id, shipment_id, vehicle_id, type, status, created_at, release_approved, visible_to_customer FROM documents';
    const params = customerId ? [customerId] : [];
    const result = await this.pool.query(query, params);
    if (result.rows.length === 0 && (!customerId || customerId === 'cust-123' || customerId === 'cust-exception-001')) {
      return customerId ? seedDocuments.filter((d) => d.customerId === customerId) : seedDocuments;
    }
    return result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      shipmentId: row.shipment_id || undefined,
      vehicleId: row.vehicle_id || undefined,
      type: row.type as any,
      status: row.status as any,
      createdAt: row.created_at,
      releaseApproved: Boolean(row.release_approved),
      visibleToCustomer: Boolean(row.visible_to_customer),
    }));
  }

  private async getRawVehicles(): Promise<VehicleRecord[]> {
    const result = await this.pool.query(
      `SELECT v.id, v.chassis_number, m.display_name AS make, mo.display_name AS model, v.model_code, v.year, v.price_usd, v.status,
        (SELECT string_agg(c.display_name, ',' ORDER BY c.display_name) FROM vehicle_category_assignments a JOIN vehicle_categories c ON c.id=a.category_id WHERE a.vehicle_id=v.id) AS category,
        v.location_status, v.created_at, v.images, v.featured, v.stock_type, dp.display_name AS destination_port, v.discount_percent,
        bs.display_name AS body_style, st.display_name AS vehicle_sub_type, v.engine_cc, ft.display_name AS fuel_type,
        tr.display_name AS transmission, dt.display_name AS drive_train, od.display_name AS overdrive, co.display_name AS color,
        eg.display_name AS exterior_grade, steer.display_name AS steering, sc.display_name AS stock_country, sl.display_name AS stock_location,
        v.seats, v.load_capacity,
        (SELECT COALESCE(jsonb_object_agg(f.feature_key, true), '{}'::jsonb)::text FROM vehicle_feature_assignments f WHERE f.vehicle_id=v.id) AS features,
        v.mileage, v.etd, v.eta, v.request_price
       FROM vehicles v JOIN vehicle_makes m ON m.id=v.make_id JOIN vehicle_models mo ON mo.id=v.model_id
       LEFT JOIN vehicle_body_styles bs ON bs.id=v.body_style_id LEFT JOIN vehicle_sub_types st ON st.id=v.vehicle_sub_type_id
       LEFT JOIN vehicle_fuel_types ft ON ft.id=v.fuel_type_id LEFT JOIN vehicle_transmissions tr ON tr.id=v.transmission_id
       LEFT JOIN vehicle_drive_trains dt ON dt.id=v.drive_train_id LEFT JOIN vehicle_overdrives od ON od.id=v.overdrive_id
       LEFT JOIN vehicle_colors co ON co.id=v.color_id LEFT JOIN vehicle_exterior_grades eg ON eg.id=v.exterior_grade_id
       LEFT JOIN vehicle_steering_types steer ON steer.id=v.steering_type_id LEFT JOIN vehicle_stock_countries sc ON sc.id=v.stock_country_id
       LEFT JOIN vehicle_stock_locations sl ON sl.id=v.stock_location_id LEFT JOIN vehicle_destination_ports dp ON dp.id=v.destination_port_id
       ORDER BY v.id`
    );
    return result.rows.map((row) => ({
      id: row.id,
      chassisNumber: row.chassis_number,
      make: row.make,
      model: row.model,
      modelCode: row.model_code,
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
      vehicleSubType: row.vehicle_sub_type,
      engineCc: row.engine_cc ? Number(row.engine_cc) : undefined,
      fuelType: row.fuel_type,
      transmission: row.transmission,
      driveTrain: row.drive_train,
      overdrive: row.overdrive,
      color: row.color,
      exteriorGrade: row.exterior_grade,
      steering: row.steering,
      stockCountry: row.stock_country,
      stockLocation: row.stock_location,
      seats: row.seats ? Number(row.seats) : undefined,
      loadCapacity: row.load_capacity ? Number(row.load_capacity) : undefined,
      features: row.features ? JSON.parse(row.features) : undefined,
      mileage: row.mileage ? Number(row.mileage) : undefined,
      etd: row.etd,
      eta: row.eta,
      requestPrice: Boolean(row.request_price),
    }));
  }

  private async getFeatureCatalog(): Promise<VehicleFeatureCatalogEntry[]> {
    const result = await this.pool.query('SELECT feature_key, display_name, sort_order, active FROM vehicle_feature_catalog ORDER BY sort_order ASC');
    return result.rows.map((row) => ({ key: row.feature_key, label: row.display_name, sortOrder: Number(row.sort_order), active: Boolean(row.active) }));
  }

  private async getVehicleStatusDefinitions(): Promise<VehicleStatusDefinition[]> {
    const result = await this.pool.query(
      'SELECT code, singular_label, plural_label, description, active, sort_order FROM vehicle_statuses ORDER BY sort_order, code'
    );
    return result.rows.map((row) => ({
      code: row.code as VehicleStatusDefinition['code'],
      singularLabel: row.singular_label,
      pluralLabel: row.plural_label,
      description: row.description,
      active: row.active,
      sortOrder: Number(row.sort_order),
    }));
  }

  private async getRawVehiclesWith(client: PoolClient): Promise<VehicleRecord[]> {
    const result = await client.query(
      `SELECT v.id, v.chassis_number, m.display_name AS make, mo.display_name AS model, v.model_code, v.year, v.price_usd, v.status,
        (SELECT string_agg(c.display_name, ',' ORDER BY c.display_name) FROM vehicle_category_assignments a JOIN vehicle_categories c ON c.id=a.category_id WHERE a.vehicle_id=v.id) AS category,
        v.location_status, v.created_at, v.images, v.featured, v.stock_type, dp.display_name AS destination_port, v.discount_percent,
        bs.display_name AS body_style, st.display_name AS vehicle_sub_type, v.engine_cc, ft.display_name AS fuel_type,
        tr.display_name AS transmission, dt.display_name AS drive_train, od.display_name AS overdrive, co.display_name AS color,
        eg.display_name AS exterior_grade, steer.display_name AS steering, sc.display_name AS stock_country, sl.display_name AS stock_location,
        v.seats, v.load_capacity,
        (SELECT COALESCE(jsonb_object_agg(f.feature_key, true), '{}'::jsonb)::text FROM vehicle_feature_assignments f WHERE f.vehicle_id=v.id) AS features,
        v.mileage, v.etd, v.eta, v.request_price
       FROM vehicles v JOIN vehicle_makes m ON m.id=v.make_id JOIN vehicle_models mo ON mo.id=v.model_id
       LEFT JOIN vehicle_body_styles bs ON bs.id=v.body_style_id LEFT JOIN vehicle_sub_types st ON st.id=v.vehicle_sub_type_id
       LEFT JOIN vehicle_fuel_types ft ON ft.id=v.fuel_type_id LEFT JOIN vehicle_transmissions tr ON tr.id=v.transmission_id
       LEFT JOIN vehicle_drive_trains dt ON dt.id=v.drive_train_id LEFT JOIN vehicle_overdrives od ON od.id=v.overdrive_id
       LEFT JOIN vehicle_colors co ON co.id=v.color_id LEFT JOIN vehicle_exterior_grades eg ON eg.id=v.exterior_grade_id
       LEFT JOIN vehicle_steering_types steer ON steer.id=v.steering_type_id LEFT JOIN vehicle_stock_countries sc ON sc.id=v.stock_country_id
       LEFT JOIN vehicle_stock_locations sl ON sl.id=v.stock_location_id LEFT JOIN vehicle_destination_ports dp ON dp.id=v.destination_port_id
       ORDER BY v.id`
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
      vehicleSubType: row.vehicle_sub_type,
      engineCc: row.engine_cc ? Number(row.engine_cc) : undefined,
      fuelType: row.fuel_type,
      transmission: row.transmission,
      driveTrain: row.drive_train,
      overdrive: row.overdrive,
      color: row.color,
      exteriorGrade: row.exterior_grade,
      steering: row.steering,
      stockCountry: row.stock_country,
      stockLocation: row.stock_location,
      seats: row.seats ? Number(row.seats) : undefined,
      loadCapacity: row.load_capacity ? Number(row.load_capacity) : undefined,
      features: row.features ? JSON.parse(row.features) : undefined,
      mileage: row.mileage ? Number(row.mileage) : undefined,
      etd: row.etd,
      eta: row.eta,
      requestPrice: Boolean(row.request_price),
    }));
  }

  async getConfig(): Promise<PublicConfig> {
    const result = await this.pool.query('SELECT site_name, currency, contact_phone, tier_descriptions FROM public_config WHERE id = 1');
    const row = result.rows[0];
    return row ? {
      siteName: row.site_name,
      currency: row.currency,
      contactPhone: row.contact_phone,
      tierDescriptions: row.tier_descriptions && Object.keys(row.tier_descriptions).length > 0
        ? row.tier_descriptions
        : seedConfig.tierDescriptions,
    } : { ...seedConfig };
  }

  private async getTierRule(tier: CustomerTier): Promise<CustomerTierRule> {
    const result = await this.pool.query(
      'SELECT tier, discount_percent, max_active_reservations, description, active FROM customer_tier_rules WHERE tier = $1 AND active = true LIMIT 1',
      [tier],
    );
    const row = result.rows[0];
    if (row) return {
      tier: row.tier as CustomerTier,
      discountPercent: Number(row.discount_percent),
      maxActiveReservations: Number(row.max_active_reservations),
      description: row.description,
      active: row.active,
    };
    return seedTierRules.find((rule) => rule.tier === 'Standard')!;
  }

  async getCustomerTier(customerId: string): Promise<CustomerTier> {
    const result = await this.pool.query('SELECT tier FROM customer_accounts WHERE customer_id = $1 LIMIT 1', [customerId]);
    return (result.rows[0]?.tier as CustomerTier) || 'Standard';
  }

  async getCustomerTierBenefits(customerId: string, nowISO = new Date().toISOString()): Promise<CustomerTierBenefits> {
    const tier = await this.getCustomerTier(customerId);
    const rule = await this.getTierRule(tier);
    const activeResult = await this.pool.query(
      'SELECT count(*)::int AS count FROM reservations WHERE customer_id = $1 AND expires_at > $2',
      [customerId, nowISO],
    );
    const activeReservations = Number(activeResult.rows[0]?.count || 0);
    return {
      tier,
      discountPercent: rule.discountPercent,
      maxActiveReservations: rule.maxActiveReservations,
      activeReservations,
      remainingReservations: Math.max(0, rule.maxActiveReservations - activeReservations),
      description: rule.description,
    };
  }

  async getBankAccounts(): Promise<BankAccount[]> {
    return seedBankAccounts;
  }

  async getVehicles(query?: GetVehiclesQuery, context?: VehicleQueryContext): Promise<VehicleSearchResult> {
    const rawRecords = await this.getRawVehicles();
    const featureCatalog = await this.getFeatureCatalog();
    const reservations = await this.getRawReservations();
    const effectiveTier = context?.customerId ? await this.getCustomerTier(context.customerId) : (context?.customerTier || query?.tier);
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations,
      customerTier: effectiveTier,
      tierRule: effectiveTier ? await this.getTierRule(effectiveTier) : undefined,
    };
    const filteredList = filterAndSortVehicles(rawRecords, query, mergedContext);
    const facets = calculateSearchFacets(rawRecords, query, mergedContext, featureCatalog);

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
    const invoices = await this.getRawInvoices();
    const vehicleStatusDefinitions = await this.getVehicleStatusDefinitions();
    const effectiveTier = context?.customerId ? await this.getCustomerTier(context.customerId) : context?.customerTier;
    const mergedContext: VehicleQueryContext = {
      ...context,
      reservations,
      customerTier: effectiveTier,
      tierRule: effectiveTier ? await this.getTierRule(effectiveTier) : undefined,
      allocatedCustomerId: findAllocatedCustomerId(invoices, record.id),
      vehicleStatusDefinitions,
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

  async createEnquiry(request: EnquiryRequest, customerId = 'cust-123'): Promise<EnquiryResponse> {
    const rawVehicles = await this.getRawVehicles();
    const invoices = await this.getRawInvoices();
    assertVehicleEnquiryAllowed(rawVehicles, invoices, request, customerId);
    const prepared = prepareEnquiry(rawVehicles, freightDestinations, freightPorts, freightRateRecords, request, FREIGHT_REFERENCE_DATE, customerId);
    const dedupeKey = buildEnquiryDedupeKey(prepared);

    const existingResult = await this.pool.query(
      `${ENQUIRY_SELECT_COLUMNS}${ENQUIRY_FROM} WHERE e.dedupe_key = $1 LIMIT 1`,
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
      'INSERT INTO enquiries (id, dedupe_key, message, consent, vehicle_slug, destination_code, port_code, rate_status, currency, rate_effective_from, rate_effective_to, estimate_message, received_at, enquiry_type, source, duplicate_resubmission_count, preferred_make, preferred_model, preferred_drive_side, preferred_year, target_price_usd, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)',
      [
        id,
        dedupeKey,
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
        prepared.customerId,
      ]
    );

    const record: EnquiryRecord = { id, dedupeKey, receivedAt, duplicateResubmissionCount: 0, ...prepared };
    return toEnquiryResponse(record, false);
  }

  async getLeadById(id: string): Promise<LeadRecord | null> {
    const result = await this.pool.query(`${ENQUIRY_SELECT_COLUMNS}${ENQUIRY_FROM} WHERE e.id = $1 LIMIT 1`, [id]);
    const row = result.rows[0];
    return row ? toLeadRecord(rowToEnquiryRecord(row)) : null;
  }

  async listLeads(): Promise<LeadListResponse> {
    const result = await this.pool.query(`${ENQUIRY_SELECT_COLUMNS}${ENQUIRY_FROM} ORDER BY e.received_at ASC, e.id ASC`);
    const items = result.rows.map((row) => toLeadRecord(rowToEnquiryRecord(row)));
    return { items, total: items.length };
  }

  async listCustomerInquiries(customerId: string): Promise<CustomerInquiryListResponse> {
    const result = await this.pool.query(
      `${ENQUIRY_SELECT_COLUMNS}${ENQUIRY_FROM} WHERE e.customer_id = $1 AND e.enquiry_type = 'price-request' ORDER BY e.received_at DESC`,
      [customerId]
    );

    const enquiries = result.rows.map((row) => rowToEnquiryRecord(row));
    const vehicleSlugs = [...new Set(enquiries.map((e) => e.vehicleSlug).filter(Boolean))];
    const vehicles = await this.getRawVehicles();
    const customerTier = await this.getCustomerTier(customerId);
    const tierRule = await this.getTierRule(customerTier);

    const items: CustomerInquirySummary[] = [];
    for (const slug of vehicleSlugs) {
      const enquiry = enquiries.find((e) => e.vehicleSlug === slug)!;
      const vehicle = vehicles.find((v) => generateVehicleSlug(v.year, v.make, v.model, v.id) === slug);
      const projection = vehicle
        ? projectVehicle(vehicle, { audience: 'customer', customerId, customerTier, tierRule })
        : undefined;

      const countResult = await this.pool.query(
        `SELECT COUNT(DISTINCT customer_id) as inquirer_count FROM enquiries WHERE vehicle_slug = $1 AND enquiry_type = 'price-request'`,
        [slug]
      );
      const inquirerCount = Number(countResult.rows[0].inquirer_count);

      items.push({
        vehicleSlug: slug!,
        vehicleId: vehicle?.id || '',
        vehicleTitle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle',
        requestedAt: enquiry.receivedAt,
        inquirerCount,
        stockNumber: vehicle?.stockNumber,
        chassisNumber: vehicle?.chassisNumber,
        imageUrl: projection?.images?.[0],
        engineCc: projection?.engineCc,
        mileage: projection?.mileage,
        fuelType: projection?.fuelType,
        transmission: projection?.transmission,
        color: projection?.color,
        priceState: projection?.priceState,
        priceUsd: projection?.priceState === 'priced' ? projection.priceUsd : undefined,
        tierPricing: projection?.tierPricing,
      });
    }

    return { items };
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
      releaseExpiredReservationStatus(vehicle, existingReservations, nowISO);
      if (vehicle.status === 'Available') {
        await client.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['Available', vehicle.id]);
      }
      const tier = await this.getCustomerTier(customerId);
      const tierRule = await this.getTierRule(tier);
      checkReservationEligibility(vehicle, existingReservations, customerId, nowISO, tierRule.maxActiveReservations);

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
    const itemResult = await this.pool.query('SELECT f.id, f.category_id, c.name AS category_name, f.question, f.answer, f.slug, f.featured, f.sort_order, f.owner, f.status, f.updated_at FROM faq_items f JOIN faq_categories c ON c.id=f.category_id WHERE f.status = $1 ORDER BY f.sort_order ASC', ['approved']);

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
      status: row.status as ContentApprovalStatus,
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
      status: row.status as ContentApprovalStatus,
    };
  }

  async getCustomerDashboard(customerId: string, customerEmail: string): Promise<CustomerDashboard> {
    await this.ensureCustomerFleetDataInPostgres(customerId, customerEmail);
    const customerInvoices = await this.getRawInvoices(customerId);
    const issuedInvoices = customerInvoices.filter((i) => i.status === 'Issued');
    const totalIssuedAmount = issuedInvoices.reduce((sum, inv) => sum + inv.totalAmountUsd, 0);

    const customerAllocations = await this.getRawAllocations(customerId);
    const approvedAllocations = customerAllocations.filter((a) => a.status === 'Approved');
    const totalApprovedAmount = approvedAllocations.reduce((sum, alloc) => sum + alloc.amountUsd, 0);

    const outstandingBalanceUsd = Math.max(0, totalIssuedAmount - totalApprovedAmount);
    const creditLimitUsd = 500000.00;
    const creditUtilisationPercent = (outstandingBalanceUsd / creditLimitUsd) * 100;

    const vehicles = await this.getRawVehicles();
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

    const invoicedVehicleIds = new Set(issuedInvoices.map((i) => i.vehicleId));
    const deliveredVehicleIds = new Set(
      issuedInvoices
        .filter((i) => {
          const vehicle = vehicles.find((v) => v.id === i.vehicleId);
          return vehicle && vehicle.status === 'Sold';
        })
        .map((i) => i.vehicleId)
    );

    const customerPayments = (await this.listCustomerPayments(customerId)).items;
    const paymentStatusSummary = {
      approved: customerPayments.filter((p) => p.status === 'Approved').length,
      pending: customerPayments.filter((p) => p.status === 'Pending').length,
      rejected: customerPayments.filter((p) => p.status === 'Rejected').length,
    };

    const customerShipments = await this.getRawShipments(customerId);
    const shipmentStatusSummary = {
      ready: customerShipments.filter((s) => s.status === 'Ready').length,
      inTransit: customerShipments.filter((s) => s.status === 'InTransit').length,
      delivered: customerShipments.filter((s) => s.status === 'Delivered').length,
      other: customerShipments.filter((s) => !['Ready', 'InTransit', 'Delivered'].includes(s.status)).length,
    };

    const customerDocuments = await this.getRawDocuments(customerId);
    const documentAvailabilityCount = {
      available: customerDocuments.filter((d) => d.status === 'Available').length,
      pending: customerDocuments.filter((d) => d.status === 'Pending').length,
      unavailable: customerDocuments.filter((d) => d.status === 'Unavailable').length,
    };

    const notificationUnreadCount = this.notifications.filter((n) => n.customerId === customerId && !n.isRead).length;

    return {
      customerId,
      customerEmail,
      creditLimitUsd,
      outstandingBalanceUsd,
      creditUtilisationPercent: Math.round(creditUtilisationPercent * 10) / 10,
      vehicleCountReserved: reservedVehicleIds.size,
      vehicleCountInvoiced: invoicedVehicleIds.size,
      vehicleCountDelivered: deliveredVehicleIds.size,
      paymentStatusSummary,
      shipmentStatusSummary,
      documentAvailabilityCount,
      notificationUnreadCount,
    };
  }

  async getCustomerVehicles(customerId: string, query?: ListCustomerVehiclesQuery, nowISO?: string): Promise<CustomerVehicleListResponse> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const vehicles = await this.getRawVehicles();
    const reservations = await this.getRawReservations();
    const proformaInvoices = await this.getRawProformaInvoices();
    const invoices = await this.getRawInvoices();
    const allocations = await this.getRawAllocations();
    const shipments = await this.getRawShipments();
    const documents = await this.getRawDocuments();
    const statusDefinitions = await this.getVehicleStatusDefinitions();
    const all = buildCustomerVehicleProjections(
      customerId,
      vehicles,
      reservations,
      proformaInvoices,
      invoices,
      allocations,
      shipments,
      documents,
      nowISO,
      statusDefinitions
    );
    return queryCustomerVehicles(all, query, statusDefinitions);
  }

  async getCustomerVehicleById(customerId: string, idOrSlug: string, nowISO?: string): Promise<CustomerVehicleDetail | null> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const vehicles = await this.getRawVehicles();
    const reservations = await this.getRawReservations();
    const proformaInvoices = await this.getRawProformaInvoices();
    const invoices = await this.getRawInvoices();
    const allocations = await this.getRawAllocations();
    const shipments = await this.getRawShipments();
    const documents = await this.getRawDocuments();
    const statusDefinitions = await this.getVehicleStatusDefinitions();
    const all = buildCustomerVehicleProjections(
      customerId,
      vehicles,
      reservations,
      proformaInvoices,
      invoices,
      allocations,
      shipments,
      documents,
      nowISO,
      statusDefinitions
    );
    const target = all.find((v) => v.id === idOrSlug || v.vehicleId === idOrSlug || v.slug === idOrSlug);
    return target || null;
  }

  async listCustomerDocuments(customerId: string): Promise<CustomerDocument[]> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const shipments = await this.getRawShipments(customerId);
    const customerShipmentIds = new Set(shipments.map((s) => s.id));
    const documents = await this.getRawDocuments(customerId);
    return documents
      .filter((document) => document.releaseApproved === true
        && document.visibleToCustomer === true
        && (!document.shipmentId || customerShipmentIds.has(document.shipmentId)))
      .map(toCustomerDocument);
  }

  async getCustomerDocument(customerId: string, documentId: string): Promise<CustomerDocument | null> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const documents = await this.getRawDocuments(customerId);
    const document = documents.find((candidate) => candidate.id === documentId);
    if (!document || document.releaseApproved !== true || document.visibleToCustomer !== true) return null;
    return toCustomerDocument(document);
  }

  private async getRawNotifications(customerId: string): Promise<NotificationRecord[]> {
    const res = await this.pool.query('SELECT * FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
    return res.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      title: row.title || undefined,
      message: row.message,
      type: row.type as any,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
      related: row.related_kind ? {
        kind: row.related_kind,
        id: row.related_id,
        href: row.related_href,
      } : undefined,
    }));
  }

  async listCustomerNotifications(customerId: string, query?: { status?: 'all' | 'read' | 'unread'; q?: string }): Promise<CustomerNotificationListResponse> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const notifications = await this.getRawNotifications(customerId);
    return queryCustomerNotifications(notifications, query);
  }

  async markCustomerNotificationRead(customerId: string, notificationId: string): Promise<Notification | null> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const res = await this.pool.query(
      'UPDATE notifications SET is_read = true WHERE customer_id = $1 AND id = $2 RETURNING *',
      [customerId, notificationId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return toCustomerNotification({
      id: row.id,
      customerId: row.customer_id,
      title: row.title || undefined,
      message: row.message,
      type: row.type as any,
      isRead: Boolean(row.is_read),
      createdAt: row.created_at,
      related: row.related_kind ? {
        kind: row.related_kind,
        id: row.related_id,
        href: row.related_href,
      } : undefined,
    });
  }

  async markAllCustomerNotificationsRead(customerId: string): Promise<MarkNotificationsReadResponse> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const unreadCountRes = await this.pool.query('SELECT count(*) FROM notifications WHERE customer_id = $1 AND is_read = false', [customerId]);
    const updatedCount = Number(unreadCountRes.rows[0]?.count || 0);
    await this.pool.query('UPDATE notifications SET is_read = true WHERE customer_id = $1', [customerId]);
    return { updatedCount, unreadCount: 0 };
  }

  async deleteCustomerNotification(customerId: string, notificationId: string): Promise<boolean> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const res = await this.pool.query('DELETE FROM notifications WHERE customer_id = $1 AND id = $2', [customerId, notificationId]);
    return (res.rowCount || 0) > 0;
  }

  async getCustomerProfile(customerId: string, email: string): Promise<CustomerProfile> {
    const accountResult = await this.pool.query(
      `SELECT customer_id, name_with_initials, email, company_name, profile_phone, delivery_address, profile_version, updated_at
       FROM customer_accounts WHERE customer_id = $1`,
      [customerId],
    );
    const account = accountResult.rows[0];
    if (account) {
      return toCustomerProfile({
        customerId: account.customer_id,
        name: account.name_with_initials || '',
        companyName: account.company_name || '',
        phone: account.profile_phone || '',
        deliveryAddress: account.delivery_address || '',
        version: Number(account.profile_version || 1),
        updatedAt: account.updated_at,
      }, account.email || email);
    }
    let profile = this.customerProfiles.find((candidate) => candidate.customerId === customerId);
    if (!profile) {
      profile = {
        customerId,
        name: '',
        companyName: '',
        phone: '',
        deliveryAddress: '',
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      this.customerProfiles.push(profile);
    }
    return toCustomerProfile(profile, email);
  }

  async updateCustomerProfile(customerId: string, email: string, request: UpdateCustomerProfileRequest, nowISO = new Date().toISOString()): Promise<CustomerProfile> {
    validateCustomerProfileRequest(request);
    const accountResult = await this.pool.query(
      `SELECT customer_id, name_with_initials, email, company_name, profile_phone, delivery_address, profile_version, updated_at
       FROM customer_accounts WHERE customer_id = $1`,
      [customerId],
    );
    const account = accountResult.rows[0];
    if (account) {
      const currentVersion = Number(account.profile_version || 1);
      if (request.expectedVersion !== undefined && request.expectedVersion !== currentVersion) throw new ProfileConflictError();
      const nextVersion = currentVersion + 1;
      const updated = await this.pool.query(
        `UPDATE customer_accounts
         SET company_name = $2, profile_phone = $3, delivery_address = $4,
             profile_version = $5, updated_at = $6
         WHERE customer_id = $1
         RETURNING customer_id, name_with_initials, email, company_name, profile_phone, delivery_address, profile_version, updated_at`,
        [customerId, request.companyName.trim(), request.phone.trim(), request.deliveryAddress.trim(), nextVersion, nowISO],
      );
      const row = updated.rows[0];
      return toCustomerProfile({
        customerId: row.customer_id,
        name: row.name_with_initials || '',
        companyName: row.company_name || '',
        phone: row.profile_phone || '',
        deliveryAddress: row.delivery_address || '',
        version: Number(row.profile_version || nextVersion),
        updatedAt: row.updated_at,
      }, row.email || email);
    }
    let profile = this.customerProfiles.find((candidate) => candidate.customerId === customerId);
    if (!profile) {
      profile = { customerId, name: '', companyName: '', phone: '', deliveryAddress: '', version: 1, updatedAt: nowISO };
      this.customerProfiles.push(profile);
    }
    if (request.expectedVersion !== undefined && request.expectedVersion !== profile.version) throw new ProfileConflictError();
    profile.companyName = request.companyName.trim();
    profile.phone = request.phone.trim();
    profile.deliveryAddress = request.deliveryAddress.trim();
    profile.version += 1;
    profile.updatedAt = nowISO;
    return toCustomerProfile(profile, email);
  }

  async getCustomerInvoices(customerId: string, query?: ListCustomerInvoicesQuery, nowISO?: string): Promise<CustomerInvoiceListResponse> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const vehicles = await this.getRawVehicles();
    const invoices = await this.getRawInvoices();
    const proformaInvoices = await this.getRawProformaInvoices();
    const allocations = await this.getRawAllocations();
    const documents = await this.getRawDocuments();
    const all = buildCustomerInvoiceProjections(
      customerId,
      invoices,
      proformaInvoices,
      allocations,
      vehicles,
      documents,
      nowISO
    );
    return queryCustomerInvoices(all, query);
  }

  async getCustomerInvoiceById(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDetail | null> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const vehicles = await this.getRawVehicles();
    const invoices = await this.getRawInvoices();
    const proformaInvoices = await this.getRawProformaInvoices();
    const allocations = await this.getRawAllocations();
    const documents = await this.getRawDocuments();
    const all = buildCustomerInvoiceProjections(
      customerId,
      invoices,
      proformaInvoices,
      allocations,
      vehicles,
      documents,
      nowISO
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    return target || null;
  }

  async getCustomerInvoiceDocument(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDocument | null> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const vehicles = await this.getRawVehicles();
    const invoices = await this.getRawInvoices();
    const proformaInvoices = await this.getRawProformaInvoices();
    const allocations = await this.getRawAllocations();
    const documents = await this.getRawDocuments();
    const all = buildCustomerInvoiceProjections(
      customerId,
      invoices,
      proformaInvoices,
      allocations,
      vehicles,
      documents,
      nowISO
    );
    const target = all.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
    if (!target) return null;
    return buildCustomerInvoiceDocument(target);
  }

  async listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const invoices = await this.getRawInvoices(customerId);
    const allocations = await this.getRawAllocations(customerId);
    const result = await this.pool.query(
      `SELECT p.id, p.customer_id, p.invoice_id, p.amount_usd, p.paid_at, p.status, p.reference,
              p.bank_name, p.currency, p.remarks, p.finance_note, ca.name_with_initials AS customer_name
       FROM payments p
       LEFT JOIN customer_accounts ca ON ca.customer_id = p.customer_id
       WHERE p.customer_id = $1 ORDER BY p.paid_at DESC, p.id DESC`,
      [customerId]
    );
    if (result.rows.length === 0) {
      const customerName = this.paymentRecords.find((payment) => payment.customerId === customerId)?.customerName;
      const items = this.paymentRecords.filter((payment) => payment.customerId === customerId).map((payment) => toCustomerPayment(payment, invoices, allocations, customerName));
      return { items, total: items.length };
    }
    const items = result.rows.map((row) => {
      const memoryMatch = this.paymentRecords.find((p) => p.id === row.id);
      const record: PaymentRecord = {
        id: row.id,
        customerId: row.customer_id,
        invoiceId: row.invoice_id,
        amountUsd: Number(row.amount_usd),
        paidAt: row.paid_at,
        paymentDate: row.paid_at.slice(0, 10),
        status: row.status as any,
        reference: row.reference || memoryMatch?.reference || `TT-${row.id.replace(/^pay-/, '').toUpperCase()}`,
        bankName: row.bank_name || memoryMatch?.bankName || 'Sumitomo Mitsui Banking Corp (USD)',
        currency: row.currency || memoryMatch?.currency || 'USD',
        remarks: row.remarks || memoryMatch?.remarks || 'None',
        financeNote: row.finance_note || memoryMatch?.financeNote,
        proof: memoryMatch?.proof,
        idempotencyKey: memoryMatch?.idempotencyKey,
        customerName: row.customer_name || undefined,
        depositorName: row.customer_name || undefined,
      };
      return toCustomerPayment(record, invoices, allocations, row.customer_name || undefined);
    });
    return { items, total: items.length };
  }

  async listCustomerPaymentAllocations(customerId: string, query?: ListCustomerPaymentAllocationsQuery): Promise<CustomerPaymentAllocationListResponse> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const [paymentResult, invoices, allocations, vehicles] = await Promise.all([
      this.listCustomerPayments(customerId),
      this.getRawInvoices(customerId),
      this.getRawAllocations(customerId),
      this.getRawVehicles(),
    ]);
    const payments: PaymentRecord[] = paymentResult.items.map((payment) => ({
      id: payment.id,
      customerId: payment.customerId,
      invoiceId: payment.invoiceId,
      amountUsd: payment.amountUsd,
      paidAt: payment.paymentDate,
      paymentDate: payment.paymentDate,
      status: payment.status,
      reference: payment.reference,
      bankName: payment.bankName,
      currency: payment.currency,
      remarks: payment.remarks,
      financeNote: payment.financeNote,
      idempotencyKey: payment.idempotencyKey,
    }));
    return queryCustomerPaymentAllocations(buildCustomerPaymentAllocationSummaries(customerId, payments, allocations, invoices, vehicles), query);
  }

  async getCustomerPaymentAllocation(customerId: string, paymentId: string): Promise<CustomerPaymentAllocationSummary | null> {
    const result = await this.listCustomerPaymentAllocations(customerId, { page: 1, limit: 100 });
    return result.items.find((item) => item.id === paymentId) || null;
  }

  async createCustomerPayment(customerId: string, request: CreateCustomerPaymentRequest, nowISO = new Date().toISOString()): Promise<CustomerPayment> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const invoices = await this.getRawInvoices(customerId);
    const allocations = await this.getRawAllocations(customerId);
    const record = createPaymentRecord(customerId, request, nowISO, this.paymentRecords, invoices);
    await this.pool.query(
      `INSERT INTO payments (id, customer_id, invoice_id, amount_usd, paid_at, status, reference, bank_name, currency, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         reference = EXCLUDED.reference,
         bank_name = EXCLUDED.bank_name,
         currency = EXCLUDED.currency,
         remarks = EXCLUDED.remarks;`,
      [record.id, record.customerId, record.invoiceId, record.amountUsd, record.paidAt, record.status, record.reference || null, record.bankName || null, record.currency || 'USD', record.remarks || null]
    );
    const notifId = `notif-${customerId}-pmt-${Date.now()}`;
    await this.pool.query(
      `INSERT INTO notifications (id, customer_id, title, message, type, is_read, created_at, related_kind, related_id, related_href)
       VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8, $9)
       ON CONFLICT (id) DO NOTHING;`,
      [
        notifId,
        customerId,
        'TT WIRE PAYMENT SUBMITTED',
        `Your telegraphic transfer payment proof (Ref: ${record.reference || 'TT'}) has been submitted and queued for finance audit.`,
        'Payment',
        nowISO,
        'Payment',
        record.id,
        '/customer/payments',
      ]
    );
    return toCustomerPayment(record, invoices, allocations);
  }

  private async persistApprovedPaymentStatementEntry(payment: PaymentRecord): Promise<void> {
    if (payment.status !== 'Approved') return;
    await this.pool.query(
      `INSERT INTO customer_statement_transactions
        (id, customer_id, entry_date, entry_type, description, reference_no, debit_usd, credit_usd,
         source_type, source_id, created_at)
       VALUES ($1, $2, $3::date, 'Payment', 'Payment received', $4, 0, $5, 'payment', $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         entry_date = EXCLUDED.entry_date,
         reference_no = EXCLUDED.reference_no,
         credit_usd = EXCLUDED.credit_usd`,
      [`stmt-payment-${payment.id}`, payment.customerId, (payment.paymentDate || payment.paidAt).slice(0, 10),
        payment.reference || payment.id.toUpperCase(), payment.amountUsd, payment.id, payment.createdAt || payment.paidAt],
    );
  }

  async resubmitCustomerPayment(customerId: string, paymentId: string, nowISO = new Date().toISOString()): Promise<CustomerPayment> {
    await this.ensureCustomerFleetDataInPostgres(customerId);
    const invoices = await this.getRawInvoices(customerId);
    const allocations = await this.getRawAllocations(customerId);
    const payment = this.paymentRecords.find((candidate) => candidate.id === paymentId && candidate.customerId === customerId);
    if (!payment) throw new PaymentWorkflowError(404, 'Payment not found or not owned by customer');
    applyPaymentNotification(payment, { event: 'PaymentResubmitted' }, this.paymentNotifications, allocations, nowISO);
    return toCustomerPayment(payment, invoices, allocations);
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
    const notification = applyPaymentNotification(payment, request, this.paymentNotifications, this.allocations, nowISO);
    await this.persistApprovedPaymentStatementEntry(payment);
    return toCustomerPaymentNotification(notification);
  }

  private static rowToCustomerAccountRecord(row: {
    id: string;
    customer_id: string;
    name_with_initials: string;
    country_code: string;
    dial_code: string;
    mobile_number: string;
    email: string;
    tier?: string;
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
      tier: (row.tier as CustomerTier) || 'Standard',
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
      `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, tier, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [id, customerId, validated.nameWithInitials, validated.countryCode, validated.dialCode, validated.mobileNumber, validated.email, 'Standard', hash, salt, 'active', 'unverified', nowISO, nowISO, nowISO]
    );
    this.customerProfiles.push({
      customerId,
      name: '',
      companyName: '',
      phone: '',
      deliveryAddress: '',
      version: 1,
      updatedAt: nowISO,
    });
    await this.ensureCustomerFleetDataInPostgres(customerId, validated.email);
    return toCustomerAccountProjection({
      id,
      customerId,
      nameWithInitials: validated.nameWithInitials,
      countryCode: validated.countryCode,
      dialCode: validated.dialCode,
      mobileNumber: validated.mobileNumber,
      email: validated.email,
      tier: 'Standard',
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
    await this.ensureCustomerFleetDataInPostgres(record.customerId, record.email);
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

  // --- Phase 2.13: Wishlist and Favourites (D02-P13-T002) ---

  async listWishlist(customerId: string): Promise<WishlistListResponse> {
    const result = await this.pool.query(
      `SELECT id, customer_id, vehicle_id, vehicle_slug, created_at FROM wishlist_items WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    const items = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      vehicleId: row.vehicle_id,
      vehicleSlug: row.vehicle_slug,
      createdAt: row.created_at,
    }));
    return { items };
  }

  async toggleWishlist(customerId: string, vehicleSlug: string): Promise<WishlistToggleResponse> {
    const rawVehicles = await this.getRawVehicles();
    const vehicle = findVehicleRecord(rawVehicles, vehicleSlug);
    if (!vehicle) {
      throw { statusCode: 404, message: `Vehicle '${vehicleSlug}' not found` };
    }

    const existingResult = await this.pool.query(
      `SELECT id FROM wishlist_items WHERE customer_id = $1 AND vehicle_slug = $2 LIMIT 1`,
      [customerId, vehicleSlug]
    );

    if (existingResult.rows.length > 0) {
      const itemId = existingResult.rows[0].id;
      await this.pool.query(`DELETE FROM wishlist_items WHERE id = $1`, [itemId]);
      return { wishlisted: false };
    } else {
      const id = `wish-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = new Date().toISOString();
      await this.pool.query(
        `INSERT INTO wishlist_items (id, customer_id, vehicle_id, vehicle_slug, created_at) VALUES ($1, $2, $3, $4, $5)`,
        [id, customerId, vehicle.id, vehicleSlug, createdAt]
      );
      const item: WishlistItem = {
        id,
        customerId,
        vehicleId: vehicle.id,
        vehicleSlug,
        createdAt,
      };
      return { wishlisted: true, item };
    }
  }

  async listFavourites(customerId: string): Promise<FavouriteSearchListResponse> {
    const result = await this.pool.query(
      `SELECT id, customer_id, name, criteria_json, created_at FROM favourite_searches WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    const items = result.rows.map((row) => ({
      id: row.id,
      customerId: row.customer_id,
      name: row.name,
      criteria: JSON.parse(row.criteria_json),
      createdAt: row.created_at,
    }));
    return { items, limit: 25 };
  }

  async createFavourite(
    customerId: string,
    name: string,
    criteria: FavouriteSearchCriteria,
    nowISO?: string
  ): Promise<FavouriteSearch> {
    const hasAtLeastOne = Object.values(criteria).some((v) => v != null && v !== '' && v !== 0 && v !== false);
    if (!hasAtLeastOne) {
      throw { statusCode: 400, message: 'At least one criteria field is required' };
    }

    const countResult = await this.pool.query(
      `SELECT COUNT(*) as cnt FROM favourite_searches WHERE customer_id = $1`,
      [customerId]
    );
    const count = Number(countResult.rows[0].cnt);
    if (count >= 25) {
      throw { statusCode: 409, message: 'Favourite limit exceeded', reason: 'limit_exceeded' };
    }

    const id = `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = nowISO || new Date().toISOString();
    const criteriaJson = JSON.stringify(criteria);

    await this.pool.query(
      `INSERT INTO favourite_searches (id, customer_id, name, criteria_json, created_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, customerId, name, criteriaJson, createdAt]
    );

    return {
      id,
      customerId,
      name,
      criteria,
      createdAt,
    };
  }

  async deleteFavourite(customerId: string, id: string): Promise<void> {
    const result = await this.pool.query(
      `DELETE FROM favourite_searches WHERE id = $1 AND customer_id = $2`,
      [id, customerId]
    );
    if (result.rowCount === 0) {
      throw { statusCode: 404, message: 'Favourite not found' };
    }
  }

  async getFavouriteFacets(): Promise<FavouriteSearchFacets> {
    const rawVehicles = await this.getRawVehicles();
    const vehicles = rawVehicles.filter((v) => v.status !== 'Draft');

    const makeMap = new Map<string, number>();
    const modelMap = new Map<string, number>();
    const fuelTypeMap = new Map<string, number>();
    const driveTrainMap = new Map<string, number>();
    const transmissionMap = new Map<string, number>();

    let minYear = 2026;
    let maxYear = 1970;
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minMileage = Infinity;
    let maxMileage = -Infinity;

    vehicles.forEach((v) => {
      if (v.make) makeMap.set(v.make, (makeMap.get(v.make) || 0) + 1);
      if (v.model) modelMap.set(v.model, (modelMap.get(v.model) || 0) + 1);
      if (v.fuelType) fuelTypeMap.set(v.fuelType, (fuelTypeMap.get(v.fuelType) || 0) + 1);
      if (v.driveTrain) driveTrainMap.set(v.driveTrain, (driveTrainMap.get(v.driveTrain) || 0) + 1);
      if (v.transmission) transmissionMap.set(v.transmission, (transmissionMap.get(v.transmission) || 0) + 1);

      if (v.year) {
        if (v.year < minYear) minYear = v.year;
        if (v.year > maxYear) maxYear = v.year;
      }

      if (v.priceUsd && !v.requestPrice) {
        if (v.priceUsd < minPrice) minPrice = v.priceUsd;
        if (v.priceUsd > maxPrice) maxPrice = v.priceUsd;
      }

      if (v.mileage !== undefined && v.mileage !== null) {
        if (v.mileage < minMileage) minMileage = v.mileage;
        if (v.mileage > maxMileage) maxMileage = v.mileage;
      }
    });

    const sortFacets = (map: Map<string, number>) =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      makes: sortFacets(makeMap),
      models: sortFacets(modelMap),
      fuelTypes: sortFacets(fuelTypeMap),
      driveTrains: sortFacets(driveTrainMap),
      transmissions: sortFacets(transmissionMap),
      yearRange: {
        min: minYear <= maxYear ? minYear : 2015,
        max: minYear <= maxYear ? maxYear : 2024,
      },
      priceRange: {
        min: minPrice <= maxPrice ? minPrice : 0,
        max: minPrice <= maxPrice ? maxPrice : 50000,
      },
      mileageRange: {
        min: minMileage <= maxMileage ? minMileage : 0,
        max: minMileage <= maxMileage ? maxMileage : 100000,
      },
      modelCodes: [],
      engineCcOptions: [],
      colors: [],
      steeringOptions: [],
    };
  }

  async reset(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Clear dependent rows first now that the normalization migration has
      // added foreign keys to the vehicle and FAQ reference rows.
      await client.query('DELETE FROM faq_items');
      await client.query('DELETE FROM reservations');
      await client.query('DELETE FROM wishlist_items');
      await client.query('DELETE FROM favourite_searches');
      await client.query('DELETE FROM allocations');
      await client.query('DELETE FROM payment_notifications');
      await client.query('DELETE FROM customer_statement_transactions');
      await client.query('DELETE FROM payments');
      await client.query('DELETE FROM documents');
      await client.query('DELETE FROM shipments');
      await client.query('DELETE FROM proforma_invoices');
      await client.query('DELETE FROM invoices');
      await client.query('DELETE FROM vehicle_feature_assignments');
      await client.query('DELETE FROM vehicle_category_assignments');
      await client.query('DELETE FROM vehicles');
      await client.query('DELETE FROM vehicle_categories');
      await client.query('DELETE FROM vehicle_models');
      await client.query('DELETE FROM vehicle_makes');
      for (const table of Object.values(vehicleReferenceTables).filter((table) => table !== vehicleReferenceTables.make && table !== vehicleReferenceTables.model)) {
        await client.query(`DELETE FROM ${table}`);
      }
      await client.query('DELETE FROM vehicle_feature_catalog');
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
      await client.query('DELETE FROM notifications');
      await client.query('DELETE FROM customer_accounts');
      await client.query('DELETE FROM customer_tier_rules');
      await client.query('DELETE FROM wishlist_items');
      await client.query('DELETE FROM favourite_searches');
      await client.query('DELETE FROM proforma_invoices');
      await client.query('DELETE FROM invoices');
      await client.query('DELETE FROM allocations');
      await client.query('DELETE FROM shipments');
      await client.query('DELETE FROM documents');
      await client.query('DELETE FROM payments');
      await client.query('DELETE FROM payment_notifications');

      for (const rule of seedTierRules) {
        await client.query(
          'INSERT INTO customer_tier_rules (tier, discount_percent, max_active_reservations, description, active) VALUES ($1, $2, $3, $4, $5)',
          [rule.tier, rule.discountPercent, rule.maxActiveReservations, rule.description, rule.active],
        );
      }

      const seedAccount = buildSeedCustomerAccount();
      await client.query(
        `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, tier, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          seedAccount.id,
          seedAccount.customerId,
          seedAccount.nameWithInitials,
          seedAccount.countryCode,
          seedAccount.dialCode,
          seedAccount.mobileNumber,
          seedAccount.email,
          seedAccount.tier,
          seedAccount.passwordHash,
          seedAccount.passwordSalt,
          seedAccount.status,
          seedAccount.verificationState,
          seedAccount.createdAt,
          seedAccount.updatedAt,
          seedAccount.passwordUpdatedAt,
        ]
      );
      const otherSeedAccount = buildSeedOtherCustomerAccount();
      await client.query(
        `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, tier, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [otherSeedAccount.id, otherSeedAccount.customerId, otherSeedAccount.nameWithInitials, otherSeedAccount.countryCode,
          otherSeedAccount.dialCode, otherSeedAccount.mobileNumber, otherSeedAccount.email, otherSeedAccount.tier, otherSeedAccount.passwordHash,
          otherSeedAccount.passwordSalt, otherSeedAccount.status, otherSeedAccount.verificationState, otherSeedAccount.createdAt,
          otherSeedAccount.updatedAt, otherSeedAccount.passwordUpdatedAt],
      );

      for (const account of [
        buildSeedTierAccount('cust-silver-789', 'daniel.mwangi@example.com', 'Daniel Mwangi', 'KE', 'Silver'),
        buildSeedTierAccount('cust-gold-012', 'haruto.sato@example.com', 'Haruto Sato', 'JP', 'Gold'),
        buildSeedTierAccount('cust-platinum-345', 'sofia.almeida@example.com', 'Sofia Almeida', 'PT', 'Platinum'),
      ]) {
        await client.query(
          `INSERT INTO customer_accounts (id, customer_id, name_with_initials, country_code, dial_code, mobile_number, email, tier, password_hash, password_salt, status, verification_state, created_at, updated_at, password_updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [account.id, account.customerId, account.nameWithInitials, account.countryCode, account.dialCode, account.mobileNumber,
            account.email, account.tier, account.passwordHash, account.passwordSalt, account.status, account.verificationState,
            account.createdAt, account.updatedAt, account.passwordUpdatedAt],
        );
      }
      for (const profile of seedCustomerProfiles) {
        await client.query(
          `UPDATE customer_accounts
           SET company_name = $2, profile_phone = $3, delivery_address = $4,
               profile_version = $5, updated_at = $6
           WHERE customer_id = $1`,
          [profile.customerId, profile.companyName, profile.phone, profile.deliveryAddress, profile.version, profile.updatedAt],
        );
      }
      await client.query('INSERT INTO public_config (id, site_name, currency, contact_phone, tier_descriptions) VALUES (1, $1, $2, $3, $4)', [
        seedConfig.siteName,
        seedConfig.currency,
        seedConfig.contactPhone,
        JSON.stringify(seedConfig.tierDescriptions),
      ]);
      for (const feature of vehicleFeatureCatalog) {
        await client.query(
          'INSERT INTO vehicle_feature_catalog (feature_key, display_name, sort_order, active) VALUES ($1, $2, $3, $4)',
          [feature.key, feature.label, feature.sortOrder, feature.active],
        );
      }
      for (const vehicle of preparedSeedVehicles) {
        await client.query(
          'INSERT INTO vehicles (id, chassis_number, make, model, model_code, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, internal_notes, staff_owner_id, body_style, vehicle_sub_type, engine_cc, fuel_type, transmission, drive_train, overdrive, color, exterior_grade, steering, stock_country, stock_location, seats, load_capacity, features, mileage, etd, eta, request_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37)',
          [
            vehicle.id,
            vehicle.chassisNumber,
            vehicle.make,
            vehicle.model,
            vehicle.modelCode || null,
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
            vehicle.vehicleSubType || null,
            vehicle.engineCc || null,
            vehicle.fuelType || null,
            vehicle.transmission || null,
            vehicle.driveTrain || null,
            vehicle.overdrive || null,
            vehicle.color || null,
            vehicle.exteriorGrade || null,
            vehicle.steering || null,
            vehicle.stockCountry || null,
            vehicle.stockLocation || null,
            vehicle.seats || null,
            vehicle.loadCapacity || null,
            vehicle.features ? JSON.stringify(vehicle.features) : null,
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
        await client.query('INSERT INTO faq_items (id, category_id, question, answer, slug, featured, sort_order, owner, status, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [item.id, item.categoryId, item.question, item.answer, item.slug, item.featured ?? false, item.order || 1, item.owner, item.status, item.updatedAt]);
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
        await client.query('INSERT INTO branch_content (id, name, code, destination_port, introduction, welcome_banner, contact_banner, team_members, meet_and_greet_info, contact_details, content_owner, status, latest_arrivals_query, recently_discounted_query) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)', [branch.id, branch.name, branch.code, branch.destinationPort, branch.introduction, branch.welcomeBanner, branch.contactBanner, JSON.stringify(branch.teamMembers), branch.meetAndGreetInfo, JSON.stringify(branch.contactDetails), 'BranchContentSeed', branch.status, null, null]);
      }

      await client.query('COMMIT');
      this.notifications = seedNotifications.map((notification) => ({ ...notification }));
      this.customerProfiles = seedCustomerProfiles.map((profile) => ({ ...profile }));
      this.paymentRecords = seedPayments.map((payment) => ({ ...payment }));
      this.paymentNotifications = seedPaymentNotifications.map((notification) => ({ ...notification }));
      this.allocations = seedAllocations.map((allocation) => ({ ...allocation }));

      await this.ensureCustomerFleetDataInPostgres(seedAccount.customerId, seedAccount.email);
      await this.ensureCustomerFleetDataInPostgres('user-other-456', 'amina.njeri@example.com');
      await this.ensureMockRelationalFixtures();
      await this.backfillVehicleReferences();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getCustomerStatement(customerId: string, fromDate?: string, toDate?: string): Promise<CustomerStatementSummary> {
    const result = await this.pool.query(
      `SELECT id, entry_date, description, reference_no, debit_usd, credit_usd, opening_balance_usd, is_opening_balance
       FROM customer_statement_transactions
       WHERE customer_id = $1
         AND (is_opening_balance = true OR ($2::date IS NULL OR entry_date >= $2::date)
         AND ($3::date IS NULL OR entry_date <= $3::date))
       ORDER BY is_opening_balance DESC, entry_date ASC, created_at ASC, id ASC`,
      [customerId, fromDate || null, toDate || null],
    );

    const openingRow = result.rows.find((row) => row.is_opening_balance);
    const openingBalanceUsd = openingRow ? Number(openingRow.opening_balance_usd) : 0;
    let runningBalanceUsd = openingBalanceUsd;
    const entries: CustomerStatementEntry[] = result.rows.map((row) => {
      const isOpeningBalance = Boolean(row.is_opening_balance);
      const debitUsd = Number(row.debit_usd);
      const creditUsd = Number(row.credit_usd);
      if (!isOpeningBalance) runningBalanceUsd += debitUsd - creditUsd;
      return {
        id: row.id,
        date: String(row.entry_date).slice(0, 10),
        description: row.description,
        ...(row.reference_no ? { referenceNo: row.reference_no } : {}),
        debitUsd,
        creditUsd,
        runningBalanceUsd,
        ...(isOpeningBalance ? { isOpeningBalance: true } : {}),
      };
    });
    const transactionEntries = entries.filter((entry) => !entry.isOpeningBalance);
    const totalDebitsUsd = transactionEntries.reduce((sum, entry) => sum + entry.debitUsd, 0);
    const totalCreditsUsd = transactionEntries.reduce((sum, entry) => sum + entry.creditUsd, 0);

    return {
      customerId,
      fromDate: fromDate || (entries[0]?.date ?? new Date().toISOString().slice(0, 10)),
      toDate: toDate || (entries.at(-1)?.date ?? new Date().toISOString().slice(0, 10)),
      openingBalanceUsd,
      totalDebitsUsd,
      totalCreditsUsd,
      closingBalanceUsd: openingBalanceUsd + totalDebitsUsd - totalCreditsUsd,
      entries,
    };
  }

  listCustomerPolymorphicInquiries(customerId: string): Promise<CustomerPolymorphicInquiryListResponse> {
    const memory = new MemoryStore();
    return memory.listCustomerPolymorphicInquiries(customerId);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createStore(connectionString = process.env.DATABASE_URL): DemoStore {
  return connectionString ? new PostgresStore(connectionString) : new MemoryStore();
}
