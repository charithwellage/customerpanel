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
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
}

export interface ResetResponse {
  success: boolean;
  message: string;
}
