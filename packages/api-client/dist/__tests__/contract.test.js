"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const vehicles_js_1 = require("../services/vehicles.js");
const testing_1 = require("@carchief/testing");
(0, vitest_1.describe)('API Client & Contract Integration Tests', () => {
    (0, vitest_1.it)('instantiates VehicleService and returns empty list initially', async () => {
        const service = new vehicles_js_1.VehicleService();
        const vehicles = await service.getVehicles();
        (0, vitest_1.expect)(vehicles).toEqual([]);
    });
    (0, vitest_1.it)('matches OpenAPI mock HTTP endpoint payload shape', () => {
        const mock = (0, testing_1.getMockVehiclesEndpoint)();
        (0, vitest_1.expect)(mock.status).toBe(200);
        (0, vitest_1.expect)(mock.data.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=contract.test.js.map