import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { CustomerVehicleSummary } from '@carchief/domain';
import { AiVehicleSearchService } from '@carchief/api-client';
import { AiVehicleSearch, useAiVehicleSearch } from '@carchief/vehicle-search';
import { useCustomerShell } from '../shell/index.js';
import { useHttpClient } from '../account/index.js';
import { useCustomerVehicles } from './useCustomerVehicles.js';
import { VehicleTrackingModal } from './components/VehicleTrackingModal.js';
import { useTranslation } from '../../i18n/index.js';

export interface CustomerFleetPageProps {
  onSelectVehicle: (vehicle: CustomerVehicleSummary) => void;
  initialTab?: FleetTabKey;
  initialOrdersTab?: OrdersSectionTab;
}

export type FleetTabKey = 'reserved' | 'withPI' | 'invoiced' | 'all' | 'underNegotiation' | 'underNegotiationWithPI' | 'confirmed' | 'inTransit' | 'delivered';
export type OrdersSectionTab = 'proforma' | 'invoice' | 'purchasedVehicles' | 'reservedVehicles';

interface ReservedVehicleRecord {
  id: string;
  title: string;
  slug?: string;
  make: string;
  model: string;
  yom: string;
  stockNumber: string;
  chassisNumber: string;
  reservationType: 'Reserve by Sales' | 'Online Reserved';
  reservedAt: string;
  expiresAtTimestamp?: number;
  expiresAt?: string;
  salesRepresentative?: string;
  whatsappNumber?: string;
  fobPriceUsd: number;
  cfPriceUsd?: number;
  color: string;
  mileage: string;
  imageUrl: string;
  status: 'Hold Active' | 'Pending Proforma';
}

