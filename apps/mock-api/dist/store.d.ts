import type { VehicleDomainSummary, VehicleSearchResult, SearchVehiclesQuery, VehicleDetail, CustomerTier, FreightDestination, FreightPort, FreightRateRecord, FreightEstimateRequest, FreightEstimateResponse, EnquiryRequest, EnquiryResponse, EnquiryEstimateSnapshot, EnquiryType, EnquirySource, EnquiryPreferredDriveSide, LeadRecord, LeadListResponse, CustomerInquiryListResponse, WishlistListResponse, WishlistToggleResponse, FavouriteSearchCriteria, FavouriteSearch, FavouriteSearchListResponse, FavouriteSearchFacets, ReservationRequest, ReservationResponse, FaqQueryResponse, TestimonialSubmissionRequest, TestimonialSubmissionResponse, TestimonialListResponse, PublicContentPage, OfficeListResponse, BranchContent, BranchListResponse, CustomerDashboard, CustomerVehicleDetail, CustomerVehicleListResponse, VehicleStatusDefinition, ListCustomerVehiclesQuery, CustomerInvoiceDetail, CustomerInvoiceListResponse, ListCustomerInvoicesQuery, CustomerInvoiceDocument, CustomerPayment, CustomerPaymentMethod, CustomerPaymentListResponse, CreateCustomerPaymentRequest, CreateCustomerCardPaymentRequest, CustomerPaymentNotification, CustomerPaymentNotificationEvent, CustomerPaymentNotificationListResponse, RecordPaymentNotificationRequest, CustomerPaymentAllocationSummary, CustomerPaymentAllocationListResponse, ListCustomerPaymentAllocationsQuery, Notification, CustomerNotificationListResponse, MarkNotificationsReadResponse, CustomerProfile, UpdateCustomerProfileRequest, CustomerStatementSummary, CustomerPolymorphicInquiryListResponse, BankAccount } from '@carchief/domain';
import { CustomerTierRule, CustomerTierBenefits } from '@carchief/domain';
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
export interface PublicConfig {
    siteName: string;
    currency: string;
    contactPhone: string;
    tierDescriptions?: Partial<Record<'Platinum' | 'Gold' | 'Silver' | 'Standard', string>>;
    liveAuctionUrl?: string;
}
export interface GetVehiclesQuery extends SearchVehiclesQuery {
    collection?: string;
    market?: string;
    category?: string;
    limit?: number;
    destinationCountry?: string;
}
export declare const seedVehicleStatusDefinitions: VehicleStatusDefinition[];
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
    getCustomerDashboard(customerId: string, customerEmail: string): Promise<CustomerDashboard>;
    getCustomerVehicles(customerId: string, query?: ListCustomerVehiclesQuery, nowISO?: string): Promise<CustomerVehicleListResponse>;
    getCustomerVehicleById(customerId: string, idOrSlug: string, nowISO?: string): Promise<CustomerVehicleDetail | null>;
    listCustomerDocuments(customerId: string): Promise<CustomerDocument[]>;
    getCustomerDocument(customerId: string, documentId: string): Promise<CustomerDocument | null>;
    listCustomerNotifications(customerId: string, query?: {
        status?: 'all' | 'read' | 'unread';
        q?: string;
    }): Promise<CustomerNotificationListResponse>;
    markCustomerNotificationRead(customerId: string, notificationId: string): Promise<Notification | null>;
    markAllCustomerNotificationsRead(customerId: string): Promise<MarkNotificationsReadResponse>;
    deleteCustomerNotification(customerId: string, notificationId: string): Promise<boolean>;
    getCustomerProfile(customerId: string, email: string): Promise<CustomerProfile>;
    updateCustomerProfile(customerId: string, email: string, request: UpdateCustomerProfileRequest, nowISO?: string): Promise<CustomerProfile>;
    getCustomerInvoices(customerId: string, query?: ListCustomerInvoicesQuery, nowISO?: string): Promise<CustomerInvoiceListResponse>;
    getCustomerInvoiceById(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDetail | null>;
    getCustomerInvoiceDocument(customerId: string, id: string, nowISO?: string): Promise<CustomerInvoiceDocument | null>;
    listCustomerPaymentAllocations(customerId: string, query?: ListCustomerPaymentAllocationsQuery): Promise<CustomerPaymentAllocationListResponse>;
    getCustomerPaymentAllocation(customerId: string, paymentId: string): Promise<CustomerPaymentAllocationSummary | null>;
    listCustomerPayments(customerId: string): Promise<CustomerPaymentListResponse>;
    createCustomerPayment(customerId: string, request: CreateCustomerPaymentRequest, nowISO?: string): Promise<CustomerPayment>;
    createCustomerCardPayment(customerId: string, request: CreateCustomerCardPaymentRequest, nowISO?: string): Promise<CustomerPayment>;
    listCustomerPaymentNotifications(customerId: string, paymentId?: string): Promise<CustomerPaymentNotificationListResponse>;
    resubmitCustomerPayment(customerId: string, paymentId: string, nowISO?: string): Promise<CustomerPayment>;
    recordPaymentNotification(paymentId: string, request: RecordPaymentNotificationRequest, nowISO?: string): Promise<CustomerPaymentNotification | null>;
    registerCustomerAccount(request: RegisterCustomerRequest, nowISO?: string): Promise<CustomerAccountProjection>;
    authenticateCustomer(request: LoginRequest): Promise<CustomerAccountProjection>;
    changeCustomerPassword(customerId: string, request: ChangePasswordRequest, nowISO?: string): Promise<void>;
    requestPasswordReset(request: PasswordResetRequest, nowISO?: string): Promise<void>;
    confirmPasswordReset(request: ConfirmPasswordResetRequest, nowISO?: string): Promise<void>;
    listPasswordResetOutbox(): Promise<PasswordResetOutboxRecord[]>;
    getCountries(): Promise<CountriesResponse>;
    listWishlist(customerId: string): Promise<WishlistListResponse>;
    toggleWishlist(customerId: string, vehicleSlug: string): Promise<WishlistToggleResponse>;
    listFavourites(customerId: string): Promise<FavouriteSearchListResponse>;
    createFavourite(customerId: string, name: string, criteria: FavouriteSearchCriteria, nowISO?: string): Promise<FavouriteSearch>;
    deleteFavourite(customerId: string, id: string): Promise<void>;
    getFavouriteFacets(): Promise<FavouriteSearchFacets>;
    getCustomerStatement(customerId: string, fromDate?: string, toDate?: string): Promise<CustomerStatementSummary>;
    listCustomerPolymorphicInquiries(customerId: string): Promise<CustomerPolymorphicInquiryListResponse>;
    reset(): Promise<void>;
    close(): Promise<void>;
}
export declare class AccountRequestError extends Error {
    readonly statusCode: number;
    readonly field?: string;
    constructor(statusCode: number, message: string, field?: string);
}
/**
 * A single generic authentication failure — reused for "unknown email" and
 * "wrong password" so a caller can never distinguish account existence from
 * a login response (CUST-27, account-enumeration boundary).
 */
