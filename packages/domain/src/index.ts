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

export function generateVehicleSlug(year: number, make: string, model: string, id: string): string {
  const raw = `${year}-${make}-${model}-${id}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export * from './auth.js';
