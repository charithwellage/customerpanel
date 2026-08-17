export interface FeatureOwnershipRecord {
  id: string;
  phase: string;
  title: string;
  routePath: string;
  openapiPrefix: string;
  mockApiPrefix: string;
  fixtureNamespace: string;
  e2eSpecPath: string;
}

export const CUSTOMER_FEATURE_REGISTRY: Record<string, FeatureOwnershipRecord> = {
  dashboard: {
    id: 'dashboard',
    phase: 'Phase 2.2',
    title: 'Customer Dashboard & Logistics KPIs',
    routePath: '/dashboard',
    openapiPrefix: '/api/v1/customer/dashboard',
    mockApiPrefix: '/api/v1/customer/dashboard',
    fixtureNamespace: 'customer_dashboard',
    e2eSpecPath: 'tests/e2e/customer/dashboard.spec.ts',
  },
  inventory: {
    id: 'inventory',
    phase: 'Phase 2.3',
    title: 'Customer Inventory & Vehicle Allocations',
    routePath: '/inventory',
    openapiPrefix: '/api/v1/customer/inventory',
    mockApiPrefix: '/api/v1/customer/inventory',
    fixtureNamespace: 'customer_inventory',
    e2eSpecPath: 'tests/e2e/customer/inventory.spec.ts',
  },
  inquiries: {
    id: 'inquiries',
    phase: 'Phase 2.13',
    title: 'My Inquiries',
    routePath: '/inquiries',
    openapiPrefix: '/api/v1/customer/inquiries',
    mockApiPrefix: '/api/v1/customer/inquiries',
    fixtureNamespace: 'customer_inquiries',
    e2eSpecPath: 'tests/e2e/customer/inquiries.spec.ts',
  },
  vehicles: {
    id: 'vehicles',
    phase: 'Phase 2.4',
    title: 'My Fleet & Vehicle Detail Tracking',
    routePath: '/vehicles',
    openapiPrefix: '/api/v1/customer/vehicles',
    mockApiPrefix: '/api/v1/customer/vehicles',
    fixtureNamespace: 'customer_vehicle',
    e2eSpecPath: 'tests/e2e/customer/vehicles.spec.ts',
  },
  invoices: {
    id: 'invoices',
    phase: 'Phase 2.5',
    title: 'Invoices & Customer Ledger',
    routePath: '/invoices',
    openapiPrefix: '/api/v1/customer/invoices',
    mockApiPrefix: '/api/v1/customer/invoices',
    fixtureNamespace: 'customer_invoice',
    e2eSpecPath: 'tests/e2e/customer/invoices.spec.ts',
  },
  payments: {
    id: 'payments',
    phase: 'Phase 2.6',
    title: 'Telegraphic Transfers & Payment Allocations',
    routePath: '/payments',
    openapiPrefix: '/api/v1/customer/payments',
    mockApiPrefix: '/api/v1/customer/payments',
    fixtureNamespace: 'customer_payment',
    e2eSpecPath: 'tests/e2e/customer/payments.spec.ts',
  },
  shipments: {
    id: 'shipments',
    phase: 'Phase 2.7',
    title: 'Shipments & Tracking Operations',
    routePath: '/shipments',
    openapiPrefix: '/api/v1/customer/shipments',
    mockApiPrefix: '/api/v1/customer/shipments',
    fixtureNamespace: 'customer_shipment',
    e2eSpecPath: 'tests/e2e/customer/shipments.spec.ts',
  },
  documents: {
    id: 'documents',
    phase: 'Phase 2.8',
    title: 'Customs Clearance & Document Vault',
    routePath: '/documents',
    openapiPrefix: '/api/v1/customer/documents',
    mockApiPrefix: '/api/v1/customer/documents',
    fixtureNamespace: 'customer_document',
    e2eSpecPath: 'tests/e2e/customer/documents.spec.ts',
  },
  profile: {
    id: 'profile',
    phase: 'Phase 2.8',
    title: 'Profile & Account Settings',
    routePath: '/profile',
    openapiPrefix: '/api/v1/customer/profile',
    mockApiPrefix: '/api/v1/customer/profile',
    fixtureNamespace: 'customer_profile',
    e2eSpecPath: 'tests/e2e/customer/profile.spec.ts',
  },
  auth: {
    id: 'auth',
    phase: 'Phase 2.12',
    title: 'Registration, Credential Sign-In & Password Recovery',
    routePath: '/',
    openapiPrefix: '/api/v1/auth',
    mockApiPrefix: '/api/v1/auth',
    fixtureNamespace: 'customer_auth',
    e2eSpecPath: 'tests/e2e/customer/registration-login.spec.ts',
  },
};

export interface RegistryValidationResult {
  valid: boolean;
  errors: string[];
  totalFeatures: number;
}

export function validateCustomerFeatureRegistry(): RegistryValidationResult {
  const records = Object.values(CUSTOMER_FEATURE_REGISTRY);
  const errors: string[] = [];

  const routes = new Set<string>();
  const openapiPrefixes = new Set<string>();
  const mockPrefixes = new Set<string>();
  const fixtures = new Set<string>();
  const specs = new Set<string>();

  for (const r of records) {
    if (routes.has(r.routePath)) {
      errors.push(`Duplicate routePath detected: ${r.routePath}`);
    }
    routes.add(r.routePath);

    if (openapiPrefixes.has(r.openapiPrefix)) {
      errors.push(`Duplicate openapiPrefix detected: ${r.openapiPrefix}`);
    }
    openapiPrefixes.add(r.openapiPrefix);

    if (mockPrefixes.has(r.mockApiPrefix)) {
      errors.push(`Duplicate mockApiPrefix detected: ${r.mockApiPrefix}`);
    }
    mockPrefixes.add(r.mockApiPrefix);

    if (fixtures.has(r.fixtureNamespace)) {
      errors.push(`Duplicate fixtureNamespace detected: ${r.fixtureNamespace}`);
    }
    fixtures.add(r.fixtureNamespace);

    if (specs.has(r.e2eSpecPath)) {
      errors.push(`Duplicate e2eSpecPath detected: ${r.e2eSpecPath}`);
    }
    specs.add(r.e2eSpecPath);
  }

  return {
    valid: errors.length === 0,
    errors,
    totalFeatures: records.length,
  };
}