export declare class AuthenticationError extends Error {
    readonly statusCode = 401;
    constructor(message?: string);
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
    readonly reason?: string;
    constructor(statusCode: number, message: string, field?: string, reason?: string);
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
    criteriaJson: string;
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
/**
 * Validates and normalizes an enquiry request, resolving an optional vehicle
 * link and an optional server-side freight rate-lookup snapshot. Throws a
 * field-associated `EnquiryRequestError` (400) for anything invalid — never
 * silently drops or substitutes a value. `customerId` is accepted as a
 * trusted parameter from the route handler (never from the request body).
 */
export declare function prepareEnquiry(vehicles: VehicleRecord[], destinations: FreightDestination[], ports: FreightPort[], records: FreightRateRecord[], request: EnquiryRequest, nowISO: string, customerId: string): PreparedEnquiry;
/**
 * A resubmission is the same enquiry, not a new lead: identical contact
 * identifier (customerId for authenticated submitters, email for anonymous),
 * vehicle, destination/port and message text collapse to one stored record
 * (RULE-08) rather than creating unlimited duplicates from a double-click or
 * retry. This keying prevents two different customers sharing an email from
 * being incorrectly collapsed into one row.
 */
export declare function buildEnquiryDedupeKey(prepared: PreparedEnquiry): string;
export declare function resolveLocationStatus(v: VehicleRecord, nowISO?: string): 'In Japan' | 'In Transit' | 'In Port';
export declare function projectVehicle(v: VehicleRecord, context?: VehicleQueryContext): VehicleDomainSummary;
export declare function projectPublicVehicle(v: VehicleRecord): VehicleDomainSummary;
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
export declare function buildVehicleDetail(v: VehicleRecord, context?: VehicleQueryContext): VehicleDetail;
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
export declare const seedReservations: ReservationRecord[];
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
    paymentMethod?: CustomerPaymentMethod;
    vehicleId?: string;
    vehicleName?: string;
    proformaInvoiceId?: string;
    gatewayProvider?: string;
    gatewayTransactionId?: string;
    cardBrand?: string;
    cardLast4?: string;
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
export declare class DatabaseRequiredError extends Error {
    readonly statusCode = 503;
    constructor();
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
export declare function buildCustomerVehicleProjections(customerId: string, vehicles: VehicleRecord[], reservations: ReservationRecord[], proformaInvoices: ProformaInvoiceRecord[], invoices: InvoiceRecord[], allocations: AllocationRecord[], shipments: ShipmentRecord[], documents: DocumentRecord[], nowISO?: string, vehicleStatusDefinitions?: VehicleStatusDefinition[]): CustomerVehicleDetail[];
export declare function queryCustomerVehicles(allVehicles: CustomerVehicleDetail[], query?: ListCustomerVehiclesQuery, vehicleStatusDefinitions?: VehicleStatusDefinition[]): CustomerVehicleListResponse;
/**
 * Phase 2.5: Customer Invoice & Proforma Invoice Projections
 * (CUST-02, CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-08, RULE-10)
 */
export declare function buildCustomerInvoiceProjections(customerId: string, invoices: InvoiceRecord[], proformaInvoices: ProformaInvoiceRecord[], allocations: AllocationRecord[], vehicles: VehicleRecord[], documents: DocumentRecord[], nowISO?: string): CustomerInvoiceDetail[];
export declare function queryCustomerInvoices(allInvoices: CustomerInvoiceDetail[], query?: ListCustomerInvoicesQuery): CustomerInvoiceListResponse;
export declare function buildCustomerInvoiceDocument(invoice: CustomerInvoiceDetail): CustomerInvoiceDocument;
export declare class PaymentWorkflowError extends Error {
    readonly statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare class ProfileConflictError extends Error {
    readonly statusCode = 409;
    constructor();
}
export declare function createStore(connectionString?: string | undefined): DemoStore;
//# sourceMappingURL=store.d.ts.map