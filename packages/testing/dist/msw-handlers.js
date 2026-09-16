import { createMockVehicle } from './builders.js';
export function getMockVehiclesEndpoint() {
    return {
        status: 200,
        data: [
            createMockVehicle({ id: 'veh-mock-1', make: 'Toyota', model: 'Corolla Axio', category: 'arrival,premium', locationStatus: 'In Japan' }),
            createMockVehicle({ id: 'veh-mock-2', make: 'Nissan', model: 'X-Trail', category: 'premium', locationStatus: 'In Japan', year: 2022, priceUsd: 19500 }),
            createMockVehicle({ id: 'veh-mock-3', make: 'Subaru', model: 'Forester', category: 'clearance', locationStatus: 'In Port', year: 2019, priceUsd: 11800, discountPercent: 10 }),
        ],
    };
}
//# sourceMappingURL=msw-handlers.js.map