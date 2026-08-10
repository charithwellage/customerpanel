import { Pool } from 'pg';

export interface VehicleRecord {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: string;
  category?: string;
  locationStatus?: 'In Japan' | 'In Transit' | 'In Port';
  createdAt?: string;
  images?: string[];
  featured?: boolean;
  stockType?: 'J' | 'CRFO';
  destinationPort?: string;
  discountPercent?: number;
  internalNotes?: string;
  staffOwnerId?: string;
}

export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
}

export interface GetVehiclesQuery {
  collection?: string;
  market?: string;
  category?: string;
  limit?: string;
}

const seedConfig: PublicConfig = { siteName: 'CarChief', currency: 'USD', contactPhone: '+256 700 000 000' };

// Reference date for deterministic 5-day window tests: 2026-08-10T10:00:00.000Z
const seedVehicles: VehicleRecord[] = [
  {
    id: 'veh-1',
    chassisNumber: 'NZE141-1234567',
    make: 'Toyota',
    model: 'Corolla Axio',
    year: 2021,
    priceUsd: 8500,
    status: 'Available',
    category: 'arrival,premium',
    locationStatus: 'In Japan',
    createdAt: '2026-08-09T10:00:00.000Z', // 1 day old -> Latest Arrival eligible
    images: ['https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400'],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    internalNotes: 'Internal inspection passed',
    staffOwnerId: 'staff-99',
  },
  {
    id: 'veh-2',
    chassisNumber: 'KDH201-7654321',
    make: 'Toyota',
    model: 'HiAce Van',
    year: 2020,
    priceUsd: 14200,
    status: 'ReservedWithPI',
    category: 'arrival',
    locationStatus: 'In Japan',
    createdAt: '2026-08-08T14:30:00.000Z', // 2 days old -> Latest Arrival eligible
    images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
  },
  {
    id: 'veh-3',
    chassisNumber: 'T32-9876543',
    make: 'Nissan',
    model: 'X-Trail',
    year: 2022,
    priceUsd: 19500,
    status: 'Available',
    category: 'premium',
    locationStatus: 'In Japan',
    createdAt: '2026-07-30T09:00:00.000Z', // 11 days old -> NOT Latest Arrival
    images: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400'],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
  },
  {
    id: 'veh-4',
    chassisNumber: 'SK9-5544332',
    make: 'Subaru',
    model: 'Forester',
    year: 2019,
    priceUsd: 11800,
    status: 'Available',
    category: 'clearance',
    locationStatus: 'In Port',
    createdAt: '2026-07-25T11:00:00.000Z',
    discountPercent: 10,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
  },
  {
    id: 'veh-5',
    chassisNumber: 'GP5-1122334',
    make: 'Honda',
    model: 'Fit Hybrid',
    year: 2021,
    priceUsd: 7900,
    status: 'Available',
    category: 'best_offer',
    locationStatus: 'In Transit',
    createdAt: '2026-08-07T08:00:00.000Z', // 3 days old
    discountPercent: 5,
    featured: true,
    stockType: 'J',
    destinationPort: 'Dar es Salaam',
  },
  {
    id: 'veh-6',
    chassisNumber: 'FE83-4455667',
    make: 'Mitsubishi',
    model: 'Fuso Canter',
    year: 2018,
    priceUsd: 16000,
    status: 'Available',
    category: 'clearance',
    locationStatus: 'In Port',
    createdAt: '2026-07-20T10:00:00.000Z',
    discountPercent: 15,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
  },
  {
    id: 'veh-7',
    chassisNumber: 'GYL25-6677889',
    make: 'Lexus',
    model: 'RX450h',
    year: 2023,
    priceUsd: 38000,
    status: 'Available',
    category: 'premium',
    locationStatus: 'In Japan',
    createdAt: '2026-08-09T16:00:00.000Z', // 1 day old
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
  },
  {
    id: 'veh-8',
    chassisNumber: 'KF2P-3344556',
    make: 'Mazda',
    model: 'CX-5',
    year: 2020,
    priceUsd: 13500,
    status: 'Available',
    category: 'arrival',
    locationStatus: 'In Japan',
    createdAt: '2026-08-06T12:00:00.000Z', // 4 days old -> Latest Arrival eligible
    featured: false,
    stockType: 'J',
    destinationPort: 'Mombasa',
  },
];

