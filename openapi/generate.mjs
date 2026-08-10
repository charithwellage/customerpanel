import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const openapiPath = join(root, 'openapi', 'openapi.json');
const outputPath = join(root, 'packages', 'api-client', 'src', 'generated', 'schema.d.ts');

if (!existsSync(openapiPath)) {
  console.error(`OpenAPI spec not found at ${openapiPath}`);
  process.exit(1);
}

const openapiSpec = JSON.parse(readFileSync(openapiPath, 'utf8'));

const outputContent = `/**
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
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, outputContent, 'utf8');
console.log(`Generated API schema client at ${outputPath}`);
