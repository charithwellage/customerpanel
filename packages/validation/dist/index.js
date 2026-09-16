export function isValidVehicleStatus(status) {
    const validStatuses = [
        'Draft',
        'Available',
        'Pending',
        'Reserved',
        'ReservedWithPI',
        'InvoiceCreated',
        'Invoiced',
        'Sold',
    ];
    return validStatuses.includes(status);
}
export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export { enquiryFormSchema } from './enquiry.js';
export { wishlistToggleSchema } from './wishlist.js';
export { favouriteSearchCriteriaSchema, favouriteSearchCreateSchema } from './favourites.js';
export { customerPaymentFormSchema, MAX_PAYMENT_PROOF_BYTES, SUPPORTED_PAYMENT_CURRENCIES } from './payment.js';
export { registrationFormSchema, loginFormSchema, passwordChangeSchema, passwordResetSchema, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, } from './auth.js';
//# sourceMappingURL=index.js.map