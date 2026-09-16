import React, { useState, useEffect, useId, useRef } from 'react';
import type { VehicleDetail } from '@carchief/domain';
import { formatVehicleTitle, getVisibleGalleryImages } from '@carchief/vehicle-detail';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerProfile } from '../profile/index.js';
import { useCustomerVehicleDetail } from './useCustomerVehicleDetail.js';
import { useCustomerTierBenefits } from './useCustomerTierBenefits.js';
import './inventory.css';

export interface CustomerVehicleDetailPageProps {
  slug: string;
  apiBaseUrl?: string;
  token?: string;
  onBack?: () => void;
  backLabel?: string;
}

interface DestinationCountry {
  country: string;
  flag: string;
  ports: {
    name: string;
    duration: string;
    costUsd: number;
    cityDelivery?: boolean;
  }[];
}

const DESTINATIONS: DestinationCountry[] = [
  {
    country: 'Kenya',
    flag: '🇰🇪',
    ports: [
      { name: 'Mombasa', duration: '18-28 Days', costUsd: 1656 },
      { name: 'Inland Hub', duration: '5 Days', costUsd: 1822, cityDelivery: true },
    ],
  },
  {
    country: 'Tanzania',
    flag: '🇹🇿',
    ports: [
      { name: 'Dar es Salaam', duration: '20-30 Days', costUsd: 1550 },
      { name: 'Inland Hub', duration: '4 Days', costUsd: 1750, cityDelivery: true },
    ],
  },
  {
    country: 'Uganda',
    flag: '🇺🇬',
    ports: [
      { name: 'Mombasa → Kampala', duration: '25-35 Days', costUsd: 2100, cityDelivery: true },
    ],
  },
  {
    country: 'DR Congo',
    flag: '🇨🇩',
    ports: [
      { name: 'Mombasa → Goma', duration: '30-40 Days', costUsd: 2600, cityDelivery: true },
    ],
  },
  {
    country: 'South Sudan',
    flag: '🇸🇸',
    ports: [
      { name: 'Mombasa → Juba', duration: '30-40 Days', costUsd: 2800, cityDelivery: true },
    ],
  },
  {
    country: 'Rwanda',
    flag: '🇷🇼',
    ports: [
      { name: 'Dar es Salaam → Kigali', duration: '28-35 Days', costUsd: 2300, cityDelivery: true },
    ],
  },
  {
    country: 'Burundi',
    flag: '🇧🇮',
    ports: [
      { name: 'Dar es Salaam → Bujumbura', duration: '30-38 Days', costUsd: 2400, cityDelivery: true },
    ],
  },
  {
    country: 'Zambia',
    flag: '🇿🇲',
    ports: [
      { name: 'Dar es Salaam → Lusaka', duration: '28-38 Days', costUsd: 2500, cityDelivery: true },
    ],
  },
  {
    country: 'Zimbabwe',
    flag: '🇿🇼',
    ports: [
      { name: 'Durban → Harare', duration: '25-35 Days', costUsd: 2450, cityDelivery: true },
    ],
  },
  {
    country: 'Mozambique',
    flag: '🇲🇿',
    ports: [
      { name: 'Maputo', duration: '22-30 Days', costUsd: 1700 },
    ],
  },
  {
    country: 'Malawi',
    flag: '🇲🇼',
    ports: [
      { name: 'Dar es Salaam → Lilongwe', duration: '28-35 Days', costUsd: 2350, cityDelivery: true },
    ],
  },
];

const STANDARD_EQUIPMENT_LIST = [
  'Alloy Wheels',
  'Power Steering',
  'Power Window',
  'A/C',
  'ABS',
  'Airbag',
  'Radio',
  'Central Locking',
  'Back Camera',
  'Push Start',
  'Keyless Entry',
  'ESC',
  'Navigation',
];

const ALL_EQUIPMENT_LIST = [
  ...STANDARD_EQUIPMENT_LIST,
  'Sunroof',
  'Leather Seats',
  'Fog Lights',
  'Parking Sensors',
  'Bluetooth Audio',
  'Heated Seats',
  'Adaptive Cruise Control',
  'Lane Departure Warning',
  'Blind Spot Monitor',
  'Apple CarPlay / Android Auto',
  'LED Matrix Headlights',
  'Carbon Aerokit / Rear Wing',
  'Traction Control System',
  'Dual-Zone Automatic Climate',
  'Power Tailgate',
  'Memory Sports Seats',
  'Wireless Charging Pad',
  'Surround View 360 Camera',
  'Head-Up Display',
  'Tyre Pressure Monitor',
  'Adaptive Sport Suspension',
  'Ambient Interior Lighting',
];

const FALLBACK_IMAGES = [
  // Batch 1 (1 - 20): Exterior Full, 3/4 Angles, Grille, Emblems, Wheels, Diffuser, Lighting
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80',
  // Batch 2 (21 - 40): Cockpit, Dashboard, Steering Wheel, Cluster, Infotainment, Center Console, Recaro Seats
  'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570733117311-d990c3816c47?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1514316454349-db50a8d75d02?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1567818735868-e71b99932e29?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80&sig=219',
  'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80&sig=220',
  // Batch 3 (41 - 60): Engine Bay Twin-Turbo, Underbody, Exhaust, Suspension, Trunk, Chassis Plate, Keys & Documentation
  'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80&sig=301',
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80&sig=302',
  'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80&sig=303',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80&sig=304',
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80&sig=305',
  'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80&sig=306',
  'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=1200&q=80&sig=307',
  'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80&sig=308',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80&sig=309',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80&sig=310',
  'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80&sig=311',
  'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80&sig=312',
  'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80&sig=313',
  'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80&sig=314',
  'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80&sig=315',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80&sig=316',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80&sig=317',
  'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80&sig=318',
  'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80&sig=319',
  'https://images.unsplash.com/photo-1555353540-64580b51c258?auto=format&fit=crop&w=1200&q=80&sig=320',
];

const THUMBS_PER_PAGE = 20;

const SPIN_360_ANGLES = [
  { deg: 0, label: 'Front View (0°)', shortLabel: '0° FRONT' },
  { deg: 45, label: 'Front-Right (45°)', shortLabel: '45° F-R' },
  { deg: 90, label: 'Right Side (90°)', shortLabel: '90° RIGHT' },
  { deg: 135, label: 'Rear-Right (135°)', shortLabel: '135° R-R' },
  { deg: 180, label: 'Rear View (180°)', shortLabel: '180° REAR' },
  { deg: 225, label: 'Rear-Left (225°)', shortLabel: '225° R-L' },
  { deg: 270, label: 'Left Side (270°)', shortLabel: '270° LEFT' },
  { deg: 315, label: 'Front-Left (315°)', shortLabel: '315° F-L' },
];

