"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOnline = isOnline;
function isOnline() {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        return navigator.onLine;
    }
    return true;
}
//# sourceMappingURL=index.js.map