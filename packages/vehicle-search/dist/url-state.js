"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUrlSearchQuery = parseUrlSearchQuery;
exports.serializeSearchQuery = serializeSearchQuery;
/**
 * Parses search query parameters from URLSearchParams or a query string.
 */
function parseUrlSearchQuery(source) {
    const params = typeof source === 'string' ? new URLSearchParams(source) : source;
    const result = {};
    const getString = (key) => params.get(key) || undefined;
    const getNumber = (key) => {
        const val = params.get(key);
        if (!val)
            return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
    };
    result.searchQuery = getString('searchQuery') || getString('q');
    result.make = getString('make');
    result.model = getString('model');
    result.bodyStyle = getString('bodyStyle');
    result.fuelType = getString('fuelType');
    result.transmission = getString('transmission');
    result.driveTrain = getString('driveTrain');
    result.stockType = getString('stockType');
    result.locationStatus = getString('locationStatus');
    result.yearMin = getNumber('yearMin');
    result.yearMax = getNumber('yearMax');
    result.priceMin = getNumber('priceMin');
    result.priceMax = getNumber('priceMax');
    result.sortBy = (getString('sortBy') || 'newest');
    result.page = getNumber('page') || 1;
    result.limit = getNumber('limit') || 12;
    // Market & Destination Port context preservation
    result.market = getString('market');
    result.destinationPort = getString('destinationPort');
    return result;
}
/**
 * Serializes SearchVehiclesQuery into URLSearchParams while omitting empty or default values.
 * Preserves additional context parameters (e.g. market, country, destinationPort).
 */
function serializeSearchQuery(query, existingParams) {
    const params = new URLSearchParams(existingParams ? existingParams.toString() : '');
    const setOrDelete = (key, val) => {
        if (val !== undefined && val !== null && val !== '') {
            params.set(key, String(val));
        }
        else {
            params.delete(key);
        }
    };
    setOrDelete('searchQuery', query.searchQuery);
    setOrDelete('make', query.make);
    setOrDelete('model', query.model);
    setOrDelete('bodyStyle', query.bodyStyle);
    setOrDelete('fuelType', query.fuelType);
    setOrDelete('transmission', query.transmission);
    setOrDelete('driveTrain', query.driveTrain);
    setOrDelete('stockType', query.stockType);
    setOrDelete('locationStatus', query.locationStatus);
    setOrDelete('yearMin', query.yearMin);
    setOrDelete('yearMax', query.yearMax);
    setOrDelete('priceMin', query.priceMin);
    setOrDelete('priceMax', query.priceMax);
    if (query.sortBy && query.sortBy !== 'newest') {
        params.set('sortBy', query.sortBy);
    }
    else {
        params.delete('sortBy');
    }
    if (query.page && query.page > 1) {
        params.set('page', String(query.page));
    }
    else {
        params.delete('page');
    }
    if (query.limit && query.limit !== 12) {
        params.set('limit', String(query.limit));
    }
    else {
        params.delete('limit');
    }
    setOrDelete('market', query.market);
    setOrDelete('destinationPort', query.destinationPort);
    return params;
}
//# sourceMappingURL=url-state.js.map