export const CustomerVehicleDetailPage: React.FC<CustomerVehicleDetailPageProps> = ({
  slug,
  apiBaseUrl = '',
  token,
  onBack,
  backLabel,
}) => {
  const { user, activeRoute, setActiveRoute } = useCustomerShell();
  const { data: profile } = useCustomerProfile();
  const { data: tierBenefits } = useCustomerTierBenefits();
  const destinationCountry = profile?.deliveryAddress || user?.company || 'Kenya';
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const isWishlistSource = (backLabel?.toLowerCase().includes('wishlist') ?? false) || activeRoute.includes('from=wishlist') || activeRoute.startsWith('/wishlist');
  const isDashboardSource =
    (backLabel?.toLowerCase().includes('dashboard') ?? false) ||
    (backLabel?.toLowerCase().includes('recommend') ?? false) ||
    activeRoute.startsWith('/dashboard') ||
    activeRoute.includes('from=dashboard') ||
    activeRoute.includes('from=dashboard_personalized') ||
    activeRoute.includes('section=personalized_vehicles');
  const isOrdersReservedSource =
    (backLabel?.toLowerCase().includes('reserved') ?? false) ||
    activeRoute.includes('from=orders_reserved') ||
    activeRoute.includes('tab=reservedVehicles');
  const isOrdersPurchasedSource =
    (backLabel?.toLowerCase().includes('purchased') ?? false) ||
    activeRoute.includes('from=orders_purchased') ||
    activeRoute.includes('tab=purchasedVehicles');
  const isInquiriesSource =
    (backLabel?.toLowerCase().includes('inquir') ?? false) ||
    activeRoute.includes('from=inquiries') ||
    activeRoute.startsWith('/inquiries');

  const resolvedBackLabel =
    backLabel ||
    (isInquiriesSource
      ? 'Back to Inquiries & Quotes'
      : isOrdersReservedSource
      ? 'Back to Reserved Vehicles'
      : isOrdersPurchasedSource
      ? 'Back to Purchased Vehicles'
      : isWishlistSource
      ? 'Back to Wishlist'
      : isDashboardSource
      ? 'Back to Recommended Vehicles'
      : 'Back to Inventory');

  const handleBack = () => {
    if (isInquiriesSource) {
      setActiveRoute('/inquiries');
      return;
    }
    if (isOrdersReservedSource) {
      setActiveRoute('/vehicles?tab=reservedVehicles');
      return;
    }
    if (isOrdersPurchasedSource) {
      setActiveRoute('/vehicles?tab=purchasedVehicles');
      return;
    }
    if (onBack) {
      onBack();
    } else {
      if (isWishlistSource) {
        setActiveRoute('/wishlist');
      } else if (isDashboardSource) {
        setActiveRoute('/dashboard?section=personalized_vehicles');
      } else {
        setActiveRoute('/inventory');
      }
    }
  };

  const { state, refetch, reserveVehicle, requestPriceInquiry } = useCustomerVehicleDetail({
    idOrSlug: slug,
    apiBaseUrl,
    token,
    destinationCountry,
  });

  const { vehicle, loading, error, reserving, reserveSuccess, reserveError, holdExpiresAt } = state;

  // Interactive Gallery state
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | '360'>('photos');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [thumbPage, setThumbPage] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 360 Interactive Spin state
  const [spin360Index, setSpin360Index] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [is360Dragging, setIs360Dragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartIndexRef = useRef<number>(0);

  // Equipment toggles
  const [equipmentView, setEquipmentView] = useState<'equipped' | 'all'>('equipped');

  // CIF Calculator State
  const [selectedCountryName, setSelectedCountryName] = useState('Kenya');
  const [selectedPortIndex, setSelectedPortIndex] = useState(0);
  const [includeInsurance, setIncludeInsurance] = useState(false);

  // In-page Inquiry Form State
  const [inquiryName, setInquiryName] = useState(profile?.name || user?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(profile?.email || user?.email || '');
  const [inquiryPhone, setInquiryPhone] = useState(profile?.phone || '');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmittedLocal, setInquirySubmittedLocal] = useState(false);
  const [freeQuoteSuccess, setFreeQuoteSuccess] = useState(false);

  // Buy Now and PayPal Procurement Modals State
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyNowConfirmed, setBuyNowConfirmed] = useState(false);
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [payPalPaymentType, setPayPalPaymentType] = useState<'deposit' | 'full'>('deposit');
  const [payPalProcessing, setPayPalProcessing] = useState(false);
  const [payPalSuccess, setPayPalSuccess] = useState(false);

  const handleProcessPayPal = () => {
    setPayPalProcessing(true);
    setTimeout(() => {
      setPayPalProcessing(false);
      setPayPalSuccess(true);
    }, 850);
  };

  const handleConfirmBuyNow = () => {
    setBuyNowConfirmed(true);
  };

  const countrySelectId = useId();

  // Populate message once vehicle loads
  useEffect(() => {
    if (vehicle && !inquiryMessage) {
      setInquiryMessage(
        `Hello, I am interested in purchasing the ${vehicle.year} ${vehicle.make} ${vehicle.model}. Please let me know its availability and the next steps.`
      );
    }
  }, [vehicle, inquiryMessage]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const total = vehicle?.media ? getVisibleGalleryImages(vehicle.media).length || FALLBACK_IMAGES.length : FALLBACK_IMAGES.length;
        return (prev + 1) % total;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [isPlaying, vehicle]);

  // 360 Auto-spin timer
  useEffect(() => {
    if (!isAutoSpinning || activeMediaTab !== '360') return;
    const interval = setInterval(() => {
      setSpin360Index((prev) => (prev + 1) % SPIN_360_ANGLES.length);
    }, 700);
    return () => clearInterval(interval);
  }, [isAutoSpinning, activeMediaTab]);

  if (loading) {
    return (
      <div className="cc-cust-detail-state" role="status" aria-live="polite">
        <div className="cc-cust-shell-spinner" aria-hidden="true" />
        <p>Loading vehicle details...</p>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="cc-cust-detail-state cc-cust-detail-state--error" role="alert">
        <h2>Unable to load vehicle</h2>
        <p>{error || 'Vehicle not found'}</p>
        <div className="cc-cust-detail-state__actions">
          {handleBack && (
            <button type="button" className="cc-cust-btn cc-cust-btn--secondary" onClick={handleBack}>
              &larr; {resolvedBackLabel}
            </button>
          )}
          <button type="button" className="cc-cust-btn cc-cust-btn--primary" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const title = formatVehicleTitle(vehicle);
  const resolvedImages = vehicle.media ? getVisibleGalleryImages(vehicle.media) : [];
  const images = resolvedImages.length >= 60
    ? resolvedImages
    : [...resolvedImages, ...FALLBACK_IMAGES.slice(resolvedImages.length)];

  const thumbsPerPage = isMobile ? 8 : THUMBS_PER_PAGE;
  const totalThumbPages = Math.ceil(images.length / thumbsPerPage);
  const visibleThumbnails = images.slice(
    thumbPage * thumbsPerPage,
    (thumbPage + 1) * thumbsPerPage
  );

  const handlePrevImage = () => {
    const nextIdx = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(nextIdx);
    setThumbPage(Math.floor(nextIdx / thumbsPerPage));
  };

  const handleNextImage = () => {
    const nextIdx = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(nextIdx);
    setThumbPage(Math.floor(nextIdx / thumbsPerPage));
  };

  const spin360Frames = SPIN_360_ANGLES.map((ang, idx) => ({
    ...ang,
    url: images[idx % images.length],
  }));

  const handle360MouseDown = (e: React.MouseEvent) => {
    setIsAutoSpinning(false);
    setIs360Dragging(true);
    dragStartXRef.current = e.clientX;
    dragStartIndexRef.current = spin360Index;
  };

  const handle360MouseMove = (e: React.MouseEvent) => {
    if (!is360Dragging || dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const step = Math.round(deltaX / 30);
    const newIdx =
      ((dragStartIndexRef.current - step) % SPIN_360_ANGLES.length + SPIN_360_ANGLES.length) %
      SPIN_360_ANGLES.length;
    setSpin360Index(newIdx);
  };

  const handle360MouseUp = () => {
    setIs360Dragging(false);
    dragStartXRef.current = null;
  };

  const handle360TouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsAutoSpinning(false);
    setIs360Dragging(true);
    dragStartXRef.current = e.touches[0].clientX;
    dragStartIndexRef.current = spin360Index;
  };

  const handle360TouchMove = (e: React.TouchEvent) => {
    if (!is360Dragging || dragStartXRef.current === null || e.touches.length === 0) return;
    const deltaX = e.touches[0].clientX - dragStartXRef.current;
    const step = Math.round(deltaX / 30);
    const newIdx =
      ((dragStartIndexRef.current - step) % SPIN_360_ANGLES.length + SPIN_360_ANGLES.length) %
      SPIN_360_ANGLES.length;
    setSpin360Index(newIdx);
  };

  const handle360TouchEnd = () => {
    setIs360Dragging(false);
    dragStartXRef.current = null;
  };

  const step360 = (direction: 'prev' | 'next') => {
    setIsAutoSpinning(false);
    setSpin360Index((prev) => {
      const offset = direction === 'next' ? 1 : -1;
      return (prev + offset + SPIN_360_ANGLES.length) % SPIN_360_ANGLES.length;
    });
  };

  const isRequestPrice = Boolean(vehicle.requestPrice || vehicle.priceState === 'request_price' || !vehicle.priceUsd);
  const tierPricing = vehicle.tierPricing;
  const originalPrice = tierPricing ? tierPricing.originalPriceUsd : (vehicle.priceUsd ?? 0);
  const hasTierDiscount = Boolean(tierPricing && tierPricing.tierDiscountPercent > 0);
  const finalPrice = hasTierDiscount
    ? tierPricing!.tierPriceUsd
    : (vehicle.discountedPriceUsd ?? vehicle.priceUsd ?? 0);

  // Price calculations matching the exact screenshot
  const regularFobPrice = isRequestPrice ? null : Math.round(originalPrice > 0 ? originalPrice * 1.15 : (finalPrice * 1.15 || 281750));
  const activeDealerPrice = isRequestPrice ? null : (finalPrice > 0 ? finalPrice : 245000);
  const estDeposit = activeDealerPrice ? Math.round(activeDealerPrice * 0.1) : null;

  // CIF calculations
  const selectedCountryData = DESTINATIONS.find((d) => d.country === selectedCountryName) || DESTINATIONS[0];
  const selectedPort = selectedCountryData.ports[selectedPortIndex] || selectedCountryData.ports[0];
  const freightCost = selectedPort?.costUsd ?? 1656;
  const insuranceCost = includeInsurance ? 250 : 0;
  const landedTotal = activeDealerPrice ? activeDealerPrice + freightCost + insuranceCost : freightCost + insuranceCost;

  const eligibility = vehicle.reservationEligibility;
  const displayExpiry = holdExpiresAt || eligibility?.holdExpiresAt;
  const formattedExpiry = displayExpiry ? new Date(displayExpiry).toLocaleString() : '';

  // Handle in-page inquiry submission
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await requestPriceInquiry(inquiryMessage);
    if (res) {
      setInquirySubmittedLocal(true);
    }
  };

  const handleGetFreeQuote = () => {
    setFreeQuoteSuccess(true);
    const element = document.getElementById('vehicle-inquiry-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Stock ID formatting: clean, elegant short lot / stock number
  const stockDisplay = (() => {
    const rawStock = (vehicle as unknown as Record<string, unknown>).stockNumber as string | undefined;
    if (rawStock) {
      const clean = rawStock.trim().toUpperCase();
      return clean.startsWith('LOT') ? clean : `LOT ${clean}`;
    }
    const lotMatch = vehicle.slug?.match(/lot[-_]?([a-z0-9]+)/i);
    if (lotMatch) {
      return `LOT ${lotMatch[1].toUpperCase()}`;
    }
    if (vehicle.chassisNumber) {
      const cleanChassis = vehicle.chassisNumber.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanChassis.length >= 4) {
        return `LOT ${cleanChassis.slice(-4).toUpperCase()}`;
      }
    }
    return 'LOT 3044';
  })();
  const jaaiGrade = '4.5 / A';

  // Canonical status mapping: AVAILABLE, RESERVED, or SOLD
  const normalizedStatus = (() => {
    if (
      isOrdersReservedSource ||
      activeRoute.includes('status=reserved') ||
      activeRoute.includes('status=RESERVED')
    ) {
      return 'RESERVED';
    }
    if (
      isOrdersPurchasedSource ||
      activeRoute.includes('status=sold') ||
      activeRoute.includes('status=SOLD')
    ) {
      return 'SOLD';
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('carchief_48h_reservations');
        if (saved) {
          const list: { vehicleId: string }[] = JSON.parse(saved);
          if (list.some((r) => r.vehicleId === vehicle.id || r.vehicleId === slug)) {
            return 'RESERVED';
          }
        }
      } catch {
        // ignore
      }
    }
    const reason = (vehicle.reservationEligibility?.reason as string) || '';
    const raw = (
      vehicle.reservationEligibility && !vehicle.reservationEligibility.eligible &&
      (reason.includes('reserve') || reason.includes('hold'))
        ? 'RESERVED'
        : vehicle.statusLabel || vehicle.status || 'AVAILABLE'
    ).toUpperCase();

    if (raw === 'RESERVEDWITHPI' || raw.includes('RESERV') || raw.includes('HOLD')) {
      return 'RESERVED';
    }
    if (
      raw.includes('SOLD') ||
      raw.includes('ADVANCED') ||
      raw.includes('PURCHASED') ||
      raw.includes('DISPATCHED') ||
      raw.includes('PAID') ||
      raw.includes('INVOIC')
    ) {
      return 'SOLD';
    }
    return 'AVAILABLE';
  })();

  const isVehicleReserved =
    normalizedStatus === 'RESERVED' ||
    reserveSuccess ||
    eligibility?.isOwnHold ||
    isOrdersReservedSource ||
    eligibility?.reason === 'reserved_by_other';

  const isVehicleSold =
    normalizedStatus === 'SOLD' ||
    isOrdersPurchasedSource;

  const isActionDisabled = isVehicleReserved || isVehicleSold;

  return (
    <div className="cc-cust-detail-page" data-testid="customer-vehicle-detail-page">
      {/* Back Navigation */}
      <nav className="cc-cust-breadcrumb-bar" aria-label="Back navigation">
        <button
          type="button"
          className="cc-cust-breadcrumb-back-btn"
          onClick={handleBack}
          aria-label={resolvedBackLabel}
        >
          &larr; {resolvedBackLabel}
        </button>
        {isInquiriesSource ? (
          <>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/inquiries')}
            >
              My Inquiries &amp; Quotes
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <span className="cc-cust-breadcrumb-current" aria-current="page">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </>
        ) : isDashboardSource ? (
          <>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/dashboard')}
            >
              Dashboard
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/dashboard?section=personalized_vehicles')}
            >
              Recommended Vehicles
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <span className="cc-cust-breadcrumb-current" aria-current="page">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </>
        ) : isOrdersReservedSource ? (
          <>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/vehicles')}
            >
              My Orders
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/vehicles?tab=reservedVehicles')}
            >
              Reserved Vehicles
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <span className="cc-cust-breadcrumb-current" aria-current="page">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </>
        ) : isOrdersPurchasedSource ? (
          <>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/vehicles')}
            >
              My Orders
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/vehicles?tab=purchasedVehicles')}
            >
              Purchased Vehicles
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <span className="cc-cust-breadcrumb-current" aria-current="page">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </>
        ) : isWishlistSource ? (
          <>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/wishlist')}
            >
              My Wishlist
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <span className="cc-cust-breadcrumb-current" aria-current="page">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </>
        ) : (
          <>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <button
              type="button"
              className="cc-cust-breadcrumb-link"
              onClick={() => setActiveRoute('/inventory')}
            >
              All Inventory Stock
            </button>
            <span className="cc-cust-breadcrumb-sep">/</span>
            <span className="cc-cust-breadcrumb-current" aria-current="page">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </>
        )}
      </nav>

      {/* Main 2-Column Bento Layout */}
      <div className="cc-cust-detail-grid">
        {/* =========================================================================
            LEFT COLUMN: Gallery, Overview, Specifications, Equipment, Selling Points, Form
            ========================================================================= */}
        <div className="cc-cust-detail-gallery-col">
          {/* Interactive Vehicle Gallery Card */}
          <section className="cc-cust-card cc-cust-gallery-box" aria-label="Vehicle Media Gallery">
            {/* Top tab bar */}
            <div className="cc-cust-gallery-topbar">
              <div className="cc-cust-gallery-tabs">
                <button
                  type="button"
                  className={`cc-cust-gallery-tab ${activeMediaTab === 'photos' ? 'cc-cust-gallery-tab--active' : ''}`}
                  onClick={() => {
                    setIsAutoSpinning(false);
                    setActiveMediaTab('photos');
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  PHOTOS ({images.length})
                </button>
                <button
                  type="button"
                  className={`cc-cust-gallery-tab ${activeMediaTab === '360' ? 'cc-cust-gallery-tab--active' : ''}`}
                  onClick={() => setActiveMediaTab('360')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  360° VIEW
                </button>
              </div>

              <div className="cc-cust-gallery-badge-jaai">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                JAAI Certified
              </div>
            </div>

            {/* Stage: 360 Interactive Spin or Photo Stage */}
            {activeMediaTab === '360' ? (
              <div
                className={`cc-cust-360-stage ${is360Dragging ? 'cc-cust-360-stage--dragging' : ''}`}
                onMouseDown={handle360MouseDown}
                onMouseMove={handle360MouseMove}
                onMouseUp={handle360MouseUp}
                onMouseLeave={handle360MouseUp}
                onTouchStart={handle360TouchStart}
                onTouchMove={handle360TouchMove}
                onTouchEnd={handle360TouchEnd}
                tabIndex={0}
                role="region"
                aria-label="360 degree interactive vehicle spin viewer"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    step360('prev');
                  } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    step360('next');
                  }
                }}
              >
                {/* Turntable Floor Glow */}
                <div className="cc-cust-360-turntable-floor" aria-hidden="true" />

                {/* Top overlay badges */}
                <div className="cc-cust-360-topbar">
                  <div className="cc-cust-360-badge-spin">
                    <span className="cc-cust-360-spin-icon" aria-hidden="true">↻</span>
                    <span>360° EXTERIOR ROTATION</span>
                  </div>

                  <div className="cc-cust-360-angle-badge">
                    <span className="cc-cust-360-angle-num">{SPIN_360_ANGLES[spin360Index].deg}°</span>
                    <span className="cc-cust-360-angle-text">{SPIN_360_ANGLES[spin360Index].label}</span>
                  </div>
                </div>

                {/* Preloaded stack of images for instant lag-free rotation */}
                <div className="cc-cust-360-frames-wrap">
                  {spin360Frames.map((frame, idx) => (
                    <img
                      key={`frame-360-${idx}`}
                      src={frame.url}
                      alt={`${title} - 360 view ${frame.label}`}
                      className={`cc-cust-360-frame ${idx === spin360Index ? 'cc-cust-360-frame--active' : ''}`}
                      loading="eager"
                      draggable={false}
                    />
                  ))}
                </div>

                {/* Drag hint */}
                <div className="cc-cust-360-hint" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M7 16l-4-4m0 0l4-4m-4 4h18m-4 4l4-4m0 0l-4-4" />
                  </svg>
                  <span>Drag left / right to spin vehicle 360°</span>
                </div>

                {/* Left/Right Step Controls */}
                <button
                  type="button"
                  className="cc-cust-gallery-arrow cc-cust-gallery-arrow--prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    step360('prev');
                  }}
                  aria-label="Rotate left 45 degrees"
                  title="Previous Angle (⟲ 45°)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="cc-cust-gallery-arrow cc-cust-gallery-arrow--next"
                  onClick={(e) => {
                    e.stopPropagation();
                    step360('next');
                  }}
                  aria-label="Rotate right 45 degrees"
                  title="Next Angle (⟳ 45°)"
                >
                  ›
                </button>
              </div>
            ) : (
              <div className="cc-cust-gallery-stage">
                <div className="cc-cust-gallery-overlay-badges">
                  <span className="cc-cust-badge-used">USED</span>
                  <span className={`cc-cust-badge-status cc-cust-badge-status--${normalizedStatus.toLowerCase()}`}>
                    {normalizedStatus}
                  </span>
                </div>

                <div className="cc-cust-gallery-overlay-controls">
                  <button
                    type="button"
                    className="cc-cust-gallery-ctrl-btn"
                    onClick={() => setIsZoomed((z) => !z)}
                    title="Toggle Zoom"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    ZOOM
                  </button>
                  <span className="cc-cust-gallery-counter">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                  <button
                    type="button"
                    className={`cc-cust-gallery-ctrl-btn ${isPlaying ? 'cc-cust-gallery-ctrl-btn--active' : ''}`}
                    onClick={() => setIsPlaying((p) => !p)}
                    title="Toggle Slideshow"
                  >
                    ▶ {isPlaying ? 'PAUSE' : 'PLAY'}
                  </button>
                </div>

                {/* Main Image Display */}
                <div className={`cc-cust-gallery-main-img-wrap ${isZoomed ? 'cc-cust-gallery-main-img-wrap--zoomed' : ''}`}>
                  <img
                    src={images[currentImageIndex]}
                    alt={`${title} - View ${currentImageIndex + 1}`}
                    className="cc-cust-gallery-main-img"
                    loading="eager"
                  />
                </div>

                {/* Navigation Arrows */}
                <button
                  type="button"
                  className="cc-cust-gallery-arrow cc-cust-gallery-arrow--prev"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="cc-cust-gallery-arrow cc-cust-gallery-arrow--next"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  ›
                </button>
              </div>
            )}

            {/* Bottom Controls / Thumbnails Panel */}
            {activeMediaTab === '360' ? (
              <div className="cc-cust-360-bottom-panel">
                <div className="cc-cust-360-controls-bar">
                  <button
                    type="button"
                    className={`cc-cust-360-btn-autospin ${isAutoSpinning ? 'cc-cust-360-btn-autospin--active' : ''}`}
                    onClick={() => setIsAutoSpinning((prev) => !prev)}
                    title={isAutoSpinning ? 'Pause automatic rotation' : 'Start automatic 360 rotation'}
                  >
                    {isAutoSpinning ? (
                      <>
                        <span className="cc-cust-360-pulse-dot" aria-hidden="true" />
                        <span>PAUSE SPIN</span>
                      </>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>AUTO SPIN 360°</span>
                      </>
                    )}
                  </button>

                  <div className="cc-cust-360-slider-container">
                    <span className="cc-cust-360-slider-label">SCRUB ROTATION</span>
                    <input
                      type="range"
                      min={0}
                      max={SPIN_360_ANGLES.length - 1}
                      step={1}
                      value={spin360Index}
                      onChange={(e) => {
                        setIsAutoSpinning(false);
                        setSpin360Index(Number(e.target.value));
                      }}
                      className="cc-cust-360-slider-input"
                      aria-label="Rotate vehicle 360 angle slider"
                    />
                    <span className="cc-cust-360-slider-deg">{SPIN_360_ANGLES[spin360Index].deg}°</span>
                  </div>

                  <button
                    type="button"
                    className="cc-cust-360-btn-reset"
                    onClick={() => {
                      setIsAutoSpinning(false);
                      setSpin360Index(0);
                    }}
                    title="Reset to front angle (0°)"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    <span>FRONT (0°)</span>
                  </button>
                </div>

                {/* 8 Angle Presets Strip */}
                <div className="cc-cust-360-angles-strip" role="group" aria-label="360 degree angle presets">
                  {spin360Frames.map((frame, idx) => {
                    const isActive = spin360Index === idx;
                    return (
                      <button
                        key={`angle-pill-${idx}`}
                        type="button"
                        className={`cc-cust-360-angle-item ${isActive ? 'cc-cust-360-angle-item--active' : ''}`}
                        onClick={() => {
                          setIsAutoSpinning(false);
                          setSpin360Index(idx);
                        }}
                        aria-pressed={isActive}
                      >
                        <div className="cc-cust-360-angle-thumb-wrap">
                          <img src={frame.url} alt={frame.label} loading="lazy" />
                          <span className="cc-cust-360-angle-deg-pill">{frame.deg}°</span>
                        </div>
                        <span className="cc-cust-360-angle-caption">{frame.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* 20 Thumbnails Grid with Dots for Next 20 */}
                {showThumbnails && (
                  <div className="cc-cust-gallery-thumbs-wrap">
                    <div className="cc-cust-gallery-thumbs-20">
                      {visibleThumbnails.map((imgUrl, localIdx) => {
                        const globalIdx = thumbPage * thumbsPerPage + localIdx;
                        const isActive = currentImageIndex === globalIdx;
                        return (
                          <button
                            key={`thumb-20-${globalIdx}`}
                            type="button"
                            className={`cc-cust-thumb-item-20 ${isActive ? 'cc-cust-thumb-item-20--active' : ''}`}
                            onClick={() => setCurrentImageIndex(globalIdx)}
                            aria-label={`View photo ${globalIdx + 1}`}
                          >
                            <img src={imgUrl} alt={`Thumbnail ${globalIdx + 1}`} loading="lazy" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Batch Pagination Bar with Dots */}
                    <div className="cc-cust-gallery-batch-bar">
                      <div className="cc-cust-batch-nav-group">
                        <button
                          type="button"
                          className="cc-cust-batch-nav-btn"
                          onClick={() => {
                            const prevP = Math.max(0, thumbPage - 1);
                            setThumbPage(prevP);
                            setCurrentImageIndex(prevP * thumbsPerPage);
                          }}
                          disabled={thumbPage === 0}
                          aria-label={`Previous ${thumbsPerPage} photos`}
                        >
                          ‹ PREV {thumbsPerPage}
                        </button>

                        <div className="cc-cust-gallery-batch-dots" role="tablist" aria-label="Photo batches">
                          {Array.from({ length: totalThumbPages }).map((_, pIdx) => (
                            <button
                              key={`batch-dot-${pIdx}`}
                              type="button"
                              role="tab"
                              aria-selected={thumbPage === pIdx}
                              className={`cc-cust-batch-dot ${thumbPage === pIdx ? 'cc-cust-batch-dot--active' : ''}`}
                              onClick={() => {
                                setThumbPage(pIdx);
                                setCurrentImageIndex(pIdx * thumbsPerPage);
                              }}
                              title={`Photos ${pIdx * thumbsPerPage + 1} - ${Math.min((pIdx + 1) * thumbsPerPage, images.length)}`}
                            >
                              <span className="sr-only">Batch {pIdx + 1}</span>
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="cc-cust-batch-nav-btn"
                          onClick={() => {
                            const nextP = Math.min(totalThumbPages - 1, thumbPage + 1);
                            setThumbPage(nextP);
                            setCurrentImageIndex(nextP * thumbsPerPage);
                          }}
                          disabled={thumbPage >= totalThumbPages - 1}
                          aria-label={`Next ${thumbsPerPage} photos`}
                        >
                          NEXT {thumbsPerPage} ›
                        </button>
                      </div>

                      <span className="cc-cust-batch-indicator">
                        Showing Photos <strong>{thumbPage * thumbsPerPage + 1}–{Math.min((thumbPage + 1) * thumbsPerPage, images.length)}</strong> of {images.length}
                      </span>

                      <button
                        type="button"
                        className="cc-cust-gallery-toggle-thumbs"
                        onClick={() => setShowThumbnails(false)}
                      >
                        Hide thumbnails
                      </button>
                    </div>
                  </div>
                )}

                {!showThumbnails && (
                  <div className="cc-cust-gallery-thumbs-collapsed">
                    <button
                      type="button"
                      className="cc-cust-gallery-toggle-thumbs"
                      onClick={() => setShowThumbnails(true)}
                    >
                      Show 20 thumbnails
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Condition Assessment & Overview */}
          <section className="cc-cust-card cc-cust-overview-section" aria-label="Condition Assessment and Overview">
            <div className="cc-cust-section-title-row cc-cust-section-title-row--divider">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">CONDITION ASSESSMENT &amp; OVERVIEW</h2>
              </div>
            </div>

            <p className="cc-cust-overview-p">
              {isMobile
                ? 'Certified Grade A export vehicle. Verified odometer reading, zero flood or major accident structural chassis damage.'
                : 'Certified Grade A export vehicle inspected by JAAI / EAA certified automotive engineers. Verified odometer reading, zero flood or major accident structural chassis damage. Clean interior and immaculate mechanical performance.'}
            </p>

            <div className="cc-cust-guarantee-card">
              <div className="cc-cust-guarantee-header">
                <span className="cc-cust-guarantee-icon" aria-hidden="true">ⓘ</span>
                <strong>CARCHIEF SECURED INVENTORY GUARANTEE:</strong>
              </div>
              <p className="cc-cust-guarantee-body">
                This vehicle is backed by our pre-purchase inspection certification program. All specifications are certified by certified auto engineers prior to entering dynamic freight cargo.
              </p>
            </div>
          </section>

          {/* Specifications & Features */}
          <section className="cc-cust-card cc-cust-specs-section" aria-label="Vehicle Specifications and Features">
            <div className="cc-cust-section-title-row cc-cust-section-title-row--space">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">SPECIFICATIONS &amp; FEATURES</h2>
              </div>
              <span className="cc-cust-pill-count">5 Specs • 35 Features</span>
            </div>

            {/* 5 Top Key Spec Metric Cards */}
            <div className="cc-cust-key-metrics-grid">
              <div className="cc-cust-key-metric-card">
                <span className="cc-cust-key-metric-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-label">ENGINE</span>
                <span className="cc-cust-key-metric-val">{vehicle.engineSize || '4.0L Naturally'}</span>
              </div>

              <div className="cc-cust-key-metric-card">
                <span className="cc-cust-key-metric-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 8 10" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-label">MILEAGE</span>
                <span className="cc-cust-key-metric-val">{vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} KM` : '2,800 KM'}</span>
              </div>

              <div className="cc-cust-key-metric-card">
                <span className="cc-cust-key-metric-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 22h12M4 9h10M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
                    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L19 6" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-label">FUEL</span>
                <span className="cc-cust-key-metric-val">{(vehicle.fuelType || 'PETROL').toUpperCase()}</span>
              </div>

              <div className="cc-cust-key-metric-card">
                <span className="cc-cust-key-metric-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-label">TRANSMISSION</span>
                <span className="cc-cust-key-metric-val">{vehicle.transmission || '7-Speed Porsch'}</span>
              </div>

              <div className="cc-cust-key-metric-card">
                <span className="cc-cust-key-metric-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-label">COLOR</span>
                <span className="cc-cust-key-metric-val" title={(vehicle.color || 'GT SILVER METALLIC').toUpperCase()}>
                  {(vehicle.color || 'GT SILVER METALLI...').toUpperCase()}
                </span>
              </div>
            </div>

            {/* 2-Column Full Specifications Table matching reference */}
            <div className="cc-cust-specs-grid-table">
              {/* Row 1: Make | Model Code */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Make</span>
                  <span className="cc-cust-specs-value">{(vehicle.make || 'PORSCHE').toUpperCase()}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Model Code</span>
                  <span className="cc-cust-specs-value">{vehicle.modelCode || '992-GT3RS-7129'}</span>
                </div>
              </div>

              {/* Row 2: Model | Version/Class */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Model</span>
                  <span className="cc-cust-specs-value">{(vehicle.model || '911 GT3 RS').toUpperCase()}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Version/Class</span>
                  <span className="cc-cust-specs-value cc-cust-specs-value--truncate" title={vehicle.versionClass || `${vehicle.year || 2023} ${vehicle.make || 'Porsche'} ${vehicle.model || '911 GT3 RS'} Weissach Package`}>
                    {vehicle.versionClass || `${vehicle.year || 2023} ${vehicle.make || 'Porsche'} ${vehicle.model || '911 GT3 RS'} Wei...`}
                  </span>
                </div>
              </div>

              {/* Row 3: Stock No. | MFG Year/Mon */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Stock No.</span>
                  <span className="cc-cust-specs-value">{stockDisplay}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">MFG Year/Mon</span>
                  <span className="cc-cust-specs-value">{vehicle.mfgYear || `${vehicle.year || 2023} / 04`}</span>
                </div>
              </div>

              {/* Row 4: Chassis No | Fuel */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Chassis No</span>
                  <span className="cc-cust-specs-value cc-cust-mono">{vehicle.chassisNumber || 'WP0ZZZ99ZPS291082'}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Fuel</span>
                  <span className="cc-cust-specs-value">{(vehicle.fuelType || 'PETROL').toUpperCase()}</span>
                </div>
              </div>

              {/* Row 5: REG Year/Mon | Steering */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">REG Year/Mon</span>
                  <span className="cc-cust-specs-value">{vehicle.registerYear || `${vehicle.year || 2023} / 05`}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Steering</span>
                  <span className="cc-cust-specs-value">{((vehicle as unknown as Record<string, unknown>).steering as string)?.toUpperCase() || 'RIGHT HAND (RHD)'}</span>
                </div>
              </div>

              {/* Row 6: Mileage | Doors / Seats */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Mileage</span>
                  <span className="cc-cust-specs-value">{vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} KM` : '2,800 KM'}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Doors / Seats</span>
                  <span className="cc-cust-specs-value">5 Doors / 5 Seats</span>
                </div>
              </div>

              {/* Row 7: Engine | Gross Weight */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Engine</span>
                  <span className="cc-cust-specs-value">{vehicle.engineSize || '4.0L Naturally'}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Gross Weight</span>
                  <span className="cc-cust-specs-value">{((vehicle as unknown as Record<string, unknown>).grossWeight as string) || '1,250 KG'}</span>
                </div>
              </div>

              {/* Row 8: Transmission | Dimensions (LxWxH) */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Transmission</span>
                  <span className="cc-cust-specs-value">{vehicle.transmission || '7-Speed Porsch'}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Dimensions (LxWxH)</span>
                  <span className="cc-cust-specs-value">
                    {vehicle.dimensions?.lengthMm ? `${vehicle.dimensions.lengthMm}x${vehicle.dimensions.widthMm}x${vehicle.dimensions.heightMm} mm` : '3,995x1,695x1,620 mm'}
                  </span>
                </div>
              </div>

              {/* Row 9: Drive (2WD/4WD) | M3 Volume Size */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Drive (2WD/4WD)</span>
                  <span className="cc-cust-specs-value">{(vehicle.driveTrain || 'RWD').toUpperCase()}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">M3 Volume Size</span>
                  <span className="cc-cust-specs-value">{vehicle.dimensions?.m3 ? `${vehicle.dimensions.m3} m³` : '16.56 m³'}</span>
                </div>
              </div>

              {/* Row 10: Exterior Color | JAAI Grade */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Exterior Color</span>
                  <span className="cc-cust-specs-value cc-cust-specs-value--wrap">{(vehicle.color || 'GT SILVER METALLIC WITH PYRO RED ACCENTS').toUpperCase()}</span>
                </div>
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">JAAI Grade</span>
                  <span className="cc-cust-specs-value">{jaaiGrade}</span>
                </div>
              </div>

              {/* Row 11: Type | (empty) */}
              <div className="cc-cust-specs-row">
                <div className="cc-cust-specs-cell">
                  <span className="cc-cust-specs-label">Type</span>
                  <span className="cc-cust-specs-value">{(vehicle.bodyStyle || 'COUPE').toUpperCase()}</span>
                </div>
                <div className="cc-cust-specs-cell cc-cust-specs-cell--empty"></div>
              </div>
            </div>
          </section>

          {/* Features & Equipment */}
          <section className="cc-cust-card cc-cust-equipment-section" aria-label="Features and Equipment">
            <div className="cc-cust-section-title-row cc-cust-section-title-row--space">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">FEATURES &amp; EQUIPMENT</h2>
                <span className="cc-cust-badge-equipped-count">
                  {STANDARD_EQUIPMENT_LIST.length} / {ALL_EQUIPMENT_LIST.length} EQUIPPED
                </span>
              </div>

              <div className="cc-cust-toggle-btn-group">
                <button
                  type="button"
                  className={`cc-cust-toggle-btn ${equipmentView === 'equipped' ? 'cc-cust-toggle-btn--active' : ''}`}
                  onClick={() => setEquipmentView('equipped')}
                >
                  EQUIPPED ONLY
                </button>
                <button
                  type="button"
                  className={`cc-cust-toggle-btn ${equipmentView === 'all' ? 'cc-cust-toggle-btn--active' : ''}`}
                  onClick={() => setEquipmentView('all')}
                >
                  ALL ({ALL_EQUIPMENT_LIST.length})
                </button>
              </div>
            </div>

            <p className="cc-cust-sub-note">Factory certified features and installed comfort options</p>

            <div className="cc-cust-equipment-grid">
              {(equipmentView === 'equipped' ? STANDARD_EQUIPMENT_LIST : ALL_EQUIPMENT_LIST).map((item) => {
                const isEquipped = STANDARD_EQUIPMENT_LIST.includes(item);
                return (
                  <div
                    key={item}
                    className={`cc-cust-equipment-pill ${isEquipped ? 'cc-cust-equipment-pill--equipped' : 'cc-cust-equipment-pill--unequipped'}`}
                  >
                    <span className="cc-cust-equipment-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="cc-cust-equipment-text">{item}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Selling Points */}
          <section className="cc-cust-card cc-cust-selling-section" aria-label="Selling Points">
            <div className="cc-cust-section-title-row cc-cust-section-title-row--space">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">SELLING POINTS</h2>
              </div>
              <span className="cc-cust-pill-count">2 Highlights</span>
            </div>

            <div className="cc-cust-selling-pills">
              <div className="cc-cust-selling-pill">
                <span className="cc-cust-selling-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>NON SMOKER</span>
              </div>
              <div className="cc-cust-selling-pill">
                <span className="cc-cust-selling-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>ONE OWNER</span>
              </div>
            </div>
          </section>

          {/* In-page Specs Inquiry & Booking Form (Matching Attached Design) */}
          <section
            id="vehicle-inquiry-section"
            className="cc-cust-card cc-cust-inquiry-section"
            aria-label="Specs Inquiry & Booking Form"
          >
            <div className="cc-cust-section-title-row cc-cust-section-title-row--space">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">SPECS INQUIRY &amp; BOOKING FORM</h2>
              </div>
              <span className="cc-cust-badge-inquire-now">Inquire Now</span>
            </div>

            <p className="cc-cust-overview-p">
              Send a secure sales inquiry regarding this <strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong>.
              Our customer representatives will provide customized export estimates.
            </p>

            {inquirySubmittedLocal || state.inquirySuccess ? (
              <div className="cc-cust-inquiry-alert cc-cust-inquiry-alert--success" role="status">
                <span className="cc-cust-alert-icon">✓</span>
                <div>
                  <strong>Inquiry Spec File Submitted Successfully!</strong>
                  <p>
                    {state.inquiryId ? `Reference: #${state.inquiryId}. ` : ''}
                    Our dedicated VIP procurement desk will contact you with the complete export pro-forma quotation.
                  </p>
                </div>
              </div>
            ) : (
              <form className="cc-cust-spec-inquiry-form" onSubmit={handleInquirySubmit}>
                {state.inquiryError && (
                  <div className="cc-cust-inquiry-alert cc-cust-inquiry-alert--error" role="alert">
                    <span className="cc-cust-alert-icon">⚠️</span>
                    <span>{state.inquiryError}</span>
                  </div>
                )}

                <div className="cc-cust-form-row">
                  <div className="cc-cust-form-field">
                    <label className="cc-cust-form-label">FULL NAME</label>
                    <input
                      type="text"
                      className="cc-cust-form-input"
                      placeholder="John Doe"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="cc-cust-form-field">
                    <label className="cc-cust-form-label">EMAIL ADDRESS</label>
                    <input
                      type="email"
                      className="cc-cust-form-input"
                      placeholder="john@example.com"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="cc-cust-form-field">
                  <label className="cc-cust-form-label">PHONE (OPTIONAL)</label>
                  <input
                    type="tel"
                    className="cc-cust-form-input"
                    placeholder="+1 555-0199"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                  />
                </div>

                <div className="cc-cust-form-field">
                  <label className="cc-cust-form-label">INQUIRY MESSAGE</label>
                  <textarea
                    className="cc-cust-form-textarea"
                    rows={3}
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="cc-cust-btn-submit-inquiry"
                  disabled={state.inquirySubmitting}
                  data-testid="submit-inquiry-btn"
                >
                  {state.inquirySubmitting ? 'SUBMITTING SPEC FILE...' : 'SUBMIT INQUIRY SPEC FILE →'}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (Sidebar): Identity, Pricing, Reservation, CIF Estimator, Verified
            ========================================================================= */}
        <div className="cc-cust-detail-info-col">
          {/* Card 1: Vehicle Identity & Pricing (Combined Card with Inner Box) */}
          <div className="cc-cust-card cc-cust-identity-pricing-card" data-testid="vehicle-pricing-card">
            <div className="cc-cust-identity-top">
              <span className="cc-cust-stock-id-tag">STOCK #{stockDisplay}</span>
              <span className={`cc-cust-badge-status cc-cust-badge-status--${normalizedStatus.toLowerCase()}`} style={{ marginLeft: 'auto', marginRight: '6px' }}>
                {normalizedStatus}
              </span>
              <span className="cc-cust-rating-badge">{jaaiGrade}</span>
            </div>

            <h1 className="cc-cust-vehicle-hero-title">
              {vehicle.year} {(vehicle.make || 'NISSAN').toUpperCase()} {(vehicle.model || 'GT-R NISMO').toUpperCase()}
            </h1>
            <p className="cc-cust-vehicle-hero-subtitle">
              {vehicle.versionClass || `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.bodyStyle ? ` • ${vehicle.bodyStyle}` : ''}`.trim()}
            </p>

            <div className="cc-cust-identity-divider" />

            {/* Inner Pricing Box */}
            <div className="cc-cust-pricing-inner-box">
              <div className="cc-cust-pricing-table">
                {/* Row 1: Regular FOB Price */}
                <div className="cc-cust-pricing-row cc-cust-pricing-row--regular">
                  <span className="cc-cust-pricing-label">REGULAR FOB PRICE</span>
                  <span className={`cc-cust-regular-price-val ${isRequestPrice ? 'cc-cust-regular-price-val--ask' : ''}`}>
                    {isRequestPrice ? 'ASK' : `$${(regularFobPrice || 281750).toLocaleString()} USD`}
                  </span>
                </div>

                {/* Row 2: Gold Member Price */}
                <div className="cc-cust-pricing-row cc-cust-pricing-row--gold">
                  <div className="cc-cust-gold-label-group">
                    <span className="cc-cust-gold-label">GOLD MEMBER PRICE</span>
                    {!isRequestPrice && <span className="cc-cust-gold-discount-badge">-15% OFF</span>}
                  </div>
                  <div className="cc-cust-gold-price-val" data-testid="vehicle-final-price">
                    {isRequestPrice ? (
                      <span className="cc-cust-gold-price-amount">ASK</span>
                    ) : (
                      <>
                        <span className="cc-cust-gold-price-amount">${(activeDealerPrice || 245000).toLocaleString()}</span>
                        <span className="cc-cust-gold-price-currency"> USD</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="cc-cust-pricing-inner-divider" />

                {/* Row 3: Est. Deposit */}
                <div className="cc-cust-pricing-row cc-cust-pricing-row--stat">
                  <span className="cc-cust-stat-label">EST. DEPOSIT (10%)</span>
                  <span className="cc-cust-stat-badge">
                    {isRequestPrice ? 'ASK' : `$${(estDeposit || 24500).toLocaleString()} USD`}
                  </span>
                </div>

                {/* Row 4: Est. Landed C&F */}
                <div className="cc-cust-pricing-row cc-cust-pricing-row--stat">
                  <span className="cc-cust-stat-label">EST. LANDED C&amp;F</span>
                  <span className="cc-cust-stat-badge">
                    {isRequestPrice ? 'ASK' : `$${(landedTotal || 246906).toLocaleString()} USD`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Order & Reserve Vehicle Card */}
          <div className="cc-cust-card cc-cust-sidebar-reserve-card" data-testid="vehicle-reservation-card">
            <div className="cc-cust-reserve-header">
              <div className="cc-cust-reserve-title-group">
                <span className="cc-cust-reserve-bookmark-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <h3 className="cc-cust-reserve-title">ORDER &amp; RESERVATION</h3>
              </div>
              {isVehicleSold ? (
                <span className="cc-cust-badge-status cc-cust-badge-status--sold" style={{ marginLeft: 'auto' }}>
                  SOLD
                </span>
              ) : isVehicleReserved ? (
                <span className="cc-cust-badge-status cc-cust-badge-status--reserved" style={{ marginLeft: 'auto' }}>
                  RESERVED
                </span>
              ) : (
                <span className="cc-cust-reserve-quota-badge">
                  1/2 Active
                </span>
              )}
            </div>

            {isVehicleSold ? (
              <div className="cc-cust-reservation-status cc-cust-sold-status-box" role="status">
                <div className="cc-cust-res-status-top">
                  <span className="cc-cust-res-status-icon cc-cust-res-status-icon--sold">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  </span>
                  <strong className="cc-cust-res-status-heading">Vehicle Status: SOLD{isOrdersPurchasedSource ? ' (Purchased)' : ''}</strong>
                </div>
                <p className="cc-cust-res-status-sub">
                  {isOrdersPurchasedSource
                    ? 'This vehicle is in your purchased orders fleet and is currently progressing through shipment and delivery.'
                    : 'This vehicle has been sold and is no longer available for purchase or reservation.'}
                </p>
                {isOrdersPurchasedSource && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="cc-cust-btn cc-cust-btn--primary cc-cust-btn-back-to-tab"
                      onClick={handleBack}
                    >
                      &larr; Back to Purchased Vehicles
                    </button>
                  </div>
                )}
              </div>
            ) : isVehicleReserved ? (
              <div className="cc-cust-reservation-status cc-cust-reserved-status-box" role="status">
                <div className="cc-cust-res-status-top">
                  <span className="cc-cust-res-status-icon cc-cust-res-status-icon--reserved">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                    </svg>
                  </span>
                  <strong className="cc-cust-res-status-heading">Vehicle Status: RESERVED</strong>
                </div>
                <p className="cc-cust-res-status-sub">
                  {isOrdersReservedSource
                    ? 'This vehicle is currently held in your Reserved Vehicles queue. Reservation and purchase are locked.'
                    : eligibility?.reason === 'reserved_by_other'
                    ? `Another customer currently has an active 48h reservation on this vehicle${formattedExpiry ? ` (expiring at ${formattedExpiry})` : ''}.`
                    : 'This vehicle is currently reserved on a 48-hour hold. New purchase and reservation actions are unavailable.'}
                </p>
                {isOrdersReservedSource && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      className="cc-cust-btn cc-cust-btn--primary cc-cust-btn-back-to-tab"
                      onClick={handleBack}
                    >
                      &larr; Back to Reserved Vehicles
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            <div className="cc-cust-reserve-action-wrap">
              {reserveError && !isActionDisabled && (
                <div className="cc-cust-reservation-error" role="alert">
                  <p>{reserveError}</p>
                </div>
              )}
              <div className="cc-cust-reserve-btns-row">
                <button
                  type="button"
                  className="cc-cust-btn-buy-now"
                  onClick={() => {
                    if (isActionDisabled) return;
                    setBuyNowConfirmed(false);
                    setShowBuyNowModal(true);
                  }}
                  disabled={isActionDisabled}
                  aria-disabled={isActionDisabled}
                  title={
                    isVehicleSold
                      ? 'Vehicle is sold — Buy Now is disabled'
                      : isVehicleReserved
                      ? 'Vehicle is reserved — Buy Now is disabled'
                      : 'Instant procurement with Proforma Invoice'
                  }
                  data-testid="buy-now-btn"
                >
                  <span className="cc-cust-btn-buy-now__icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </span>
                  <span>BUY NOW</span>
                </button>
                <button
                  type="button"
                  className="cc-cust-btn-paypal"
                  onClick={() => {
                    if (isActionDisabled) return;
                    setPayPalSuccess(false);
                    setShowPayPalModal(true);
                  }}
                  disabled={isActionDisabled}
                  aria-disabled={isActionDisabled}
                  title={
                    isVehicleSold
                      ? 'Vehicle is sold — PayPal payment is disabled'
                      : isVehicleReserved
                      ? 'Vehicle is reserved — PayPal payment is disabled'
                      : 'Express checkout with PayPal'
                  }
                  data-testid="pay-paypal-btn"
                >
                  <span className="cc-cust-btn-paypal__icon">
                    <svg width="15" height="15" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M26.885 9.883c-.45-3.328-2.875-5.35-7.391-5.35H9.682a1.36 1.36 0 0 0-1.341 1.155L4.545 27.26a.85.85 0 0 0 .839.99h5.684l1.398-8.868-.044.277a1.36 1.36 0 0 1 1.341-1.155h2.955c5.312 0 9.475-2.158 10.687-8.423.064-.333.116-.658.156-.976.012-.08.02-.158.028-.237.062-.48.083-.902.046-1.185z" fill="#003087"/>
                      <path d="M28.021 11.233c-.062.48-.083.902-.046 1.185-1.212 6.265-5.375 8.423-10.687 8.423h-2.955a1.36 1.36 0 0 0-1.341 1.155l-1.442 9.145a.85.85 0 0 0 .839.99h4.819a1.36 1.36 0 0 0 1.341-1.155l1.092-6.928a1.36 1.36 0 0 1 1.341-1.155h1.229c4.636 0 8.27-1.883 9.328-7.352.441-2.285.215-4.205-1.463-5.558a5.2 5.2 0 0 0-3.055-.75z" fill="#0079C1"/>
                      <path d="M26.885 9.883c-.008.079-.016.157-.028.237-.04.318-.092.643-.156.976-.411 2.128-1.574 3.791-3.414 4.887-.905.538-2.001.886-3.266.886h-4.664l1.398-8.868h4.743c3.228 0 5.044 1.186 5.387 1.882z" fill="#00457C"/>
                    </svg>
                  </span>
                  <span>PAY WITH PAYPAL</span>
                </button>
              </div>
              <button
                type="button"
                className="cc-cust-btn-reserve-vehicle"
                onClick={reserveVehicle}
                disabled={isActionDisabled || reserving || eligibility?.eligible === false}
                aria-disabled={isActionDisabled || reserving || eligibility?.eligible === false}
                title={
                  isVehicleSold
                    ? 'Vehicle is sold — Reservation is disabled'
                    : isVehicleReserved
                    ? 'Vehicle is reserved — Reservation is disabled'
                    : 'Reserve vehicle for 48 hours ($0 deposit)'
                }
                data-testid="reserve-vehicle-btn"
              >
                <span className="cc-cust-reserve-dot" />
                <span className="cc-cust-reserve-btn-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    <polyline points="9 10 11 12 15 8" />
                  </svg>
                </span>
                <span>
                  {isVehicleSold
                    ? 'VEHICLE SOLD'
                    : isVehicleReserved
                    ? 'VEHICLE RESERVED'
                    : reserving
                    ? 'PLACING 48H HOLD...'
                    : 'RESERVE THIS VEHICLE (48H)'}
                </span>
              </button>
            </div>

            <p className="cc-cust-reserve-note">
              Instant purchase via <strong>T/T Wire</strong> or <strong>PayPal</strong>. Hold up to <strong>2 vehicles</strong> for 48h with <strong>$0 deposit</strong>.
            </p>
          </div>

          {/* Ocean Freight Estimator (CIF) */}
          <div className="cc-cust-card cc-cust-sidebar-cif-card">
            <div className="cc-cust-cif-header-row">
              <span className="cc-cust-cif-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" />
                  <path d="M4 18L3 12h18l-1 6" />
                  <path d="M7 12V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" />
                  <path d="M9 5V3h6v2" />
                </svg>
              </span>
              <h3 className="cc-cust-cif-title">OCEAN FREIGHT ESTIMATOR (CIF)</h3>
            </div>

            <div className="cc-cust-cif-top-divider" />

            <p className="cc-cust-cif-intro">
              Calculate global logistics ocean cargo fees and marine insurance for exporting this <strong>{vehicle.make || 'Nissan'}</strong>.
            </p>

            <div className="cc-cust-cif-inner-box">
              <h4 className="cc-cust-cif-inner-title">CIF CALCULATOR</h4>
              <div className="cc-cust-cif-inner-divider" />

              <div className="cc-cust-cif-field">
                <label htmlFor={countrySelectId} className="cc-cust-cif-label">
                  CHOOSE FINAL COUNTRY <span className="cc-cust-req-star">*</span>
                </label>
                <div className="cc-cust-cif-select-wrap">
                  <select
                    id={countrySelectId}
                    className="cc-cust-cif-select"
                    value={selectedCountryName}
                    onChange={(e) => {
                      setSelectedCountryName(e.target.value);
                      setSelectedPortIndex(0);
                    }}
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d.country} value={d.country}>
                        {d.country} {d.flag}
                      </option>
                    ))}
                  </select>
                  <span className="cc-cust-cif-select-arrow" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </div>
                <p className="cc-cust-cif-helper">
                  Please select the country where your vehicle(s) will be shipped.
                </p>
              </div>

              {/* M3 Size Box */}
              <div className="cc-cust-cif-m3-box">
                <span>M3 Size (LxWxH) : </span>
                <strong>{vehicle.dimensions?.m3 ? `${vehicle.dimensions.m3} m³` : '16.56 m³'}</strong>
              </div>

              {/* Ports Table */}
              <div className="cc-cust-cif-ports-table">
                <div className="cc-cust-cif-table-header">
                  <span>PORT / HUB</span>
                  <span>EST. TRANSIT</span>
                  <span className="cc-cust-text-right">TOTAL (C&amp;F)</span>
                </div>

                <div className="cc-cust-cif-table-body">
                  {selectedCountryData.ports.map((port, idx) => {
                    const isChecked = selectedPortIndex === idx;
                    const portTotal = activeDealerPrice ? activeDealerPrice + port.costUsd + (includeInsurance ? 250 : 0) : port.costUsd + (includeInsurance ? 250 : 0);

                    return (
                      <div
                        key={port.name}
                        className={`cc-cust-cif-table-row ${isChecked ? 'cc-cust-cif-table-row--selected' : ''}`}
                        onClick={() => setSelectedPortIndex(idx)}
                      >
                        <div className="cc-cust-cif-col-port">
                          <input
                            type="radio"
                            name="cifArrivalPort"
                            checked={isChecked}
                            onChange={() => setSelectedPortIndex(idx)}
                            className="cc-cust-cif-radio"
                          />
                          <div className="cc-cust-cif-port-name-wrap">
                            <span className="cc-cust-cif-port-name">{port.name}</span>
                            {port.cityDelivery && (
                              <span className="cc-cust-cif-city-pill">CITY DELIVERY</span>
                            )}
                          </div>
                        </div>

                        <div className="cc-cust-cif-col-transit">
                          <span>{port.duration}</span>
                        </div>

                        <div className="cc-cust-cif-col-price">
                          <span className="cc-cust-cif-port-total">
                            {isRequestPrice ? 'ASK' : `$${portTotal.toLocaleString()} USD`}
                          </span>
                          <span className="cc-cust-cif-port-freight">
                            {isRequestPrice ? 'Freight: ASK' : `Freight: $${port.costUsd.toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Options */}
              <div className="cc-cust-cif-options-group">
                <span className="cc-cust-cif-options-label">ADDITIONAL OPTIONS</span>
                <label className="cc-cust-cif-option-checkbox">
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="cc-cust-cif-checkbox"
                  />
                  <span className="cc-cust-cif-checkbox-text">
                    {isRequestPrice ? 'Marine Insurance (+ASK)' : `Marine Insurance (+${250})`}
                  </span>
                </label>
              </div>

              {/* Free Quote CTA Button */}
              <button
                type="button"
                className="cc-cust-btn-free-quote"
                onClick={handleGetFreeQuote}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>GET A FREE QUOTE</span>
              </button>

              {freeQuoteSuccess && (
                <div className="cc-cust-free-quote-banner" role="status">
                  ✓ CIF specifications locked ({selectedCountryName} - {selectedPort.name}). Complete the inquiry form below to lock your vessel allocation.
                </div>
              )}

              {/* C&F Total Bottom Row */}
              <div className="cc-cust-cif-bottom-total-row">
                <span className="cc-cust-cif-bottom-total-label">C&amp;F TOTAL</span>
                <div className="cc-cust-cif-bottom-total-val">
                  {isRequestPrice ? (
                    <span className="cc-cust-cif-bottom-amount">ASK</span>
                  ) : (
                    <>
                      <span className="cc-cust-cif-bottom-amount">${landedTotal.toLocaleString()}</span>
                      <span className="cc-cust-cif-bottom-currency"> USD</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 100% Japanese Export Verified Card */}
          <div className="cc-cust-card cc-cust-sidebar-verified-card">
            <div className="cc-cust-verified-header">
              <span className="cc-cust-verified-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="16 8 10 14 7 11" />
                </svg>
              </span>
              <h3 className="cc-cust-verified-title">100% JAPANESE EXPORT VERIFIED</h3>
            </div>

            <ul className="cc-cust-verified-list">
              <li>
                <span className="cc-cust-verified-check">•</span>
                <span>Genuine Odometer Inspection Certificate</span>
              </li>
              <li>
                <span className="cc-cust-verified-check">•</span>
                <span>De-registration &amp; Export Certificate Included</span>
              </li>
              <li>
                <span className="cc-cust-verified-check">•</span>
                <span>Pre-shipment Radiation &amp; Mechanical Checks</span>
              </li>
            </ul>

            <div className="cc-cust-verified-footer">
              <span className="cc-cust-ref-id">
                REF ID: <strong>{`v-${(vehicle.make || 'nissan').toLowerCase()}-${(vehicle.model || 'gtr-nismo').toLowerCase().replace(/\s+/g, '-')}`}</strong>
              </span>
              <span className="cc-cust-stock-ready-badge">STOCK READY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Now Modal (Instant Procurement & Proforma Invoice) */}
      {showBuyNowModal && (
        <div
          className="cc-cust-procure-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowBuyNowModal(false);
              setBuyNowConfirmed(false);
            }
          }}
        >
          <div
            className="cc-cust-procure-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buy-now-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="cc-cust-procure-modal__header">
              <div className="cc-cust-procure-modal__header-title-wrap">
                <span className="cc-cust-procure-modal__eyebrow">INSTANT PROCUREMENT &bull; PROFORMA INVOICE</span>
                <h2 id="buy-now-modal-title">Confirm Vehicle Purchase</h2>
              </div>
              <button
                type="button"
                className="cc-cust-procure-modal__close"
                onClick={() => {
                  setShowBuyNowModal(false);
                  setBuyNowConfirmed(false);
                }}
                aria-label="Close modal"
              >
                &times;
              </button>
            </header>

            <div className="cc-cust-procure-modal__body">
              {buyNowConfirmed ? (
                <div className="cc-cust-procure-success">
                  <div className="cc-cust-procure-success__icon-wrap">
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="16 8 10 14 7 11" />
                    </svg>
                  </div>
                  <h3 className="cc-cust-procure-success__title">Vehicle Purchase Confirmed!</h3>
                  <p className="cc-cust-procure-success__desc">
                    Your Proforma Invoice has been officially generated. Vehicle <strong>{stockDisplay}</strong> is now reserved in your procurement queue.
                  </p>
                  <div className="cc-cust-procure-success__invoice-card">
                    <div className="cc-cust-procure-success__row">
                      <span>INVOICE REF:</span>
                      <strong>PI-2024-{stockDisplay.replace(/[^0-9]/g, '') || '9142'}</strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>TOTAL AMOUNT:</span>
                      <strong className="cc-cust-procure-success__highlight">${(landedTotal || 246906).toLocaleString()} USD</strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>DESTINATION:</span>
                      <span>{selectedCountryName} &bull; {selectedPort?.name}</span>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>TERMS:</span>
                      <span>Bank Wire (T/T) within 5 business days</span>
                    </div>
                  </div>

                  <div className="cc-cust-procure-actions" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--primary"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setBuyNowConfirmed(false);
                        setActiveRoute('/payments?action=submit_proof');
                      }}
                    >
                      SUBMIT WIRE PROOF
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--secondary"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setBuyNowConfirmed(false);
                        setActiveRoute('/invoices');
                      }}
                    >
                      VIEW INVOICES
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setBuyNowConfirmed(false);
                      }}
                    >
                      DONE
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Vehicle Mini Bar */}
                  <div className="cc-cust-procure-vehicle-bar">
                    <div className="cc-cust-procure-vehicle-thumb">
                      <img
                        src={images[0] || '/images/placeholders/car-placeholder.jpg'}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      />
                    </div>
                    <div className="cc-cust-procure-vehicle-meta">
                      <span className="cc-cust-procure-lot">{stockDisplay}</span>
                      <h4 className="cc-cust-procure-veh-title">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <div className="cc-cust-procure-veh-sub">
                        <span>VIN: {vehicle.chassisNumber || 'Verified'}</span>
                        <span>&bull;</span>
                        <span>Port: {selectedPort?.name} ({selectedCountryName})</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="cc-cust-procure-summary-box">
                    <div className="cc-cust-procure-summary-row">
                      <span className="cc-cust-procure-label">Vehicle FOB Price:</span>
                      <span className="cc-cust-procure-val">
                        {isRequestPrice ? 'ASK' : `$${(activeDealerPrice || 245000).toLocaleString()} USD`}
                      </span>
                    </div>
                    <div className="cc-cust-procure-summary-row">
                      <span className="cc-cust-procure-label">Ocean Freight ({selectedPort?.name}):</span>
                      <span className="cc-cust-procure-val">${freightCost.toLocaleString()} USD</span>
                    </div>
                    <div className="cc-cust-procure-summary-row">
                      <span className="cc-cust-procure-label">Marine Insurance:</span>
                      <span className="cc-cust-procure-val">
                        {includeInsurance ? '$250 USD' : '$0 USD (Not Selected)'}
                      </span>
                    </div>
                    <div className="cc-cust-procure-summary-divider" />
                    <div className="cc-cust-procure-summary-row cc-cust-procure-summary-row--total">
                      <span className="cc-cust-procure-label">Total Landed Amount (CIF):</span>
                      <span className="cc-cust-procure-val cc-cust-procure-val--total">
                        {isRequestPrice ? 'ASK' : `$${landedTotal.toLocaleString()} USD`}
                      </span>
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div className="cc-cust-procure-buyer-info">
                    <div className="cc-cust-procure-buyer-row">
                      <span>Buyer Account:</span>
                      <strong>{profile?.name || user?.name || 'Customer Partner'}</strong>
                    </div>
                    <div className="cc-cust-procure-buyer-row">
                      <span>Billing Email:</span>
                      <span>{profile?.email || user?.email || 'fleet@dealership.com'}</span>
                    </div>
                    <div className="cc-cust-procure-buyer-row">
                      <span>Payment Terms:</span>
                      <span>Official Proforma Invoice issued with 5-day T/T wire lock</span>
                    </div>
                  </div>

                  <div className="cc-cust-procure-actions">
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--primary"
                      onClick={handleConfirmBuyNow}
                    >
                      CONFIRM &amp; ISSUE PROFORMA INVOICE
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                      onClick={() => setShowBuyNowModal(false)}
                    >
                      CANCEL
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PayPal Express Checkout Modal */}
      {showPayPalModal && (
        <div
          className="cc-cust-procure-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !payPalProcessing) {
              setShowPayPalModal(false);
              setPayPalSuccess(false);
            }
          }}
        >
          <div
            className="cc-cust-procure-modal cc-cust-procure-modal--paypal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paypal-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="cc-cust-procure-modal__header cc-cust-procure-modal__header--paypal">
              <div className="cc-cust-paypal-header-branding">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M26.885 9.883c-.45-3.328-2.875-5.35-7.391-5.35H9.682a1.36 1.36 0 0 0-1.341 1.155L4.545 27.26a.85.85 0 0 0 .839.99h5.684l1.398-8.868-.044.277a1.36 1.36 0 0 1 1.341-1.155h2.955c5.312 0 9.475-2.158 10.687-8.423.064-.333.116-.658.156-.976.012-.08.02-.158.028-.237.062-.48.083-.902.046-1.185z" fill="#003087"/>
                  <path d="M28.021 11.233c-.062.48-.083.902-.046 1.185-1.212 6.265-5.375 8.423-10.687 8.423h-2.955a1.36 1.36 0 0 0-1.341 1.155l-1.442 9.145a.85.85 0 0 0 .839.99h4.819a1.36 1.36 0 0 0 1.341-1.155l1.092-6.928a1.36 1.36 0 0 1 1.341-1.155h1.229c4.636 0 8.27-1.883 9.328-7.352.441-2.285.215-4.205-1.463-5.558a5.2 5.2 0 0 0-3.055-.75z" fill="#0079C1"/>
                  <path d="M26.885 9.883c-.008.079-.016.157-.028.237-.04.318-.092.643-.156.976-.411 2.128-1.574 3.791-3.414 4.887-.905.538-2.001.886-3.266.886h-4.664l1.398-8.868h4.743c3.228 0 5.044 1.186 5.387 1.882z" fill="#00457C"/>
                </svg>
                <div>
                  <span className="cc-cust-procure-modal__eyebrow" style={{ color: '#003087' }}>PAYPAL EXPRESS CHECKOUT</span>
                  <h2 id="paypal-modal-title" style={{ color: '#003087' }}>Fast &amp; Secure Payment</h2>
                </div>
              </div>
              <button
                type="button"
                className="cc-cust-procure-modal__close"
                onClick={() => {
                  if (!payPalProcessing) {
                    setShowPayPalModal(false);
                    setPayPalSuccess(false);
                  }
                }}
                aria-label="Close PayPal modal"
              >
                &times;
              </button>
            </header>

            <div className="cc-cust-procure-modal__body">
              {payPalSuccess ? (
                <div className="cc-cust-procure-success">
                  <div className="cc-cust-procure-success__icon-wrap cc-cust-procure-success__icon-wrap--paypal">
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#003087" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="16 8 10 14 7 11" />
                    </svg>
                  </div>
                  <h3 className="cc-cust-procure-success__title" style={{ color: '#003087' }}>PayPal Payment Approved!</h3>
                  <p className="cc-cust-procure-success__desc">
                    Your transaction has been securely captured by PayPal. Vehicle <strong>{stockDisplay}</strong> is now allocated to your fleet account.
                  </p>
                  <div className="cc-cust-procure-success__invoice-card">
                    <div className="cc-cust-procure-success__row">
                      <span>PAYPAL TXN ID:</span>
                      <strong>PP-TXN-7940182</strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>PAID AMOUNT:</span>
                      <strong className="cc-cust-procure-success__highlight">
                        ${(payPalPaymentType === 'deposit' ? (estDeposit || 24500) : landedTotal).toLocaleString()} USD
                      </strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>PAYMENT TYPE:</span>
                      <span>{payPalPaymentType === 'deposit' ? '10% Security Deposit (Allocation Hold)' : 'Full CIF Payment'}</span>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>STATUS:</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>COMPLETED &bull; ALLOCATED</span>
                    </div>
                  </div>

                  <div className="cc-cust-procure-actions" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--paypal"
                      onClick={() => {
                        setShowPayPalModal(false);
                        setPayPalSuccess(false);
                        setActiveRoute('/payments');
                      }}
                    >
                      VIEW PAYMENTS &amp; INVOICES
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                      onClick={() => {
                        setShowPayPalModal(false);
                        setPayPalSuccess(false);
                      }}
                    >
                      DONE
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Vehicle Summary Bar */}
                  <div className="cc-cust-procure-vehicle-bar">
                    <div className="cc-cust-procure-vehicle-thumb">
                      <img
                        src={images[0] || '/images/placeholders/car-placeholder.jpg'}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      />
                    </div>
                    <div className="cc-cust-procure-vehicle-meta">
                      <span className="cc-cust-procure-lot">{stockDisplay}</span>
                      <h4 className="cc-cust-procure-veh-title">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <div className="cc-cust-procure-veh-sub">
                        <span>Destination: {selectedPort?.name} ({selectedCountryName})</span>
                      </div>
                    </div>
                  </div>

                  {/* Deposit vs Full Selection */}
                  <div className="cc-cust-paypal-options">
                    <label
                      className={`cc-cust-paypal-option-card ${payPalPaymentType === 'deposit' ? 'cc-cust-paypal-option-card--selected' : ''}`}
                      onClick={() => setPayPalPaymentType('deposit')}
                    >
                      <div className="cc-cust-paypal-option-radio">
                        <input
                          type="radio"
                          name="paypalAmountOption"
                          checked={payPalPaymentType === 'deposit'}
                          onChange={() => setPayPalPaymentType('deposit')}
                        />
                      </div>
                      <div className="cc-cust-paypal-option-content">
                        <div className="cc-cust-paypal-option-header">
                          <span className="cc-cust-paypal-option-name">10% Security Deposit (Hold Vehicle)</span>
                          <span className="cc-cust-paypal-badge">RECOMMENDED</span>
                        </div>
                        <p className="cc-cust-paypal-option-sub">
                          Instantly secures and locks this vehicle while export inspection and inland logistics begin.
                        </p>
                        <strong className="cc-cust-paypal-option-amount">
                          ${(estDeposit || 24500).toLocaleString()} USD
                        </strong>
                      </div>
                    </label>

                    <label
                      className={`cc-cust-paypal-option-card ${payPalPaymentType === 'full' ? 'cc-cust-paypal-option-card--selected' : ''}`}
                      onClick={() => setPayPalPaymentType('full')}
                    >
                      <div className="cc-cust-paypal-option-radio">
                        <input
                          type="radio"
                          name="paypalAmountOption"
                          checked={payPalPaymentType === 'full'}
                          onChange={() => setPayPalPaymentType('full')}
                        />
                      </div>
                      <div className="cc-cust-paypal-option-content">
                        <div className="cc-cust-paypal-option-header">
                          <span className="cc-cust-paypal-option-name">Full CIF Landed Amount</span>
                        </div>
                        <p className="cc-cust-paypal-option-sub">
                          Complete vehicle purchase including ocean freight and insurance.
                        </p>
                        <strong className="cc-cust-paypal-option-amount">
                          ${landedTotal.toLocaleString()} USD
                        </strong>
                      </div>
                    </label>
                  </div>

                  {/* PayPal Simulation Card */}
                  <div className="cc-cust-paypal-account-box">
                    <div className="cc-cust-paypal-account-row">
                      <span className="cc-cust-paypal-label">PayPal Account:</span>
                      <span className="cc-cust-paypal-account-val">{profile?.email || user?.email || 'customer@dealership.com'}</span>
                    </div>
                    <div className="cc-cust-paypal-account-row">
                      <span className="cc-cust-paypal-label">Funding:</span>
                      <span className="cc-cust-paypal-account-val">PayPal Balance / Visa **** 3819</span>
                    </div>
                  </div>

                  <div className="cc-cust-paypal-trust">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Protected by PayPal Buyer Protection &bull; 256-Bit SSL Encrypted</span>
                  </div>

                  <div className="cc-cust-procure-actions">
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--paypal-checkout"
                      onClick={handleProcessPayPal}
                      disabled={payPalProcessing}
                    >
                      {payPalProcessing ? (
                        <>
                          <span className="cc-cust-spinner-inline" />
                          <span>AUTHORIZING WITH PAYPAL...</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M26.885 9.883c-.45-3.328-2.875-5.35-7.391-5.35H9.682a1.36 1.36 0 0 0-1.341 1.155L4.545 27.26a.85.85 0 0 0 .839.99h5.684l1.398-8.868-.044.277a1.36 1.36 0 0 1 1.341-1.155h2.955c5.312 0 9.475-2.158 10.687-8.423.064-.333.116-.658.156-.976.012-.08.02-.158.028-.237.062-.48.083-.902.046-1.185z" fill="#003087"/>
                            <path d="M28.021 11.233c-.062.48-.083.902-.046 1.185-1.212 6.265-5.375 8.423-10.687 8.423h-2.955a1.36 1.36 0 0 0-1.341 1.155l-1.442 9.145a.85.85 0 0 0 .839.99h4.819a1.36 1.36 0 0 0 1.341-1.155l1.092-6.928a1.36 1.36 0 0 1 1.341-1.155h1.229c4.636 0 8.27-1.883 9.328-7.352.441-2.285.215-4.205-1.463-5.558a5.2 5.2 0 0 0-3.055-.75z" fill="#0079C1"/>
                            <path d="M26.885 9.883c-.008.079-.016.157-.028.237-.04.318-.092.643-.156.976-.411 2.128-1.574 3.791-3.414 4.887-.905.538-2.001.886-3.266.886h-4.664l1.398-8.868h4.743c3.228 0 5.044 1.186 5.387 1.882z" fill="#00457C"/>
                          </svg>
                          <span>
                            PAY ${(payPalPaymentType === 'deposit' ? (estDeposit || 24500) : landedTotal).toLocaleString()} USD WITH PAYPAL
                          </span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                      onClick={() => setShowPayPalModal(false)}
                      disabled={payPalProcessing}
                    >
                      CANCEL
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
