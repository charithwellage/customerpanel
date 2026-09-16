export interface MatchedVehicle {
  id: string;
  title: string;
  year: number;
  make: string;
  model: string;
  chassisNumber: string;
  grade: string;
  mileageKm: number;
  engineCc: number;
  transmission: string;
  fuelType: string;
  color: string;
  auctionSource: string;
  estimatedCifUsd: number;
  imageUrl: string;
  availableDate: string;
  location: string;
  status: 'Available' | 'Auction Tomorrow' | 'Reserved';
}

export type DemandSourceType = 'cant_find_stock' | 'future_purchase_plan';

export type DemandStatus = 'hunting' | 'matches_found' | 'under_quotation' | 'fulfilled' | 'paused';

export interface CustomerDemandRecord {
  id: string;
  demandNumber: string;
  createdAt: string;
  sourceType: DemandSourceType;
  status: DemandStatus;
  
  // Target vehicle details
  make: string;
  model: string;
  yearMin: number;
  yearMax: number;
  targetBudgetCifUsd: number;
  destinationPort: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  driveType?: string;
  mileagePreference?: string;
  colorPreference?: string;
  minAuctionGrade?: string;
  
  // Future purchase planning
  purchaseHorizon: string;
  additionalNotes?: string;
  referenceImageUrl?: string;
  notifyChannels: string[];
  
  // Matching results
  matchedVehicles?: MatchedVehicle[];
  agentAssigned?: {
    name: string;
    desk: string;
    avatar: string;
  };
}