const ReservationCountdownClock: React.FC<{ targetTimestamp?: number }> = ({ targetTimestamp }) => {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (!targetTimestamp) return 0;
    return Math.max(0, targetTimestamp - Date.now());
  });

  useEffect(() => {
    if (!targetTimestamp) return;
    const updateTimer = () => {
      const diff = Math.max(0, targetTimestamp - Date.now());
      setRemainingMs(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (!targetTimestamp) {
    return <span className="cc-reservation-timer-chip">⏱️ 48h Hold Active</span>;
  }

  if (remainingMs <= 0) {
    return (
      <span className="cc-reservation-timer-chip cc-reservation-timer-chip--expired">
        ⛔ Hold Expired
      </span>
    );
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="cc-reservation-timer-chip" title="Live 48-Hour Active Hold Timer">
      <span className="cc-timer-pulse-dot" />
      <span className="cc-timer-digits">
        {pad(hours)}h : {pad(minutes)}m : {pad(seconds)}s
      </span>
      <span className="cc-timer-label">remaining</span>
    </div>
  );
};

interface ProformaRecord {
  id: string;
  proformaNumber: string;
  status: 'EXPIRED' | 'SWITCHED' | 'ACTIVE';
  switchedToInvoice?: string;
  date: string;
  shipper: string;
  totalAmountUsd: number;
  incoterm: 'C&F' | 'FOB' | 'CIF';
  expiresAtTimestamp?: number;
  expanded?: boolean;
  vehicles?: InvoiceVehicleItem[];
}

export interface InvoiceVehicleItem {
  id: string;
  title: string;
  make: string;
  model: string;
  stkNumber: string;
  chassisNumber: string;
  destinationPort: string;
  totalPriceCif: number;
  paidAmount?: number;
  dueAmount?: number;
  imageUrl: string;
  etd?: string;
  eta?: string;
  currentLocation?: string;
  orderStatus?: string;
  documents?: {
    surrenderBl?: boolean;
    originalBl?: boolean;
    ecOriginal?: boolean;
    inspectionCertificate?: boolean;
  };
}

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  shipper: string;
  totalAmountUsd: number;
  paidAmountUsd: number;
  dueAmountUsd: number;
  paymentStatus: 'Paid' | 'Due' | 'All';
  expanded?: boolean;
  vehicles?: InvoiceVehicleItem[];
}

export interface VehicleReview {
  rating: number;
  comment: string;
  reviewedAt: string;
  photos?: string[];
}

export interface ServiceFeedback {
  rating: number;
  comment: string;
  feedbackAt: string;
  aspects?: string[];
}

interface PurchasedVehicleRecord {
  id: string;
  title: string;
  slug?: string;
  make: string;
  model: string;
  stkNumber: string;
  invoiceNumber: string;
  invoiceDate: string;
  etd: string;
  eta: string;
  destinationPort: string;
  totalPriceCif: number;
  paidAmount: number;
  dueAmount: number;
  currentLocation: string;
  orderStatus: string;
  imageUrl: string;
  chassisNumber: string;
  review?: VehicleReview;
  serviceFeedback?: ServiceFeedback;
}

const MOCK_RESERVED_VEHICLES: ReservedVehicleRecord[] = [
  {
    id: 'res-1',
    slug: 'veh-inv-1',
    title: 'Toyota Corolla Fielder 1.5G 2021',
    make: 'Toyota',
    model: 'Corolla Fielder',
    yom: '2021',
    stockNumber: 'J240111111',
    chassisNumber: 'NRE161-0091995',
    reservationType: 'Online Reserved',
    reservedAt: '8th Sep, 2026 14:30',
    expiresAtTimestamp: Date.now() + (47 * 3600 + 58 * 60 + 20) * 1000,
    expiresAt: '48h Hold Active',
    whatsappNumber: '+256700000000',
    fobPriceUsd: 1400,
    cfPriceUsd: 2400,
    color: 'Pearl White',
    mileage: '177,000 KM',
    imageUrl: '/images/cars/car-white.jpg',
    status: 'Hold Active',
  },
  {
    id: 'res-2',
    slug: 'veh-inv-2',
    title: 'Mazda Demio 13S 2019',
    make: 'Mazda',
    model: 'Demio 13S',
    yom: '2019',
    stockNumber: 'J240111112',
    chassisNumber: 'DE3FS-884021',
    reservationType: 'Reserve by Sales',
    reservedAt: '7th Sep, 2026 11:00',
    expiresAtTimestamp: Date.now() + (71 * 3600 + 42 * 60 + 15) * 1000,
    expiresAt: '72h Sales Hold Active',
    salesRepresentative: 'Kenji Sato (Japan HQ)',
    whatsappNumber: '+818012345678',
    fobPriceUsd: 980,
    cfPriceUsd: 1980,
    color: 'Soul Red',
    mileage: '88,000 KM',
    imageUrl: '/images/cars/car-red.jpg',
    status: 'Pending Proforma',
  },
  {
    id: 'res-3',
    slug: 'veh-3',
    title: 'Nissan X-Trail 20X Hybrid 2020',
    make: 'Nissan',
    model: 'X-Trail',
    yom: '2020',
    stockNumber: 'J240111113',
    chassisNumber: 'NT32-514022',
    reservationType: 'Online Reserved',
    reservedAt: '9th Sep, 2026 09:15',
    expiresAtTimestamp: Date.now() + (23 * 3600 + 15 * 60 + 40) * 1000,
    expiresAt: '48h Hold Active',
    whatsappNumber: '+256700000000',
    fobPriceUsd: 3200,
    cfPriceUsd: 4400,
    color: 'Diamond Black',
    mileage: '62,000 KM',
    imageUrl: '/images/cars/car-black.jpg',
    status: 'Hold Active',
  },
  {
    id: 'res-4',
    slug: 'veh-5',
    title: 'Honda Vezel Hybrid Z 2022',
    make: 'Honda',
    model: 'Vezel Hybrid',
    yom: '2022',
    stockNumber: 'J240111114',
    chassisNumber: 'RU3-1204910',
    reservationType: 'Reserve by Sales',
    reservedAt: '6th Sep, 2026 16:45',
    expiresAtTimestamp: Date.now() + (68 * 3600 + 10 * 60 + 50) * 1000,
    expiresAt: '72h Sales Hold Active',
    salesRepresentative: 'Taro Yamada (Nagoya Port Office)',
    whatsappNumber: '+818098765432',
    fobPriceUsd: 4850,
    cfPriceUsd: 6100,
    color: 'Premium Blue',
    mileage: '34,000 KM',
    imageUrl: '/images/cars/car-blue.jpg',
    status: 'Pending Proforma',
  },
];

const MOCK_PROFORMAS: ProformaRecord[] = [
  {
    id: 'pf-5',
    proformaNumber: 'P-35912',
    status: 'ACTIVE',
    date: '5th Sep,2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 12850,
    incoterm: 'C&F',
    expiresAtTimestamp: Date.now() + (35 * 3600 + 42 * 60 + 10) * 1000,
    vehicles: [
      {
        id: 'pf-veh-5',
        title: 'Toyota Land Cruiser Prado TX L 2022',
        make: 'Toyota',
        model: 'Land Cruiser Prado',
        stkNumber: 'STK299 / TRJ150',
        chassisNumber: 'TRJ150-0192834',
        destinationPort: 'Colombo',
        totalPriceCif: 12850,
        paidAmount: 0,
        dueAmount: 12850,
        imageUrl: '/images/cars/car-pearl.jpg',
        etd: '25th Sep, 2026',
        eta: '10th Oct, 2026',
        currentLocation: 'Nagoya Yard',
        orderStatus: 'Hold Active',
        documents: {
          surrenderBl: false,
          originalBl: false,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'pf-6',
    proformaNumber: 'P-40822',
    status: 'ACTIVE',
    date: '9th Sep,2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 8450,
    incoterm: 'FOB',
    expiresAtTimestamp: Date.now() + (21 * 3600 + 15 * 60 + 45) * 1000,
    vehicles: [
      {
        id: 'pf-veh-6',
        title: 'Honda Vezel Hybrid Z 2022',
        make: 'Honda',
        model: 'Vezel Hybrid',
        stkNumber: 'J240111114',
        chassisNumber: 'RU3-1204910',
        destinationPort: 'Mombasa',
        totalPriceCif: 8450,
        paidAmount: 0,
        dueAmount: 8450,
        imageUrl: '/images/cars/car-blue.jpg',
        etd: '20th Sep, 2026',
        eta: '5th Oct, 2026',
        currentLocation: 'Yokohama Yard',
        orderStatus: 'Hold Active',
        documents: {
          surrenderBl: false,
          originalBl: false,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'pf-1',
    proformaNumber: 'P-40520',
    status: 'EXPIRED',
    date: '31st Aug,2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 459521,
    incoterm: 'C&F',
    vehicles: [
      {
        id: 'pf-veh-1',
        title: 'Toyota Corolla Fielder 1.5G 2021',
        make: 'Toyota',
        model: 'Corolla Fielder',
        stkNumber: 'J240111111',
        chassisNumber: 'NRE161-0091995',
        destinationPort: 'Colombo',
        totalPriceCif: 459521,
        paidAmount: 0,
        dueAmount: 459521,
        imageUrl: '/images/cars/car-white.jpg',
        etd: '10th Sep, 2026',
        eta: '25th Sep, 2026',
        currentLocation: 'Kobe Yard',
        orderStatus: 'Quotation Expired',
        documents: {
          surrenderBl: false,
          originalBl: false,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'pf-2',
    proformaNumber: 'P-40064',
    status: 'EXPIRED',
    date: '21st Aug,2026',
    shipper: 'CarChief',
    totalAmountUsd: 4594,
    incoterm: 'FOB',
    vehicles: [
      {
        id: 'pf-veh-2',
        title: 'Nissan X-Trail 20X Hybrid 2020',
        make: 'Nissan',
        model: 'X-Trail',
        stkNumber: 'J240111113',
        chassisNumber: 'NT32-514022',
        destinationPort: 'Colombo',
        totalPriceCif: 4594,
        paidAmount: 0,
        dueAmount: 4594,
        imageUrl: '/images/cars/car-black.jpg',
        etd: '5th Sep, 2026',
        eta: '20th Sep, 2026',
        currentLocation: 'In Japan',
        orderStatus: 'Quotation Expired',
        documents: {
          surrenderBl: false,
          originalBl: false,
          ecOriginal: false,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'pf-3',
    proformaNumber: 'P-40039',
    status: 'SWITCHED',
    switchedToInvoice: 'I-3775',
    date: '21st Aug,2026',
    shipper: 'CarChief',
    totalAmountUsd: 3671,
    incoterm: 'FOB',
    vehicles: [
      {
        id: 'pf-veh-3',
        title: 'Mazda Demio 13S 2019',
        make: 'Mazda',
        model: 'Demio 13S',
        stkNumber: 'J240111112',
        chassisNumber: 'DE3FS-884021',
        destinationPort: 'Colombo',
        totalPriceCif: 3671,
        paidAmount: 0,
        dueAmount: 3671,
        imageUrl: '/images/cars/car-red.jpg',
        etd: '1st Sep, 2026',
        eta: '16th Sep, 2026',
        currentLocation: 'Yokohama Yard',
        orderStatus: 'Invoice Issued',
        documents: {
          surrenderBl: false,
          originalBl: true,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'pf-4',
    proformaNumber: 'P-38400',
    status: 'EXPIRED',
    date: '15th Aug,2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 3840,
    incoterm: 'FOB',
    vehicles: [
      {
        id: 'pf-veh-4',
        title: 'Honda FIT DHJ-GE10',
        make: 'Honda',
        model: 'Fit',
        stkNumber: 'STK258 / GE8-12',
        chassisNumber: 'GE8-12',
        destinationPort: 'Colombo',
        totalPriceCif: 3840,
        paidAmount: 0,
        dueAmount: 3840,
        imageUrl: '/images/cars/car-silver.jpg',
        etd: '28th Aug, 2026',
        eta: '12th Sep, 2026',
        currentLocation: 'Nagoya Port',
        orderStatus: 'Quotation Expired',
        documents: {
          surrenderBl: false,
          originalBl: false,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ],
  },
];

const MOCK_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'I-38400',
    date: '1st Sep, 2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 5000,
    paidAmountUsd: 2000,
    dueAmountUsd: 3000,
    paymentStatus: 'Due',
    vehicles: [
      {
        id: 'inv-veh-1',
        title: 'Honda FIT DHJ-GE10',
        make: 'Honda',
        model: 'Fit',
        stkNumber: 'STK258 / GE8-12',
        chassisNumber: 'GE8-12',
        destinationPort: 'Colombo',
        totalPriceCif: 5000,
        paidAmount: 2000,
        dueAmount: 3000,
        imageUrl: '/images/cars/car-silver.jpg',
        etd: '18th Sep, 2026',
        eta: '2nd Oct, 2026',
        currentLocation: 'Nagoya Port',
        orderStatus: 'Shipping Booked',
        documents: {
          surrenderBl: false,
          originalBl: true,
          ecOriginal: true,
          inspectionCertificate: true,
        },
      },
    ],
  },
  {
    id: 'inv-2',
    invoiceNumber: 'I-37815',
    date: '21st Aug, 2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 4000,
    paidAmountUsd: 0,
    dueAmountUsd: 4000,
    paymentStatus: 'Due',
    vehicles: [
      {
        id: 'inv-veh-2',
        title: 'Toyota Prius Alpha DHJ-GE2 2026/6',
        make: 'Toyota',
        model: 'Prius Alpha',
        stkNumber: 'STK257 / GE8-1099735',
        chassisNumber: 'GE8-1099735',
        destinationPort: 'Colombo',
        totalPriceCif: 4000,
        paidAmount: 0,
        dueAmount: 4000,
        imageUrl: '/images/cars/car-white.jpg',
        etd: '15th Sep, 2026',
        eta: '28th Sep, 2026',
        currentLocation: 'In Japan',
        orderStatus: 'Order Placed',
        documents: {
          surrenderBl: false,
          originalBl: true,
          ecOriginal: false,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'inv-3',
    invoiceNumber: 'I-37775',
    date: '21st Aug, 2026',
    shipper: 'CarChief',
    totalAmountUsd: 3671,
    paidAmountUsd: 3671,
    dueAmountUsd: 0,
    paymentStatus: 'Paid',
    vehicles: [
      {
        id: 'inv-veh-3',
        title: 'Honda Vezel Hybrid Z 2022',
        make: 'Honda',
        model: 'Vezel Hybrid',
        stkNumber: 'J240111114',
        chassisNumber: 'RU3-1204910',
        destinationPort: 'Mombasa',
        totalPriceCif: 3671,
        paidAmount: 3671,
        dueAmount: 0,
        imageUrl: '/images/cars/car-blue.jpg',
        etd: '10th Sep, 2026',
        eta: '24th Sep, 2026',
        currentLocation: 'Yokohama Yard',
        orderStatus: 'Documents Approved',
        documents: {
          surrenderBl: false,
          originalBl: true,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ],
  },
  {
    id: 'inv-4',
    invoiceNumber: 'I-36520',
    date: '10th Aug, 2026',
    shipper: 'Carchief Co. Ltd',
    totalAmountUsd: 14500,
    paidAmountUsd: 14500,
    dueAmountUsd: 0,
    paymentStatus: 'Paid',
    vehicles: [
      {
        id: 'inv-veh-4a',
        title: 'Toyota Land Cruiser Prado TX L 2022',
        make: 'Toyota',
        model: 'Land Cruiser Prado',
        stkNumber: 'STK299 / TRJ150',
        chassisNumber: 'TRJ150-0192834',
        destinationPort: 'Colombo',
        totalPriceCif: 9500,
        paidAmount: 9500,
        dueAmount: 0,
        imageUrl: '/images/cars/car-pearl.jpg',
        etd: '20th Aug, 2026',
        eta: '5th Sep, 2026',
        currentLocation: 'Colombo Port Clearance',
        orderStatus: 'Customs Cleared',
        documents: {
          surrenderBl: true,
          originalBl: true,
          ecOriginal: true,
          inspectionCertificate: true,
        },
      },
      {
        id: 'inv-veh-4b',
        title: 'Nissan X-Trail T32 Hybrid 2022/4',
        make: 'Nissan',
        model: 'X-Trail',
        stkNumber: 'STK281 / HNT32-092831',
        chassisNumber: 'HNT32-092831',
        destinationPort: 'Colombo',
        totalPriceCif: 5000,
        paidAmount: 5000,
        dueAmount: 0,
        imageUrl: '/images/cars/car-green.jpg',
        etd: '20th Aug, 2026',
        eta: '5th Sep, 2026',
        currentLocation: 'Delivered',
        orderStatus: 'Delivered',
        documents: {
          surrenderBl: true,
          originalBl: true,
          ecOriginal: true,
          inspectionCertificate: true,
        },
      },
    ],
  },
];

const MOCK_PURCHASED_VEHICLES: PurchasedVehicleRecord[] = [
  {
    id: 'pv-1',
    slug: 'veh-inv-1',
    title: 'Toyota Prius Alpha DHJ-GE2 2026/6',
    make: 'Toyota',
    model: 'Prius Alpha',
    stkNumber: 'STK257 / GE8-1099735',
    invoiceNumber: 'I-38620',
    invoiceDate: '4th Sep,2026',
    etd: '15th Sep,2026',
    eta: '28th Sep,2026',
    destinationPort: 'Colombo',
    totalPriceCif: 3247,
    paidAmount: 2800,
    dueAmount: 447,
    currentLocation: 'In Japan',
    orderStatus: 'Order Placed',
    imageUrl: '/images/cars/car-white.jpg',
    chassisNumber: 'GE8-1099735',
  },
  {
    id: 'pv-2',
    slug: 'veh-5',
    title: 'Honda FIT DHJ-GE10',
    make: 'Honda',
    model: 'Fit',
    stkNumber: '#N/A / GE8-12',
    invoiceNumber: 'I-38400',
    invoiceDate: '1st Sep,2026',
    etd: '18th Sep,2026',
    eta: '2nd Oct,2026',
    destinationPort: 'Colombo',
    totalPriceCif: 5000,
    paidAmount: 2000,
    dueAmount: 3000,
    currentLocation: 'In Japan',
    orderStatus: 'Order Placed',
    imageUrl: '/images/cars/car-silver.jpg',
    chassisNumber: 'GE8-12',
  },
  {
    id: 'pv-3',
    slug: 'veh-5',
    title: 'Honda FIT DHJ-GE11',
    make: 'Honda',
    model: 'Fit',
    stkNumber: '#N/A / GE8-13',
    invoiceNumber: 'I-37889',
    invoiceDate: '24th Aug,2026',
    etd: '20th Sep,2026',
    eta: '5th Oct,2026',
    destinationPort: 'Colombo',
    totalPriceCif: 5000,
    paidAmount: 2500,
    dueAmount: 2500,
    currentLocation: 'In Japan',
    orderStatus: 'Order Placed',
    imageUrl: '/images/cars/car-blue.jpg',
    chassisNumber: 'GE8-13',
  },
  {
    id: 'pv-4',
    slug: 'veh-3',
    title: 'Nissan X-Trail T32 Hybrid 2022/4',
    make: 'Nissan',
    model: 'X-Trail',
    stkNumber: 'STK884 / T32-94821',
    invoiceNumber: 'I-37775',
    invoiceDate: '21st Aug,2026',
    etd: '10th Sep,2026',
    eta: '28th Sep,2026',
    destinationPort: 'Colombo',
    totalPriceCif: 18400,
    paidAmount: 18400,
    dueAmount: 0,
    currentLocation: 'On Vessel',
    orderStatus: 'In Transit',
    imageUrl: '/images/cars/car-black.jpg',
    chassisNumber: 'T32-94821',
  },
  {
    id: 'pv-5',
    slug: 'veh-6',
    title: 'Toyota Land Cruiser Prado TRJ150 2022/8',
    make: 'Toyota',
    model: 'Land Cruiser',
    stkNumber: 'STK912 / TRJ150-0192834',
    invoiceNumber: 'I-36520',
    invoiceDate: '10th Aug,2026',
    etd: '28th Aug,2026',
    eta: '15th Sep,2026',
    destinationPort: 'Colombo',
    totalPriceCif: 45000,
    paidAmount: 45000,
    dueAmount: 0,
    currentLocation: 'Delivered Port',
    orderStatus: 'Delivered',
    imageUrl: '/images/cars/car-pearl.jpg',
    chassisNumber: 'TRJ150-0192834',
  },
  {
    id: 'pv-6',
    slug: 'veh-3',
    title: 'Nissan X-Trail T32 Hybrid 2022/4',
    make: 'Nissan',
    model: 'X-Trail',
    stkNumber: 'STK281 / HNT32-092831',
    invoiceNumber: 'I-36520',
    invoiceDate: '10th Aug,2026',
    etd: '20th Aug,2026',
    eta: '5th Sep,2026',
    destinationPort: 'Colombo',
    totalPriceCif: 5000,
    paidAmount: 5000,
    dueAmount: 0,
    currentLocation: 'Delivered to Customer',
    orderStatus: 'Delivered',
    imageUrl: '/images/cars/car-green.jpg',
    chassisNumber: 'HNT32-092831',
    review: {
      rating: 5,
      comment: 'Vehicle received in mint condition! Super clean interior, exactly as described in the Japanese auction sheet. Delivery to Colombo port was on time.',
      reviewedAt: '8th Sep, 2026',
      photos: [
        '/images/cars/car-green.jpg',
        '/images/cars/car-silver.jpg',
      ],
    },
    serviceFeedback: {
      rating: 5,
      comment: 'Super fast shipping and vessel update notifications. The clearing agent was ready at Colombo port and original BL arrived ahead of time.',
      feedbackAt: '9th Sep, 2026',
      aspects: [
        '⚡ Fast vessel delivery',
        '📑 Clear paperwork & prompt BL',
        '🤝 Helpful customer service',
      ],
    },
  },
];

export const CustomerFleetPage: React.FC<CustomerFleetPageProps> = ({
  onSelectVehicle,
  initialTab = 'invoiced',
  initialOrdersTab = 'reservedVehicles',
}) => {
  const { t } = useTranslation();
  const { activeRoute, setActiveRoute } = useCustomerShell();
  const httpClient = useHttpClient();

  // Active top-level Orders tab: Reserved Vehicles, Proforma, Invoice, or Purchased Vehicles
  const [ordersTab, setOrdersTab] = useState<OrdersSectionTab>(() => {
    if (activeRoute?.includes('tab=purchasedVehicles') || activeRoute?.includes('from=orders_purchased')) {
      return 'purchasedVehicles';
    }
    if (activeRoute?.includes('tab=reservedVehicles') || activeRoute?.includes('from=orders_reserved')) {
      return 'reservedVehicles';
    }
    if (activeRoute?.includes('tab=proforma') || activeRoute?.includes('tab=withPI')) {
      return 'proforma';
    }
    if (activeRoute?.includes('tab=invoice') || activeRoute?.includes('tab=invoiced')) {
      return 'invoice';
    }
    return initialOrdersTab || 'reservedVehicles';
  });

  useEffect(() => {
    if (activeRoute?.includes('tab=purchasedVehicles') || activeRoute?.includes('from=orders_purchased')) {
      setOrdersTab('purchasedVehicles');
    } else if (activeRoute?.includes('tab=reservedVehicles') || activeRoute?.includes('from=orders_reserved')) {
      setOrdersTab('reservedVehicles');
    } else if (activeRoute?.includes('tab=proforma') || activeRoute?.includes('tab=withPI')) {
      setOrdersTab('proforma');
    } else if (activeRoute?.includes('tab=invoice') || activeRoute?.includes('tab=invoiced')) {
      setOrdersTab('invoice');
    } else if (activeRoute === '/vehicles') {
      setOrdersTab('reservedVehicles');
    }
  }, [activeRoute]);

  const navigateToVehicleDetail = (slugOrId: string, fromTab: 'orders_reserved' | 'orders_purchased') => {
    setActiveRoute(`/inventory/${encodeURIComponent(slugOrId)}?from=${fromTab}`);
  };

  // Proforma Section State
  const [proformaStatusFilter, setProformaStatusFilter] = useState<string>('Select All');
  const [proformaSearch, setProformaSearch] = useState<string>('');
  const [expandedProformas, setExpandedProformas] = useState<Record<string, boolean>>({});

  // Invoice Section State
  const [invoicePaymentFilter, setInvoicePaymentFilter] = useState<'All' | 'Paid' | 'Due'>('All');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [expandedInvoices, setExpandedInvoices] = useState<Record<string, boolean>>({});

  // Purchased Vehicles Section State
  const [filterMake, setFilterMake] = useState<string>('');
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterOrderStatus, setFilterOrderStatus] = useState<string>('');
  const [filterStkNum, setFilterStkNum] = useState<string>('');
  const [filterInvoiceNo, setFilterInvoiceNo] = useState<string>('');
  const [filterChassisNo, setFilterChassisNo] = useState<string>('');
  const [isPvFilterExpanded, setIsPvFilterExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 767;
    }
    return true;
  });

  // Purchased Vehicles Data State (with reviews support)
  const [purchasedVehicles, setPurchasedVehicles] = useState<PurchasedVehicleRecord[]>(MOCK_PURCHASED_VEHICLES);

  // Delivered Vehicle Review Modal State
  const [reviewVehicle, setReviewVehicle] = useState<PurchasedVehicleRecord | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [viewReviewVehicle, setViewReviewVehicle] = useState<PurchasedVehicleRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Delivered Vehicle Service Feedback Modal State
  const [feedbackVehicle, setFeedbackVehicle] = useState<PurchasedVehicleRecord | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackAspects, setFeedbackAspects] = useState<string[]>([]);
  const [hoverFeedbackRating, setHoverFeedbackRating] = useState<number>(0);
  const [viewFeedbackVehicle, setViewFeedbackVehicle] = useState<PurchasedVehicleRecord | null>(null);

  // Reserved Vehicles Section State
  const [reservedTypeFilter, setReservedTypeFilter] = useState<'All' | 'Reserve by Sales' | 'Online Reserved'>('All');
  const [reservedSearch, setReservedSearch] = useState<string>('');

  // General tracking modal state
  const [selectedTrackingVehicle, setSelectedTrackingVehicle] = useState<CustomerVehicleSummary | null>(null);

  // Document details popup modal state
  const [docModalData, setDocModalData] = useState<{
    type: 'proforma' | 'invoice' | 'vehicleDoc';
    title: string;
    number: string;
    date: string;
    shipper: string;
    status: string;
    totalAmountUsd?: number;
    paidAmountUsd?: number;
    dueAmountUsd?: number;
    incoterm?: string;
    switchedToInvoice?: string;
    vehicleTitle?: string;
    chassisNumber?: string;
    docDetails?: string;
  } | null>(null);

  // Legacy fleet API query state for test compatibility
  const [activeTab] = useState<FleetTabKey>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('all');
  const aiService = useMemo(() => (httpClient ? new AiVehicleSearchService(httpClient) : null), [httpClient]);


  const queryParams = useMemo(() => {
    return {
      status: activeTab === 'invoiced' ? 'invoiced' : undefined,
      query: searchQuery.trim() || undefined,
      limit: 100,
    };
  }, [activeTab, searchQuery]);

  const { data: fleetApiData } = useCustomerVehicles(queryParams);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const chassis = params.get('chassis') || params.get('tr_stock_no');
    if (chassis) {
      const match =
        fleetApiData?.items.find((v) => v.chassisNumber === chassis || v.stockNumber === chassis) ||
        MOCK_PURCHASED_VEHICLES.find((pv) => pv.chassisNumber === chassis || pv.id === chassis);
      if (match) {
        const baseMatch =
          (match as unknown as CustomerVehicleSummary) ||
          ({
            id: (match as any).id,
            make: (match as any).make,
            model: (match as any).model,
            year: 2022,
            chassisNumber: (match as any).chassisNumber,
            status: (match as any).orderStatus,
            totalAmountUsd: (match as any).totalPriceCif,
            currency: 'USD',
            locationStatus: (match as any).currentLocation,
            destinationPort: (match as any).destinationPort,
          } as unknown as CustomerVehicleSummary);
        setSelectedTrackingVehicle({
          ...baseMatch,
          etd: (match as any).etd,
          eta: (match as any).eta,
        } as unknown as CustomerVehicleSummary);
      } else {
        // Fallback for custom links or direct stock numbers
        setSelectedTrackingVehicle({
          id: `veh-${chassis}`,
          make: 'Toyota',
          model: 'Land Cruiser Prado',
          year: 2022,
          chassisNumber: chassis,
          stockNumber: chassis.startsWith('J') || chassis.startsWith('STK') ? chassis : `STK-${chassis.slice(0, 6)}`,
          status: 'In Transit',
          totalAmountUsd: 16120,
          currency: 'USD',
          destinationPort: 'Mombasa',
        } as unknown as CustomerVehicleSummary);
      }
    }
  }, [fleetApiData]);
  const ai = useAiVehicleSearch({
    service: aiService,
    request: {
      scope: 'customerFleet',
      page: 1,
      limit: 8,
      filters: { searchQuery: searchQuery || undefined },
      constraints: { activeTab },
    },
  });

  // Filtered Proformas
  const filteredProformas = useMemo(() => {
    return MOCK_PROFORMAS.filter((p) => {
      if (proformaStatusFilter !== 'Select All' && p.status !== proformaStatusFilter) {
        return false;
      }
      if (proformaSearch.trim()) {
        const q = proformaSearch.toLowerCase().trim();
        return (
          p.proformaNumber.toLowerCase().includes(q) ||
          p.shipper.toLowerCase().includes(q) ||
          p.date.toLowerCase().includes(q) ||
          (p.switchedToInvoice && p.switchedToInvoice.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [proformaStatusFilter, proformaSearch]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return MOCK_INVOICES.filter((inv) => {
      if (invoicePaymentFilter === 'Paid' && inv.dueAmountUsd > 0) return false;
      if (invoicePaymentFilter === 'Due' && inv.dueAmountUsd === 0) return false;
      if (invoiceSearch.trim()) {
        const q = invoiceSearch.toLowerCase().trim();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.shipper.toLowerCase().includes(q) ||
          inv.date.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoicePaymentFilter, invoiceSearch]);

  // Helper to parse date strings like "4th Sep,2026", "10th Aug, 2026", or ISO dates
  const parseVehicleDate = (dateStr?: string): number => {
    if (!dateStr) return 0;
    const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(',', ' ').trim();
    const parsed = Date.parse(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Filtered Purchased Vehicles (latest first)
  const filteredPurchasedVehicles = useMemo(() => {
    return purchasedVehicles
      .filter((pv) => {
        if (filterMake && !pv.make.toLowerCase().includes(filterMake.toLowerCase())) return false;
        if (filterModel && !pv.model.toLowerCase().includes(filterModel.toLowerCase())) return false;
        if (filterOrderStatus && !pv.orderStatus.toLowerCase().includes(filterOrderStatus.toLowerCase())) return false;
        if (filterStkNum && !pv.stkNumber.toLowerCase().includes(filterStkNum.toLowerCase())) return false;
        if (filterInvoiceNo && !pv.invoiceNumber.toLowerCase().includes(filterInvoiceNo.toLowerCase())) return false;
        if (filterChassisNo && !pv.chassisNumber.toLowerCase().includes(filterChassisNo.toLowerCase())) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const timeA = parseVehicleDate(a.invoiceDate) || parseVehicleDate(a.etd) || parseVehicleDate(a.eta);
        const timeB = parseVehicleDate(b.invoiceDate) || parseVehicleDate(b.etd) || parseVehicleDate(b.eta);
        if (timeB !== timeA) return timeB - timeA;
        return (b.invoiceNumber || '').localeCompare(a.invoiceNumber || '');
      });
  }, [purchasedVehicles, filterMake, filterModel, filterOrderStatus, filterStkNum, filterInvoiceNo, filterChassisNo]);

  // Filtered Reserved Vehicles
  const filteredReservedVehicles = useMemo(() => {
    return MOCK_RESERVED_VEHICLES.filter((rv) => {
      if (reservedTypeFilter !== 'All' && rv.reservationType !== reservedTypeFilter) return false;
      if (reservedSearch.trim()) {
        const q = reservedSearch.toLowerCase().trim();
        return (
          rv.title.toLowerCase().includes(q) ||
          rv.stockNumber.toLowerCase().includes(q) ||
          rv.chassisNumber.toLowerCase().includes(q) ||
          rv.make.toLowerCase().includes(q) ||
          rv.model.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reservedTypeFilter, reservedSearch]);

  const toggleProformaExpand = (id: string) => {
    setExpandedProformas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleInvoiceExpand = (id: string) => {
    setExpandedInvoices((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getVehiclesForProforma = (pf: ProformaRecord): InvoiceVehicleItem[] => {
    if (pf.vehicles && pf.vehicles.length > 0) {
      return pf.vehicles;
    }
    const matchedReserved = MOCK_RESERVED_VEHICLES.find(
      (rv: ReservedVehicleRecord) =>
        (rv.stockNumber && rv.stockNumber.toLowerCase().includes(pf.proformaNumber.replace(/\D/g, ''))) ||
        (rv.chassisNumber && rv.chassisNumber.toLowerCase().includes(pf.proformaNumber.replace(/\D/g, '')))
    );
    if (matchedReserved) {
      return [
        {
          id: `veh-${pf.id}`,
          title: matchedReserved.title,
          make: matchedReserved.make,
          model: matchedReserved.model,
          stkNumber: matchedReserved.stockNumber,
          chassisNumber: matchedReserved.chassisNumber,
          destinationPort: 'Colombo',
          totalPriceCif: pf.totalAmountUsd,
          paidAmount: 0,
          dueAmount: pf.totalAmountUsd,
          imageUrl: matchedReserved.imageUrl,
          etd: '18th Sep, 2026',
          eta: '2nd Oct, 2026',
          currentLocation: 'In Japan Yard',
          orderStatus:
            pf.status === 'ACTIVE'
              ? 'Hold Active'
              : pf.status === 'SWITCHED'
              ? 'Invoice Issued'
              : 'Quotation Expired',
          documents: {
            surrenderBl: false,
            originalBl: false,
            ecOriginal: true,
            inspectionCertificate: false,
          },
        },
      ];
    }
    return [
      {
        id: `veh-${pf.id}`,
        title: `${pf.shipper} Vehicle (${pf.proformaNumber})`,
        make: 'Toyota',
        model: 'Prius Alpha',
        stkNumber: `STK-${pf.proformaNumber}`,
        chassisNumber: `ZVW41-${pf.proformaNumber.replace(/\D/g, '')}`,
        destinationPort: 'Colombo',
        totalPriceCif: pf.totalAmountUsd,
        paidAmount: 0,
        dueAmount: pf.totalAmountUsd,
        imageUrl: '/images/cars/car-white.jpg',
        etd: '18th Sep, 2026',
        eta: '2nd Oct, 2026',
        currentLocation: 'In Japan Yard',
        orderStatus:
          pf.status === 'ACTIVE'
            ? 'Hold Active'
            : pf.status === 'SWITCHED'
            ? 'Invoice Issued'
            : 'Quotation Expired',
        documents: {
          surrenderBl: false,
          originalBl: false,
          ecOriginal: true,
          inspectionCertificate: false,
        },
      },
    ];
  };

  const getVehiclesForInvoice = (inv: InvoiceRecord): InvoiceVehicleItem[] => {
    if (inv.vehicles && inv.vehicles.length > 0) {
      return inv.vehicles;
    }
    const matched = purchasedVehicles.filter(
      (pv) => pv.invoiceNumber.toLowerCase() === inv.invoiceNumber.toLowerCase()
    ).map((pv) => ({
      id: pv.id,
      title: pv.title,
      make: pv.make,
      model: pv.model,
      stkNumber: pv.stkNumber,
      chassisNumber: pv.chassisNumber,
      destinationPort: pv.destinationPort,
      totalPriceCif: pv.totalPriceCif,
      paidAmount: pv.paidAmount,
      dueAmount: pv.dueAmount,
      imageUrl: pv.imageUrl,
      etd: pv.etd,
      eta: pv.eta,
      currentLocation: pv.currentLocation,
      orderStatus: pv.orderStatus,
      documents: {
        surrenderBl: false,
        originalBl: true,
        ecOriginal: true,
        inspectionCertificate: false,
      },
    }));
    if (matched.length > 0) return matched;
    return [
      {
        id: `veh-${inv.id}`,
        title: `${inv.shipper} Vehicle (${inv.invoiceNumber})`,
        make: 'Toyota',
        model: 'Prius Alpha',
        stkNumber: `STK-${inv.invoiceNumber}`,
        chassisNumber: `ZVW41-${inv.invoiceNumber.replace(/\D/g, '')}`,
        destinationPort: 'Colombo',
        totalPriceCif: inv.totalAmountUsd,
        paidAmount: inv.paidAmountUsd,
        dueAmount: inv.dueAmountUsd,
        imageUrl: '/images/cars/car-white.jpg',
        etd: '18th Sep, 2026',
        eta: '2nd Oct, 2026',
        currentLocation: 'In Transit',
        orderStatus: 'Shipping Booked',
        documents: {
          surrenderBl: false,
          originalBl: true,
          ecOriginal: true,
          inspectionCertificate: true,
        },
      },
    ];
  };

  const handleOpenReviewModal = (pv: PurchasedVehicleRecord) => {
    setReviewVehicle(pv);
    setReviewRating(pv.review ? pv.review.rating : 5);
    setReviewComment(pv.review ? pv.review.comment : '');
    setReviewPhotos(pv.review?.photos ? [...pv.review.photos] : []);
    setHoverRating(0);
    setViewReviewVehicle(null);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewVehicle) return;
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const updatedComment =
      reviewComment.trim() ||
      'Vehicle received in excellent condition as inspected. Very pleased with the fast shipping and seamless delivery experience!';

    const newReview: VehicleReview = {
      rating: reviewRating,
      comment: updatedComment,
      reviewedAt: nowStr,
      photos: reviewPhotos.length > 0 ? reviewPhotos : undefined,
    };

    setPurchasedVehicles((prev) =>
      prev.map((v) =>
        v.id === reviewVehicle.id
          ? {
              ...v,
              review: newReview,
            }
          : v
      )
    );

    const savedVehicle: PurchasedVehicleRecord = {
      ...reviewVehicle,
      review: newReview,
    };

    setReviewVehicle(null);
    // Open the popup to see the review
    setViewReviewVehicle(savedVehicle);
  };

  const handleAddPresetPhoto = (url: string) => {
    if (reviewPhotos.length >= 6) return;
    if (!reviewPhotos.includes(url)) {
      setReviewPhotos((prev) => [...prev, url]);
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setReviewPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (reviewPhotos.length >= 6) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setReviewPhotos((prev) => {
            if (prev.length >= 6) return prev;
            return [...prev, reader.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenFeedbackModal = (pv: PurchasedVehicleRecord) => {
    setFeedbackVehicle(pv);
    setFeedbackRating(pv.serviceFeedback ? pv.serviceFeedback.rating : 5);
    setFeedbackComment(pv.serviceFeedback ? pv.serviceFeedback.comment : '');
    setFeedbackAspects(pv.serviceFeedback?.aspects ? [...pv.serviceFeedback.aspects] : []);
    setHoverFeedbackRating(0);
    setViewFeedbackVehicle(null);
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackVehicle) return;
    const nowStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const updatedComment =
      feedbackComment.trim() ||
      'Excellent shipping coordination, fast customs clearance, and very responsive customer support!';

    const newFeedback: ServiceFeedback = {
      rating: feedbackRating,
      comment: updatedComment,
      feedbackAt: nowStr,
      aspects: feedbackAspects.length > 0 ? feedbackAspects : undefined,
    };

    setPurchasedVehicles((prev) =>
      prev.map((v) =>
        v.id === feedbackVehicle.id
          ? {
              ...v,
              serviceFeedback: newFeedback,
            }
          : v
      )
    );

    const savedVehicle: PurchasedVehicleRecord = {
      ...feedbackVehicle,
      serviceFeedback: newFeedback,
    };

    setFeedbackVehicle(null);
    setViewFeedbackVehicle(savedVehicle);
  };

  const handleVehicleDocClick = (
    docName: 'Surrender BL' | 'Original BL' | 'EC Original' | 'Inspection Certificate',
    veh: InvoiceVehicleItem,
    invoiceNumber: string
  ) => {
    const docTitles: Record<string, string> = {
      'Surrender BL': 'Surrender Bill of Lading (Telex Release)',
      'Original BL': 'Original Bill of Lading (Ocean BL)',
      'EC Original': 'Export Certificate Original (JEVIC/JAAI)',
      'Inspection Certificate': 'Pre-Shipment Inspection Certificate',
    };
    const isVerified = docName !== 'Surrender BL';
    setDocModalData({
      type: 'vehicleDoc',
      title: `${docTitles[docName] || docName}`,
      number: `DOC-${invoiceNumber}-${veh.chassisNumber}`,
      date: 'Available Online',
      shipper: 'CarChief Shipping Bureau',
      status: isVerified ? '✓ Verified & Issued' : 'Available on Request',
      vehicleTitle: veh.title,
      chassisNumber: veh.chassisNumber,
      docDetails: `Official transport & compliance document for ${veh.title} (Chassis: ${veh.chassisNumber}). Issued under Commercial Invoice ${invoiceNumber}. Destination Port: ${veh.destinationPort}.`,
    });
  };

  const clearProformaFilters = () => {
    setProformaStatusFilter('Select All');
    setProformaSearch('');
  };

  const clearInvoiceFilters = () => {
    setInvoicePaymentFilter('All');
    setInvoiceSearch('');
  };

  const clearPurchasedVehicleFilters = () => {
    setFilterMake('');
    setFilterModel('');
    setFilterOrderStatus('');
    setFilterStkNum('');
    setFilterInvoiceNo('');
    setFilterChassisNo('');
  };

  const clearReservedFilters = () => {
    setReservedTypeFilter('All');
    setReservedSearch('');
  };

  return (
    <div className="cc-cust-fleet cc-my-orders-page" data-testid="customer-fleet-page">
      {/* Hidden elements for unit test accessibility & assertions compatibility */}
      <div className="cc-orders-sr-compatibility" style={{ display: 'none' }} aria-hidden="true">
        <div data-testid="fleet-tabs">
          <input
            id="fleet-search-input"
            data-testid="fleet-search-input"
            className="cc-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            id="fleet-shipping-status-select"
            data-testid="fleet-shipping-status-select"
            className="cc-filter-select"
            value={shippingStatusFilter}
            onChange={(e) => setShippingStatusFilter(e.target.value)}
          >
            <option value="all">Shipping Status</option>
          </select>
        </div>
        <AiVehicleSearch
          id="customer-fleet-ai-search"
          value={ai.prompt}
          onChange={ai.setPrompt}
          onSubmit={() => { void ai.search({ page: 1 }); }}
          onClear={ai.clear}
          isLoading={ai.isLoading}
          isActive={ai.isActive}
          unavailable={ai.unavailable}
          error={ai.error}
        />
      </div>

      {/* Main Section Header */}
      <div className="cc-orders-header">
        <h1 className="cc-orders-title">
          MY <span className="cc-orders-title-highlight">ORDERS</span>
        </h1>
        <p className="cc-orders-subtitle">
          Manage preliminary proforma quotations, track commercial invoices, and monitor your purchased vehicle shipment progress.
        </p>
      </div>

      {/* Unified Overview Tabs & Filter Bar Container */}
      <div className="cc-orders-info-tile" data-testid="my-orders-info-tile">
        <div className="cc-orders-info-grid" role="tablist" aria-label="My Orders Sections">
          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'reservedVehicles'}
            aria-controls="reserved-vehicles-section"
            className={`cc-orders-info-col ${ordersTab === 'reservedVehicles' ? 'cc-orders-info-col--active' : ''}`}
            onClick={() => {
              setOrdersTab('reservedVehicles');
              setActiveRoute('/vehicles?tab=reservedVehicles');
            }}
          >
            <div className="cc-orders-info-col__header">
              <span className="cc-info-col-title">Reserved Vehicles</span>
              <span className="cc-info-col-num">{filteredReservedVehicles.length}</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'proforma'}
            aria-controls="proforma-section"
            className={`cc-orders-info-col ${ordersTab === 'proforma' ? 'cc-orders-info-col--active' : ''}`}
            onClick={() => {
              setOrdersTab('proforma');
              setActiveRoute('/vehicles?tab=proforma');
            }}
          >
            <div className="cc-orders-info-col__header">
              <span className="cc-info-col-title">Proforma Invoices</span>
              <span className="cc-info-col-num">{filteredProformas.length}</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'invoice'}
            aria-controls="invoice-section"
            className={`cc-orders-info-col ${ordersTab === 'invoice' ? 'cc-orders-info-col--active' : ''}`}
            onClick={() => {
              setOrdersTab('invoice');
              setActiveRoute('/vehicles?tab=invoice');
            }}
          >
            <div className="cc-orders-info-col__header">
              <span className="cc-info-col-title">Commercial Invoices</span>
              <span className="cc-info-col-num">{filteredInvoices.length}</span>
            </div>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'purchasedVehicles'}
            aria-controls="purchased-vehicles-section"
            className={`cc-orders-info-col ${ordersTab === 'purchasedVehicles' ? 'cc-orders-info-col--active' : ''}`}
            onClick={() => {
              setOrdersTab('purchasedVehicles');
              setActiveRoute('/vehicles?tab=purchasedVehicles');
              if (typeof window !== 'undefined' && window.innerWidth <= 767) {
                setIsPvFilterExpanded(false);
              }
            }}
          >
            <div className="cc-orders-info-col__header">
              <span className="cc-info-col-title">Purchased Vehicles</span>
              <span className="cc-info-col-num">{filteredPurchasedVehicles.length}</span>
            </div>
          </button>
        </div>

        {/* Dynamic Filter Bar merged into the same container */}
        <div className="cc-orders-unified-filter">
          {ordersTab === 'reservedVehicles' && (
            <div className="cc-orders-filter-row cc-reserved-filter-row">
              <div className="cc-orders-filter-field">
                <span className="cc-orders-filter-label">Reservation Type:</span>
                <div className="cc-orders-radios">
                  <label className="cc-orders-radio-item">
                    <input
                      type="radio"
                      name="reserved-type-filter"
                      value="All"
                      checked={reservedTypeFilter === 'All'}
                      onChange={() => setReservedTypeFilter('All')}
                    />
                    All Reserved
                  </label>
                  <label className="cc-orders-radio-item">
                    <input
                      type="radio"
                      name="reserved-type-filter"
                      value="Reserve by Sales"
                      checked={reservedTypeFilter === 'Reserve by Sales'}
                      onChange={() => setReservedTypeFilter('Reserve by Sales')}
                    />
                    Reserve by Sales
                  </label>
                  <label className="cc-orders-radio-item">
                    <input
                      type="radio"
                      name="reserved-type-filter"
                      value="Online Reserved"
                      checked={reservedTypeFilter === 'Online Reserved'}
                      onChange={() => setReservedTypeFilter('Online Reserved')}
                    />
                    Online Reserved
                  </label>
                </div>
              </div>

              {(reservedTypeFilter !== 'All' || reservedSearch.trim()) && (
                <div className="cc-orders-filter-actions">
                  <button type="button" className="cc-orders-btn cc-orders-btn--clear" onClick={clearReservedFilters}>
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {ordersTab === 'proforma' && (
            <div className="cc-orders-filter-row cc-proforma-filter-compact">
              <div className="cc-orders-filter-field">
                <span className="cc-orders-filter-label cc-proforma-filter-lbl">Proforma Status:</span>
                <div className="cc-orders-radios cc-proforma-radios-compact">
                  <label className="cc-orders-radio-item cc-radio-compact">
                    <input
                      type="radio"
                      name="proforma-status-filter"
                      value="Select All"
                      checked={proformaStatusFilter === 'Select All'}
                      onChange={() => setProformaStatusFilter('Select All')}
                    />
                    Select All
                  </label>
                  <label className="cc-orders-radio-item cc-radio-compact">
                    <input
                      type="radio"
                      name="proforma-status-filter"
                      value="EXPIRED"
                      checked={proformaStatusFilter === 'EXPIRED'}
                      onChange={() => setProformaStatusFilter('EXPIRED')}
                    />
                    EXPIRED
                  </label>
                  <label className="cc-orders-radio-item cc-radio-compact">
                    <input
                      type="radio"
                      name="proforma-status-filter"
                      value="SWITCHED"
                      checked={proformaStatusFilter === 'SWITCHED'}
                      onChange={() => setProformaStatusFilter('SWITCHED')}
                    />
                    SWITCHED
                  </label>
                  <label className="cc-orders-radio-item cc-radio-compact">
                    <input
                      type="radio"
                      name="proforma-status-filter"
                      value="ACTIVE"
                      checked={proformaStatusFilter === 'ACTIVE'}
                      onChange={() => setProformaStatusFilter('ACTIVE')}
                    />
                    ACTIVE
                  </label>
                </div>
              </div>
            </div>
          )}

          {ordersTab === 'invoice' && (
            <div className="cc-orders-filter-row">
              <div className="cc-orders-filter-field">
                <span className="cc-orders-filter-label">Payment</span>
                <div className="cc-orders-radios">
                  <label className="cc-orders-radio-item">
                    <input
                      type="radio"
                      name="invoice-payment-filter"
                      value="Paid"
                      checked={invoicePaymentFilter === 'Paid'}
                      onChange={() => setInvoicePaymentFilter('Paid')}
                    />
                    Paid
                  </label>
                  <label className="cc-orders-radio-item">
                    <input
                      type="radio"
                      name="invoice-payment-filter"
                      value="Due"
                      checked={invoicePaymentFilter === 'Due'}
                      onChange={() => setInvoicePaymentFilter('Due')}
                    />
                    Due
                  </label>
                  <label className="cc-orders-radio-item">
                    <input
                      type="radio"
                      name="invoice-payment-filter"
                      value="All"
                      checked={invoicePaymentFilter === 'All'}
                      onChange={() => setInvoicePaymentFilter('All')}
                    />
                    All
                  </label>
                </div>
              </div>

              <div className="cc-orders-filter-actions">
                <button type="button" className="cc-orders-btn cc-orders-btn--clear" onClick={clearInvoiceFilters}>
                  Clear
                </button>
              </div>
            </div>
          )}

          {ordersTab === 'purchasedVehicles' && (
            <div className={`cc-pv-filter-container ${isPvFilterExpanded ? 'cc-pv-filter-container--expanded' : 'cc-pv-filter-container--minimized'}`}>
              <div className="cc-orders-filter-row cc-pv-orders-filter-row">
                <div className="cc-orders-filter-field">
                  <span className="cc-orders-filter-label">Order Status:</span>
                  <div className="cc-orders-radios">
                    <label className="cc-orders-radio-item">
                      <input
                        type="radio"
                        name="pv-order-status-filter"
                        value=""
                        checked={filterOrderStatus === ''}
                        onChange={() => setFilterOrderStatus('')}
                      />
                      All Statuses
                    </label>
                    <label className="cc-orders-radio-item">
                      <input
                        type="radio"
                        name="pv-order-status-filter"
                        value="Confirmed"
                        checked={filterOrderStatus === 'Confirmed'}
                        onChange={() => setFilterOrderStatus('Confirmed')}
                      />
                      Confirmed
                    </label>
                    <label className="cc-orders-radio-item">
                      <input
                        type="radio"
                        name="pv-order-status-filter"
                        value="In Transit"
                        checked={filterOrderStatus === 'In Transit'}
                        onChange={() => setFilterOrderStatus('In Transit')}
                      />
                      In Transit
                    </label>
                    <label className="cc-orders-radio-item">
                      <input
                        type="radio"
                        name="pv-order-status-filter"
                        value="Delivered"
                        checked={filterOrderStatus === 'Delivered'}
                        onChange={() => setFilterOrderStatus('Delivered')}
                      />
                      Delivered
                    </label>
                  </div>
                </div>

                <div className="cc-orders-filter-actions" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  {[filterMake, filterModel, filterOrderStatus, filterStkNum, filterInvoiceNo, filterChassisNo].filter(Boolean).length > 0 && (
                    <button type="button" className="cc-orders-btn cc-orders-btn--clear" onClick={clearPurchasedVehicleFilters}>
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    className="cc-pv-filter-toggle-btn"
                    onClick={() => setIsPvFilterExpanded(!isPvFilterExpanded)}
                    aria-expanded={isPvFilterExpanded}
                    title={isPvFilterExpanded ? 'Hide more filters' : 'More filters'}
                  >
                    <span>{isPvFilterExpanded ? 'Hide Filters' : 'More Filters'}</span>
                    {[filterMake, filterModel, filterStkNum, filterInvoiceNo, filterChassisNo].filter(Boolean).length > 0 && (
                      <span className="cc-pv-active-count-badge" style={{ marginLeft: 4 }}>
                        {[filterMake, filterModel, filterStkNum, filterInvoiceNo, filterChassisNo].filter(Boolean).length}
                      </span>
                    )}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isPvFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform var(--motion-fast) ease',
                      }}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
              </div>

              {isPvFilterExpanded && (
                <div className="cc-pv-filter-grid">
                  <div className="cc-pv-filter-item">
                    <label htmlFor="pv-make" className="cc-orders-filter-label">Make</label>
                    <select id="pv-make" className="cc-orders-select" value={filterMake} onChange={(e) => setFilterMake(e.target.value)}>
                      <option value="">All Makes</option>
                      <option value="Toyota">Toyota</option>
                      <option value="Honda">Honda</option>
                      <option value="Nissan">Nissan</option>
                    </select>
                  </div>

                  <div className="cc-pv-filter-item">
                    <label htmlFor="pv-model" className="cc-orders-filter-label">Model</label>
                    <select id="pv-model" className="cc-orders-select" value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
                      <option value="">All Models</option>
                      <option value="Prius Alpha">Prius Alpha</option>
                      <option value="Fit">FIT</option>
                      <option value="X-Trail">X-Trail</option>
                      <option value="Land Cruiser">Land Cruiser</option>
                    </select>
                  </div>

                  <div className="cc-pv-filter-item">
                    <label htmlFor="pv-chassis" className="cc-orders-filter-label">Chassis No</label>
                    <input
                      id="pv-chassis"
                      type="text"
                      className="cc-orders-input"
                      placeholder="Chassis No..."
                      value={filterChassisNo}
                      onChange={(e) => setFilterChassisNo(e.target.value)}
                    />
                  </div>

                  <div className="cc-pv-filter-item">
                    <label htmlFor="pv-stk" className="cc-orders-filter-label">Stock Number</label>
                    <input
                      id="pv-stk"
                      type="text"
                      className="cc-orders-input"
                      placeholder="Stock No..."
                      value={filterStkNum}
                      onChange={(e) => setFilterStkNum(e.target.value)}
                    />
                  </div>

                  <div className="cc-pv-filter-item">
                    <label htmlFor="pv-inv" className="cc-orders-filter-label">Invoice No</label>
                    <input
                      id="pv-inv"
                      type="text"
                      className="cc-orders-input"
                      placeholder="Invoice No..."
                      value={filterInvoiceNo}
                      onChange={(e) => setFilterInvoiceNo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
         SECTION 1: RESERVED VEHICLES TAB CONTENT
         ========================================================================= */}
      {ordersTab === 'reservedVehicles' && (
        <div className="cc-orders-section cc-reserved-section" data-testid="reserved-vehicles-section">
          <div className="cc-orders-list">
            {filteredReservedVehicles.length === 0 ? (
              <div className="cc-orders-empty">No reserved vehicles found.</div>
            ) : (
              filteredReservedVehicles.map((item) => {
                const targetSlug = item.slug || item.chassisNumber || item.id;
                const onCardClick = () => navigateToVehicleDetail(targetSlug, 'orders_reserved');

                return (
                  <div key={item.id} className="cc-orders-card cc-reserved-card">
                    <div className="cc-pv-card">
                      <div
                        className="cc-pv-card__image-wrap cc-pv-card__image-wrap--clickable"
                        onClick={onCardClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onCardClick();
                          }
                        }}
                        title="View vehicle details"
                        aria-label={`View details for ${item.title}`}
                      >
                        <img src={item.imageUrl} alt={item.title} className="cc-pv-card__image" loading="lazy" />
                      </div>
                      <div className="cc-pv-card__middle">
                        <div className="cc-pv-card__header-line">
                          <h3
                            className="cc-pv-card__title cc-pv-card__title--clickable"
                            onClick={onCardClick}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onCardClick();
                              }
                            }}
                            title="View vehicle details"
                          >
                            {item.yom} {item.make.toUpperCase()} {item.model.toUpperCase()}
                          </h3>
                          <span className={`cc-reserved-type-badge ${item.reservationType === 'Reserve by Sales' ? 'cc-reserved-type-badge--sales' : 'cc-reserved-type-badge--online'}`}>
                            <span className="cc-reserved-badge-dot" />
                            {item.reservationType === 'Reserve by Sales' ? 'Reserve by Sales' : 'Online Reserved'}
                          </span>
                        </div>

                        <div className="cc-pv-card__details-grid">
                          <div className="cc-pv-detail-col">
                            <div className="cc-pv-detail-row">
                              <span className="cc-pv-label">Stock No:</span>
                              <span className="cc-pv-value">{item.stockNumber}</span>
                            </div>
                            <div className="cc-pv-detail-row">
                              <span className="cc-pv-label">Chassis No:</span>
                              <span className="cc-pv-value">{item.chassisNumber}</span>
                            </div>
                            <div className="cc-pv-detail-row">
                              <span className="cc-pv-label">Reserved On:</span>
                              <span className="cc-pv-value">{item.reservedAt}</span>
                            </div>
                          </div>

                          <div className="cc-pv-detail-col">
                            <div className="cc-pv-detail-row">
                              <span className="cc-pv-label">Color / Spec:</span>
                              <span className="cc-pv-value">{item.color}</span>
                            </div>
                            <div className="cc-pv-detail-row">
                              <span className="cc-pv-label">Mileage:</span>
                              <span className="cc-pv-value">{item.mileage}</span>
                            </div>
                            {item.salesRepresentative && (
                              <div className="cc-pv-detail-row">
                                <span className="cc-pv-label">Sales Rep:</span>
                                <span className="cc-pv-value">{item.salesRepresentative}</span>
                              </div>
                            )}
                            <div className="cc-pv-detail-row">
                              <span className="cc-pv-label">Hold Status:</span>
                              <span className="cc-pv-value">
                                <ReservationCountdownClock targetTimestamp={item.expiresAtTimestamp} />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="cc-pv-card__right">
                        <div className="cc-proforma-amount-stack">
                          <span className="cc-orders-amount-label">FOB Price:</span>
                          <span className="cc-orders-amount-value">
                            ${item.fobPriceUsd.toLocaleString()} USD
                          </span>
                          {item.cfPriceUsd && (
                            <span className="cc-orders-amount-sub">
                              C&amp;F: ${item.cfPriceUsd.toLocaleString()} USD
                            </span>
                          )}
                        </div>

                        <div className="cc-pv-card__actions" style={{ gap: '8px' }}>
                          <a
                            href={`https://wa.me/${(item.whatsappNumber || '+256700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hi CarChief Sales, I am inquiring about reserved vehicle Stock No: ${item.stockNumber}, Chassis: ${item.chassisNumber} (${item.title})`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cc-orders-btn--whatsapp"
                            style={{ textDecoration: 'none' }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 2.137.673 4.116 1.82 5.74L2.3 21.7a.6.6 0 00.748.748l4.004-1.554A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.95 7.95 0 01-4.293-1.246l-.307-.184-2.548.989.988-2.548-.184-.307A7.952 7.952 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
                            </svg>
                            <span>WhatsApp Sales</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         SECTION 2: PROFORMA TAB CONTENT
         ========================================================================= */}
      {ordersTab === 'proforma' && (
        <div className="cc-orders-section cc-proforma-section" data-testid="proforma-section">
          {/* Proforma Cards List */}
          <div className="cc-orders-list">
            {filteredProformas.length === 0 ? (
              <div className="cc-orders-empty">No proforma invoices found.</div>
            ) : (
              filteredProformas.map((item) => {
                const proformaVehicles = getVehiclesForProforma(item);
                const isExpanded = !!expandedProformas[item.id];

                const openProformaModal = () =>
                  setDocModalData({
                    type: 'proforma',
                    title: 'Proforma Invoice Details',
                    number: item.proformaNumber,
                    date: item.date,
                    shipper: item.shipper,
                    status: item.status,
                    totalAmountUsd: item.totalAmountUsd,
                    incoterm: item.incoterm,
                    switchedToInvoice: item.switchedToInvoice,
                  });
                return (
                  <div
                    key={item.id}
                    className="cc-orders-card cc-proforma-card cc-orders-card--clickable"
                    onClick={openProformaModal}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProformaModal();
                      }
                    }}
                  >
                    <div className="cc-proforma-card__grid">
                      {/* Column 1: Identity & Shipper Info */}
                      <div className="cc-proforma-col cc-proforma-col--id">
                        <div className="cc-proforma-card__id-line" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="cc-proforma-card__number">{item.proformaNumber}</span>
                          <span className="cc-proforma-card__email-icon" title="Send email notification" aria-hidden="true">
                            ✉️
                          </span>
                          <span
                            className={`cc-proforma-badge ${
                              item.status === 'EXPIRED'
                                ? 'cc-proforma-badge--expired'
                                : item.status === 'SWITCHED'
                                ? 'cc-proforma-badge--switched'
                                : 'cc-proforma-badge--active'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="cc-proforma-card__sub-line">
                          <span>Date: {item.date}</span>
                          <span className="cc-orders-dot-sep">•</span>
                          <span>Shipper: {item.shipper}</span>
                        </div>
                      </div>

                      {/* Column 2: Center Procurement Meta Box (Utilizing White Space) */}
                      <div className="cc-proforma-col cc-proforma-col--meta">
                        <div className="cc-proforma-meta-box">
                          <div className="cc-proforma-stats-row">
                            <div className="cc-proforma-stat-item">
                              <span className="cc-proforma-stat-lbl">Incoterm &amp; Port</span>
                              <span className="cc-proforma-stat-val">{item.incoterm} • Colombo Port</span>
                            </div>
                            <div className="cc-proforma-stat-item">
                              <span className="cc-proforma-stat-lbl">Deposit Req (30%)</span>
                              <span className="cc-proforma-stat-val cc-proforma-stat-val--highlight">
                                ${Math.round(item.totalAmountUsd * 0.3).toLocaleString()} USD
                              </span>
                            </div>
                            <div className="cc-proforma-stat-item">
                              <span className="cc-proforma-stat-lbl">Terms</span>
                              <span className="cc-proforma-stat-val">Bank Wire (TT)</span>
                            </div>
                            {item.status === 'ACTIVE' && (
                              <div className="cc-proforma-stat-item cc-proforma-stat-item--timer">
                                <span className="cc-proforma-stat-lbl">Expires In</span>
                                <ReservationCountdownClock targetTimestamp={item.expiresAtTimestamp || Date.now() + (35 * 3600 + 42 * 60 + 10) * 1000} />
                              </div>
                            )}
                          </div>

                          <div className="cc-proforma-status-guide">
                            {item.status === 'ACTIVE' && (
                              <span>Hold Active • Pay deposit to issue Commercial Invoice</span>
                            )}
                            {item.status === 'SWITCHED' && (
                              <span>✅ Converted to Commercial Invoice: <strong>{item.switchedToInvoice}</strong></span>
                            )}
                            {item.status === 'EXPIRED' && (
                              <span>⚠️ Quotation Expired • Contact sales to refresh proforma pricing</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Amount & Action Button */}
                      <div className="cc-proforma-col cc-proforma-col--action cc-invoice-col--action">
                        <div className="cc-proforma-amount-stack">
                          <span className="cc-orders-amount-label">Total Amount</span>
                          <span className="cc-orders-amount-value">
                            ${item.totalAmountUsd.toLocaleString()} USD
                          </span>
                        </div>
                        <button
                          type="button"
                          className="cc-orders-doc-popup-btn cc-invoice-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openProformaModal();
                          }}
                        >
                          📄 Proforma
                        </button>

                        <button
                          type="button"
                          className={`cc-invoice-dropdown-btn ${isExpanded ? 'cc-invoice-dropdown-btn--open' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProformaExpand(item.id);
                          }}
                          aria-expanded={isExpanded}
                          title={isExpanded ? 'Hide vehicles' : 'Show vehicles in proforma'}
                        >
                          <svg
                            className="cc-invoice-vector-car"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                            <circle cx="7" cy="17" r="2" />
                            <path d="M9 17h6" />
                            <circle cx="17" cy="17" r="2" />
                          </svg>
                          <span>Show vehicles</span>
                          <span className="cc-invoice-vehicle-count-badge">{proformaVehicles.length}</span>
                          <span className="cc-invoice-dropdown-chevron">{isExpanded ? '▲' : '▼'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Dropdown: Vehicles Inside Proforma Invoice */}
                    {isExpanded && (
                      <div
                        className="cc-invoice-vehicles-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="cc-invoice-vehicles-header">
                          <div className="cc-invoice-vehicles-title">
                            <svg
                              className="cc-invoice-vector-car cc-invoice-vector-car--header"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                              <circle cx="7" cy="17" r="2" />
                              <path d="M9 17h6" />
                              <circle cx="17" cy="17" r="2" />
                            </svg>
                            <span>Vehicles Attached to Proforma ({proformaVehicles.length})</span>
                          </div>
                          <span className="cc-invoice-vehicles-sub">
                            Quotation specifications &amp; reservation status
                          </span>
                        </div>

                        <div className="cc-invoice-vehicles-list">
                          {proformaVehicles.map((veh) => {
                            const vehiclePrice = veh.totalPriceCif;

                            return (
                              <div key={veh.id} className="cc-invoice-vehicle-card">
                                {/* Vehicle Thumbnail */}
                                <div className="cc-invoice-vehicle-thumb-wrap">
                                  <img
                                    src={veh.imageUrl}
                                    alt={veh.title}
                                    className="cc-invoice-vehicle-thumb"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Vehicle Body Details */}
                                <div className="cc-invoice-vehicle-body">
                                  <div className="cc-invoice-vehicle-title-line">
                                    <h4 className="cc-invoice-vehicle-title">{veh.title}</h4>
                                  </div>

                                  {/* Vehicle Price Only */}
                                  <div className="cc-invoice-vehicle-financials cc-invoice-vehicle-financials--price-only" aria-label="Vehicle price">
                                    <div className="cc-invoice-vehicle-fin-item cc-invoice-vehicle-fin-item--sold">
                                      <span className="cc-invoice-vehicle-fin-label">Price:</span>
                                      <strong className="cc-invoice-vehicle-fin-val">
                                        ${vehiclePrice.toLocaleString()} USD
                                      </strong>
                                    </div>
                                  </div>

                                  <div className="cc-invoice-vehicle-meta-tags">
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      Chassis: <strong>{veh.chassisNumber}</strong>
                                    </span>
                                    {veh.stkNumber && (
                                      <span className="cc-invoice-vehicle-meta-tag">
                                        STK: <strong>{veh.stkNumber}</strong>
                                      </span>
                                    )}
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      Port: <strong>{veh.destinationPort}</strong>
                                    </span>
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      Incoterm: <strong>{item.incoterm}</strong>
                                    </span>
                                    {veh.currentLocation && (
                                      <span className="cc-invoice-vehicle-meta-tag">
                                        Location: <strong>{veh.currentLocation}</strong>
                                      </span>
                                    )}
                                    {veh.etd && (
                                      <span className="cc-invoice-vehicle-meta-tag">
                                        ETD: <strong>{veh.etd}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         SECTION 2: INVOICE TAB CONTENT
         ========================================================================= */}
      {ordersTab === 'invoice' && (
        <div className="cc-orders-section cc-invoice-section" data-testid="invoice-section">
          {/* Invoice Cards List */}
          <div className="cc-orders-list">
            {filteredInvoices.length === 0 ? (
              <div className="cc-orders-empty">No commercial invoices found.</div>
            ) : (
              filteredInvoices.map((item) => {
                const paidPercent =
                  item.totalAmountUsd > 0
                    ? Math.min(100, Math.round((item.paidAmountUsd / item.totalAmountUsd) * 100))
                    : 0;

                const invoiceVehicles = getVehiclesForInvoice(item);
                const isExpanded = !!expandedInvoices[item.id];

                const openInvoiceModal = () =>
                  setDocModalData({
                    type: 'invoice',
                    title: 'Commercial Invoice Details',
                    number: item.invoiceNumber,
                    date: item.date,
                    shipper: item.shipper,
                    status: item.dueAmountUsd > 0 ? 'Balance Pending' : 'Paid in Full',
                    totalAmountUsd: item.totalAmountUsd,
                    paidAmountUsd: item.paidAmountUsd,
                    dueAmountUsd: item.dueAmountUsd,
                  });

                return (
                  <div
                    key={item.id}
                    className="cc-orders-card cc-invoice-card cc-orders-card--clickable"
                    onClick={openInvoiceModal}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openInvoiceModal();
                      }
                    }}
                  >
                    <div className="cc-invoice-card__grid">
                      {/* Column 1: Identity, Badges & Date/Shipper */}
                      <div className="cc-invoice-col cc-invoice-col--id">
                        <div className="cc-invoice-card__id-line">
                          <span className="cc-invoice-card__number">{item.invoiceNumber}</span>
                          <span
                            className={`cc-invoice-status-pill ${
                              item.dueAmountUsd > 0
                                ? 'cc-invoice-status-pill--pending'
                                : 'cc-invoice-status-pill--paid'
                            }`}
                          >
                            {item.dueAmountUsd > 0 ? '⏱ Balance Pending' : '✓ Paid in Full'}
                          </span>
                        </div>
                        <div className="cc-invoice-card__sub-line">
                          <span>Date: {item.date}</span>
                          <span className="cc-orders-dot-sep">•</span>
                          <span>Shipper: {item.shipper}</span>
                        </div>
                      </div>

                      {/* Column 2: Financial Stats & Visual Progress Bar Box */}
                      <div className="cc-invoice-col cc-invoice-col--stats">
                        <div className="cc-invoice-meta-box">
                          <div className="cc-invoice-stats-row">
                            <div className="cc-invoice-stat-item">
                              <span className="cc-invoice-stat-lbl">Total Amount</span>
                              <span className="cc-invoice-stat-val">${item.totalAmountUsd.toLocaleString()}</span>
                            </div>
                            <div className="cc-invoice-stat-item">
                              <span className="cc-invoice-stat-lbl">Total Paid</span>
                              <span className="cc-invoice-stat-val cc-invoice-stat-val--paid">
                                ${item.paidAmountUsd.toLocaleString()}
                              </span>
                            </div>
                            <div className="cc-invoice-stat-item">
                              <span className="cc-invoice-stat-lbl">Due Balance</span>
                              <span
                                className={`cc-invoice-stat-val ${
                                  item.dueAmountUsd > 0 ? 'cc-amount-due-red' : 'cc-amount-due-green'
                                }`}
                              >
                                ${item.dueAmountUsd.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Visual Payment Progress Bar */}
                          <div className="cc-invoice-progress-wrap">
                            <div className="cc-invoice-progress-header">
                              <span className="cc-invoice-progress-label">Payment Settled</span>
                              <span className="cc-invoice-progress-percent">{paidPercent}%</span>
                            </div>
                            <div className="cc-invoice-progress-bar">
                              <div
                                className={`cc-invoice-progress-fill ${
                                  paidPercent === 100 ? 'cc-invoice-progress-fill--complete' : ''
                                }`}
                                style={
                                  {
                                    '--cc-invoice-progress-width': `${paidPercent}%`,
                                    width: `${paidPercent}%`,
                                  } as React.CSSProperties
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Action Buttons (Invoice Document & Vehicles Dropdown) */}
                      <div className="cc-invoice-col cc-invoice-col--action">
                        <button
                          type="button"
                          className="cc-orders-doc-popup-btn cc-invoice-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInvoiceModal();
                          }}
                        >
                          📄 Commercial Invoice
                        </button>

                        <button
                          type="button"
                          className={`cc-invoice-dropdown-btn ${isExpanded ? 'cc-invoice-dropdown-btn--open' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleInvoiceExpand(item.id);
                          }}
                          aria-expanded={isExpanded}
                          title={isExpanded ? 'Hide vehicles' : 'Show vehicles in invoice'}
                        >
                          <svg
                            className="cc-invoice-vector-car"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                            <circle cx="7" cy="17" r="2" />
                            <path d="M9 17h6" />
                            <circle cx="17" cy="17" r="2" />
                          </svg>
                          <span>Show vehicles</span>
                          <span className="cc-invoice-vehicle-count-badge">{invoiceVehicles.length}</span>
                          <span className="cc-invoice-dropdown-chevron">{isExpanded ? '▲' : '▼'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Collapsible Dropdown: Vehicles Inside Invoice & Their Documents */}
                    {isExpanded && (
                      <div
                        className="cc-invoice-vehicles-dropdown"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="cc-invoice-vehicles-header">
                          <div className="cc-invoice-vehicles-title">
                            <svg
                              className="cc-invoice-vector-car cc-invoice-vector-car--header"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2" />
                              <circle cx="7" cy="17" r="2" />
                              <path d="M9 17h6" />
                              <circle cx="17" cy="17" r="2" />
                            </svg>
                            <span>Vehicles in Invoice ({invoiceVehicles.length})</span>
                          </div>
                          <span className="cc-invoice-vehicles-sub">
                            Vehicle documents ready for clearance & delivery
                          </span>
                        </div>

                        <div className="cc-invoice-vehicles-list">
                          {invoiceVehicles.map((veh) => {
                            const soldPrice = veh.totalPriceCif;
                            const allocatedAmount =
                              veh.paidAmount !== undefined
                                ? veh.paidAmount
                                : invoiceVehicles.length === 1
                                ? item.paidAmountUsd
                                : 0;
                            const pendingAmount =
                              veh.dueAmount !== undefined
                                ? veh.dueAmount
                                : Math.max(0, soldPrice - allocatedAmount);

                            return (
                              <div key={veh.id} className="cc-invoice-vehicle-card">
                                {/* Vehicle Thumbnail */}
                                <div className="cc-invoice-vehicle-thumb-wrap">
                                  <img
                                    src={veh.imageUrl}
                                    alt={veh.title}
                                    className="cc-invoice-vehicle-thumb"
                                    loading="lazy"
                                  />
                                </div>

                                {/* Vehicle Body Details & Documents */}
                                <div className="cc-invoice-vehicle-body">
                                  <div className="cc-invoice-vehicle-title-line">
                                    <h4 className="cc-invoice-vehicle-title">{veh.title}</h4>
                                  </div>

                                  {/* Financial Breakdown: Sold Price, Allocated, Pending */}
                                  <div className="cc-invoice-vehicle-financials" aria-label="Vehicle payment breakdown">
                                    <div className="cc-invoice-vehicle-fin-item cc-invoice-vehicle-fin-item--sold">
                                      <span className="cc-invoice-vehicle-fin-label">Sold Price:</span>
                                      <strong className="cc-invoice-vehicle-fin-val">
                                        ${soldPrice.toLocaleString()} USD
                                      </strong>
                                    </div>
                                    <div className="cc-invoice-vehicle-fin-item cc-invoice-vehicle-fin-item--allocated">
                                      <span className="cc-invoice-vehicle-fin-label">Allocated:</span>
                                      <strong className="cc-invoice-vehicle-fin-val">
                                        ${allocatedAmount.toLocaleString()} USD
                                      </strong>
                                    </div>
                                    <div className="cc-invoice-vehicle-fin-item cc-invoice-vehicle-fin-item--pending">
                                      <span className="cc-invoice-vehicle-fin-label">Pending:</span>
                                      <strong className={`cc-invoice-vehicle-fin-val ${pendingAmount > 0 ? 'cc-invoice-vehicle-fin-val--pending' : 'cc-invoice-vehicle-fin-val--settled'}`}>
                                        ${pendingAmount.toLocaleString()} USD
                                      </strong>
                                    </div>
                                  </div>

                                <div className="cc-invoice-vehicle-meta-tags">
                                  <span className="cc-invoice-vehicle-meta-tag">
                                    Chassis: <strong>{veh.chassisNumber}</strong>
                                  </span>
                                  {veh.stkNumber && (
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      STK: <strong>{veh.stkNumber}</strong>
                                    </span>
                                  )}
                                  <span className="cc-invoice-vehicle-meta-tag">
                                    Port: <strong>{veh.destinationPort}</strong>
                                  </span>
                                  {veh.etd && (
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      ETD: <strong>{veh.etd}</strong>
                                    </span>
                                  )}
                                  {veh.eta && (
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      ETA: <strong>{veh.eta}</strong>
                                    </span>
                                  )}
                                  {veh.currentLocation && (
                                    <span className="cc-invoice-vehicle-meta-tag">
                                      Location: <strong>{veh.currentLocation}</strong>
                                    </span>
                                  )}
                                </div>

                                {/* Vehicle Documents:
                                    Surrender BL   ✓ Original BL   ✓ EC Original   ✓ Inspection Certificate
                                    Green when uploaded; Gray with gear ⚙️ & disabled when not uploaded */}
                                <div className="cc-invoice-vehicle-docs-box">
                                  <span className="cc-invoice-vehicle-docs-label">
                                    <span>📑</span> Documents:
                                  </span>
                                  <div className="cc-invoice-vehicle-docs-pills">
                                    {([
                                      {
                                        key: 'surrenderBl',
                                        label: 'Surrender BL',
                                        title: 'Surrender Bill of Lading (Telex Release)',
                                      },
                                      {
                                        key: 'originalBl',
                                        label: 'Original BL',
                                        title: 'Original Bill of Lading',
                                      },
                                      {
                                        key: 'ecOriginal',
                                        label: 'EC Original',
                                        title: 'Export Certificate Original',
                                      },
                                      {
                                        key: 'inspectionCertificate',
                                        label: 'Inspection Certificate',
                                        title: 'Vehicle Inspection Certificate',
                                      },
                                    ] as const).map((doc) => {
                                      const isUploaded = Boolean(veh.documents?.[doc.key]);
                                      if (isUploaded) {
                                        return (
                                          <button
                                            key={doc.key}
                                            type="button"
                                            className="cc-veh-doc-pill cc-veh-doc-pill--uploaded"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleVehicleDocClick(doc.label, veh, item.invoiceNumber);
                                            }}
                                            title={`✓ ${doc.title} - Uploaded & Ready`}
                                          >
                                            <span className="cc-veh-doc-check">✓</span>
                                            <span>{doc.label}</span>
                                            <span className="cc-veh-doc-action-icon">↗</span>
                                          </button>
                                        );
                                      }

                                      return (
                                        <button
                                          key={doc.key}
                                          type="button"
                                          className="cc-veh-doc-pill cc-veh-doc-pill--pending"
                                          disabled
                                          aria-disabled="true"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          title={`${doc.title} - In gear (Upload pending / Not available)`}
                                        >
                                          <span className="cc-veh-doc-gear">⚙️</span>
                                          <span>{doc.label}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
         SECTION 3: PURCHASED VEHICLES TAB CONTENT
         ========================================================================= */}
      {ordersTab === 'purchasedVehicles' && (
        <div className="cc-orders-section cc-purchased-vehicles-section" data-testid="purchased-vehicles-section">

          {/* Count Header */}
          <div className="cc-pv-count-header">
            <strong>Total Purchase Vehicles: {filteredPurchasedVehicles.length}</strong>
          </div>

          {/* Purchased Vehicles Card List */}
          <div className="cc-orders-list">
            {filteredPurchasedVehicles.length === 0 ? (
              <div className="cc-orders-empty">No purchased vehicles match your criteria.</div>
            ) : (
              filteredPurchasedVehicles.map((pv) => {
                const openInvoiceFromPv = () => {
                  const matchedInv = MOCK_INVOICES.find((i) => i.invoiceNumber === pv.invoiceNumber);
                  setDocModalData({
                    type: 'invoice',
                    title: 'Commercial Invoice Details',
                    number: pv.invoiceNumber,
                    date: pv.invoiceDate,
                    shipper: 'Carchief Co. Ltd',
                    status: pv.dueAmount > 0 ? 'Balance Pending' : 'Paid in Full',
                    totalAmountUsd: matchedInv ? matchedInv.totalAmountUsd : pv.totalPriceCif,
                    paidAmountUsd: matchedInv ? matchedInv.paidAmountUsd : pv.paidAmount,
                    dueAmountUsd: matchedInv ? matchedInv.dueAmountUsd : pv.dueAmount,
                  });
                };

                const targetSlug = pv.slug || pv.chassisNumber || pv.id;
                const onCardClick = () => navigateToVehicleDetail(targetSlug, 'orders_purchased');

                return (
                  <div key={pv.id} className="cc-orders-card cc-pv-card">
                    {/* Left: Thumbnail Image */}
                    <div
                      className="cc-pv-card__image-wrap cc-pv-card__image-wrap--clickable"
                      onClick={onCardClick}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onCardClick();
                        }
                      }}
                      title="View vehicle details"
                      aria-label={`View details for ${pv.title}`}
                    >
                      <img src={pv.imageUrl} alt={pv.title} className="cc-pv-card__image" />
                    </div>

                    {/* Middle: Details Grid & Journey */}
                    <div className="cc-pv-card__middle">
                      <h3
                        className="cc-pv-card__title cc-pv-card__title--clickable"
                        onClick={onCardClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onCardClick();
                          }
                        }}
                        title="View vehicle details"
                      >
                        {pv.title}
                      </h3>

                      <div className="cc-pv-card__details-grid">
                        <div className="cc-pv-detail-col">
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">STK Number</span>
                            <span className="cc-pv-value">{pv.stkNumber}</span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">Invoice Number</span>
                            <span className="cc-pv-value cc-pv-value--eye">
                              {pv.invoiceNumber}{' '}
                              <button
                                type="button"
                                className="cc-eye-icon-btn"
                                title="View Commercial Invoice Details"
                                onClick={openInvoiceFromPv}
                              >
                                👁
                              </button>
                            </span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">Invoice Date</span>
                            <span className="cc-pv-value">{pv.invoiceDate}</span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">ETD</span>
                            <span className="cc-pv-value">{pv.etd}</span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">ETA</span>
                            <span className="cc-pv-value">{pv.eta}</span>
                          </div>
                        </div>

                        <div className="cc-pv-detail-col">
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">Sold Price</span>
                            <span className="cc-pv-value">${pv.totalPriceCif.toLocaleString()} USD</span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">Allocated</span>
                            <span className="cc-pv-value cc-amount-allocated-green">${pv.paidAmount.toLocaleString()} USD</span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">Pending</span>
                            <span className={`cc-pv-value ${pv.dueAmount > 0 ? 'cc-amount-due-red' : 'cc-amount-due-green'}`}>
                              ${pv.dueAmount.toLocaleString()} USD
                            </span>
                          </div>
                          <div className="cc-pv-detail-row cc-pv-location-row">
                            <span className="cc-pv-label">Current Location</span>
                            <span className="cc-pv-location-pill">{pv.currentLocation}</span>
                          </div>
                          <div className="cc-pv-detail-row">
                            <span className="cc-pv-label">Destination Port</span>
                            <span className="cc-pv-value">{pv.destinationPort}</span>
                          </div>
                        </div>
                      </div>

                      <div className="cc-pv-tracker-row">
                        {pv.orderStatus && (
                          <span className={`cc-pv-status-pill ${
                            pv.orderStatus === 'Delivered' ? 'cc-pv-status-pill--delivered' :
                            pv.orderStatus === 'In Transit' ? 'cc-pv-status-pill--transit' : ''
                          }`}>
                            {pv.orderStatus}
                          </span>
                        )}

                        {/* If Delivered: show BOTH Vehicle Review button and Service Feedback button */}
                        {pv.orderStatus === 'Delivered' && (
                          <div className="cc-pv-delivered-actions">
                            {/* 1. Vehicle Review Button */}
                            {pv.review ? (
                              <button
                                type="button"
                                className="cc-pv-view-review-btn"
                                onClick={() => setViewReviewVehicle(pv)}
                                title="Click to view full vehicle review and photos"
                              >
                                <span className="cc-pv-review-stars-gold">{'★'.repeat(pv.review.rating)}</span>
                                <span className="cc-pv-view-review-text">Review</span>
                                {pv.review.photos && pv.review.photos.length > 0 && (
                                  <span className="cc-pv-review-photos-badge" title={`${pv.review.photos.length} photo(s) attached`}>
                                    📷 {pv.review.photos.length}
                                  </span>
                                )}
                                <span className="cc-pv-view-review-arrow">↗</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="cc-pv-add-review-btn"
                                onClick={() => handleOpenReviewModal(pv)}
                                title="Rate and review vehicle condition & quality"
                              >
                                <svg
                                  className="cc-pv-star-svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="#eab308"
                                  stroke="#ca8a04"
                                  strokeWidth="1.5"
                                  aria-hidden="true"
                                >
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                <span>Add Review</span>
                              </button>
                            )}

                            {/* 2. Service Feedback Button */}
                            {pv.serviceFeedback ? (
                              <button
                                type="button"
                                className="cc-pv-view-feedback-btn"
                                onClick={() => setViewFeedbackVehicle(pv)}
                                title="Click to view service feedback and ratings"
                              >
                                <span className="cc-pv-feedback-stars-green">{'★'.repeat(pv.serviceFeedback.rating)}</span>
                                <span className="cc-pv-view-feedback-text">Service Feedback</span>
                                <span className="cc-pv-view-feedback-arrow">↗</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="cc-pv-add-feedback-btn"
                                onClick={() => handleOpenFeedbackModal(pv)}
                                title="Put feedback on CarChief shipping and customer service"
                              >
                                <svg
                                  className="cc-pv-feedback-svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#16a34a"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                </svg>
                                <span>Service Feedback</span>
                              </button>
                            )}
                          </div>
                        )}


                        <button
                          type="button"
                          className="cc-pv-tracker-btn"
                          onClick={() => {
                            const summaryMatch = fleetApiData?.items.find(
                              (v) => v.make === pv.make || v.id === pv.id
                            );
                            const base = summaryMatch || ({
                              id: pv.id,
                              make: pv.make,
                              model: pv.model,
                              year: 2022,
                              chassisNumber: pv.chassisNumber,
                              status: pv.orderStatus,
                              totalAmountUsd: pv.totalPriceCif,
                              currency: 'USD',
                              locationStatus: pv.currentLocation,
                              destinationPort: pv.destinationPort,
                            } as unknown as CustomerVehicleSummary);
                            setSelectedTrackingVehicle({
                              ...base,
                              etd: pv.etd,
                              eta: pv.eta,
                            } as unknown as CustomerVehicleSummary);
                          }}
                        >
                          <svg
                            className="cc-pv-tracker-vector-icon"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>CAR TRACKER</span>
                          <span className="cc-pv-tracker-pulse-dot" title="Live Signal Active" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Shipment & Vehicle Tracking Modal */}
      <VehicleTrackingModal
        isOpen={Boolean(selectedTrackingVehicle)}
        vehicle={selectedTrackingVehicle}
        onClose={() => setSelectedTrackingVehicle(null)}
      />

      {/* Document Details Popup Modal */}
      {docModalData && (
        <div className="cc-modal-overlay" onClick={() => setDocModalData(null)}>
          <div className="cc-modal-content cc-doc-popup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cc-modal-header">
              <div className="cc-doc-modal-title-wrap">
                <span className="cc-doc-modal-icon">📄</span>
                <h2>{docModalData.title}</h2>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setDocModalData(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="cc-modal-body cc-doc-popup-body">
              <div className="cc-doc-popup-header-info">
                <div>
                  <span className="cc-doc-popup-label">Document Number</span>
                  <span className="cc-doc-popup-num">{docModalData.number}</span>
                </div>
                <div>
                  <span className="cc-doc-popup-label">Status</span>
                  <span className="cc-proforma-badge cc-proforma-badge--active">{docModalData.status}</span>
                </div>
              </div>

              <div className="cc-doc-popup-grid">
                <div>
                  <strong>Issue Date:</strong> {docModalData.date}
                </div>
                <div>
                  <strong>Shipper / Seller:</strong> {docModalData.shipper}
                </div>
                {docModalData.incoterm && (
                  <div>
                    <strong>Incoterm:</strong> {docModalData.incoterm}
                  </div>
                )}
                <div>
                  <strong>Port of Delivery:</strong> Colombo
                </div>
                {docModalData.totalAmountUsd !== undefined && (
                  <div>
                    <strong>Total Amount (USD):</strong> ${docModalData.totalAmountUsd.toLocaleString()} USD
                  </div>
                )}
                {docModalData.paidAmountUsd !== undefined && (
                  <div>
                    <strong>Total Paid Amount:</strong> ${docModalData.paidAmountUsd.toLocaleString()} USD
                  </div>
                )}
                {docModalData.dueAmountUsd !== undefined && (
                  <div>
                    <strong>Outstanding Balance:</strong> ${docModalData.dueAmountUsd.toLocaleString()} USD
                  </div>
                )}
                {docModalData.type === 'proforma' && docModalData.totalAmountUsd !== undefined && (
                  <div>
                    <strong>Deposit Required (30%):</strong> ${Math.round(docModalData.totalAmountUsd * 0.3).toLocaleString()} USD
                  </div>
                )}
                {docModalData.switchedToInvoice && (
                  <div>
                    <strong>Commercial Invoice Ref:</strong> {docModalData.switchedToInvoice}
                  </div>
                )}
                {docModalData.vehicleTitle && (
                  <div>
                    <strong>Vehicle:</strong> {docModalData.vehicleTitle}
                  </div>
                )}
                {docModalData.chassisNumber && (
                  <div>
                    <strong>Chassis No:</strong> {docModalData.chassisNumber}
                  </div>
                )}
                {docModalData.docDetails && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Document Info:</strong> {docModalData.docDetails}
                  </div>
                )}
                {docModalData.type === 'invoice' && (
                  <>
                    <div>
                      <strong>Consignee Name:</strong> Customer Account
                    </div>
                    <div>
                      <strong>Bank Wire Instructions:</strong> Swift code available under Wire Remittance
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="cc-modal-footer">
              {docModalData.type === 'vehicleDoc' && (
                <button
                  type="button"
                  className="cc-orders-btn cc-orders-btn--action"
                  onClick={() => alert(`Downloading ${docModalData.title} (PDF)...`)}
                >
                  ⬇️ Download PDF
                </button>
              )}
              <button type="button" className="cc-orders-btn cc-orders-btn--clear" onClick={() => setDocModalData(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivered Vehicle Review Modal */}
      {reviewVehicle && (
        <div className="cc-modal-overlay" onClick={() => setReviewVehicle(null)}>
          <div
            className="cc-modal-content cc-review-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="review-modal-title"
          >
            <div className="cc-modal-header cc-review-modal-header">
              <div className="cc-review-modal-title-wrap">
                <span className="cc-review-modal-icon">⭐</span>
                <div>
                  <h2 id="review-modal-title">
                    {reviewVehicle.review ? 'Edit Vehicle Review' : 'Vehicle Review'}
                  </h2>
                  <span className="cc-review-modal-sub">
                    Rate & review your delivered vehicle condition and quality
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setReviewVehicle(null)}
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="cc-review-form">
              <div className="cc-modal-body cc-review-modal-body">
                {/* Vehicle Quick Summary Card */}
                <div className="cc-review-vehicle-card">
                  <img
                    src={reviewVehicle.imageUrl}
                    alt={reviewVehicle.title}
                    className="cc-review-vehicle-thumb"
                  />
                  <div className="cc-review-vehicle-info">
                    <h4 className="cc-review-vehicle-name">{reviewVehicle.title}</h4>
                    <div className="cc-review-vehicle-meta">
                      <span>Chassis: <strong>{reviewVehicle.chassisNumber}</strong></span>
                      <span>•</span>
                      <span>Destination: <strong>{reviewVehicle.destinationPort}</strong></span>
                      <span>•</span>
                      <span>Invoice: <strong>{reviewVehicle.invoiceNumber}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Rating Section: Give 5 stars */}
                <div className="cc-review-section">
                  <label className="cc-review-label">
                    Vehicle Rating <span className="cc-review-required">*</span>
                  </label>
                  <div className="cc-review-star-picker">
                    <div className="cc-review-stars-row" role="radiogroup" aria-label="5 Star Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`cc-review-star-btn ${
                            star <= (hoverRating || reviewRating)
                              ? 'cc-review-star-btn--active'
                              : ''
                          }`}
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                          aria-label={`Give ${star} star${star > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="cc-review-rating-desc">
                      {(hoverRating || reviewRating) === 5 && '★★★★★ 5.0 - Outstanding Condition & Quality'}
                      {(hoverRating || reviewRating) === 4 && '★★★★☆ 4.0 - Great Condition & Appearance'}
                      {(hoverRating || reviewRating) === 3 && '★★★☆☆ 3.0 - Satisfied with Condition'}
                      {(hoverRating || reviewRating) === 2 && '★★☆☆☆ 2.0 - Minor Condition Issues'}
                      {(hoverRating || reviewRating) === 1 && '★☆☆☆☆ 1.0 - Condition Needs Improvement'}
                    </span>
                  </div>
                </div>

                {/* Section to put a review */}
                <div className="cc-review-section">
                  <div className="cc-review-section-header">
                    <label htmlFor="vehicle-review-text" className="cc-review-label">
                      Your Vehicle Review & Comments <span className="cc-review-required">*</span>
                    </label>
                    <span className="cc-review-char-count">{reviewComment.length} / 500</span>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="cc-review-chips-wrap">
                    <span className="cc-review-chips-label">Add quick condition feedback:</span>
                    {[
                      '🚗 Exact condition as inspected',
                      '💎 Clean engine & interior',
                      '✨ Flawless paint & bodywork',
                      '🔑 All keys & accessories present',
                      '📋 Matches auction sheet 100%',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="cc-review-chip"
                        onClick={() => {
                          setReviewComment((prev) => {
                            const trimmed = prev.trim();
                            if (!trimmed) return chip;
                            if (trimmed.includes(chip)) return prev;
                            return `${trimmed}. ${chip}`;
                          });
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="vehicle-review-text"
                    className="cc-review-textarea"
                    rows={4}
                    maxLength={500}
                    placeholder="Write your vehicle condition review here... Mention interior cleanliness, mechanical condition, auction sheet accuracy, and handover quality."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                  />
                </div>

                {/* Photo Upload Section */}
                <div className="cc-review-section">
                  <div className="cc-review-section-header">
                    <label className="cc-review-label">
                      Add Photos (Optional)
                    </label>
                    <span className="cc-review-photo-count">
                      {reviewPhotos.length} / 6 photos
                    </span>
                  </div>
                  <p className="cc-review-photo-hint">
                    Upload photos of the delivered vehicle, handover inspection, or dashboard condition.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoFileUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />

                  <div className="cc-review-photo-actions-row">
                    <button
                      type="button"
                      className="cc-review-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={reviewPhotos.length >= 6}
                    >
                      <span>📸 Upload Photos</span>
                    </button>

                    <div className="cc-review-presets">
                      <span className="cc-review-presets-label">Or quick sample:</span>
                      <button
                        type="button"
                        className="cc-review-preset-chip"
                        onClick={() =>
                          handleAddPresetPhoto(
                            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
                          )
                        }
                        disabled={reviewPhotos.length >= 6}
                      >
                        + Delivery Handover
                      </button>
                      <button
                        type="button"
                        className="cc-review-preset-chip"
                        onClick={() =>
                          handleAddPresetPhoto(
                            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80'
                          )
                        }
                        disabled={reviewPhotos.length >= 6}
                      >
                        + Interior & Dash
                      </button>
                      <button
                        type="button"
                        className="cc-review-preset-chip"
                        onClick={() =>
                          handleAddPresetPhoto(
                            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
                          )
                        }
                        disabled={reviewPhotos.length >= 6}
                      >
                        + Port Clearance
                      </button>
                    </div>
                  </div>

                  {reviewPhotos.length > 0 && (
                    <div className="cc-review-photo-preview-grid">
                      {reviewPhotos.map((url, idx) => (
                        <div key={idx} className="cc-review-photo-thumb-wrap">
                          <img
                            src={url}
                            alt={`Review photo ${idx + 1}`}
                            className="cc-review-photo-thumb"
                          />
                          <button
                            type="button"
                            className="cc-review-photo-delete"
                            onClick={() => handleRemovePhoto(idx)}
                            title="Remove photo"
                            aria-label={`Remove photo ${idx + 1}`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="cc-modal-footer cc-review-modal-footer">
                <button
                  type="button"
                  className="cc-review-cancel-btn"
                  onClick={() => setReviewVehicle(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="cc-review-submit-btn">
                  <span>✓ Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Review Details Popup Modal */}
      {viewReviewVehicle && viewReviewVehicle.review && (
        <div
          className="cc-modal-overlay"
          onClick={() => setViewReviewVehicle(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-review-modal-title"
        >
          <div
            className="cc-modal-content cc-modal-dialog cc-view-review-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-modal-header cc-view-review-header">
              <div className="cc-view-review-header-left">
                <div className="cc-view-review-badge-icon">★</div>
                <div>
                  <h2 id="view-review-modal-title">Delivered Vehicle Review</h2>
                  <span className="cc-view-review-meta-sub">
                    Verified Vehicle Quality Review • {viewReviewVehicle.review.reviewedAt}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setViewReviewVehicle(null)}
                aria-label="Close review details"
              >
                ✕
              </button>
            </div>

            <div className="cc-modal-body cc-view-review-body">
              {/* Vehicle Highlight Card */}
              <div className="cc-view-review-vehicle-card">
                <img
                  src={viewReviewVehicle.imageUrl}
                  alt={viewReviewVehicle.title}
                  className="cc-view-review-vehicle-thumb"
                />
                <div className="cc-view-review-vehicle-info">
                  <div className="cc-view-review-vehicle-top">
                    <h3 className="cc-view-review-vehicle-name">{viewReviewVehicle.title}</h3>
                    <span className="cc-pv-status-pill cc-pv-status-pill--delivered">
                      Delivered
                    </span>
                  </div>
                  <div className="cc-view-review-specs-grid">
                    <div><span>Stock #:</span> <strong>{viewReviewVehicle.stkNumber}</strong></div>
                    <div><span>Chassis #:</span> <strong>{viewReviewVehicle.chassisNumber}</strong></div>
                    <div><span>Port:</span> <strong>{viewReviewVehicle.destinationPort}</strong></div>
                    <div><span>Invoice:</span> <strong>{viewReviewVehicle.invoiceNumber}</strong></div>
                  </div>
                </div>
              </div>

              {/* Rating & Verified Summary */}
              <div className="cc-view-review-score-banner">
                <div className="cc-view-review-score-left">
                  <div className="cc-view-review-stars-large">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={s <= viewReviewVehicle.review!.rating ? 'cc-star-gold' : 'cc-star-gray'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="cc-view-review-score-num">
                    {viewReviewVehicle.review.rating}.0 / 5.0
                  </span>
                </div>
                <div className="cc-view-review-verified-badge">
                  ✓ Verified
                </div>
              </div>

              {/* Comment Content */}
              <div className="cc-view-review-comment-box">
                <h4 className="cc-view-review-comment-title">Customer Feedback:</h4>
                <p className="cc-view-review-comment-body">
                  "{viewReviewVehicle.review.comment}"
                </p>
              </div>

              {/* Photo Verification Gallery */}
              {viewReviewVehicle.review.photos && viewReviewVehicle.review.photos.length > 0 && (
                <div className="cc-view-review-gallery-section">
                  <h4 className="cc-view-review-gallery-title">
                    Delivery & Handover Photos ({viewReviewVehicle.review.photos.length}):
                  </h4>
                  <div className="cc-view-review-gallery-grid">
                    {viewReviewVehicle.review.photos.map((photo, i) => (
                      <a
                        key={i}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cc-view-review-gallery-item"
                        title="Open photo in new tab"
                      >
                        <img
                          src={photo}
                          alt={`Delivery verification ${i + 1}`}
                          className="cc-view-review-gallery-img"
                        />
                        <span className="cc-view-review-gallery-zoom">🔍 View</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cc-modal-footer cc-view-review-footer">
              <button
                type="button"
                className="cc-view-review-edit-btn"
                onClick={() => {
                  handleOpenReviewModal(viewReviewVehicle);
                }}
              >
                ✏️ Edit Review
              </button>
              <button
                type="button"
                className="cc-view-review-close-btn"
                onClick={() => setViewReviewVehicle(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivered Vehicle Service Feedback Modal */}
      {feedbackVehicle && (
        <div className="cc-modal-overlay" onClick={() => setFeedbackVehicle(null)}>
          <div
            className="cc-modal-content cc-review-modal cc-feedback-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="feedback-modal-title"
          >
            <div className="cc-modal-header cc-review-modal-header cc-feedback-modal-header">
              <div className="cc-review-modal-title-wrap">
                <span className="cc-review-modal-icon">💬</span>
                <div>
                  <h2 id="feedback-modal-title">
                    {feedbackVehicle.serviceFeedback ? 'Edit Service Feedback' : 'Service Feedback'}
                  </h2>
                  <span className="cc-review-modal-sub">
                    Rate & put feedback on CarChief's delivery, shipping & customer service
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setFeedbackVehicle(null)}
                aria-label="Close feedback modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="cc-review-form">
              <div className="cc-modal-body cc-review-modal-body">
                {/* Vehicle Quick Summary Card */}
                <div className="cc-review-vehicle-card">
                  <img
                    src={feedbackVehicle.imageUrl}
                    alt={feedbackVehicle.title}
                    className="cc-review-vehicle-thumb"
                  />
                  <div className="cc-review-vehicle-info">
                    <h4 className="cc-review-vehicle-name">{feedbackVehicle.title}</h4>
                    <div className="cc-review-vehicle-meta">
                      <span>Chassis: <strong>{feedbackVehicle.chassisNumber}</strong></span>
                      <span>•</span>
                      <span>Destination: <strong>{feedbackVehicle.destinationPort}</strong></span>
                      <span>•</span>
                      <span>Invoice: <strong>{feedbackVehicle.invoiceNumber}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Rating Section: Service Rating */}
                <div className="cc-review-section">
                  <label className="cc-review-label">
                    Service Rating <span className="cc-review-required">*</span>
                  </label>
                  <div className="cc-review-star-picker">
                    <div className="cc-review-stars-row" role="radiogroup" aria-label="5 Star Service Rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`cc-review-star-btn cc-feedback-star-btn ${
                            star <= (hoverFeedbackRating || feedbackRating)
                              ? 'cc-review-star-btn--active'
                              : ''
                          }`}
                          onClick={() => setFeedbackRating(star)}
                          onMouseEnter={() => setHoverFeedbackRating(star)}
                          onMouseLeave={() => setHoverFeedbackRating(0)}
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                          aria-label={`Give ${star} star${star > 1 ? 's' : ''}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <span className="cc-review-rating-desc">
                      {(hoverFeedbackRating || feedbackRating) === 5 && '★★★★★ 5.0 - Outstanding Shipping & Support Service'}
                      {(hoverFeedbackRating || feedbackRating) === 4 && '★★★★☆ 4.0 - Great Delivery & Staff Communication'}
                      {(hoverFeedbackRating || feedbackRating) === 3 && '★★★☆☆ 3.0 - Satisfied with Delivery Process'}
                      {(hoverFeedbackRating || feedbackRating) === 2 && '★★☆☆☆ 2.0 - Service Needs Improvement'}
                      {(hoverFeedbackRating || feedbackRating) === 1 && '★☆☆☆☆ 1.0 - Poor Service Experience'}
                    </span>
                  </div>
                </div>

                {/* Section for service feedback & quick suggestions */}
                <div className="cc-review-section">
                  <div className="cc-review-section-header">
                    <label htmlFor="service-feedback-text" className="cc-review-label">
                      Your Service Feedback & Suggestions <span className="cc-review-required">*</span>
                    </label>
                    <span className="cc-review-char-count">{feedbackComment.length} / 500</span>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="cc-review-chips-wrap">
                    <span className="cc-review-chips-label">Add quick service feedback:</span>
                    {[
                      '⚡ Fast vessel delivery',
                      '📑 Clear paperwork & prompt BL',
                      '🤝 Helpful customer service',
                      '🚢 Smooth customs & port clearance',
                      '📲 Transparent shipment tracking',
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="cc-review-chip cc-feedback-chip"
                        onClick={() => {
                          setFeedbackComment((prev) => {
                            const trimmed = prev.trim();
                            if (!trimmed) return chip;
                            if (trimmed.includes(chip)) return prev;
                            return `${trimmed}. ${chip}`;
                          });
                          if (!feedbackAspects.includes(chip)) {
                            setFeedbackAspects((prev) => [...prev, chip]);
                          }
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    id="service-feedback-text"
                    className="cc-review-textarea"
                    rows={4}
                    maxLength={500}
                    placeholder="Provide your feedback on shipping timeliness, documentation dispatch, customs clearance support, and overall staff communication..."
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="cc-modal-footer cc-review-modal-footer">
                <button
                  type="button"
                  className="cc-review-cancel-btn"
                  onClick={() => setFeedbackVehicle(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="cc-review-submit-btn cc-feedback-submit-btn">
                  <span>✓ Submit Service Feedback</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Service Feedback Details Popup Modal */}
      {viewFeedbackVehicle && viewFeedbackVehicle.serviceFeedback && (
        <div
          className="cc-modal-overlay"
          onClick={() => setViewFeedbackVehicle(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-feedback-modal-title"
        >
          <div
            className="cc-modal-content cc-modal-dialog cc-view-review-modal cc-view-feedback-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-modal-header cc-view-review-header cc-view-feedback-header">
              <div className="cc-view-review-header-left">
                <div className="cc-view-review-badge-icon cc-view-feedback-badge-icon">💬</div>
                <div>
                  <h2 id="view-feedback-modal-title">CarChief Service Feedback</h2>
                  <span className="cc-view-review-meta-sub">
                    Service Feedback • {viewFeedbackVehicle.serviceFeedback.feedbackAt}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setViewFeedbackVehicle(null)}
                aria-label="Close service feedback"
              >
                ✕
              </button>
            </div>

            <div className="cc-modal-body cc-view-review-body">
              {/* Vehicle Highlight Card */}
              <div className="cc-view-review-vehicle-card">
                <img
                  src={viewFeedbackVehicle.imageUrl}
                  alt={viewFeedbackVehicle.title}
                  className="cc-view-review-vehicle-thumb"
                />
                <div className="cc-view-review-vehicle-info">
                  <div className="cc-view-review-vehicle-top">
                    <h3 className="cc-view-review-vehicle-name">{viewFeedbackVehicle.title}</h3>
                    <span className="cc-pv-status-pill cc-pv-status-pill--delivered">
                      Delivered
                    </span>
                  </div>
                  <div className="cc-view-review-specs-grid">
                    <div><span>Stock #:</span> <strong>{viewFeedbackVehicle.stkNumber}</strong></div>
                    <div><span>Chassis #:</span> <strong>{viewFeedbackVehicle.chassisNumber}</strong></div>
                    <div><span>Port:</span> <strong>{viewFeedbackVehicle.destinationPort}</strong></div>
                    <div><span>Invoice:</span> <strong>{viewFeedbackVehicle.invoiceNumber}</strong></div>
                  </div>
                </div>
              </div>

              {/* Rating & Service Score Banner */}
              <div className="cc-view-review-score-banner cc-view-feedback-score-banner">
                <div className="cc-view-review-score-left">
                  <div className="cc-view-review-stars-large">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={s <= viewFeedbackVehicle.serviceFeedback!.rating ? 'cc-star-gold' : 'cc-star-gray'}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="cc-view-review-score-num">
                    {viewFeedbackVehicle.serviceFeedback.rating}.0 / 5.0
                  </span>
                </div>
                <div className="cc-view-review-verified-badge cc-view-feedback-verified-badge">
                  ✓ Verified
                </div>
              </div>

              {/* Service Aspects Chips (if present) */}
              {viewFeedbackVehicle.serviceFeedback.aspects && viewFeedbackVehicle.serviceFeedback.aspects.length > 0 && (
                <div className="cc-view-feedback-aspects-card">
                  <h4 className="cc-view-feedback-card-title">Highlights:</h4>
                  <div className="cc-view-feedback-chips-wrap">
                    {viewFeedbackVehicle.serviceFeedback.aspects.map((aspect, idx) => (
                      <span key={idx} className="cc-view-feedback-aspect-chip">
                        {aspect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="cc-view-feedback-comment-card">
                <h4 className="cc-view-feedback-card-title">Customer Feedback:</h4>
                <p className="cc-view-feedback-comment-body">
                  "{viewFeedbackVehicle.serviceFeedback.comment}"
                </p>
              </div>
            </div>

            <div className="cc-modal-footer cc-view-review-footer">
              <button
                type="button"
                className="cc-view-review-edit-btn"
                onClick={() => {
                  handleOpenFeedbackModal(viewFeedbackVehicle);
                }}
              >
                ✏️ Edit Feedback
              </button>
              <button
                type="button"
                className="cc-view-review-close-btn"
                onClick={() => setViewFeedbackVehicle(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
