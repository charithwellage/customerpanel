import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDashboard } from './useDashboard.js';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerVehicles } from '../vehicles/useCustomerVehicles.js';
import { useCustomerInvoices } from '../invoices/useCustomerInvoices.js';
import { useCustomerNotifications } from '../notifications/useCustomerNotifications.js';
import { useCustomerProfile } from '../profile/useCustomerProfile.js';
import { useHttpClient } from '../account/index.js';
import { VehicleService } from '@carchief/api-client';
import { CustomerPwaBanner, usePwaInstall } from '../pwa/index.js';
import { SubmitWireProofModal } from '../payments/index.js';
import type { CustomerVehicleSummary, CustomerInvoiceSummary, Notification } from '@carchief/domain';
import {
  WireRemittanceDollarIcon,
  ShowroomCarIcon,
  VehiclesSideCarIcon,
  InvoiceDocumentIcon,
  FavouritesStarIcon,
  InquiriesChatIcon,
  DemandTargetIcon,
  BoughtCarsIcon,
  InTransitShipIcon,
  PortReadyBoxIcon,
  DueBillsClockIcon,
  PendingBalanceDollarIcon,
} from '../../components/Icons.js';

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  column: 'left' | 'right' | 'full';
  visible: boolean;
}

const DEFAULT_WIDGET_CONFIGS: DashboardWidgetConfig[] = [
  { id: 'kpi_metrics', title: 'Key Performance Metrics Summary', column: 'full', visible: true },
  { id: 'quick_shortcuts', title: 'Quick Shortcuts', column: 'left', visible: true },
  { id: 'unread_bulletins', title: 'Unread Bulletins', column: 'left', visible: true },
  { id: 'active_shipments', title: 'Active Shipment Tracking', column: 'right', visible: true },
  { id: 'billing_summary', title: 'Financial Billing Summary', column: 'right', visible: true },
  { id: 'personalized_vehicles', title: 'Personalized Vehicles for You', column: 'full', visible: true },
];

const STORAGE_KEY = 'carchief_custom_dashboard_layout_v6';

// Studio automotive photography on white backgrounds
const STUDIO_WHITE_BG_PALETTE = [
  '/images/cars/car-white.jpg',
  '/images/cars/car-silver.jpg',
  '/images/cars/car-blue.jpg',
  '/images/cars/car-pearl.jpg',
  '/images/cars/car-red.jpg',
  '/images/cars/car-black.jpg',
  '/images/cars/car-gray.jpg',
  '/images/cars/car-green.jpg',
];

const COLOR_TO_STUDIO_WHITE_BG: Record<string, string> = {
  white: '/images/cars/car-white.jpg',
  pearl: '/images/cars/car-pearl.jpg',
  black: '/images/cars/car-black.jpg',
  red: '/images/cars/car-red.jpg',
  blue: '/images/cars/car-blue.jpg',
  silver: '/images/cars/car-silver.jpg',
  gray: '/images/cars/car-gray.jpg',
  grey: '/images/cars/car-gray.jpg',
  charcoal: '/images/cars/car-gray.jpg',
  gunmetal: '/images/cars/car-gray.jpg',
  green: '/images/cars/car-green.jpg',
};

function resolveStudioWhiteBgImage(
  vehicle?: { primaryImage?: string; color?: string; id?: string },
  fallbackIndex = 0
): string {
  if (vehicle?.primaryImage && vehicle.primaryImage.startsWith('/images/cars/')) {
    return vehicle.primaryImage;
  }
  const colorKey = (vehicle?.color || '').toLowerCase().trim();
  if (colorKey) {
    for (const [key, path] of Object.entries(COLOR_TO_STUDIO_WHITE_BG)) {
      if (colorKey.includes(key)) {
        return path;
      }
    }
  }
  return STUDIO_WHITE_BG_PALETTE[fallbackIndex % STUDIO_WHITE_BG_PALETTE.length];
}

