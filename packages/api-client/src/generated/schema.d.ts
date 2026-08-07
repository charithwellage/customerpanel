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
  status: 'Available' | 'ReservedWithPI' | 'Sold';
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
