import { Pool } from 'pg';
import type {
  VehicleDomainSummary,
  VehicleStatus,
  VehicleSearchResult,
  VehicleFacets,
  SearchVehiclesQuery,
  VehicleDetail,
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
  LeadRecord,
  LeadListResponse,
} from '@carchief/domain';
import { generateVehicleSlug, calculateFreightEstimate, resolveFreightRateStatus, ENQUIRY_TYPES, ENQUIRY_SOURCES } from '@carchief/domain';
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
];

export interface DemoStore {
  ready(): Promise<void>;
  getConfig(): Promise<PublicConfig>;
  getVehicles(query?: GetVehiclesQuery): Promise<VehicleDomainSummary[]>;
  searchVehicles(query?: SearchVehiclesQuery): Promise<VehicleSearchResult>;
  getVehicleDetail(idOrSlug: string): Promise<VehicleDetail | null>;
  getFreightDestinations(): Promise<FreightDestination[]>;
  getFreightPorts(): Promise<FreightPort[]>;
  getFreightEstimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse>;
  createEnquiry(request: EnquiryRequest): Promise<EnquiryResponse>;
  getLeadById(id: string): Promise<LeadRecord | null>;
  listLeads(): Promise<LeadListResponse>;
  reset(): Promise<void>;
  close(): Promise<void>;
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
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
  receivedAt: string;
  enquiryType: EnquiryType;
  source: EnquirySource;
  duplicateResubmissionCount: number;
}

interface PreparedEnquiry {
  name: string;
  email: string;
  phone: string;
  message: string;
  vehicleSlug?: string;
  estimateSnapshot?: EnquiryEstimateSnapshot;
  enquiryType: EnquiryType;
  source: EnquirySource;
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

  return { name, email, phone, message, vehicleSlug, estimateSnapshot, enquiryType, source };
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
  ].join('|');
}

const ENQUIRY_SELECT_COLUMNS =
  'SELECT id, dedupe_key, name, email, phone, message, vehicle_slug, destination_code, port_code, rate_status, currency, rate_effective_from, rate_effective_to, estimate_message, received_at, enquiry_type, source, duplicate_resubmission_count';

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
    vehicleSlug: (row.vehicle_slug as string | null) || undefined,
    receivedAt: row.received_at as string,
    enquiryType: (row.enquiry_type as EnquiryType | null) || 'general',
    source: (row.source as EnquirySource | null) || 'form',
    duplicateResubmissionCount: Number(row.duplicate_resubmission_count ?? 0),
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
    vehicleSlug: record.vehicleSlug,
    estimateSnapshot: record.estimateSnapshot,
    duplicateResubmissionCount: record.duplicateResubmissionCount,
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

