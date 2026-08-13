import type { VehicleDomainSummary, VehicleSearchResult, SearchVehiclesQuery, VehicleDetail } from '@carchief/domain';
import type { HttpClient } from '../http.js';
export interface GetVehiclesOptions extends SearchVehiclesQuery {
}
export declare class VehicleService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    getVehicles(options?: GetVehiclesOptions): Promise<VehicleDomainSummary[]>;
    searchVehicles(query?: SearchVehiclesQuery): Promise<VehicleSearchResult>;
    getVehicleDetail(idOrSlug: string): Promise<VehicleDetail | null>;
}
//# sourceMappingURL=vehicles.d.ts.map