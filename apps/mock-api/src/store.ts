import { Pool } from 'pg';

export interface VehicleRecord {
  id: string;
  chassisNumber: string;
  make: string;
  model: string;
  year: number;
  priceUsd: number;
  status: string;
}

export interface PublicConfig {
  siteName: string;
  currency: string;
  contactPhone: string;
}

const seedConfig: PublicConfig = { siteName: 'CarChief', currency: 'USD', contactPhone: '+256 700 000 000' };
const seedVehicles: VehicleRecord[] = [
  { id: 'veh-1', chassisNumber: 'NZE141-1234567', make: 'Toyota', model: 'Corolla Axio', year: 2021, priceUsd: 8500, status: 'Available' },
  { id: 'veh-2', chassisNumber: 'KDH201-7654321', make: 'Toyota', model: 'HiAce Van', year: 2020, priceUsd: 14200, status: 'ReservedWithPI' },
];

export interface DemoStore {
  ready(): Promise<void>;
  getConfig(): Promise<PublicConfig>;
  getVehicles(): Promise<VehicleRecord[]>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

class MemoryStore implements DemoStore {
  private config = { ...seedConfig };
  private vehicles = seedVehicles.map((vehicle) => ({ ...vehicle }));
  ready(): Promise<void> { return Promise.resolve(); }
  getConfig(): Promise<PublicConfig> { return Promise.resolve({ ...this.config }); }
  getVehicles(): Promise<VehicleRecord[]> { return Promise.resolve(this.vehicles.map((vehicle) => ({ ...vehicle }))); }
  reset(): Promise<void> { this.config = { ...seedConfig }; this.vehicles = seedVehicles.map((vehicle) => ({ ...vehicle })); return Promise.resolve(); }
  close(): Promise<void> { return Promise.resolve(); }
}

class PostgresStore implements DemoStore {
  private readonly pool: Pool;
  constructor(connectionString: string) { this.pool = new Pool({ connectionString }); }
  async ready(): Promise<void> {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS public_config (id integer PRIMARY KEY, site_name text NOT NULL, currency text NOT NULL, contact_phone text NOT NULL);`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS vehicles (id text PRIMARY KEY, chassis_number text NOT NULL, make text NOT NULL, model text NOT NULL, year integer NOT NULL, price_usd numeric NOT NULL, status text NOT NULL);`);
    await this.reset();
  }
  async getConfig(): Promise<PublicConfig> {
    const result = await this.pool.query('SELECT site_name, currency, contact_phone FROM public_config WHERE id = 1');
    const row = result.rows[0];
    return row ? { siteName: row.site_name, currency: row.currency, contactPhone: row.contact_phone } : { ...seedConfig };
  }
  async getVehicles(): Promise<VehicleRecord[]> {
    const result = await this.pool.query('SELECT id, chassis_number, make, model, year, price_usd, status FROM vehicles ORDER BY id');
    return result.rows.map((row) => ({ id: row.id, chassisNumber: row.chassis_number, make: row.make, model: row.model, year: Number(row.year), priceUsd: Number(row.price_usd), status: row.status }));
  }
  async reset(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM vehicles');
      await client.query('DELETE FROM public_config');
      await client.query('INSERT INTO public_config (id, site_name, currency, contact_phone) VALUES (1, $1, $2, $3)', [seedConfig.siteName, seedConfig.currency, seedConfig.contactPhone]);
      for (const vehicle of seedVehicles) await client.query('INSERT INTO vehicles (id, chassis_number, make, model, year, price_usd, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [vehicle.id, vehicle.chassisNumber, vehicle.make, vehicle.model, vehicle.year, vehicle.priceUsd, vehicle.status]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async close(): Promise<void> { await this.pool.end(); }
}

export function createStore(connectionString = process.env.DATABASE_URL): DemoStore {
  return connectionString ? new PostgresStore(connectionString) : new MemoryStore();
}
