import type { VehicleStatus } from '@carchief/domain';

export function isValidVehicleStatus(status: string): status is VehicleStatus {
  const validStatuses: VehicleStatus[] = [
    'Draft',
    'Available',
    'Pending',
    'Reserved',
    'ReservedWithPI',
    'InvoiceCreated',
    'Invoiced',
    'Sold',
  ];
  return validStatuses.includes(status as VehicleStatus);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export { enquiryFormSchema } from './enquiry.js';
export type { EnquiryFormSchemaValues, EnquiryFormSchemaInput } from './enquiry.js';
