export function createMockVehicle(overrides) {
    return {
        id: 'veh-mock-1',
        chassisNumber: 'NZE141-1234567',
        make: 'Toyota',
        model: 'Corolla Axio',
        year: 2021,
        priceUsd: 8500,
        status: 'Available',
        category: 'arrival',
        locationStatus: 'In Japan',
        createdAt: '2026-08-09T10:00:00.000Z',
        images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400'],
        featured: true,
        stockType: 'J',
        destinationPort: 'Mombasa',
        ...overrides,
    };
}
export function createMockCustomer(overrides) {
    return {
        id: 'cust-mock-1',
        name: 'Kampala Auto Traders',
        email: 'info@kampalaauto.co.ug',
        tier: 'Gold',
        ...overrides,
    };
}
//# sourceMappingURL=builders.js.map