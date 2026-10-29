import type {
  VehicleDomainSummary,
  VehicleDetail,
  VehicleSearchResult,
  SearchVehiclesQuery,
  VehicleFacets,
  FacetCount,
} from '@carchief/domain';
import { calculateTierPricing } from '@carchief/domain';

export interface SeedVehicleRecord extends VehicleDomainSummary {
  description?: string;
  engineSize?: string;
  versionClass?: string;
  registerYear?: string;
  mfgYear?: string;
  dimensions?: {
    lengthMm?: number;
    widthMm?: number;
    heightMm?: number;
    m3?: number;
  };
}

export const FALLBACK_SEED_VEHICLES: SeedVehicleRecord[] = [
  {
    id: 'veh-1',
    chassisNumber: 'NZE141-1234567',
    slug: '2021-toyota-corolla-axio-veh-1',
    make: 'Toyota',
    model: 'Corolla Axio',
    year: 2021,
    priceUsd: 8500,
    status: 'Available',
    category: 'arrival,premium',
    createdAt: '2026-08-09T10:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 32000,
    engineCc: 1500,
    engineSize: '1,500 cc',
    color: 'White',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(8500, 'Standard', 10),
    dimensions: { lengthMm: 4410, widthMm: 1695, heightMm: 1460, m3: 10.9 },
    description: 'Clean pre-export certified sedan with verified mileage, dual airbags, ABS, and fuel-efficient VVTi engine.',
  },
  {
    id: 'veh-2',
    chassisNumber: 'KDH201-7654321',
    slug: '2020-toyota-hiace-van-veh-2',
    make: 'Toyota',
    model: 'HiAce Van',
    year: 2020,
    priceUsd: 14200,
    status: 'ReservedWithPI',
    category: 'arrival',
    createdAt: '2026-08-08T14:30:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'Van',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 68000,
    engineCc: 2800,
    engineSize: '2,800 cc',
    color: 'Silver',
    steering: 'Right',
    locationStatus: 'In Transit',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: false, reason: 'reserved_by_other' },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(14200, 'Standard', 10),
    dimensions: { lengthMm: 4695, widthMm: 1695, heightMm: 1980, m3: 15.7 },
    description: 'High-roof diesel transporter with heavy-duty leaf springs, cold AC, and low operating overheads.',
  },
  {
    id: 'veh-3',
    chassisNumber: 'T32-9876543',
    slug: '2022-nissan-x-trail-veh-3',
    make: 'Nissan',
    model: 'X-Trail',
    year: 2022,
    priceUsd: 19500,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-07-30T09:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 18000,
    engineCc: 2000,
    engineSize: '2,000 cc',
    color: 'Red',
    steering: 'Right',
    locationStatus: 'In Port',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(19500, 'Standard', 10),
    dimensions: { lengthMm: 4690, widthMm: 1820, heightMm: 1740, m3: 14.8 },
    description: 'All-mode 4x4-i intelligent AWD crossover with 360 around view monitor and panoramic glass roof.',
  },
  {
    id: 'veh-4',
    chassisNumber: 'SK9-5544332',
    slug: '2019-subaru-forester-veh-4',
    make: 'Subaru',
    model: 'Forester',
    year: 2019,
    priceUsd: 0,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-25T11:00:00.000Z',
    discountPercent: 10,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 54000,
    engineCc: 2500,
    engineSize: '2,500 cc',
    color: 'Blue',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: true,
    priceState: 'request_price',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    dimensions: { lengthMm: 4625, widthMm: 1815, heightMm: 1730, m3: 14.5 },
    description: 'Symmetrical AWD Boxer engine with EyeSight driver assist and heated leather seating.',
  },
  {
    id: 'veh-5',
    chassisNumber: 'GP5-1122334',
    slug: '2021-honda-fit-hybrid-veh-5',
    make: 'Honda',
    model: 'Fit Hybrid',
    year: 2021,
    priceUsd: 7900,
    status: 'Available',
    category: 'best_offer',
    createdAt: '2026-08-07T08:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    discountPercent: 5,
    featured: true,
    stockType: 'J',
    destinationPort: 'Dar es Salaam',
    bodyStyle: 'Hatchback',
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 41000,
    engineCc: 1500,
    engineSize: '1,500 cc Hybrid',
    color: 'Silver',
    steering: 'Right',
    locationStatus: 'In Transit',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(7900, 'Standard', 10),
    dimensions: { lengthMm: 3995, widthMm: 1695, heightMm: 1525, m3: 10.3 },
    description: 'Earth Dreams e:HEV hybrid powertrain providing exceptional 32 km/L efficiency.',
  },
  {
    id: 'veh-6',
    chassisNumber: 'TRJ250-001234',
    slug: '2024-toyota-land-cruiser-250-veh-6',
    make: 'Toyota',
    model: 'Land Cruiser 250',
    year: 2024,
    priceUsd: 16120,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-20T10:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
    discountPercent: 15,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 34497,
    engineCc: 2700,
    engineSize: '2,700 cc',
    color: 'Pearl',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(16120, 'Standard', 10),
    dimensions: { lengthMm: 4925, widthMm: 1980, heightMm: 1870, m3: 18.2 },
    description: 'Next-generation rugged utility frame with full-time 4WD and crawl control.',
  },
  {
    id: 'veh-7',
    chassisNumber: 'A200A-009876',
    slug: '2024-toyota-raize-veh-7',
    make: 'Toyota',
    model: 'Raize',
    year: 2024,
    priceUsd: 58000,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-09T16:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 1200,
    engineCc: 1000,
    engineSize: '1,000 cc Turbo',
    color: 'White',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(58000, 'Standard', 10),
    dimensions: { lengthMm: 3995, widthMm: 1695, heightMm: 1620, m3: 10.9 },
    description: 'Compact SUV with 1.0L Turbo engine, high ground clearance, and smart assist safety suite.',
  },
  {
    id: 'veh-8',
    chassisNumber: 'KF2P-3344556',
    slug: '2020-mazda-cx-5-veh-8',
    make: 'Mazda',
    model: 'CX-5',
    year: 2020,
    priceUsd: 13500,
    status: 'Available',
    category: 'arrival',
    createdAt: '2026-08-06T12:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: false,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 49000,
    engineCc: 2200,
    engineSize: '2,200 cc SkyActiv-D',
    color: 'Machine Gray',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(13500, 'Standard', 10),
    dimensions: { lengthMm: 4545, widthMm: 1840, heightMm: 1690, m3: 14.1 },
    description: 'SkyActiv-D twin-turbo clean diesel delivering responsive acceleration and luxury cabin finishes.',
  },
  {
    id: 'veh-9',
    chassisNumber: 'WDD205-998877',
    slug: '2019-mercedes-benz-c200-amg-line-veh-9',
    make: 'Mercedes-Benz',
    model: 'C200 AMG Line',
    year: 2019,
    priceUsd: 17800,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-08T09:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'Sedan',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '2WD',
    mileage: 38000,
    engineCc: 1500,
    engineSize: '1,500 cc EQ Boost',
    color: 'Obsidian Black',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(17800, 'Standard', 10),
    dimensions: { lengthMm: 4686, widthMm: 1810, heightMm: 1442, m3: 12.2 },
    description: 'AMG Styling pack, panoramic sunroof, digital cockpit display, and Burmester surround audio.',
  },
  {
    id: 'veh-10',
    chassisNumber: 'G01-112244',
    slug: '2021-bmw-x3-xdrive20d-veh-10',
    make: 'BMW',
    model: 'X3 xDrive20d',
    year: 2021,
    priceUsd: 26500,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-07T14:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 27000,
    engineCc: 2000,
    engineSize: '2,000 cc TwinPower Turbo',
    color: 'Mineral White',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(26500, 'Standard', 10),
    dimensions: { lengthMm: 4708, widthMm: 1891, heightMm: 1676, m3: 14.9 },
    description: 'xDrive intelligent all-wheel drive, adaptive LED lights, M Sport aero, and Vernasca leather upholstery.',
  },
  {
    id: 'veh-11',
    chassisNumber: '8K-556677',
    slug: '2020-audi-a4-avant-veh-11',
    make: 'Audi',
    model: 'A4 Avant',
    year: 2020,
    priceUsd: 15900,
    status: 'Available',
    category: 'best_offer',
    createdAt: '2026-08-05T10:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1000&auto=format&fit=crop',
    ],
    featured: false,
    stockType: 'J',
    destinationPort: 'Dar es Salaam',
    bodyStyle: 'Wagon',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 52000,
    engineCc: 2000,
    engineSize: '2,000 cc TFSI',
    color: 'Daytona Gray',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(15900, 'Standard', 10),
    dimensions: { lengthMm: 4762, widthMm: 1847, heightMm: 1435, m3: 12.6 },
    description: 'Quattro all-wheel drive sport wagon with virtual cockpit, electric tailgate, and drive select.',
  },
  {
    id: 'veh-12',
    chassisNumber: 'L663-778899',
    slug: '2022-land-rover-defender-110-veh-12',
    make: 'Land Rover',
    model: 'Defender 110',
    year: 2022,
    priceUsd: 49000,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-09T18:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Diesel',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 15000,
    engineCc: 3000,
    engineSize: '3,000 cc D300 MHEV',
    color: 'Pangea Green',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(49000, 'Standard', 10),
    dimensions: { lengthMm: 5018, widthMm: 2008, heightMm: 1967, m3: 19.8 },
    description: 'Expedition-ready air suspension, Terrain Response 2, 3D surround camera, and wading depth sensor.',
  },
  {
    id: 'veh-price-req',
    chassisNumber: 'URJ201-998877',
    slug: '2023-lexus-lx570-veh-price-req',
    make: 'Lexus',
    model: 'LX570',
    year: 2023,
    priceUsd: 0,
    status: 'Available',
    category: 'premium',
    createdAt: '2026-08-10T12:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Petrol',
    transmission: 'Automatic',
    driveTrain: '4WD',
    mileage: 5000,
    engineCc: 5700,
    engineSize: '5,700 cc V8',
    color: 'Sonic Titanium',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: true,
    priceState: 'request_price',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    dimensions: { lengthMm: 5080, widthMm: 1980, heightMm: 1910, m3: 19.2 },
    description: 'Flagship prestige 5.7L V8 luxury SUV with rear entertainment, cooling seats, and hydraulic height control.',
  },
  {
    id: 'veh-13',
    chassisNumber: 'GYL25W-100234',
    slug: '2023-lexus-rx450h-veh-13',
    make: 'Lexus',
    model: 'RX450h',
    year: 2023,
    priceUsd: 38000,
    status: 'Available',
    category: 'arrival,premium',
    createdAt: '2026-08-09T12:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop',
    ],
    featured: true,
    stockType: 'J',
    destinationPort: 'Mombasa',
    bodyStyle: 'SUV',
    fuelType: 'Hybrid',
    transmission: 'Automatic',
    driveTrain: 'AWD',
    mileage: 14000,
    engineCc: 3500,
    engineSize: '3,500 cc V6 Hybrid',
    color: 'Sonic Quartz',
    steering: 'Right',
    locationStatus: 'In Japan',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(38000, 'Standard', 10),
    dimensions: { lengthMm: 4890, widthMm: 1895, heightMm: 1690, m3: 15.6 },
    description: 'E-Four intelligent hybrid AWD system, Mark Levinson premium audio, and head-up display.',
  },
  {
    id: 'veh-14',
    chassisNumber: 'FEB50-200981',
    slug: '2018-mitsubishi-fuso-canter-veh-14',
    make: 'Mitsubishi',
    model: 'Fuso Canter',
    year: 2018,
    priceUsd: 16000,
    status: 'Available',
    category: 'clearance',
    createdAt: '2026-07-28T07:00:00.000Z',
    images: [
      'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop',
    ],
    discountPercent: 15,
    featured: false,
    stockType: 'CRFO',
    destinationPort: 'Mombasa',
    bodyStyle: 'Truck',
    fuelType: 'Diesel',
    transmission: 'Manual',
    driveTrain: '2WD',
    mileage: 82000,
    engineCc: 3000,
    engineSize: '3,000 cc Turbo Diesel',
    color: 'White',
    steering: 'Right',
    locationStatus: 'In Port',
    requestPrice: false,
    priceState: 'priced',
    reservationEligibility: { eligible: true },
    inquiryEligibility: { eligible: true },
    tierPricing: calculateTierPricing(16000, 'Standard', 10),
    dimensions: { lengthMm: 4685, widthMm: 1695, heightMm: 1990, m3: 15.8 },
    description: 'Heavy duty 2-ton commercial chassis with reinforced aluminum dropside cargo bed.',
  },
];

