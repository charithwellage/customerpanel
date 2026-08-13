"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleGalleryPrimitive = void 0;
exports.serializeJsonLd = serializeJsonLd;
exports.formatVehicleTitle = formatVehicleTitle;
exports.isVehicleAvailable = isVehicleAvailable;
exports.getEffectivePrice = getEffectivePrice;
exports.getVisibleGalleryImages = getVisibleGalleryImages;
var VehicleGalleryPrimitive_js_1 = require("./VehicleGalleryPrimitive.js");
Object.defineProperty(exports, "VehicleGalleryPrimitive", { enumerable: true, get: function () { return VehicleGalleryPrimitive_js_1.VehicleGalleryPrimitive; } });
/**
 * Serializes a JSON-LD payload for safe embedding inside a `<script>` element.
 *
 * `JSON.stringify` does not escape `<`, `>` or `&`, so a vehicle field
 * containing `</script>` would otherwise close the script element and inject
 * arbitrary markup into the page. Vehicle text is staff-editable, so this is a
 * stored-injection path, not a theoretical one. The escaped sequences remain
 * valid JSON string escapes, so consumers parse the identical object.
 */
function serializeJsonLd(payload) {
    return JSON.stringify(payload)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026');
}
function formatVehicleTitle(vehicle) {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
}
function isVehicleAvailable(status) {
    return status === 'Available';
}
function getEffectivePrice(detail) {
    if (detail.priceState === 'request_price' || detail.requestPrice || detail.priceUsd === undefined) {
        return { priceText: 'Request Price', isRequestPrice: true };
    }
    const finalPrice = detail.discountedPriceUsd ?? detail.priceUsd;
    return { priceText: `$${finalPrice.toLocaleString()}`, isRequestPrice: false };
}
function getVisibleGalleryImages(media) {
    if (media.gallery?.length) {
        return media.gallery;
    }
    if (media.showAuctionPictures && media.auctionPictures?.length) {
        return media.auctionPictures;
    }
    if (media.showJapanPictures && media.japanPictures?.length) {
        return media.japanPictures;
    }
    if (media.showDurbanPictures && media.durbanPictures?.length) {
        return media.durbanPictures;
    }
    return [];
}
//# sourceMappingURL=index.js.map