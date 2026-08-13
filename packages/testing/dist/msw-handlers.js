"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockVehiclesEndpoint = getMockVehiclesEndpoint;
const builders_js_1 = require("./builders.js");
function getMockVehiclesEndpoint() {
    return {
        status: 200,
        data: [
            (0, builders_js_1.createMockVehicle)({ id: 'veh-mock-1', make: 'Toyota', model: 'Corolla Axio', category: 'arrival,premium', locationStatus: 'In Japan' }),
            (0, builders_js_1.createMockVehicle)({ id: 'veh-mock-2', make: 'Nissan', model: 'X-Trail', category: 'premium', locationStatus: 'In Japan', year: 2022, priceUsd: 19500 }),
            (0, builders_js_1.createMockVehicle)({ id: 'veh-mock-3', make: 'Subaru', model: 'Forester', category: 'clearance', locationStatus: 'In Port', year: 2019, priceUsd: 11800, discountPercent: 10 }),
        ],
    };
}
//# sourceMappingURL=msw-handlers.js.map