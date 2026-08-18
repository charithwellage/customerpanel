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

export { enquiryFormSchema, quoteRequestFormSchema } from './enquiry.js';
export type { EnquiryFormSchemaValues, EnquiryFormSchemaInput, QuoteRequestFormSchemaValues, QuoteRequestFormSchemaInput } from './enquiry.js';
export { wishlistToggleSchema } from './wishlist.js';
export type { WishlistToggleSchemaValues, WishlistToggleSchemaInput } from './wishlist.js';
export { favouriteSearchCriteriaSchema, favouriteSearchCreateSchema } from './favourites.js';
export type {
  FavouriteSearchCriteriaValues,
  FavouriteSearchCriteriaInput,
  FavouriteSearchCreateSchemaValues,
  FavouriteSearchCreateSchemaInput,
} from './favourites.js';
export { customerPaymentFormSchema, MAX_PAYMENT_PROOF_BYTES, SUPPORTED_PAYMENT_CURRENCIES } from './payment.js';
export type { CustomerPaymentFormInput, CustomerPaymentFormValues, SupportedPaymentCurrency } from './payment.js';
export {
  registrationFormSchema,
  loginFormSchema,
  passwordChangeSchema,
  passwordResetSchema,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from './auth.js';
export type {
  RegistrationFormSchemaValues,
  RegistrationFormSchemaInput,
  LoginFormSchemaValues,
  LoginFormSchemaInput,
  PasswordChangeSchemaValues,
  PasswordChangeSchemaInput,
  PasswordResetSchemaValues,
  PasswordResetSchemaInput,
} from './auth.js';