export const OverviewPage: React.FC = () => {
  const { user, setActiveRoute, activeRoute } = useCustomerShell();
  const { isLoading, error } = useDashboard();
  const { data: vehiclesData } = useCustomerVehicles();
  const { data: invoicesData } = useCustomerInvoices();
  const { data: notificationsData } = useCustomerNotifications('all', '');
  const { data: profile } = useCustomerProfile();
  const { canInstall, installApp } = usePwaInstall();
  const httpClient = useHttpClient();

  // Query live available inventory so recommendations prioritize active unsold stock
  const { data: recommendedInventoryData } = useQuery({
    queryKey: ['customer-recommended-inventory'],
    queryFn: async () => {
      if (!httpClient) return null;
      const vehicleService = new VehicleService(httpClient);
      return vehicleService.getVehicles({ audience: 'customer', limit: 20 });
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Dashboard Customization State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isWireProofModalOpen, setIsWireProofModalOpen] = useState(false);
  const [showWidgetManager, setShowWidgetManager] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as DashboardWidgetConfig[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((w) => w.id));
          const missing = DEFAULT_WIDGET_CONFIGS.filter((d) => !existingIds.has(d.id));
          return [...parsed, ...missing].filter((w) => w.id !== 'credit_utilisation');
        }
      }
    } catch {
      // Fallback to default
    }
    return DEFAULT_WIDGET_CONFIGS;
  });

  const saveWidgets = (updated: DashboardWidgetConfig[]) => {
    const filtered = updated.filter((w) => w.id !== 'credit_utilisation');
    setWidgets(filtered);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore localStorage save failures
    }
  };

  const handleResetLayout = () => {
    saveWidgets(DEFAULT_WIDGET_CONFIGS);
  };

  // Smoothly scroll down to RECOMMENDED & PERSONALIZED FLEET VEHICLES if returning from detail page
  useEffect(() => {
    if (activeRoute && (activeRoute.includes('personalized') || activeRoute.includes('recommend'))) {
      const timer = setTimeout(() => {
        const el = document.getElementById('personalized-vehicles-heading') || document.getElementById('personalized-vehicles-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeRoute]);

  const toggleWidgetVisibility = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveWidgets(updated);
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const index = widgets.findIndex((w) => w.id === id);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const next = [...widgets];
    const [removed] = next.splice(index, 1);
    next.splice(targetIndex, 0, removed);
    saveWidgets(next);
  };

  const handleDragStart = (id: string) => {
    setDraggedWidgetId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedWidgetId && draggedWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDrop = (id: string) => {
    if (!draggedWidgetId || draggedWidgetId === id) return;
    const fromIndex = widgets.findIndex((w) => w.id === draggedWidgetId);
    const toIndex = widgets.findIndex((w) => w.id === id);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...widgets];
    const [movedItem] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, movedItem);

    saveWidgets(next);
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const fullName = user?.name || profile?.name || 'PRABODHA';
  const displayUserCaps = fullName.toUpperCase();
  const customerId = user?.id || profile?.customerId || 'cust-123';
  const country = 'Sri Lanka';

  const allVehicles: CustomerVehicleSummary[] = vehiclesData?.items || [];
  
  // Real or fallback vehicle tracking list
  const activeShipments = useMemo(() => {
    if (allVehicles.length > 0) {
      return allVehicles.slice(0, 4).map((v, i) => ({
        id: v.id,
        name: `${v.year || 2024} ${v.make || 'TOYOTA'} ${v.model || 'LAND CRUISER'}`,
        chassis: v.chassisNumber || v.stockNumber || 'STK-6E5F',
        stock: v.stockNumber || v.id,
        badge: i === 1 ? 'INSPECTION' : i === 2 ? 'PORT READY' : i === 3 ? 'IN TRANSIT' : 'RESERVED',
        badgeLight: i === 1 ? 'amber' : i === 2 ? 'green' : i === 3 ? 'green' : 'red',
        etd: `1${2 + i}-SEP-2026`,
        eta: `${5 + i * 6}-OCT-2026`,
        image: resolveStudioWhiteBgImage(v, i),
      }));
    }
    return [
      {
        id: 'ship-1',
        name: '2024 TOYOTA LAND CRUISER 250',
        chassis: 'STK-6E5F',
        stock: 'STK-6E5F',
        badge: 'RESERVED',
        badgeLight: 'red',
        etd: '12-SEP-2026',
        eta: '5-OCT-2026',
        image: '/images/cars/car-white.jpg',
      },
      {
        id: 'ship-2',
        name: '2021 TOYOTA COROLLA FIELDER',
        chassis: 'NRE161-5091995',
        stock: '%RE161',
        badge: 'INSPECTION',
        badgeLight: 'amber',
        etd: '18-SEP-2026',
        eta: '12-OCT-2026',
        image: '/images/cars/car-silver.jpg',
      },
      {
        id: 'ship-3',
        name: '2013 VOLVO V40',
        chassis: 'YV1MV485BE209D6(078877',
        stock: 'YV1MV4',
        badge: 'PORT READY',
        badgeLight: 'green',
        etd: '25-SEP-2026',
        eta: '19-OCT-2026',
        image: '/images/cars/car-blue.jpg',
      },
      {
        id: 'ship-4',
        name: '2019 MAZDA DEMIO',
        chassis: 'DJ5FS-601248',
        stock: 'STK-DJ5FS',
        badge: 'IN TRANSIT',
        badgeLight: 'green',
        etd: '2-OCT-2026',
        eta: '26-OCT-2026',
        image: '/images/cars/car-red.jpg',
      },
    ];
  }, [allVehicles]);

  // Format only date without time portion (e.g. YYYY-MM-DD or DD/MM/YYYY)
  const formatOnlyDate = (val?: string): string => {
    if (!val) return '—';
    const isoMatch = val.match(/^(\d{4}[-/]\d{1,2}[-/]\d{1,2})/);
    if (isoMatch) return isoMatch[1];
    const dmyMatch = val.match(/^(\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
    if (dmyMatch) return dmyMatch[1];
    return val.split('T')[0].split(',')[0].split(' ')[0];
  };

  // Billing summary rows: 5 main invoices with due day reaching (sorted by closest due date)
  const billingRows = useMemo(() => {
    const defaultPriorityInvoices = [
      { id: 'INV-31644', type: 'COMMERCIAL', amount: '$275,750', outstanding: '$275,750', dueDate: '2026-07-16', status: 'PENDING PAYMENT' },
      { id: 'P-31890', type: 'PROFORMA', amount: '$11,800', outstanding: '$11,800', dueDate: '2026-07-17', status: 'PENDING PAYMENT' },
      { id: 'P-50211', type: 'COMMERCIAL', amount: '$22,400', outstanding: '$5,400', dueDate: '2026-07-18', status: 'PENDING PAYMENT' },
      { id: 'P-61048', type: 'PROFORMA', amount: '$14,500', outstanding: '$14,500', dueDate: '2026-07-20', status: 'PENDING PAYMENT' },
      { id: 'P-94324', type: 'PROFORMA', amount: '$8,974', outstanding: '$8,974', dueDate: '2026-07-23', status: 'PENDING PAYMENT' },
    ];
    if (invoicesData?.items && invoicesData.items.length > 0) {
      const sorted = [...(invoicesData.items as CustomerInvoiceSummary[])].sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      });
      return sorted.slice(0, 5).map((inv) => ({
        id: inv.invoiceNumber || inv.id,
        type: (inv.type || 'PROFORMA').toUpperCase(),
        amount: `$${inv.totalAmountUsd?.toLocaleString() || '12,730'}`,
        outstanding: `$${inv.outstandingAmountUsd?.toLocaleString() || inv.totalAmountUsd?.toLocaleString() || '12,730'}`,
        dueDate: formatOnlyDate(inv.dueDate || '2026-07-23'),
        status: 'PENDING PAYMENT',
      }));
    }
    return defaultPriorityInvoices;
  }, [invoicesData]);

  // Strict helper: check whether a vehicle is sold, delivered, or purchased
  const isVehicleSold = (v: unknown): boolean => {
    if (!v || typeof v !== 'object') return true;
    const item = v as Record<string, unknown>;
    const statusCode = String(item.vehicleStatusCode || '').trim().toLowerCase();
    const status = String(item.status || '').trim().toLowerCase();
    const statusLabel = String(item.statusLabel || '').trim().toLowerCase();
    const shippingStage = String(item.shippingStage || '').trim().toLowerCase();
    const logisticsStatus = String(item.logisticsStatus || '').trim().toLowerCase();

    return (
      statusCode === 'sold' ||
      status === 'sold' ||
      status === 'delivered' ||
      shippingStage === 'delivered' ||
      logisticsStatus === 'delivered' ||
      statusLabel.includes('sold') ||
      statusLabel.includes('purchased') ||
      statusLabel.includes('delivered') ||
      Boolean(item.isSold) ||
      Boolean(item.sold) ||
      item.vehicleStatus === 'Sold' ||
      item.status === 'Sold'
    );
  };

  // Curated fallback vehicle pool (all actively available in stock, none sold)
  const defaultAvailableFallbackVehicles = [
    {
      id: 'veh-1',
      slug: '2021-toyota-corolla-axio-veh-1',
      year: '2024',
      make: 'TOYOTA',
      model: 'LAND CRUISER 250',
      price: '$38,500 USD',
      badge: 'TOP MATCH',
      image: '/images/cars/car-white.jpg',
    },
    {
      id: 'veh-2',
      slug: '2022-toyota-yaris-cross-veh-2',
      year: '2023',
      make: 'HONDA',
      model: 'VEZEL E:HEV Z',
      price: '$21,400 USD',
      badge: 'HIGH DEMAND',
      image: '/images/cars/car-silver.jpg',
    },
    {
      id: 'veh-3',
      slug: '2020-honda-fit-hybrid-veh-3',
      year: '2023',
      make: 'NISSAN',
      model: 'X-TRAIL E-POWER',
      price: '$26,800 USD',
      badge: 'POPULAR',
      image: '/images/cars/car-blue.jpg',
    },
    {
      id: 'veh-4',
      slug: '2023-nissan-note-aura-veh-4',
      year: '2022',
      make: 'TOYOTA',
      model: 'HARRIER HYBRID',
      price: '$29,900 USD',
      badge: 'PREMIUM',
      image: '/images/cars/car-pearl.jpg',
    },
    {
      id: 'veh-5',
      slug: '2021-honda-fit-hybrid-veh-5',
      year: '2021',
      make: 'HONDA',
      model: 'FIT HYBRID',
      price: '$7,900 USD',
      badge: 'GRADE A+',
      image: '/images/cars/car-red.jpg',
    },
    {
      id: 'veh-6',
      slug: '2022-subaru-forester-veh-6',
      year: '2023',
      make: 'MERCEDES-BENZ',
      model: 'C200 AMG LINE',
      price: '$41,800 USD',
      badge: 'FAST DISPATCH',
      image: '/images/cars/car-black.jpg',
    },
    {
      id: 'veh-7',
      slug: '2021-suzuki-jimny-sierra-veh-7',
      year: '2021',
      make: 'TOYOTA',
      model: 'COROLLA FIELDER',
      price: '$14,200 USD',
      badge: 'BEST VALUE',
      image: '/images/cars/car-gray.jpg',
    },
    {
      id: 'veh-8',
      slug: '2020-toyota-rav4-hybrid-veh-8',
      year: '2023',
      make: 'TOYOTA',
      model: 'RAV4 ADVENTURE',
      price: '$32,600 USD',
      badge: 'BESTSELLER',
      image: '/images/cars/car-green.jpg',
    },
    {
      id: 'veh-9',
      slug: '2023-lexus-nx350h-veh-9',
      year: '2022',
      make: 'LEXUS',
      model: 'NX 350H F SPORT',
      price: '$45,900 USD',
      badge: 'VIP CHOICE',
      image: '/images/cars/car-white.jpg',
    },
    {
      id: 'veh-10',
      slug: '2021-toyota-alphard-sc-veh-10',
      year: '2020',
      make: 'TOYOTA',
      model: 'ALPHARD EXEC',
      price: '$48,200 USD',
      badge: 'LUXURY VAN',
      image: '/images/cars/car-pearl.jpg',
    },
  ];

  // Personalized recommended vehicles for the customer (5 per row, displaying Year, Make, Model, Price)
  // Strictly EXCLUDES any sold, delivered, or purchased vehicles.
  const personalizedVehicles = useMemo(() => {
    const badges = [
      'TOP MATCH',
      'HIGH DEMAND',
      'POPULAR',
      'PREMIUM',
      'GRADE A+',
      'FAST DISPATCH',
      'BEST VALUE',
      'BESTSELLER',
      'VIP CHOICE',
      'LUXURY VAN',
    ];

    const results: Array<{
      id: string;
      slug: string;
      year: string;
      make: string;
      model: string;
      price: string;
      badge: string;
      image: string;
    }> = [];
    const seenIds = new Set<string>();

    // 1. Prioritize real available inventory vehicles (filtering out sold vehicles)
    const inventoryItems = (recommendedInventoryData?.items || []).filter((v) => !isVehicleSold(v));
    for (const v of inventoryItems) {
      if (results.length >= 10) break;
      if (!v.id || seenIds.has(v.id)) continue;
      seenIds.add(v.id);
      results.push({
        id: v.id,
        slug: v.slug || v.id,
        year: String(v.year || 2024),
        make: (v.make || 'TOYOTA').toUpperCase(),
        model: (v.model || 'LAND CRUISER').toUpperCase(),
        price: v.priceUsd ? `$${v.priceUsd.toLocaleString()} USD` : 'ASK FOB',
        badge: badges[results.length % badges.length],
        image: resolveStudioWhiteBgImage(v, results.length),
      });
    }

    // 2. If needed, supplement with active non-sold fleet vehicles
    if (results.length < 10) {
      const unsoldFleet = allVehicles.filter((v) => !isVehicleSold(v));
      for (const v of unsoldFleet) {
        if (results.length >= 10) break;
        if (!v.id || seenIds.has(v.id)) continue;
        seenIds.add(v.id);
        results.push({
          id: v.id,
          slug: v.slug || v.id,
          year: String(v.year || 2024),
          make: (v.make || 'TOYOTA').toUpperCase(),
          model: (v.model || 'LAND CRUISER').toUpperCase(),
          price: v.priceUsd ? `$${v.priceUsd.toLocaleString()} USD` : 'ASK FOB',
          badge: badges[results.length % badges.length],
          image: resolveStudioWhiteBgImage(v, results.length),
        });
      }
    }

    // 3. Fill any remaining slots with guaranteed unsold fallback vehicles
    if (results.length < 10) {
      for (const v of defaultAvailableFallbackVehicles) {
        if (results.length >= 10) break;
        if (!v.id || seenIds.has(v.id) || isVehicleSold(v)) continue;
        seenIds.add(v.id);
        results.push({
          ...v,
          badge: badges[results.length % badges.length],
        });
      }
    }

    return results;
  }, [recommendedInventoryData, allVehicles]);

  // Notifications / Bulletins
  const bulletins = useMemo(() => {
    const rawNotifications: Notification[] = notificationsData?.items || [];
    if (rawNotifications.length > 0) {
      return rawNotifications.slice(0, 3).map((n) => ({
        id: n.id,
        title: (n.title || 'TT WIRE PAYMENT APPROVED').toUpperCase(),
        body: n.message || 'Dear Charith Wellage, your wire transfer payment has been audited and approved...',
        date: n.createdAt?.slice(0, 10) || '21/07/2026',
        priority: 'HIGH',
      }));
    }
    return [
      {
        id: 'bul-1',
        title: 'TT WIRE PAYMENT APPROVED',
        body: 'Dear Charith Wellage, your wire transfer payment of $50,000 USD (Reference Code: ffgff) for Invoice INV-31644 has been audited and approved by the Finance Team. Your invoice allocation h...',
        date: '21/07/2026',
        priority: 'HIGH',
      },
      {
        id: 'bul-2',
        title: 'TT WIRE PAYMENT APPROVED',
        body: 'Dear Charith Wellage, your wire transfer payment of $4,700 USD (Reference Code: TEST) for Invoice INV-70873 has been audited and approved by the Finance Team. Your invoice allocation...',
        date: '21/07/2026',
        priority: 'HIGH',
      },
      {
        id: 'bul-3',
        title: 'TT WIRE PAYMENT APPROVED ✓',
        body: 'Dear Charith Wellage, your Telegraphic Transfer (TT) wire transfer payment of $15,000 USD (Ref / Swift Code: charith wellage) has been audited and approved by the Finance Team. Available TT...',
        date: '23/07/2026',
        priority: 'HIGH',
      },
    ];
  }, [notificationsData]);

  // Customer notices for continuous running marquee ticker
  const customerNotices = useMemo(() => {
    const list: string[] = [];
    if (notificationsData?.items && notificationsData.items.length > 0) {
      notificationsData.items.slice(0, 3).forEach((n) => {
        if (n.message) {
          list.push(`${n.title ? `${n.title}: ` : ''}${n.message}`);
        }
      });
    }
    list.push(
      'Telegraphic Transfer (TT) wire proofs submitted before 15:00 JST are verified and approved same-day by the Treasury Team.',
      '48-Hour Vehicle Hold: Lock any live Japanese auction or showroom stock with $0 deposit directly from your portal.',
      'Ocean Logistics Notice: Ro-Ro vessel departures and container bill of lading tracking now updated weekly for all destination ports.',
      'Japan Auction Network: Real-time bids now active across USS Tokyo, TAA Yokohama, CAA, and JU auto auctions.'
    );
    return list;
  }, [notificationsData]);

  // Widget Renderer Helper
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'kpi_metrics':
        return (
          <section className="cc-dash-kpi-grid" aria-label="Key metrics summary">
            <div className="cc-dash-bento-card" onClick={() => setActiveRoute('/vehicles')} role="button" tabIndex={0}>
              <div className="cc-dash-kpi-top">
                <span className="cc-dash-kpi-label">My orders</span>
                <span className="cc-dash-kpi-icon">
                  <BoughtCarsIcon size={16} />
                </span>
              </div>
              <div className="cc-dash-kpi-value">24</div>
              <div className="cc-dash-kpi-bottom">FULL LEDGER</div>
            </div>

            <div className="cc-dash-bento-card cc-dash-bento-card--static">
              <div className="cc-dash-kpi-top">
                <span className="cc-dash-kpi-label">TBA</span>
                <span className="cc-dash-kpi-icon">
                  <InTransitShipIcon size={16} />
                </span>
              </div>
              <div className="cc-dash-kpi-value">0</div>
              <div className="cc-dash-kpi-bottom">VESSELS EN ROUTE</div>
            </div>

            <div className="cc-dash-bento-card cc-dash-bento-card--static">
              <div className="cc-dash-kpi-top">
                <span className="cc-dash-kpi-label">TBA</span>
                <span className="cc-dash-kpi-icon">
                  <PortReadyBoxIcon size={16} />
                </span>
              </div>
              <div className="cc-dash-kpi-value">0</div>
              <div className="cc-dash-kpi-bottom">BOOKED &amp; LOADED</div>
            </div>

            <div className="cc-dash-bento-card cc-dash-bento-card--static">
              <div className="cc-dash-kpi-top">
                <span className="cc-dash-kpi-label">TBA</span>
                <span className="cc-dash-kpi-icon">
                  <DueBillsClockIcon size={16} />
                </span>
              </div>
              <div className="cc-dash-kpi-value">28</div>
              <div className="cc-dash-kpi-bottom">UNPAID / PARTIAL</div>
            </div>

            <div className="cc-dash-bento-card cc-dash-kpi-card--pending-balance" onClick={() => setActiveRoute('/invoices')} role="button" tabIndex={0}>
              <div className="cc-dash-kpi-top">
                <span className="cc-dash-kpi-label">PENDING BALANCE</span>
                <span className="cc-dash-kpi-icon">
                  <PendingBalanceDollarIcon size={16} />
                </span>
              </div>
              <div className="cc-dash-kpi-value">$833,336.00</div>
              <div className="cc-dash-kpi-bottom cc-dash-text-red">CREDIT LIMIT: $100,000</div>
            </div>
          </section>
        );

      case 'active_shipments':
        return (
          <section className="cc-dash-bento-panel cc-dash-shipments-panel" aria-labelledby="active-shipment-heading">
            <div className="cc-dash-panel-header">
              <div>
                <h2 id="active-shipment-heading" className="cc-dash-panel-title">
                  ACTIVE SHIPMENT TRACKING
                </h2>
                <p className="cc-dash-panel-subtitle">Live ocean logistics &amp; container status</p>
              </div>
              <button
                type="button"
                className="cc-dash-header-link"
                onClick={() => setActiveRoute('/vehicles?tab=purchasedVehicles')}
              >
                VIEW ALL &rarr;
              </button>
            </div>

            <div className="cc-dash-shipment-rows">
              {activeShipments.map((item) => (
                <div
                  key={item.id}
                  className="cc-dash-shipment-row"
                  onClick={() => setActiveRoute('/vehicles?tab=purchasedVehicles')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="cc-dash-shipment-row-main">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="cc-dash-shipment-thumb"
                      loading="lazy"
                    />
                    <div className="cc-dash-shipment-details">
                      <h3 className="cc-dash-shipment-car-name">{item.name}</h3>
                      <p className="cc-dash-shipment-chassis">
                        Chassis: {item.chassis} <span className="cc-dash-meta-pipe">|</span> Stock: {item.stock}
                      </p>
                    </div>
                  </div>
                  <div className="cc-dash-shipment-badges">
                    <span className="cc-dash-status-tag cc-dash-status-tag--unified">
                      <span className={`cc-dash-light-dot cc-dash-light-dot--${item.badgeLight}`} />
                      {item.badge}
                    </span>
                    <div className="cc-dash-dates-stack">
                      <div className="cc-dash-date-line cc-dash-date-line--etd">
                        <span className="cc-dash-date-lbl">ETD</span>
                        <span className="cc-dash-date-val">{item.etd}</span>
                      </div>
                      <div className="cc-dash-date-line cc-dash-date-line--eta">
                        <span className="cc-dash-date-lbl">ETA</span>
                        <span className="cc-dash-date-val">{item.eta}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'billing_summary':
        return (
          <section className="cc-dash-bento-panel" aria-labelledby="financial-billing-heading">
            <div className="cc-dash-panel-header">
              <div>
                <h2 id="financial-billing-heading" className="cc-dash-panel-title">
                  FINANCIAL BILLING SUMMARY
                </h2>
                <p className="cc-dash-panel-subtitle">Top 5 priority accounts with approaching due dates &bull; Pending payment settlement</p>
              </div>
              <button
                type="button"
                className="cc-dash-header-link"
                onClick={() => setActiveRoute('/invoices')}
              >
                FULL LEDGER &rarr;
              </button>
            </div>

            <div className="cc-dash-table-container">
              <table className="cc-dash-table">
                <thead>
                  <tr>
                    <th scope="col">INVOICE NO</th>
                    <th scope="col" className="cc-dash-col-type">TYPE</th>
                    <th scope="col">AMOUNT</th>
                    <th scope="col">OUTSTANDING</th>
                    <th scope="col">DUE DATE</th>
                    <th scope="col" className="cc-dash-th-right cc-dash-col-status">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billingRows.map((inv) => (
                    <tr
                      key={inv.id}
                      className="cc-dash-tr-interactive"
                      onClick={() => setActiveRoute('/invoices')}
                    >
                      <td className="cc-dash-td-mono cc-dash-td-bold">{inv.id}</td>
                      <td className="cc-dash-td-muted cc-dash-col-type">{inv.type}</td>
                      <td className="cc-dash-td-mono">{inv.amount}</td>
                      <td className="cc-dash-td-mono cc-dash-td-bold cc-dash-text-red">{inv.outstanding}</td>
                      <td className="cc-dash-td-mono cc-dash-td-muted">{inv.dueDate}</td>
                      <td className="cc-dash-td-right cc-dash-col-status">
                        <span className="cc-dash-status-tag cc-dash-status-tag--pending">{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );

      case 'quick_shortcuts':
        return (
          <section className="cc-dash-bento-panel cc-dash-shortcuts-panel" aria-labelledby="quick-shortcuts-heading">
            <div className="cc-dash-panel-header">
              <div>
                <h2 id="quick-shortcuts-heading" className="cc-dash-panel-title">
                  QUICK SHORTCUTS
                </h2>
                <p className="cc-dash-panel-subtitle">Fast access to frequent tasks</p>
              </div>
            </div>

            <div className="cc-dash-shortcuts-grid">
              <div
                className="cc-dash-shortcut-card"
                onClick={() => setIsWireProofModalOpen(true)}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--amber">
                  <WireRemittanceDollarIcon size={16} />
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">SUBMIT WIRE PROOF</span>
                  <span className="cc-dash-shortcut-desc">Upload TT wire receipt or check status</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>

              <div
                className="cc-dash-shortcut-card"
                onClick={() => setActiveRoute('/vehicles')}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--blue">
                  <ShowroomCarIcon size={16} />
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">FLEET DIRECTORY</span>
                  <span className="cc-dash-shortcut-desc">Track reserved &amp; purchased vehicles</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>

              <div
                className="cc-dash-shortcut-card"
                onClick={() => setActiveRoute('/invoices')}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--emerald">
                  <InvoiceDocumentIcon size={16} />
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">INVOICES &amp; STATEMENTS</span>
                  <span className="cc-dash-shortcut-desc">View commercial bills &amp; payments</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>

              <div
                className="cc-dash-shortcut-card"
                onClick={() => setActiveRoute('/inventory')}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--teal">
                  <VehiclesSideCarIcon size={16} />
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">BROWSE INVENTORY</span>
                  <span className="cc-dash-shortcut-desc">Explore live Japan export catalog</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>

              <div
                className="cc-dash-shortcut-card"
                onClick={() => setActiveRoute('/demand?action=create_future')}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--purple">
                  <DemandTargetIcon size={16} />
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">CREATE FUTURE DEMAND</span>
                  <span className="cc-dash-shortcut-desc">Request specific models &amp; target FOB/CIF budget</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>

              <div
                className="cc-dash-shortcut-card"
                onClick={() => setActiveRoute('/wishlist')}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--gold">
                  <FavouritesStarIcon size={16} />
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">SAVED FAVOURITES</span>
                  <span className="cc-dash-shortcut-desc">View saved vehicles in your wishlist</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>

              <div
                className="cc-dash-shortcut-card"
                onClick={() => {
                  window.open(
                    'https://wa.me/817092101426?text=' + encodeURIComponent('Hello CarChief Sales, I would like to make a direct inquiry regarding vehicle procurement.'),
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                role="button"
                tabIndex={0}
              >
                <div className="cc-dash-shortcut-icon-badge cc-dash-shortcut-icon-badge--emerald">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 2.796.933 3.183 0 5.769-2.587 5.77-5.767.001-3.181-2.585-5.769-5.77-5.769zm10.125 5.769c0 5.602-4.557 10.16-10.156 10.16-1.748 0-3.411-.453-4.877-1.272l-5.623 1.472 1.503-5.485c-.927-1.536-1.442-3.329-1.442-5.176 0-5.603 4.557-10.16 10.156-10.16 5.602 0 10.157 4.558 10.157 10.161zm-4.328 4.225c-.244-.122-1.443-.712-1.667-.793-.224-.082-.387-.122-.55.122-.163.244-.632.793-.774.956-.143.163-.285.184-.529.061-.244-.122-1.03-.38-1.962-1.211-.725-.646-1.215-1.445-1.357-1.689-.143-.244-.015-.376.107-.498.11-.11.244-.285.366-.428.122-.143.163-.244.244-.407.082-.163.041-.305-.02-.428-.061-.122-.55-1.324-.753-1.813-.198-.476-.399-.411-.55-.419l-.469-.008c-.163 0-.428.061-.651.305-.224.244-.855.835-.855 2.037 0 1.202.876 2.363.998 2.526.122.163 1.724 2.632 4.177 3.69.583.252 1.039.403 1.394.516.586.186 1.119.16 1.541.097.471-.07 1.443-.59 1.647-1.161.204-.57.204-1.059.143-1.161-.061-.102-.224-.163-.468-.285z"/>
                  </svg>
                </div>
                <div className="cc-dash-shortcut-info">
                  <span className="cc-dash-shortcut-title">DIRECT INQUIRY</span>
                  <span className="cc-dash-shortcut-desc">Chat with sales on WhatsApp</span>
                </div>
                <span className="cc-dash-shortcut-arrow">&rarr;</span>
              </div>
            </div>
          </section>
        );

      case 'unread_bulletins':
        return (
          <section className="cc-dash-bento-panel cc-dash-panel--full cc-dash-unread-bulletins-widget" aria-labelledby="unread-bulletins-heading">
            <div className="cc-dash-panel-header">
              <div>
                <h2 id="unread-bulletins-heading" className="cc-dash-panel-title">
                  UNREAD BULLETINS
                </h2>
                <p className="cc-dash-panel-subtitle">Official notifications &amp; wire updates</p>
              </div>
              <button
                type="button"
                className="cc-dash-header-link"
                onClick={() => setActiveRoute('/notifications')}
              >
                INBOX &rarr;
              </button>
            </div>

            <div className="cc-dash-bulletin-list">
              {bulletins.map((b) => (
                <div
                  key={b.id}
                  className="cc-dash-bulletin-card"
                  onClick={() => setActiveRoute('/notifications')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="cc-dash-bulletin-top">
                    <h3 className="cc-dash-bulletin-title">{b.title}</h3>
                    <span className="cc-dash-badge-high">{b.priority}</span>
                  </div>
                  <p className="cc-dash-bulletin-body">{b.body}</p>
                  <div className="cc-dash-bulletin-date">{b.date}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'personalized_vehicles':
        return (
          <section
            id="personalized-vehicles-section"
            className="cc-dash-bento-panel cc-dash-personalized-panel"
            aria-labelledby="personalized-vehicles-heading"
          >
            <div className="cc-dash-personalized-tag-row">
              <span className="cc-dash-pill-badge cc-dash-pill-badge--shield">
                AI CURATED MATCHES
              </span>
              <span className="cc-dash-pill-badge cc-dash-pill-badge--active">
                <span className="cc-dash-dot cc-dash-dot--emerald" />
                TAILORED FOR {displayUserCaps}
              </span>
              <button
                type="button"
                className="cc-dash-header-link cc-dash-header-link--inventory"
                onClick={() => setActiveRoute('/inventory')}
              >
                <span className="cc-dash-inventory-label--desktop">VIEW FULL INVENTORY &rarr;</span>
                <span className="cc-dash-inventory-label--mobile">SEE MORE</span>
              </button>
            </div>

            <div className="cc-dash-panel-header">
              <div>
                <h2 id="personalized-vehicles-heading" className="cc-dash-panel-title cc-dash-pv-heading">
                  RECOMMENDED &amp; PERSONALIZED FLEET VEHICLES
                </h2>
                <p className="cc-dash-panel-subtitle cc-dash-pv-subtitle">
                  High-yield stock and market-aligned vehicle recommendations based on your purchasing preferences
                </p>
              </div>
            </div>

            <div className="cc-dash-personalized-grid">
              {personalizedVehicles.slice(0, 10).map((v) => (
                <div
                  key={v.id}
                  className="cc-dash-pv-card"
                  onClick={() => setActiveRoute(`/inventory/${v.slug || v.id}?from=dashboard_personalized`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveRoute(`/inventory/${v.slug || v.id}?from=dashboard_personalized`);
                    }
                  }}
                >
                  <div className="cc-dash-pv-image-wrap">
                    <img
                      src={v.image}
                      alt={`${v.year} ${v.make} ${v.model}`}
                      className="cc-dash-pv-image"
                      loading="lazy"
                    />
                    <span className="cc-dash-pv-match-badge">{v.badge}</span>
                  </div>
                  <div className="cc-dash-pv-body">
                    <div className="cc-dash-pv-year-row">
                      <span className="cc-dash-pv-year">{v.year}</span>
                    </div>
                    <div className="cc-dash-pv-title-row" title={`${v.year} ${v.make} ${v.model}`}>
                      <span className="cc-dash-pv-make">{v.make}</span>
                      <span className="cc-dash-pv-model">{v.model}</span>
                    </div>
                    <div className="cc-dash-pv-price-wrap">
                      <span className="cc-dash-pv-price-lbl">FOB PRICE</span>
                      <span className="cc-dash-pv-price-val">{v.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const renderDraggableWrapper = (widget: DashboardWidgetConfig) => {
    if (!widget.visible && !isCustomizing) {
      return null;
    }

    const isDragging = draggedWidgetId === widget.id;
    const isDropzone = dragOverWidgetId === widget.id;

    return (
      <div
        key={widget.id}
        className={`cc-dash-draggable-widget ${isCustomizing ? 'cc-dash-draggable-widget--editing' : ''} ${
          isDragging ? 'cc-dash-draggable-widget--dragging' : ''
        } ${isDropzone ? 'cc-dash-draggable-widget--dropzone' : ''}`}
        draggable={isCustomizing}
        onDragStart={() => handleDragStart(widget.id)}
        onDragOver={(e) => handleDragOver(e, widget.id)}
        onDrop={() => handleDrop(widget.id)}
        onDragEnd={() => {
          setDraggedWidgetId(null);
          setDragOverWidgetId(null);
        }}
        style={{ opacity: !widget.visible && isCustomizing ? 0.45 : 1 }}
      >
        {isCustomizing && (
          <div className="cc-dash-widget-edit-bar">
            <span className="cc-dash-drag-handle" title="Drag to reorder dashboard item">
              ⣿ {widget.title}
            </span>
            <div className="cc-dash-widget-edit-controls">
              <button
                type="button"
                className="cc-dash-widget-control-btn"
                title="Move Up"
                onClick={() => moveWidget(widget.id, 'up')}
              >
                ▲
              </button>
              <button
                type="button"
                className="cc-dash-widget-control-btn"
                title="Move Down"
                onClick={() => moveWidget(widget.id, 'down')}
              >
                ▼
              </button>
              <button
                type="button"
                className="cc-dash-widget-control-btn cc-dash-widget-control-btn--hide"
                title={widget.visible ? 'Hide Widget' : 'Show Widget'}
                onClick={() => toggleWidgetVisibility(widget.id)}
              >
                {widget.visible ? '👁️' : '🚫'}
              </button>
            </div>
          </div>
        )}
        {renderWidgetContent(widget.id)}
      </div>
    );
  };

  const topFullWidthWidgets = widgets.filter((w) => w.column === 'full' && w.id !== 'personalized_vehicles');
  const leftColWidgets = widgets.filter((w) => w.column === 'left');
  const rightColWidgets = widgets.filter((w) => w.column === 'right');
  const bottomFullWidthWidgets = widgets.filter((w) => w.column === 'full' && w.id === 'personalized_vehicles');

  return (
    <div className="cc-dash-page" data-testid="customer-dashboard-page">
      {isLoading && (
        <div className="cc-dash-loading-bar" role="status" aria-live="polite">
          <span>Syncing portal records&hellip;</span>
        </div>
      )}

      {error && (
        <div className="cc-dash-alert-strip cc-dash-alert-strip--error" role="alert">
          <span>Central broker sync notice. Displaying cached portal records.</span>
        </div>
      )}

      {/* PWA Install Banner Slot (Positioned before Notice Bar) */}
      {canInstall && (
        <div className="cc-dash-pwa-banner-slot" data-testid="dash-pwa-banner-slot">
          <CustomerPwaBanner onInstall={installApp} />
        </div>
      )}

      {/* Running Notice Ticker Section (Positioned before Welcome Card) */}
      <section
        className="cc-dash-notice-ticker-bar"
        aria-label="Customer Notice Bulletin"
        data-testid="customer-notice-ticker"
      >
        <div className="cc-dash-notice-badge">
          <span className="cc-dash-notice-badge__dot" aria-hidden="true" />
          <span>NOTICE</span>
        </div>

        <div className="cc-dash-notice-fade-left" aria-hidden="true" />

        <div
          className="cc-dash-notice-track-wrap"
          onClick={() => setActiveRoute('/notifications')}
          title="Click to view all notices and bulletins"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setActiveRoute('/notifications');
            }
          }}
        >
          <div className="cc-dash-notice-track">
            <div className="cc-dash-notice-group">
              {customerNotices.map((notice, idx) => (
                <span key={`n1-${idx}`} className="cc-dash-notice-item">
                  <span>{notice}</span>
                  <span className="cc-dash-notice-sep" aria-hidden="true">✦</span>
                </span>
              ))}
            </div>
            <div className="cc-dash-notice-group" aria-hidden="true">
              {customerNotices.map((notice, idx) => (
                <span key={`n2-${idx}`} className="cc-dash-notice-item">
                  <span>{notice}</span>
                  <span className="cc-dash-notice-sep">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="cc-dash-notice-fade-right" aria-hidden="true" />
      </section>

      {/* =========================================================================
          1. HERO HEADER CARD (Matching chiefdesign.netlify.app Bento Card Style)
         ========================================================================= */}
      <section className="cc-dash-bento-hero" aria-label="Welcome and session overview">
        <div className="cc-dash-hero-main">
          {/* Badges */}
          <div className="cc-dash-hero-badges">
            <span className="cc-dash-pill-badge cc-dash-pill-badge--shield">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              </svg>
              SECURE CLIENT SESSION
            </span>
            <span className="cc-dash-pill-badge cc-dash-pill-badge--active">
              <span className="cc-dash-dot cc-dash-dot--emerald" />
              ACTIVE
            </span>

            {/* Customization Toggle Action Button */}
            <button
              type="button"
              className={`cc-dash-header-cust-btn ${isCustomizing ? 'cc-dash-header-cust-btn--active' : ''}`}
              onClick={() => setIsCustomizing(!isCustomizing)}
            >
              {isCustomizing ? '✓ Done Customizing' : '⚙️ Customize Dashboard'}
            </button>
          </div>

          {/* Heading */}
          <h1 className="cc-dash-welcome-heading">
            WELCOME BACK, <span className="cc-dash-user-highlight">{displayUserCaps}</span>
          </h1>

          {/* Clean Subtext */}
          <p className="cc-dash-welcome-subtext">
            Your central portal for vehicle procurement, ocean freight tracking, and financial account management.
          </p>
        </div>

        {/* Right Stacked Meta Container (4 Aligned Rows) */}
        <div className="cc-dash-hero-meta-stack">
          <div className="cc-dash-meta-box cc-dash-meta-box--four-rows">
            {/* Row 1: PORTAL TIER */}
            <div className="cc-dash-meta-row cc-dash-meta-row--tier">
              <span className="cc-dash-meta-label">PORTAL TIER</span>
              <span className="cc-dash-meta-tier-pill cc-dash-meta-tier-pill--green">
                <span className="cc-dash-dot cc-dash-dot--green-pulse" />
                PREMIUM DEALER
              </span>
            </div>
            <div className="cc-dash-meta-divider" />

            {/* Row 2: MARKET */}
            <div className="cc-dash-meta-row cc-dash-meta-row--market">
              <span className="cc-dash-meta-label">MARKET</span>
              <span className="cc-dash-meta-value">{country}</span>
            </div>
            <div className="cc-dash-meta-divider" />

            {/* Row 3: SECURE CLIENT ID */}
            <div className="cc-dash-meta-row cc-dash-meta-row--id">
              <span className="cc-dash-meta-label">
                <span className="cc-dash-meta-label-full">SECURE CLIENT ID</span>
                <span className="cc-dash-meta-label-short">CLIENT ID</span>
              </span>
              <span className="cc-dash-meta-value cc-dash-mono">{customerId}</span>
            </div>
            <div className="cc-dash-meta-divider" />

            {/* Row 4: CREDIT UTILIZATION */}
            <div className="cc-dash-meta-row cc-dash-meta-row--credit">
              <span className="cc-dash-meta-label">
                <span className="cc-dash-meta-label-full">CREDIT UTILIZATION</span>
                <span className="cc-dash-meta-label-short">CREDIT UTIL.</span>
              </span>
              <span className="cc-dash-meta-value cc-dash-mono">
                <span className="cc-dash-credit-used">$833,336</span>
                <span className="cc-dash-credit-limit"> / $100,000</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Customization Banner */}
      {isCustomizing && (
        <div className="cc-dash-customize-banner">
          <div className="cc-dash-customize-title">
            <span>✨ Customizing Dashboard Layout</span>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 400 }}>
              (Drag ⣿ handles to reorder widgets)
            </span>
          </div>
          <div className="cc-dash-customize-actions">
            <button
              type="button"
              className="cc-dash-customize-btn"
              onClick={() => setShowWidgetManager(true)}
            >
              ➕ Manage Widgets ({widgets.filter((w) => w.visible).length}/{widgets.length})
            </button>
            <button
              type="button"
              className="cc-dash-customize-btn"
              onClick={handleResetLayout}
            >
              🔄 Reset to Default
            </button>
            <button
              type="button"
              className="cc-dash-customize-btn cc-dash-customize-btn--primary"
              onClick={() => setIsCustomizing(false)}
            >
              ✓ Done
            </button>
          </div>
        </div>
      )}

      {/* Manage Widgets Modal */}
      {showWidgetManager && (
        <div className="cc-dash-manager-modal" onClick={() => setShowWidgetManager(false)}>
          <div className="cc-dash-manager-box" onClick={(e) => e.stopPropagation()}>
            <div className="cc-dash-manager-header">
              <h3 className="cc-dash-manager-title">Manage Dashboard Widgets</h3>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setShowWidgetManager(false)}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Toggle visibility for any widget item on your personalized dashboard layout.
            </p>
            <div className="cc-dash-manager-list">
              {widgets.map((widget) => (
                <div key={widget.id} className="cc-dash-manager-item">
                  <span className="cc-dash-manager-item-name">{widget.title}</span>
                  <label className="cc-dash-manager-toggle">
                    <input
                      type="checkbox"
                      checked={widget.visible}
                      onChange={() => toggleWidgetVisibility(widget.id)}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: widget.visible ? '#0f172a' : '#94a3b8' }}>
                      {widget.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                className="cc-dash-customize-btn cc-dash-customize-btn--primary"
                onClick={() => setShowWidgetManager(false)}
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL WIDTH TOP WIDGETS */}
      {topFullWidthWidgets.map((w) => renderDraggableWrapper(w))}

      {/* 2 COLUMN DYNAMIC GRID */}
      <div className="cc-dash-layout-grid">
        {/* LEFT COLUMN */}
        <div className="cc-dash-left-col cc-dash-main-col">
          {leftColWidgets.map((w) => renderDraggableWrapper(w))}
        </div>

        {/* RIGHT COLUMN */}
        <div className="cc-dash-right-col cc-dash-side-col">
          {rightColWidgets.map((w) => renderDraggableWrapper(w))}
        </div>
      </div>

      {/* PERSONALIZED VEHICLES AT THE END (FULL WIDTH 5 PER ROW) */}
      {bottomFullWidthWidgets.map((w) => renderDraggableWrapper(w))}

      <SubmitWireProofModal
        isOpen={isWireProofModalOpen}
        onClose={() => setIsWireProofModalOpen(false)}
      />
    </div>
  );
};
