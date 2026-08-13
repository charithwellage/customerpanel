"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatVehicleTitle = void 0;
exports.getPublicWebSkeletonInfo = getPublicWebSkeletonInfo;
__exportStar(require("./shell/Header.js"), exports);
__exportStar(require("./shell/Footer.js"), exports);
__exportStar(require("./shell/NavigationDrawer.js"), exports);
__exportStar(require("./shell/LayoutShell.js"), exports);
__exportStar(require("./shell/ErrorBoundary.js"), exports);
const theme_1 = require("@carchief/theme");
const vehicle_detail_1 = require("@carchief/vehicle-detail");
Object.defineProperty(exports, "formatVehicleTitle", { enumerable: true, get: function () { return vehicle_detail_1.formatVehicleTitle; } });
function getPublicWebSkeletonInfo() {
    return `CarChief Public Website Shell (${theme_1.defaultTheme.colors.primary})`;
}
//# sourceMappingURL=index.js.map