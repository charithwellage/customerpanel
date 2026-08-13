import type { VehicleDomainSummary, VehicleSearchResult, SearchVehiclesQuery, VehicleDetail, FreightDestination, FreightPort, FreightRateRecord, FreightEstimateRequest, FreightEstimateResponse, EnquiryRequest, EnquiryResponse, EnquiryEstimateSnapshot, EnquiryType, EnquirySource, EnquiryPreferredDriveSide, LeadRecord, LeadListResponse, ReservationRequest, ReservationResponse, FaqQueryResponse, TestimonialSubmissionRequest, TestimonialSubmissionResponse, TestimonialListResponse, PublicContentPage, OfficeListResponse, BranchContent, BranchListResponse } from '@carchief/domain';
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
    liveAuctionUrl?: string;
}
export interface GetVehiclesQuery extends SearchVehiclesQuery {
    collection?: string;
    market?: string;
    category?: string;
    limit?: number;
}
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
    createReservation(customerId: string, customerEmail: string, request: ReservationRequest, nowISO?: string): Promise<ReservationResponse>;
    getReservationById(id: string): Promise<ReservationResponse | null>;
    getFaqs(query?: {
        category?: string;
        q?: string;
    }): Promise<FaqQueryResponse>;
    getTestimonials(): Promise<TestimonialListResponse>;
    submitTestimonial(request: TestimonialSubmissionRequest): Promise<TestimonialSubmissionResponse>;
    getContentPages(): Promise<PublicContentPage[]>;
    getContentPageBySlug(slug: string): Promise<PublicContentPage | null>;
    getOffices(): Promise<OfficeListResponse>;
    getBranches(): Promise<BranchListResponse>;
    getBranchById(id: string): Promise<BranchContent | null>;
    reset(): Promise<void>;
    close(): Promise<void>;
}
/**
 * Thin store-owned wrapper around the domain calculation sequence, supplying
 * this store's default reference instant when the caller omits one.
 */
export declare function buildFreightEstimate(destinations: FreightDestination[], ports: FreightPort[], records: FreightRateRecord[], request: FreightEstimateRequest, nowISO?: string): FreightEstimateResponse;
export declare class TestimonialRequestError extends Error {
    readonly statusCode: number;
    readonly field?: string;
    constructor(statusCode: number, message: string, field?: string);
}
export declare class EnquiryRequestError extends Error {
    readonly statusCode: number;
    readonly field?: string;
    constructor(statusCode: number, message: string, field?: string);
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
/**
 * Validates and normalizes an enquiry request, resolving an optional vehicle
 * link and an optional server-side freight rate-lookup snapshot. Throws a
 * field-associated `EnquiryRequestError` (400) for anything invalid — never
 * silently drops or substitutes a value.
 */
export declare function prepareEnquiry(vehicles: VehicleRecord[], destinations: FreightDestination[], ports: FreightPort[], records: FreightRateRecord[], request: EnquiryRequest, nowISO: string): PreparedEnquiry;
/**
 * A resubmission is the same enquiry, not a new lead: identical contact
 * email, vehicle, destination/port and message text collapse to one stored
 * record (RULE-08) rather than creating unlimited duplicates from a
 * double-click or retry.
 */
export declare function buildEnquiryDedupeKey(prepared: PreparedEnquiry): string;
export declare function resolveLocationStatus(v: VehicleRecord, nowISO?: string): 'In Japan' | 'In Transit' | 'In Port';
/**
 * Demo-only stand-in for the country eligibility projection.
 *
 * The real projection is server-authoritative and per-vehicle (PUB-25), but the
 * demo record carries no eligibility source data and `DEC-PUB-LEGACY-PARITY` is
 * still OPEN. This constant is therefore an explicitly named placeholder, not a
 * business rule: it must be replaced with per-vehicle data before any screen
 * makes an eligibility claim to a visitor.
 */
export declare const DEMO_COUNTRY_ELIGIBILITY_PLACEHOLDER: readonly ["UG", "KE", "TZ", "RW", "SS"];
export declare function buildVehicleDetail(v: VehicleRecord): VehicleDetail;
export declare function findVehicleRecord(vehicles: VehicleRecord[], idOrSlug: string): VehicleRecord | undefined;
export declare class ReservationRequestError extends Error {
    readonly statusCode: number;
    readonly field?: string;
    readonly reason?: string;
    constructor(statusCode: number, message: string, field?: string, reason?: string);
}
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
export declare function createStore(connectionString?: string | undefined): DemoStore;
//# sourceMappingURL=store.d.ts.map