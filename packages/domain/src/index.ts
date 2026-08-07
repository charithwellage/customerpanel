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

export interface VehicleDomainSummary {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: VehicleStatus;
}