function projectPublicVehicle(v: VehicleRecord): VehicleDomainSummary {
  const resolvedLoc = resolveLocationStatus(v);
  return {
    id: v.id,
    chassisNumber: v.chassisNumber,
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
    requestPrice: v.requestPrice ?? (v.priceUsd === 0),
  };
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

export function buildVehicleDetail(v: VehicleRecord): VehicleDetail {
  const slug = generateVehicleSlug(v.year, v.make, v.model, v.id);
  const isRequestPrice = Boolean(v.requestPrice || !v.priceUsd || v.priceUsd <= 0);
  const priceState = isRequestPrice ? 'request_price' : 'priced';
  const priceUsd = isRequestPrice ? undefined : v.priceUsd;
  const discountPercent = isRequestPrice ? undefined : v.discountPercent;
  const discountedPriceUsd = (priceState === 'priced' && priceUsd && discountPercent)
    ? Math.round(priceUsd * (1 - discountPercent / 100))
    : undefined;

  const gallery = v.images ? [...v.images] : [];
  const locStatus = resolveLocationStatus(v);

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

function filterAndSortVehicles(vehicles: VehicleRecord[], query?: GetVehiclesQuery): VehicleDomainSummary[] {
  let list: VehicleDomainSummary[] = vehicles.map(projectPublicVehicle);
  const now = new Date('2026-08-10T10:00:00.000Z').getTime();
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

class MemoryStore implements DemoStore {
  private config = { ...seedConfig };
  private vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));
  private enquiries: EnquiryRecord[] = [];
  private enquirySeq = 0;

  ready(): Promise<void> {
    return Promise.resolve();
  }

  getConfig(): Promise<PublicConfig> {
    return Promise.resolve({ ...this.config });
  }

  getVehicles(query?: GetVehiclesQuery): Promise<VehicleDomainSummary[]> {
    return Promise.resolve(filterAndSortVehicles(this.vehicles, query));
  }

  searchVehicles(query?: SearchVehiclesQuery): Promise<VehicleSearchResult> {
    const filteredList = filterAndSortVehicles(this.vehicles, query);
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

  getVehicleDetail(idOrSlug: string): Promise<VehicleDetail | null> {
    const record = findVehicleRecord(this.vehicles, idOrSlug);
    if (!record) return Promise.resolve(null);
    return Promise.resolve(buildVehicleDetail(record));
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

  reset(): Promise<void> {
    this.config = { ...seedConfig };
    this.vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));
    this.enquiries = [];
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

class PostgresStore implements DemoStore {
  private readonly pool: Pool;

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
    await this.reset();
  }

  async getConfig(): Promise<PublicConfig> {
    const result = await this.pool.query('SELECT site_name, currency, contact_phone FROM public_config WHERE id = 1');
    const row = result.rows[0];
    return row ? { siteName: row.site_name, currency: row.currency, contactPhone: row.contact_phone } : { ...seedConfig };
  }

  async getVehicles(query?: GetVehiclesQuery): Promise<VehicleDomainSummary[]> {
    const result = await this.pool.query(
      'SELECT id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, body_style, fuel_type, transmission, drive_train, mileage, etd, eta, request_price FROM vehicles ORDER BY id'
    );
    const rawRecords: VehicleRecord[] = result.rows.map((row) => ({
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
    return filterAndSortVehicles(rawRecords, query);
  }

  async searchVehicles(query?: SearchVehiclesQuery): Promise<VehicleSearchResult> {
    const rawRecords = await this.getRawVehicles();
    const filteredList = filterAndSortVehicles(rawRecords, query);
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

  async getVehicleDetail(idOrSlug: string): Promise<VehicleDetail | null> {
    const rawRecords = await this.getRawVehicles();
    const record = findVehicleRecord(rawRecords, idOrSlug);
    if (!record) return null;
    return buildVehicleDetail(record);
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
    if (existingResult.rows[0]) {
      const updateResult = await this.pool.query(
        `UPDATE enquiries SET duplicate_resubmission_count = COALESCE(duplicate_resubmission_count, 0) + 1 WHERE id = $1 RETURNING duplicate_resubmission_count`,
        [existingResult.rows[0].id]
      );
      const record = rowToEnquiryRecord({
        ...existingResult.rows[0],
        duplicate_resubmission_count: updateResult.rows[0].duplicate_resubmission_count,
      });
      return toEnquiryResponse(record, true);
    }

    const id = `enq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const receivedAt = new Date().toISOString();
    await this.pool.query(
      'INSERT INTO enquiries (id, dedupe_key, name, email, phone, message, vehicle_slug, destination_code, port_code, rate_status, currency, rate_effective_from, rate_effective_to, estimate_message, received_at, enquiry_type, source, duplicate_resubmission_count) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)',
      [
        id,
        dedupeKey,
        prepared.name,
        prepared.email,
        prepared.phone,
        prepared.message,
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

  async reset(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM vehicles');
      await client.query('DELETE FROM public_config');
      await client.query('DELETE FROM enquiries');
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
      await client.query('COMMIT');
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
