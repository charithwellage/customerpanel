import type { AiVehicleSearchRequest, AiVehicleSearchResponse, VehicleSearchResult, SearchVehiclesQuery, VehicleDetail } from '@carchief/domain';
import type { HttpClient } from '../http.js';
export interface GetVehiclesOptions extends SearchVehiclesQuery {
}
export declare class VehicleService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    getVehicles(options?: GetVehiclesOptions): Promise<VehicleSearchResult>;
    getVehicleDetail(idOrSlug: string, options?: {
        audience?: 'public' | 'customer' | 'salesperson';
        tier?: string;
        destinationCountry?: string;
    }): Promise<VehicleDetail | null>;
}
export declare class AiVehicleSearchService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    search(request: AiVehicleSearchRequest): Promise<AiVehicleSearchResponse>;
}
//# sourceMappingURL=vehicles.d.ts.map