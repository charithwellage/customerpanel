export class VehicleService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async getVehicles(options) {
        if (!this.httpClient) {
            return emptyVehicleSearchResult();
        }
        const params = new URLSearchParams();
        appendVehicleQuery(params, options);
        const queryString = params.toString();
        const path = `/api/v1/vehicles${queryString ? `?${queryString}` : ''}`;
        return this.httpClient.request(path);
    }
    async getVehicleDetail(idOrSlug, options) {
        if (!this.httpClient) {
            return null;
        }
        try {
            const params = new URLSearchParams();
            if (options?.audience)
                params.set('audience', options.audience);
            if (options?.tier)
                params.set('tier', options.tier);
            if (options?.destinationCountry)
                params.set('destinationCountry', options.destinationCountry);
            const queryString = params.toString();
            const path = `/api/v1/vehicles/${encodeURIComponent(idOrSlug)}${queryString ? `?${queryString}` : ''}`;
            return await this.httpClient.request(path);
        }
        catch (err) {
            if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }
}
export class AiVehicleSearchService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async search(request) {
        if (!this.httpClient) {
            throw new Error('AiVehicleSearchService.search requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/vehicles/ai-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
}
function appendVehicleQuery(params, query) {
    if (!query)
        return;
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '')
            continue;
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
    }
}
function emptyVehicleSearchResult() {
    return {
        items: [], total: 0, page: 1, limit: 15, totalPages: 0, hasNextPage: false, hasPrevPage: false,
        facets: {
            makes: [], bodyStyles: [], fuelTypes: [], transmissions: [], driveTrains: [], models: [], modelCodes: [], vehicleTypes: [], vehicleSubTypes: [], locationStatuses: [], destinationPorts: [], overdrives: [], colors: [], exteriorGrades: [], steerings: [], stockCountries: [], stockLocations: [], features: [], yearRange: { min: 2000, max: 2026 }, priceRange: { min: 0, max: 0 }, mileageRange: { min: 0, max: 0 }, engineCcRange: { min: 0, max: 0 }, seatsRange: { min: 0, max: 0 }, loadCapacityRange: { min: 0, max: 0 },
        },
    };
}
//# sourceMappingURL=vehicles.js.map