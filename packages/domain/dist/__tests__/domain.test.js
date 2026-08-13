"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
function createMockVehicle(overrides) {
    return {
        id: 'veh-mock-1',
        chassisNumber: 'NZE141-1234567',
        make: 'Toyota',
        model: 'Corolla Axio',
        year: 2021,
        priceUsd: 8500,
        status: 'Available',
        ...overrides,
    };
}
(0, vitest_1.describe)('Domain Package Unit Tests', () => {
    (0, vitest_1.it)('creates a valid mock vehicle summary with defaults', () => {
        const vehicle = createMockVehicle();
        (0, vitest_1.expect)(vehicle.id).toBe('veh-mock-1');
        (0, vitest_1.expect)(vehicle.make).toBe('Toyota');
        (0, vitest_1.expect)(vehicle.status).toBe('Available');
    });
    (0, vitest_1.it)('allows overriding mock vehicle fields', () => {
        const vehicle = createMockVehicle({ make: 'Nissan', model: 'X-Trail', year: 2022 });
        (0, vitest_1.expect)(vehicle.make).toBe('Nissan');
        (0, vitest_1.expect)(vehicle.model).toBe('X-Trail');
        (0, vitest_1.expect)(vehicle.year).toBe(2022);
    });
});
//# sourceMappingURL=domain.test.js.map