export function buildFallbackFacets(vehicles: SeedVehicleRecord[]): VehicleFacets {
  const countBy = (fn: (v: SeedVehicleRecord) => string | undefined): FacetCount[] => {
    const counts = new Map<string, number>();
    for (const v of vehicles) {
      const val = fn(v);
      if (val) counts.set(val, (counts.get(val) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getRange = (fn: (v: SeedVehicleRecord) => number | undefined) => {
    const values = vehicles.map(fn).filter((n): n is number => typeof n === 'number' && !isNaN(n));
    if (values.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...values), max: Math.max(...values) };
  };

  return {
    makes: countBy((v) => v.make),
    bodyStyles: countBy((v) => v.bodyStyle),
    fuelTypes: countBy((v) => v.fuelType),
    transmissions: countBy((v) => v.transmission),
    driveTrains: countBy((v) => v.driveTrain),
    models: countBy((v) => v.model),
    modelCodes: countBy((v) => v.modelCode),
    vehicleTypes: countBy((v) => v.bodyStyle),
    vehicleSubTypes: countBy((v) => v.vehicleSubType),
    locationStatuses: countBy((v) => v.locationStatus),
    destinationPorts: countBy((v) => v.destinationPort),
    overdrives: countBy((v) => v.overdrive),
    colors: countBy((v) => v.color),
    exteriorGrades: countBy((v) => v.exteriorGrade),
    steerings: countBy((v) => v.steering),
    stockCountries: countBy((v) => v.stockCountry),
    stockLocations: countBy((v) => v.stockLocation),
    features: [],
    yearRange: getRange((v) => v.year),
    priceRange: getRange((v) => (v.priceUsd > 0 ? v.priceUsd : undefined)),
    mileageRange: getRange((v) => v.mileage),
    engineCcRange: getRange((v) => v.engineCc),
    seatsRange: getRange((v) => v.seats),
    loadCapacityRange: getRange((v) => v.loadCapacity),
  };
}

export function filterFallbackVehicles(query: SearchVehiclesQuery = {}): VehicleSearchResult {
  let list = [...FALLBACK_SEED_VEHICLES];

  if (query.make) {
    list = list.filter((v) => v.make.toLowerCase() === query.make!.toLowerCase());
  }
  if (query.model) {
    list = list.filter((v) => v.model.toLowerCase().includes(query.model!.toLowerCase()));
  }
  if (query.bodyStyle) {
    list = list.filter((v) => v.bodyStyle?.toLowerCase() === query.bodyStyle!.toLowerCase());
  }
  if (query.fuelType) {
    list = list.filter((v) => v.fuelType?.toLowerCase() === query.fuelType!.toLowerCase());
  }
  if (query.transmission) {
    list = list.filter((v) => v.transmission?.toLowerCase() === query.transmission!.toLowerCase());
  }
  if (query.yearMin !== undefined) {
    list = list.filter((v) => v.year >= query.yearMin!);
  }
  if (query.yearMax !== undefined) {
    list = list.filter((v) => v.year <= query.yearMax!);
  }
  if (query.priceMin !== undefined) {
    list = list.filter((v) => v.priceUsd >= query.priceMin!);
  }
  if (query.priceMax !== undefined) {
    list = list.filter((v) => v.priceUsd <= query.priceMax!);
  }
  if (query.searchQuery) {
    const q = query.searchQuery.toLowerCase().trim();
    list = list.filter(
      (v) =>
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.chassisNumber.toLowerCase().includes(q) ||
        `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q)
    );
  }

  // Sorting
  const sortBy = query.sortBy || 'newest';
  if (sortBy === 'price_asc') {
    list.sort((a, b) => a.priceUsd - b.priceUsd);
  } else if (sortBy === 'price_desc') {
    list.sort((a, b) => b.priceUsd - a.priceUsd);
  } else if (sortBy === 'year_desc') {
    list.sort((a, b) => b.year - a.year);
  } else if (sortBy === 'mileage_asc') {
    list.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
  } else {
    list.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.priceUsd - a.priceUsd));
  }

  const facets = buildFallbackFacets(FALLBACK_SEED_VEHICLES);
  const total = list.length;
  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, query.limit || 20);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const items = list.slice(startIndex, startIndex + limit);

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    facets,
  };
}

export function getFallbackVehicleDetail(idOrSlug: string, destinationCountry = 'Kenya'): VehicleDetail | null {
  const norm = idOrSlug.toLowerCase().trim();
  const found =
    FALLBACK_SEED_VEHICLES.find(
      (v) =>
        v.id.toLowerCase() === norm ||
        (v.slug && v.slug.toLowerCase() === norm) ||
        v.chassisNumber.toLowerCase() === norm ||
        norm.includes(v.id.toLowerCase())
    ) || FALLBACK_SEED_VEHICLES[0];

  if (!found) return null;

  return {
    id: found.id,
    chassisNumber: found.chassisNumber,
    slug: found.slug || found.id,
    make: found.make,
    model: found.model,
    year: found.year,
    status: found.status,
    statusLabel: found.status === 'Available' ? 'Available' : found.status === 'ReservedWithPI' ? 'Reserved with PI' : 'Sold',
    statusLabelPlural: found.status,
    statusDescription: `Vehicle ${found.chassisNumber} in certified inventory.`,
    priceState: found.requestPrice ? 'request_price' : 'priced',
    priceUsd: found.priceUsd,
    requestPrice: Boolean(found.requestPrice),
    discountPercent: found.discountPercent,
    discountedPriceUsd:
      found.priceUsd && found.discountPercent
        ? Math.round(found.priceUsd * (1 - found.discountPercent / 100))
        : found.priceUsd,
    category: found.category,
    locationStatus: found.locationStatus || 'In Japan',
    stockType: found.stockType || 'J',
    destinationPort: found.destinationPort || 'Mombasa',
    bodyStyle: found.bodyStyle,
    fuelType: found.fuelType,
    transmission: found.transmission,
    driveTrain: found.driveTrain,
    mileage: found.mileage,
    engineSize: found.engineSize || (found.engineCc ? `${found.engineCc} cc` : undefined),
    color: found.color,
    dimensions: found.dimensions,
    featured: found.featured,
    tierPricing: found.tierPricing,
    reservationEligibility: found.reservationEligibility || { eligible: true },
    inquiryEligibility: found.inquiryEligibility || { eligible: true },
    media: {
      gallery: found.images && found.images.length > 0 ? found.images : [
        'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1000&auto=format&fit=crop',
      ],
      showAuctionPictures: false,
      showJapanPictures: true,
      showDurbanPictures: false,
    },
    compliance: {
      isCompliant: true,
      countryCode: destinationCountry === 'Kenya' ? 'KE' : 'TZ',
      countryName: destinationCountry,
      ruleSummary: 'Within destination age and import specifications',
      failedCriteria: [],
      passedCriteria: ['Chassis age compliant', 'RHD steering verified'],
    },
  };
}
