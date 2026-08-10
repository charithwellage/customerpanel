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
}

export * from './auth.js';