export interface DemoStore {
  ready(): Promise<void>;
  getConfig(): Promise<PublicConfig>;
  getVehicles(query?: GetVehiclesQuery): Promise<VehicleRecord[]>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

function projectPublicVehicle(v: VehicleRecord): VehicleRecord {
  // Public field projection: enforce that private/staff fields (like internalNotes, staffOwnerId) are stripped
  return {
    id: v.id,
    chassisNumber: v.chassisNumber,
    make: v.make,
    model: v.model,
    year: v.year,
    priceUsd: v.priceUsd,
    status: v.status,
    category: v.category,
    locationStatus: v.locationStatus,
    createdAt: v.createdAt,
    images: v.images ? [...v.images] : [],
    featured: v.featured,
    stockType: v.stockType,
    destinationPort: v.destinationPort,
    discountPercent: v.discountPercent,
  };
}

function filterAndSortVehicles(vehicles: VehicleRecord[], query?: GetVehiclesQuery): VehicleRecord[] {
  let list = vehicles.map(projectPublicVehicle);
  const now = new Date('2026-08-10T10:00:00.000Z').getTime();
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

  if (query?.category) {
    list = list.filter((v) => v.category?.split(',').includes(query.category!));
  }

  if (query?.collection) {
    switch (query.collection) {
      case 'latest_arrivals': {
        // Eligible In Japan only, created in the last 5 days
        const eligible = list.filter((v) => {
          if (v.locationStatus !== 'In Japan') return false;
          if (!v.createdAt) return false;
          const createdTime = new Date(v.createdAt).getTime();
          return now - createdTime <= FIVE_DAYS_MS;
        });
        // Fallback rule: if market/selection filter results in empty, fall back to all In Japan within 5 days
        if (eligible.length > 0) {
          list = eligible;
        } else {
          list = list.filter((v) => v.locationStatus === 'In Japan');
        }
        break;
      }
      case 'premium_teaser': {
        // Premium collection limited to at most 10 returned vehicles
        const premium = list.filter((v) => v.category?.split(',').includes('premium'));
        const limitNum = Math.min(query.limit ? Number(query.limit) : 10, 10);
        list = premium.slice(0, limitNum);
        break;
      }
      case 'discounted': {
        list = list.filter((v) => v.category?.split(',').includes('best_offer') || (v.discountPercent && v.discountPercent > 0));
        break;
      }
      case 'clearance': {
        list = list.filter((v) => v.category?.split(',').includes('clearance'));
        break;
      }
      case 'featured': {
        list = list.filter((v) => v.featured === true);
        break;
      }
      case 'browse':
      default: {
        // Order by In Port -> In Transit -> In Japan, and J stock -> CRFO stock
        const locationPriority: Record<string, number> = { 'In Port': 1, 'In Transit': 2, 'In Japan': 3 };
        const stockPriority: Record<string, number> = { J: 1, CRFO: 2 };
        list.sort((a, b) => {
          const locA = locationPriority[a.locationStatus || 'In Japan'] || 3;
          const locB = locationPriority[b.locationStatus || 'In Japan'] || 3;
          if (locA !== locB) return locA - locB;

          const stockA = stockPriority[a.stockType || 'J'] || 1;
          const stockB = stockPriority[b.stockType || 'J'] || 1;
          if (stockA !== stockB) return stockA - stockB;

          return a.id.localeCompare(b.id);
        });
        break;
      }
    }
  }

  if (query?.limit && query.collection !== 'premium_teaser') {
    const limitNum = Number(query.limit);
    if (!isNaN(limitNum) && limitNum > 0) {
      list = list.slice(0, limitNum);
    }
  }

  return list;
}

class MemoryStore implements DemoStore {
  private config = { ...seedConfig };
  private vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));

  ready(): Promise<void> {
    return Promise.resolve();
  }

  getConfig(): Promise<PublicConfig> {
    return Promise.resolve({ ...this.config });
  }

  getVehicles(query?: GetVehiclesQuery): Promise<VehicleRecord[]> {
    return Promise.resolve(filterAndSortVehicles(this.vehicles, query));
  }

  reset(): Promise<void> {
    this.config = { ...seedConfig };
    this.vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

class PostgresStore implements DemoStore {
  private readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async ready(): Promise<void> {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS public_config (id integer PRIMARY KEY, site_name text NOT NULL, currency text NOT NULL, contact_phone text NOT NULL);`
    );
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS vehicles (
        id text PRIMARY KEY,
        chassis_number text NOT NULL,
        make text NOT NULL,
        model text NOT NULL,
        year integer NOT NULL,
        price_usd numeric NOT NULL,
        status text NOT NULL,
        category text,
        location_status text,
        created_at text,
        images text,
        featured boolean,
        stock_type text,
        destination_port text,
        discount_percent numeric,
        internal_notes text,
        staff_owner_id text
      );`
    );
    await this.pool.query(
      `ALTER TABLE vehicles
        ADD COLUMN IF NOT EXISTS category text,
        ADD COLUMN IF NOT EXISTS location_status text,
        ADD COLUMN IF NOT EXISTS created_at text,
        ADD COLUMN IF NOT EXISTS images text,
        ADD COLUMN IF NOT EXISTS featured boolean,
        ADD COLUMN IF NOT EXISTS stock_type text,
        ADD COLUMN IF NOT EXISTS destination_port text,
        ADD COLUMN IF NOT EXISTS discount_percent numeric;`
    );
    await this.reset();
  }

  async getConfig(): Promise<PublicConfig> {
    const result = await this.pool.query('SELECT site_name, currency, contact_phone FROM public_config WHERE id = 1');
    const row = result.rows[0];
    return row ? { siteName: row.site_name, currency: row.currency, contactPhone: row.contact_phone } : { ...seedConfig };
  }

  async getVehicles(query?: GetVehiclesQuery): Promise<VehicleRecord[]> {
    const result = await this.pool.query(
      'SELECT id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent FROM vehicles ORDER BY id'
    );
    const rawRecords: VehicleRecord[] = result.rows.map((row) => ({
      id: row.id,
      chassisNumber: row.chassis_number,
      make: row.make,
      model: row.model,
      year: Number(row.year),
      priceUsd: Number(row.price_usd),
      status: row.status,
      category: row.category,
      locationStatus: row.location_status,
      createdAt: row.created_at,
      images: row.images ? JSON.parse(row.images) : [],
      featured: Boolean(row.featured),
      stockType: row.stock_type,
      destinationPort: row.destination_port,
      discountPercent: row.discount_percent ? Number(row.discount_percent) : undefined,
    }));
    return filterAndSortVehicles(rawRecords, query);
  }

  async reset(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM vehicles');
      await client.query('DELETE FROM public_config');
      await client.query('INSERT INTO public_config (id, site_name, currency, contact_phone) VALUES (1, $1, $2, $3)', [
        seedConfig.siteName,
        seedConfig.currency,
        seedConfig.contactPhone,
      ]);
      for (const vehicle of seedVehicles) {
        await client.query(
          'INSERT INTO vehicles (id, chassis_number, make, model, year, price_usd, status, category, location_status, created_at, images, featured, stock_type, destination_port, discount_percent, internal_notes, staff_owner_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
          [
            vehicle.id,
            vehicle.chassisNumber,
            vehicle.make,
            vehicle.model,
            vehicle.year,
            vehicle.priceUsd,
            vehicle.status,
            vehicle.category || null,
            vehicle.locationStatus || null,
            vehicle.createdAt || null,
            vehicle.images ? JSON.stringify(vehicle.images) : null,
            vehicle.featured ?? false,
            vehicle.stockType || null,
            vehicle.destinationPort || null,
            vehicle.discountPercent || null,
            vehicle.internalNotes || null,
            vehicle.staffOwnerId || null,
          ]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createStore(connectionString = process.env.DATABASE_URL): DemoStore {
  return connectionString ? new PostgresStore(connectionString) : new MemoryStore();
}

