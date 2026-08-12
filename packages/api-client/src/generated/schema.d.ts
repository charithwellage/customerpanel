/**
 * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Generated from openapi/openapi.json specification.
 */

export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
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
