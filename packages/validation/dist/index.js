"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enquiryFormSchema = void 0;
exports.isValidVehicleStatus = isValidVehicleStatus;
exports.validateEmail = validateEmail;
function isValidVehicleStatus(status) {
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
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
var enquiry_js_1 = require("./enquiry.js");
Object.defineProperty(exports, "enquiryFormSchema", { enumerable: true, get: function () { return enquiry_js_1.enquiryFormSchema; } });
//# sourceMappingURL=index.js.map