import type { VehicleDomainSummary, CustomerTier } from '@carchief/domain';
export declare function createMockVehicle(overrides?: Partial<VehicleDomainSummary>): VehicleDomainSummary;
export interface MockCustomer {
    id: string;
    name: string;
    email: string;
    tier: CustomerTier;
}
export declare function createMockCustomer(overrides?: Partial<MockCustomer>): MockCustomer;
//# sourceMappingURL=builders.d.ts.map