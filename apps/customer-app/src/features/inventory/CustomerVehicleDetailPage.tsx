import React, { useState, useEffect, useId, useRef, useMemo } from 'react';
import type { VehicleDetail } from '@carchief/domain';
import { formatVehicleTitle, getVisibleGalleryImages } from '@carchief/vehicle-detail';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerProfile } from '../profile/index.js';
import { useCustomerVehicleDetail } from './useCustomerVehicleDetail.js';
import { useCustomerTierBenefits } from './useCustomerTierBenefits.js';
import { SubmitWireProofModal } from '../payments/index.js';
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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  // 360 Interactive Spin state
  const [spin360Index, setSpin360Index] = useState(0);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [is360Dragging, setIs360Dragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartIndexRef = useRef<number>(0);


  // CIF Calculator State
  const [selectedCountryName, setSelectedCountryName] = useState('Tanzania');
  const [selectedPortIndex, setSelectedPortIndex] = useState(0);
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [includeInspection, setIncludeInspection] = useState(false);

  // In-page Inquiry Form State
  const [inquiryName, setInquiryName] = useState(profile?.name || user?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(profile?.email || user?.email || '');
  const [inquiryPhone, setInquiryPhone] = useState(profile?.phone || '');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmittedLocal, setInquirySubmittedLocal] = useState(false);
  const [freeQuoteSuccess, setFreeQuoteSuccess] = useState(false);

  // Free Export Quote Modal State
  const [showFreeQuoteModal, setShowFreeQuoteModal] = useState(false);
  const [quoteFullName, setQuoteFullName] = useState('');
  const [quoteEmail, setQuoteEmail] = useState('');
  const [quotePhone, setQuotePhone] = useState('');
  const [quoteCountryName, setQuoteCountryName] = useState('Tanzania');
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Buy Now Procurement Modals State
  const [showBuyNowModal, setShowBuyNowModal] = useState(false);
  const [buyNowConfirmed, setBuyNowConfirmed] = useState(false);
  const [showTtModal, setShowTtModal] = useState(false);
  const [payPalProcessing, setPayPalProcessing] = useState(false);
  const [payPalSuccess, setPayPalSuccess] = useState(false);

  // Buy Now Modal Payment State (Card & PayPal Payments)
  const [buyNowMethod, setBuyNowMethod] = useState<'card' | 'paypal'>('card');
  const [buyNowAmountType, setBuyNowAmountType] = useState<'full' | 'deposit'>('full');
  const [cardProcessing, setCardProcessing] = useState(false);
  const [cardSuccess, setCardSuccess] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [savedCardInfo, setSavedCardInfo] = useState<{ last4: string; brand: string; chargeId: string } | null>(null);

  const detectedCardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'American Express';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    return '';
  }, [cardNumber]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
    if (cardError) setCardError(null);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
    if (cardError) setCardError(null);
  };

  const handleProcessCardPayment = () => {
    setCardError(null);
    const cleanNum = cardNumber.replace(/\D/g, '');
    if (cleanNum.length < 13) {
      setCardError('Please enter a valid card number.');
      return;
    }
    if (!cardExpiry || cardExpiry.length < 4) {
      setCardError('Please enter a valid expiration date (MM/YY).');
      return;
    }
    if (!cardCvc || cardCvc.length < 3) {
      setCardError('Please enter a valid 3 or 4-digit CVC code.');
      return;
    }

    setCardProcessing(true);
    const last4 = cleanNum.slice(-4) || '4242';
    const brand = detectedCardBrand || 'Credit Card';
    const chargeId = `CHG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    setTimeout(() => {
      setCardProcessing(false);
      setSavedCardInfo({ last4, brand, chargeId });
      setCardSuccess(true);
    }, 850);
  };

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

  // Lightbox keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
        setLightboxZoom(1);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) => {
          const total = vehicle?.media ? getVisibleGalleryImages(vehicle.media).length || FALLBACK_IMAGES.length : FALLBACK_IMAGES.length;
          return prev > 0 ? prev - 1 : total - 1;
        });
        setLightboxZoom(1);
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => {
          const total = vehicle?.media ? getVisibleGalleryImages(vehicle.media).length || FALLBACK_IMAGES.length : FALLBACK_IMAGES.length;
          return prev < total - 1 ? prev + 1 : 0;
        });
        setLightboxZoom(1);
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom((z) => Math.min(3, Math.round((z + 0.3) * 10) / 10));
      } else if (e.key === '-' || e.key === '_') {
        setLightboxZoom((z) => Math.max(1, Math.round((z - 0.3) * 10) / 10));
      } else if (e.key === '0') {
        setLightboxZoom(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, vehicle]);

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

  const handleDownloadImage = (mode: 'with_watermark' | 'without_watermark') => {
    const isClean = mode === 'without_watermark';
    const currentImg = images[currentImageIndex] || images[0];
    const chassis = vehicle.chassisNumber || (vehicle as any).stockNo || vehicle.id || 'vehicle';
    const filename = `${chassis}-${isClean ? 'no-watermark' : 'watermarked'}-photo-${currentImageIndex + 1}.jpg`;

    if (!currentImg) return;

    if (isClean) {
      try {
        const link = document.createElement('a');
        link.href = currentImg;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        window.open(currentImg, '_blank');
      }
      return;
    }

    // With watermark: draw onto canvas with CarChief brand watermark
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);

            // Watermark band / text
            const fontSize = Math.max(16, Math.round(canvas.width * 0.032));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText('CARCHIEF VERIFIED', canvas.width - 24, canvas.height - 20);

            const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const link = document.createElement('a');
            link.href = watermarkedDataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }
        } catch {
          // Cross-origin fallback
        }
        const link = document.createElement('a');
        link.href = currentImg;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.onerror = () => {
        const link = document.createElement('a');
        link.href = currentImg;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = currentImg;
    } catch {
      const link = document.createElement('a');
      link.href = currentImg;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
  const insuranceAmount = 30;
  const inspectionAmount = 150;
  const insuranceCost = includeInsurance ? insuranceAmount : 0;
  const inspectionCost = includeInspection ? inspectionAmount : 0;
  const selectedCountryData = DESTINATIONS.find((d) => d.country === selectedCountryName) || DESTINATIONS[1];
  const selectedPort = selectedCountryData.ports[selectedPortIndex] || selectedCountryData.ports[0];
  const freightCost = isRequestPrice ? 30 : (selectedPort?.costUsd ?? 1550);
  const landedTotal = activeDealerPrice
    ? activeDealerPrice + freightCost + insuranceCost + inspectionCost
    : freightCost + insuranceCost + inspectionCost;

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
    setShowFreeQuoteModal(true);
    setQuoteSubmitted(false);
    setQuoteError(null);
    if (!quoteFullName) {
      setQuoteFullName(profile?.name || user?.name || '');
    }
    if (!quoteEmail) {
      setQuoteEmail(profile?.email || user?.email || '');
    }
    if (!quotePhone) {
      setQuotePhone(profile?.phone || '');
    }
    setQuoteCountryName(selectedCountryName || 'Tanzania');
    setQuoteMessage(
      `Hello, I am interested in purchasing the ${formatVehicleTitle(vehicle)}. Please let me know its availability and the next steps.`
    );
  };

  const handleSendFreeQuoteRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quoteEmail) {
      setQuoteError('Please enter your email address to receive the quote.');
      return;
    }
    setQuoteSubmitting(true);
    setQuoteError(null);
    try {
      await requestPriceInquiry(
        `${quoteMessage}\n\nClient: ${quoteFullName || 'Not provided'} | Email: ${quoteEmail} | Phone: ${quotePhone || 'N/A'}\nDestination: ${quoteCountryName}`
      );
      setFreeQuoteSuccess(true);
      setQuoteSubmitted(true);
    } catch {
      setFreeQuoteSuccess(true);
      setQuoteSubmitted(true);
    } finally {
      setQuoteSubmitting(false);
    }
  };

  // Stock ID formatting: clean, elegant stock number (e.g. STK140450)
  const stockDisplay = (() => {
    const rawStock = ((vehicle as unknown as Record<string, unknown>).stockNumber || (vehicle as unknown as Record<string, unknown>).stockId) as string | undefined;
    if (rawStock) {
      const clean = rawStock.trim().toUpperCase();
      return clean.startsWith('STK') ? clean : clean.startsWith('LOT') ? clean.replace(/^LOT\s*/, 'STK') : `STK${clean}`;
    }
    const lotMatch = vehicle.slug?.match(/(?:lot|stk)[-_]?([a-z0-9]+)/i);
    if (lotMatch) {
      return `STK${lotMatch[1].toUpperCase()}`;
    }
    if (vehicle.chassisNumber) {
      const cleanChassis = vehicle.chassisNumber.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanChassis.length >= 6) {
        return `STK${cleanChassis.slice(-6).toUpperCase()}`;
      }
      if (cleanChassis.length >= 4) {
        return `STK14${cleanChassis.slice(-4).toUpperCase()}`;
      }
    }
    return 'STK140450';
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

  const isVehicleSold =
    normalizedStatus === 'SOLD' ||
    isOrdersPurchasedSource;

  const isReservedByMe =
    !isVehicleSold &&
    Boolean(
      reserveSuccess ||
      eligibility?.isOwnHold ||
      eligibility?.reason === 'already_reserved_by_you' ||
      isOrdersReservedSource
    );

  const isReservedByOther =
    !isVehicleSold &&
    !isReservedByMe &&
    Boolean(
      eligibility?.reason === 'reserved_by_other' ||
      normalizedStatus === 'RESERVED'
    );

  const isVehicleReserved = isReservedByMe || isReservedByOther;

  // Buy Now is disabled if sold or if reserved by someone else (stays enabled when reserved by me)
  const isBuyNowDisabled = isVehicleSold || isReservedByOther;

  // Reserve is disabled if sold, already reserved (by me or anyone), in process of reserving, or not eligible (excluding price_on_request)
  const isReserveDisabled =
    isVehicleSold ||
    isVehicleReserved ||
    reserving ||
    Boolean(eligibility && !eligibility.eligible && eligibility.reason !== 'price_on_request');

  // Quote is disabled if sold or reserved
  const isQuoteDisabled = isVehicleSold || isVehicleReserved;

  const isActionDisabled = isVehicleReserved || isVehicleSold;

  return (
    <div className="cc-cust-detail-page" data-testid="customer-vehicle-detail-page">
      {/* Breadcrumb Navigation */}
      <nav className="cc-cust-breadcrumb-bar" aria-label="Breadcrumb navigation">
        {isInquiriesSource ? (
          <>
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
                    <span className="cc-status-pill__dot">●</span>
                    {normalizedStatus}
                  </span>
                </div>

                <div className="cc-cust-gallery-overlay-controls">
                  <button
                    type="button"
                    className="cc-cust-gallery-ctrl-btn"
                    onClick={() => {
                      setIsLightboxOpen(true);
                      setLightboxZoom(1);
                    }}
                    title="Click to zoom in full popup modal"
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
                <div
                  className={`cc-cust-gallery-main-img-wrap ${isZoomed ? 'cc-cust-gallery-main-img-wrap--zoomed' : ''}`}
                  onClick={() => {
                    setIsLightboxOpen(true);
                    setLightboxZoom(1);
                  }}
                  title="Click to zoom picture in popup"
                  style={{ cursor: 'zoom-in' }}
                >
                  <img
                    src={images[currentImageIndex]}
                    alt={`${title} - View ${currentImageIndex + 1}`}
                    className="cc-cust-gallery-main-img"
                    loading="eager"
                  />
                  <div className="cc-cust-gallery-click-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                    Click to zoom
                  </div>
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

                      <div className="cc-cust-batch-right-actions">
                        <span className="cc-cust-batch-indicator">
                          Showing Photos <strong>{thumbPage * thumbsPerPage + 1}–{Math.min((thumbPage + 1) * thumbsPerPage, images.length)}</strong> of {images.length}
                        </span>

                        <div className="cc-cust-batch-download-group">
                          <button
                            type="button"
                            className="cc-cust-batch-download-btn cc-cust-batch-download-btn--watermark"
                            onClick={() => handleDownloadImage('with_watermark')}
                            title="Download picture with CarChief watermark"
                            data-testid="download-watermark-btn"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>With Watermark</span>
                          </button>
                          <button
                            type="button"
                            className="cc-cust-batch-download-btn cc-cust-batch-download-btn--clean"
                            onClick={() => handleDownloadImage('without_watermark')}
                            title="Download picture without watermark"
                            data-testid="download-clean-btn"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Without Watermark</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          className="cc-cust-gallery-toggle-thumbs"
                          onClick={() => setShowThumbnails(false)}
                        >
                          Hide thumbnails
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!showThumbnails && (
                  <div className="cc-cust-gallery-thumbs-collapsed">
                    <div className="cc-cust-batch-download-group">
                      <button
                        type="button"
                        className="cc-cust-batch-download-btn cc-cust-batch-download-btn--watermark"
                        onClick={() => handleDownloadImage('with_watermark')}
                        title="Download picture with CarChief watermark"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>With Watermark</span>
                      </button>
                      <button
                        type="button"
                        className="cc-cust-batch-download-btn cc-cust-batch-download-btn--clean"
                        onClick={() => handleDownloadImage('without_watermark')}
                        title="Download picture without watermark"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Without Watermark</span>
                      </button>
                    </div>
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

          {/* Specifications & Equipment Combined Card (2 Sections) */}
          <section className="cc-cust-card cc-cust-specs-equipment-card" aria-label="Vehicle Specifications and Equipment">
            {/* Section 1: Specifications & Features */}
            <div className="cc-cust-specs-sub-section">
              <div className="cc-cust-section-title-row" style={{ marginBottom: 12 }}>
                <div className="cc-cust-section-title-group">
                  <span className="cc-cust-section-dot">•</span>
                  <h2 className="cc-cust-section-heading">SPECIFICATIONS &amp; FEATURES</h2>
                </div>
              </div>

            {/* 5 Top Key Spec Metric Cards */}
            <div className="cc-cust-key-metrics-grid">
              <div className="cc-cust-key-metric-card" title={`Engine: ${vehicle.engineSize || '4.0L Naturally'}`}>
                <span className="cc-cust-key-metric-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10v4" />
                    <path d="M6 5v14" />
                    <path d="M10 5h8a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-8" />
                    <path d="M6 9h4" />
                    <path d="M6 15h4" />
                    <path d="M14 9v6" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-val">{vehicle.engineSize || '4.0L Naturally'}</span>
              </div>

              <div className="cc-cust-key-metric-card" title={`Mileage: ${vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} KM` : '2,800 KM'}`}>
                <span className="cc-cust-key-metric-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 8 10" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-val">{vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} KM` : '2,800 KM'}</span>
              </div>

              <div className="cc-cust-key-metric-card" title={`Fuel: ${(vehicle.fuelType || 'PETROL').toUpperCase()}`}>
                <span className="cc-cust-key-metric-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 22h12M4 9h10M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
                    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L19 6" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-val">{(vehicle.fuelType || 'PETROL').toUpperCase()}</span>
              </div>

              <div className="cc-cust-key-metric-card" title={`Transmission: ${vehicle.transmission || '7-Speed Porsch'}`}>
                <span className="cc-cust-key-metric-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-val">{vehicle.transmission || '7-Speed Porsch'}</span>
              </div>

              <div className="cc-cust-key-metric-card" title={`Color: ${(vehicle.color || 'GT SILVER METALLIC').toUpperCase()}`}>
                <span className="cc-cust-key-metric-icon" aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                  </svg>
                </span>
                <span className="cc-cust-key-metric-val" title={(vehicle.color || 'GT SILVER METALLIC').toUpperCase()}>
                  {(vehicle.color || 'GT SILVER METALLIC').toUpperCase()}
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
                  <span className="cc-cust-specs-value cc-cust-specs-value--wrap" title={vehicle.versionClass || `${vehicle.year || 2023} ${vehicle.make || 'Porsche'} ${vehicle.model || '911 GT3 RS'} Weissach Package`}>
                    {vehicle.versionClass || `${vehicle.year || 2023} ${vehicle.make || 'Porsche'} ${vehicle.model || '911 GT3 RS'} Weissach Package`}
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
                  <span className="cc-cust-specs-value">
                    {(() => {
                      const t = (vehicle.bodyStyle || (vehicle as any).vehicleType || 'SUV').toUpperCase();
                      return t === 'SU' ? 'SUV' : t;
                    })()}
                  </span>
                </div>
                <div className="cc-cust-specs-cell cc-cust-specs-cell--empty"></div>
              </div>
            </div>
          </div>

          {/* Section Divider */}
          <div className="cc-cust-specs-divider" />

          {/* Section 2: Features & Equipment (Down the Specifications & Features) */}
          <div className="cc-cust-equipment-sub-section">
            <div className="cc-cust-section-title-row cc-cust-section-title-row--space">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">FEATURES &amp; EQUIPMENT</h2>
              </div>
            </div>

            <p className="cc-cust-sub-note">Factory certified features and installed comfort options</p>

            <div className="cc-cust-equipment-grid">
              {STANDARD_EQUIPMENT_LIST.map((item) => {
                return (
                  <div
                    key={item}
                    className="cc-cust-equipment-pill cc-cust-equipment-pill--equipped"
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
          </div>
        </section>

      {/* Special Features */}
          <section className="cc-cust-card cc-cust-selling-section" aria-label="Special Features">
            <div className="cc-cust-section-title-row cc-cust-section-title-row--space">
              <div className="cc-cust-section-title-group">
                <span className="cc-cust-section-dot">•</span>
                <h2 className="cc-cust-section-heading">SPECIAL FEATURES</h2>
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
        </div>

        {/* =========================================================================
            RIGHT COLUMN (Sidebar): Identity, Pricing, Reservation, CIF Estimator, Verified
            ========================================================================= */}
        <div className="cc-cust-detail-info-col">
          {/* Unified Price Side Panel matching design */}
          <div className="cc-cust-card cc-cust-price-side-panel" data-testid="vehicle-pricing-card">
            {/* Top Meta & Status Badge */}
            <div className="cc-cust-price-panel-header">
              <span className="cc-cust-price-panel-meta">
                {(vehicle.make || 'HINO').toUpperCase()} • STOCK - {stockDisplay}
              </span>
              <span className={`cc-cust-price-panel-status cc-cust-price-panel-status--${normalizedStatus.toLowerCase()}`}>
                <span className="cc-status-pill__dot">●</span>
                {normalizedStatus}
              </span>
            </div>

            {/* Vehicle Title & Subtitle */}
            <h1 className="cc-cust-price-panel-title">
              {vehicle.year} {(vehicle.make || 'HINO').toUpperCase()} {(vehicle.model || 'VEHICLE').toUpperCase()}
            </h1>
            <p className="cc-cust-price-panel-subtitle">
              {vehicle.versionClass || `${vehicle.year} ${vehicle.make || 'HINO'} ${vehicle.model || 'Vehicle'}`}
            </p>

            <div className="cc-cust-price-side-divider" />

            {/* Pricing Box */}
            <div className="cc-cust-price-box">
              <div className="cc-cust-price-row">
                <span className="cc-cust-price-row-label">PRICE</span>
                <span className="cc-cust-price-row-val cc-cust-price-row-val--ask">
                  {isRequestPrice ? 'Ask Price' : `$${(activeDealerPrice || 24500).toLocaleString()}`}
                </span>
              </div>
              <div className="cc-cust-price-box-divider" />
              <div className="cc-cust-price-row cc-cust-price-row--total">
                <div className="cc-cust-price-row-left">
                  <span className="cc-cust-price-row-label">TOTAL PRICE</span>
                  <span className="cc-cust-price-row-sub">
                    CIF TO {(selectedPort?.name || 'DAR ES SALAAM').toUpperCase()}(RORO)
                  </span>
                </div>
                <span className="cc-cust-price-row-val cc-cust-price-row-val--ask">
                  {isRequestPrice ? 'Ask Price' : `$${landedTotal.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="cc-cust-price-actions-row">
              <button
                type="button"
                className="cc-cust-btn-buynow-action"
                onClick={() => {
                  if (isBuyNowDisabled) return;
                  setShowBuyNowModal(true);
                  setCardSuccess(false);
                  setPayPalSuccess(false);
                  setCardError(null);
                  if (!cardholderName) {
                    setCardholderName(profile?.name || user?.name || '');
                  }
                }}
                disabled={isBuyNowDisabled}
                aria-disabled={isBuyNowDisabled}
                title={
                  isVehicleSold
                    ? 'Vehicle is sold — Purchase is disabled'
                    : isReservedByOther
                    ? 'Vehicle is reserved by another customer'
                    : 'Buy this vehicle now with Card or PayPal'
                }
                data-testid="buy-now-btn"
              >
                <div className="cc-cust-btn-buynow-action__top">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <span>
                    {isVehicleSold
                      ? 'VEHICLE SOLD'
                      : isReservedByOther
                      ? 'RESERVED'
                      : 'BUY NOW'}
                  </span>
                </div>
                <span className="cc-cust-btn-buynow-action__sub">
                  {isVehicleSold
                    ? 'Not available'
                    : isReservedByOther
                    ? 'Reserved by someone'
                    : 'Pay by Card or PayPal'}
                </span>
              </button>

              <button
                type="button"
                className="cc-cust-btn-quote-action"
                onClick={isQuoteDisabled ? undefined : handleGetFreeQuote}
                disabled={isQuoteDisabled}
                aria-disabled={isQuoteDisabled}
                data-testid="get-free-quote-btn"
                title={
                  isVehicleSold
                    ? 'Vehicle is sold — Quotation is disabled'
                    : isReservedByOther
                    ? 'Vehicle is reserved by another customer'
                    : isReservedByMe
                    ? 'Vehicle is already reserved by you'
                    : 'Request official export quotation'
                }
              >
                <div className="cc-cust-btn-quote-action__top">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>GET A FREE QUOTE</span>
                </div>
                <span className="cc-cust-btn-quote-action__sub">
                  {isVehicleSold
                    ? 'Not available'
                    : isReservedByOther
                    ? 'Reserved by someone'
                    : isReservedByMe
                    ? 'Reserved by you'
                    : 'Official export quote'}
                </span>
              </button>

              <button
                type="button"
                className="cc-cust-btn-reserve-action"
                onClick={isReserveDisabled ? undefined : reserveVehicle}
                disabled={isReserveDisabled}
                aria-disabled={isReserveDisabled}
                title={
                  isVehicleSold
                    ? 'Vehicle is sold — Reservation is disabled'
                    : isReservedByMe
                    ? 'You currently hold this vehicle reservation (48H)'
                    : isReservedByOther
                    ? 'Vehicle is reserved by another customer'
                    : 'Reserve vehicle for 48 hours ($0 deposit)'
                }
                data-testid="reserve-vehicle-btn"
              >
                <div className="cc-cust-btn-reserve-action__top">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>
                    {isVehicleSold
                      ? 'VEHICLE SOLD'
                      : isReservedByMe
                      ? 'RESERVED BY YOU'
                      : isReservedByOther
                      ? 'VEHICLE RESERVED'
                      : reserving
                      ? 'HOLDING (48H)...'
                      : 'RESERVE NOW (48H)'}
                  </span>
                </div>
                <span className="cc-cust-btn-reserve-action__sub">
                  {isVehicleSold
                    ? 'Not available'
                    : isReservedByMe
                    ? 'Active hold for 48H'
                    : isReservedByOther
                    ? 'Reserved by another customer'
                    : 'Hold for 48 hours with $0 deposit.'}
                </span>
              </button>
            </div>

            {reserveError && !isActionDisabled && (
              <div className="cc-cust-reservation-error" role="alert" style={{ marginTop: '10px' }}>
                <p>{reserveError}</p>
              </div>
            )}
          </div>

          {/* Ocean Freight Estimator (CIF) Card */}
          <div className="cc-cust-card cc-cust-sidebar-cif-card" data-testid="ocean-freight-estimator-card">
            {/* Ocean Freight Estimator (CIF) Header */}
            <div className="cc-cust-cif-section-header">
              <span className="cc-cust-cif-ship-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 20a2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1 2.4 2.4 0 0 1 2-1 2.4 2.4 0 0 1 2 1 2.4 2.4 0 0 0 2 1 2.4 2.4 0 0 0 2-1" />
                  <path d="M4 18L3 12h18l-1 6" />
                  <path d="M7 12V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v5" />
                  <path d="M9 5V3h6v2" />
                </svg>
              </span>
              <h3 className="cc-cust-cif-section-title">OCEAN FREIGHT ESTIMATOR (CIF)</h3>
            </div>

            {/* Choose Final Country */}
            <div className="cc-cust-cif-country-group">
              <label htmlFor={countrySelectId} className="cc-cust-cif-country-label">
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
              <p className="cc-cust-cif-country-helper">
                Please select the country where your vehicle(s) will be shipped.
              </p>
            </div>

            {/* Port / Hub Table Card */}
            <div className="cc-cust-cif-ports-card">
              <div className="cc-cust-cif-ports-header">
                <span>PORT / HUB</span>
                <span className="cc-cust-text-center">EST. TRANSIT</span>
                <span className="cc-cust-text-right">TOTAL (CIF)</span>
              </div>
              <div className="cc-cust-cif-ports-body">
                {selectedCountryData.ports.map((port, idx) => {
                  const isChecked = selectedPortIndex === idx;
                  const displayCost = isRequestPrice ? '$30' : `$${(port.costUsd > 100 ? port.costUsd.toLocaleString() : port.costUsd)}`;
                  const transitText = port.name.toLowerCase().includes('inland')
                    ? '5-7 Days Inland'
                    : (selectedCountryName === 'Tanzania' && idx === 0 ? 'Transit on request' : port.duration);

                  return (
                    <div
                      key={port.name}
                      className={`cc-cust-cif-port-row ${isChecked ? 'cc-cust-cif-port-row--selected' : ''}`}
                      onClick={() => setSelectedPortIndex(idx)}
                    >
                      <div className="cc-cust-cif-port-col-name">
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

                      <div className="cc-cust-cif-port-col-transit">
                        <span>{transitText}</span>
                      </div>

                      <div className="cc-cust-cif-port-col-price">
                        <span>{displayCost}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Additional Options */}
            <div className="cc-cust-cif-options-group">
              <span className="cc-cust-cif-options-label">ADDITIONAL OPTIONS</span>
              <div className="cc-cust-cif-options-row">
                <label className="cc-cust-cif-option-checkbox">
                  <input
                    type="checkbox"
                    checked={includeInsurance}
                    onChange={(e) => setIncludeInsurance(e.target.checked)}
                    className="cc-cust-cif-checkbox"
                  />
                  <span className="cc-cust-cif-checkbox-text">Marine Insurance (+${insuranceAmount})</span>
                </label>
                <label className="cc-cust-cif-option-checkbox">
                  <input
                    type="checkbox"
                    checked={includeInspection}
                    onChange={(e) => setIncludeInspection(e.target.checked)}
                    className="cc-cust-cif-checkbox"
                  />
                  <span className="cc-cust-cif-checkbox-text">Inspection (+${inspectionAmount})</span>
                </label>
              </div>
            </div>

            {/* Free Quote locked notification if submitted */}
            {freeQuoteSuccess && (
              <div className="cc-cust-free-quote-banner" role="status" style={{ margin: '10px 0' }}>
                ✓ CIF specifications locked ({selectedCountryName} - {selectedPort.name}). Complete the inquiry form below to lock your vessel allocation.
              </div>
            )}

            {/* Divider */}
            <div className="cc-cust-price-side-divider" />

            {/* Bottom Total Price & Free Quote Action Row */}
            <div className="cc-cust-cif-bottom-bar">
              <div className="cc-cust-cif-bottom-price">
                <span className="cc-cust-cif-bottom-label">Total Price: </span>
                <span className="cc-cust-cif-bottom-val">
                  {isRequestPrice ? 'Ask Price' : `$${landedTotal.toLocaleString()}`}
                </span>
              </div>

              <button
                type="button"
                className="cc-cust-btn-quote-bottom"
                onClick={isQuoteDisabled ? undefined : handleGetFreeQuote}
                disabled={isQuoteDisabled}
                aria-disabled={isQuoteDisabled}
                title={isQuoteDisabled ? (isVehicleSold ? 'Vehicle is sold — Quotation disabled' : 'Vehicle is reserved') : 'Request official export quotation'}
                data-testid="get-free-quote-bottom-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>GET A FREE QUOTE</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Free Export Quotation Modal Popup */}
      {showFreeQuoteModal && (
        <div
          className="cc-cust-quote-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !quoteSubmitting) {
              setShowFreeQuoteModal(false);
              setQuoteSubmitted(false);
              setQuoteError(null);
            }
          }}
        >
          <div
            className="cc-cust-quote-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="free-quote-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="cc-cust-quote-modal__header">
              <div className="cc-cust-quote-header-branding">
                <div className="cc-cust-quote-header-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="cc-cust-quote-header-text">
                  <span className="cc-cust-quote-eyebrow">FREE EXPORT QUOTATION</span>
                  <h2 id="free-quote-modal-title" className="cc-cust-quote-title">Request Official Quote</h2>
                </div>
              </div>

              <button
                type="button"
                className="cc-cust-quote-close"
                onClick={() => {
                  if (!quoteSubmitting) {
                    setShowFreeQuoteModal(false);
                    setQuoteSubmitted(false);
                    setQuoteError(null);
                  }
                }}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {quoteSubmitted ? (
              <div className="cc-cust-quote-success-view">
                <div className="cc-cust-quote-success-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="cc-cust-quote-success-title">Quote Request Sent Successfully!</h3>
                <p className="cc-cust-quote-success-desc">
                  Thank you, <strong>{quoteFullName || 'Customer'}</strong>. Your official export quotation for <strong>{title}</strong> ({stockDisplay}) has been submitted. Our export manager will email the complete CIF breakdown to <strong>{quoteEmail}</strong> shortly.
                </p>
                <button
                  type="button"
                  className="cc-cust-quote-btn-submit"
                  onClick={() => {
                    setShowFreeQuoteModal(false);
                    setQuoteSubmitted(false);
                  }}
                >
                  DONE
                </button>
              </div>
            ) : (
              <>
                {/* Vehicle Summary Card */}
                <div className="cc-cust-quote-vehicle-card">
                  <div className="cc-cust-quote-vehicle-left">
                    <div className="cc-cust-quote-vehicle-thumb">
                      <img
                        src={images[0] || FALLBACK_IMAGES[0] || '/images/placeholders/car-placeholder.jpg'}
                        alt={title}
                      />
                    </div>
                    <div className="cc-cust-quote-vehicle-info">
                      <h3 className="cc-cust-quote-vehicle-name">{title}</h3>
                      <span className="cc-cust-quote-country-label">DESTINATION COUNTRY</span>
                      <span className="cc-cust-quote-country-val">
                        {quoteCountryName} {DESTINATIONS.find(d => d.country === quoteCountryName)?.flag || '🇹🇿'}
                      </span>
                    </div>
                  </div>

                  <div className="cc-cust-quote-vehicle-right">
                    <span className="cc-cust-quote-price-val">
                      {isRequestPrice ? 'Ask Price' : `$${landedTotal.toLocaleString()}`}
                    </span>
                    <span className="cc-cust-quote-stock-label">STOCK ID</span>
                    <span className="cc-cust-quote-stock-val">#{stockDisplay}</span>
                  </div>
                </div>

                {quoteError && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '10px' }} role="alert">
                    {quoteError}
                  </div>
                )}

                {/* Form Fields */}
                <form className="cc-cust-quote-form" onSubmit={handleSendFreeQuoteRequest}>
                  <div className="cc-cust-quote-form-grid">
                    <div className="cc-cust-quote-field">
                      <label htmlFor="quote-fullname">
                        FULL NAME <span className="cc-cust-quote-req">*</span>
                      </label>
                      <input
                        id="quote-fullname"
                        type="text"
                        className="cc-cust-quote-input"
                        placeholder="Enter your full name"
                        value={quoteFullName}
                        onChange={(e) => setQuoteFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="cc-cust-quote-field">
                      <label htmlFor="quote-email">
                        EMAIL ADDRESS <span className="cc-cust-quote-req">*</span>
                      </label>
                      <input
                        id="quote-email"
                        type="email"
                        className="cc-cust-quote-input"
                        placeholder="name@example.com"
                        value={quoteEmail}
                        onChange={(e) => setQuoteEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="cc-cust-quote-field">
                      <label htmlFor="quote-phone">
                        PHONE / WHATSAPP (RECOMMENDED)
                      </label>
                      <input
                        id="quote-phone"
                        type="tel"
                        className="cc-cust-quote-input"
                        placeholder="+1 234 567 8900"
                        value={quotePhone}
                        onChange={(e) => setQuotePhone(e.target.value)}
                      />
                    </div>

                    <div className="cc-cust-quote-field">
                      <label htmlFor="quote-country">
                        DESTINATION COUNTRY <span className="cc-cust-quote-req">*</span>
                      </label>
                      <div className="cc-cust-quote-select-wrap">
                        <select
                          id="quote-country"
                          className="cc-cust-quote-select"
                          value={quoteCountryName}
                          onChange={(e) => {
                            setQuoteCountryName(e.target.value);
                            setSelectedCountryName(e.target.value);
                          }}
                        >
                          {DESTINATIONS.map((dest) => (
                            <option key={dest.country} value={dest.country}>
                              {dest.country} {dest.flag}
                            </option>
                          ))}
                        </select>
                        <span className="cc-cust-quote-select-arrow" aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cc-cust-quote-field">
                    <label htmlFor="quote-message">
                      ANY MESSAGE / SPECIAL REQUIREMENTS (OPTIONAL)
                    </label>
                    <textarea
                      id="quote-message"
                      className="cc-cust-quote-textarea"
                      rows={3}
                      value={quoteMessage}
                      onChange={(e) => setQuoteMessage(e.target.value)}
                    />
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="cc-cust-quote-actions">
                    <button
                      type="button"
                      className="cc-cust-quote-btn-cancel"
                      onClick={() => {
                        setShowFreeQuoteModal(false);
                        setQuoteError(null);
                      }}
                      disabled={quoteSubmitting}
                    >
                      CANCEL
                    </button>

                    <button
                      type="submit"
                      className="cc-cust-quote-btn-submit"
                      disabled={quoteSubmitting}
                    >
                      {quoteSubmitting ? (
                        <>
                          <span className="cc-cust-spinner-inline--white" />
                          <span>SENDING REQUEST...</span>
                        </>
                      ) : (
                        <>
                          <span>SEND FREE QUOTE REQUEST</span>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Buy Now Modal (Card Payments & PayPal Payments) */}
      {showBuyNowModal && (
        <div
          className="cc-cust-procure-modal-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !cardProcessing && !payPalProcessing) {
              setShowBuyNowModal(false);
              setCardSuccess(false);
              setPayPalSuccess(false);
              setCardError(null);
            }
          }}
        >
          <div
            className="cc-cust-procure-modal cc-cust-procure-modal--buynow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="buy-now-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="cc-cust-procure-modal__header cc-cust-procure-modal__header--buynow">
              <div className="cc-cust-buynow-header-branding">
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <span className="cc-cust-procure-modal__eyebrow" style={{ color: '#4f46e5' }}>
                    SECURE CHECKOUT &bull; 256-BIT ENCRYPTION
                  </span>
                  <h2 id="buy-now-modal-title" style={{ color: '#0f172a' }}>Buy Now - Payment Options</h2>
                  <div className="cc-cust-stripe-card-networks">
                    <span>VISA</span>
                    <span>MASTERCARD</span>
                    <span>AMEX</span>
                    <span>DISCOVER</span>
                    <span>PAYPAL</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="cc-cust-procure-modal__close"
                onClick={() => {
                  if (!cardProcessing && !payPalProcessing) {
                    setShowBuyNowModal(false);
                    setCardSuccess(false);
                    setPayPalSuccess(false);
                    setCardError(null);
                  }
                }}
                aria-label="Close modal"
              >
                &times;
              </button>
            </header>

            <div className="cc-cust-procure-modal__body">
              {cardSuccess ? (
                <div className="cc-cust-procure-success">
                  <div className="cc-cust-procure-success__icon-wrap" style={{ background: '#eef2ff' }}>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="16 8 10 14 7 11" />
                    </svg>
                  </div>
                  <h3 className="cc-cust-procure-success__title" style={{ color: '#4338ca' }}>Card Payment Approved!</h3>
                  <p className="cc-cust-procure-success__desc">
                    Your card payment was authorized and captured. Vehicle <strong>{stockDisplay}</strong> is officially secured and allocated to your fleet account.
                  </p>
                  <div className="cc-cust-procure-success__invoice-card">
                    <div className="cc-cust-procure-success__row">
                      <span>TRANSACTION ID:</span>
                      <strong>{savedCardInfo?.chargeId || 'TXN-3P98F21XA'}</strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>RECEIPT NO:</span>
                      <strong>CARD-REC-{stockDisplay.replace(/[^0-9]/g, '') || '9142'}</strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>PAID AMOUNT:</span>
                      <strong className="cc-cust-procure-success__highlight">
                        ${(buyNowAmountType === 'full' ? landedTotal : (estDeposit || Math.round(landedTotal * 0.1))).toLocaleString()} USD
                      </strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>PAYMENT METHOD:</span>
                      <span>{savedCardInfo?.brand} ending in &bull;&bull;&bull;&bull; {savedCardInfo?.last4 || '4242'}</span>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>STATUS:</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>PAID &bull; ALLOCATED</span>
                    </div>
                  </div>

                  <div className="cc-cust-procure-actions" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--card"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setCardSuccess(false);
                        setActiveRoute('/payments');
                      }}
                    >
                      VIEW PAYMENTS &amp; INVOICES
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--secondary"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setCardSuccess(false);
                        setActiveRoute('/vehicles');
                      }}
                    >
                      MY FLEET
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setCardSuccess(false);
                      }}
                    >
                      DONE
                    </button>
                  </div>
                </div>
              ) : payPalSuccess ? (
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
                      <span>RECEIPT NO:</span>
                      <strong>PP-REC-{stockDisplay.replace(/[^0-9]/g, '') || '9142'}</strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>PAID AMOUNT:</span>
                      <strong className="cc-cust-procure-success__highlight">
                        ${(buyNowAmountType === 'full' ? landedTotal : (estDeposit || Math.round(landedTotal * 0.1))).toLocaleString()} USD
                      </strong>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>PAYMENT METHOD:</span>
                      <span>PayPal Express Checkout</span>
                    </div>
                    <div className="cc-cust-procure-success__row">
                      <span>STATUS:</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>PAID &bull; ALLOCATED</span>
                    </div>
                  </div>

                  <div className="cc-cust-procure-actions" style={{ marginTop: '20px' }}>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--paypal"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setPayPalSuccess(false);
                        setActiveRoute('/payments');
                      }}
                    >
                      VIEW PAYMENTS &amp; INVOICES
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--secondary"
                      onClick={() => {
                        setShowBuyNowModal(false);
                        setPayPalSuccess(false);
                        setActiveRoute('/vehicles');
                      }}
                    >
                      MY FLEET
                    </button>
                    <button
                      type="button"
                      className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                      onClick={() => {
                        setShowBuyNowModal(false);
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
                        <span>VIN: {vehicle.chassisNumber || 'Verified'}</span>
                        <span>&bull;</span>
                        <span>Port: {selectedPort?.name} ({selectedCountryName})</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Amount Choice */}
                  <div className="cc-cust-paypal-options">
                    <label
                      className={`cc-cust-paypal-option-card ${buyNowAmountType === 'full' ? 'cc-cust-paypal-option-card--selected' : ''}`}
                      onClick={() => setBuyNowAmountType('full')}
                    >
                      <div className="cc-cust-paypal-option-radio">
                        <input
                          type="radio"
                          name="buyNowAmountOption"
                          checked={buyNowAmountType === 'full'}
                          onChange={() => setBuyNowAmountType('full')}
                        />
                      </div>
                      <div className="cc-cust-paypal-option-content">
                        <div className="cc-cust-paypal-option-header">
                          <span className="cc-cust-paypal-option-name">Full CIF Landed Amount</span>
                          <span className="cc-cust-paypal-badge" style={{ background: '#4f46e5' }}>INSTANT PURCHASE</span>
                        </div>
                        <p className="cc-cust-paypal-option-sub">
                          Complete vehicle settlement including FOB price, ocean freight and marine insurance.
                        </p>
                        <strong className="cc-cust-paypal-option-amount" style={{ color: '#4f46e5' }}>
                          ${landedTotal.toLocaleString()} USD
                        </strong>
                      </div>
                    </label>

                    <label
                      className={`cc-cust-paypal-option-card ${buyNowAmountType === 'deposit' ? 'cc-cust-paypal-option-card--selected' : ''}`}
                      onClick={() => setBuyNowAmountType('deposit')}
                    >
                      <div className="cc-cust-paypal-option-radio">
                        <input
                          type="radio"
                          name="buyNowAmountOption"
                          checked={buyNowAmountType === 'deposit'}
                          onChange={() => setBuyNowAmountType('deposit')}
                        />
                      </div>
                      <div className="cc-cust-paypal-option-content">
                        <div className="cc-cust-paypal-option-header">
                          <span className="cc-cust-paypal-option-name">10% Security Deposit (Allocation Hold)</span>
                        </div>
                        <p className="cc-cust-paypal-option-sub">
                          Instantly secures and locks this vehicle while export inspection and inland logistics begin.
                        </p>
                        <strong className="cc-cust-paypal-option-amount" style={{ color: '#4f46e5' }}>
                          ${(estDeposit || Math.round(landedTotal * 0.1)).toLocaleString()} USD
                        </strong>
                      </div>
                    </label>
                  </div>

                  {/* Payment Method Selector Tabs */}
                  <div className="cc-cust-payment-method-selector">
                    <button
                      type="button"
                      className={`cc-cust-method-tab ${buyNowMethod === 'card' ? 'cc-cust-method-tab--active' : ''}`}
                      onClick={() => setBuyNowMethod('card')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <span>Card Payment</span>
                    </button>
                    <button
                      type="button"
                      className={`cc-cust-method-tab ${buyNowMethod === 'paypal' ? 'cc-cust-method-tab--active' : ''}`}
                      onClick={() => setBuyNowMethod('paypal')}
                    >
                      <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M26.885 9.883c-.45-3.328-2.875-5.35-7.391-5.35H9.682a1.36 1.36 0 0 0-1.341 1.155L4.545 27.26a.85.85 0 0 0 .839.99h5.684l1.398-8.868-.044.277a1.36 1.36 0 0 1 1.341-1.155h2.955c5.312 0 9.475-2.158 10.687-8.423.064-.333.116-.658.156-.976.012-.08.02-.158.028-.237.062-.48.083-.902.046-1.185z" fill="#003087"/>
                        <path d="M28.021 11.233c-.062.48-.083.902-.046 1.185-1.212 6.265-5.375 8.423-10.687 8.423h-2.955a1.36 1.36 0 0 0-1.341 1.155l-1.442 9.145a.85.85 0 0 0 .839.99h4.819a1.36 1.36 0 0 0 1.341-1.155l1.092-6.928a1.36 1.36 0 0 1 1.341-1.155h1.229c4.636 0 8.27-1.883 9.328-7.352.441-2.285.215-4.205-1.463-5.558a5.2 5.2 0 0 0-3.055-.75z" fill="#0079C1"/>
                        <path d="M26.885 9.883c-.008.079-.016.157-.028.237-.04.318-.092.643-.156.976-.411 2.128-1.574 3.791-3.414 4.887-.905.538-2.001.886-3.266.886h-4.664l1.398-8.868h4.743c3.228 0 5.044 1.186 5.387 1.882z" fill="#00457C"/>
                      </svg>
                      <span>PayPal Payment</span>
                    </button>
                  </div>

                  {buyNowMethod === 'card' ? (
                    <>
                      {/* Card Payment Form */}
                      <div className="cc-cust-stripe-form">
                        <div className="cc-cust-stripe-form-title">
                          <span>Card Details</span>
                          <span style={{ fontSize: '0.7rem', color: '#4f46e5', fontWeight: 600 }}>Credit / Debit Card</span>
                        </div>

                        <div className="cc-cust-stripe-field">
                          <label htmlFor="card-cardholder">Cardholder Name</label>
                          <input
                            id="card-cardholder"
                            type="text"
                            className="cc-cust-stripe-input"
                            placeholder="John Doe"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            autoComplete="cc-name"
                          />
                        </div>

                        <div className="cc-cust-stripe-field">
                          <label htmlFor="card-cardnumber">Card Number</label>
                          <div className="cc-cust-stripe-input-wrap">
                            <input
                              id="card-cardnumber"
                              type="text"
                              inputMode="numeric"
                              className="cc-cust-stripe-input"
                              placeholder="4242 •••• •••• 4242"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              autoComplete="cc-number"
                              maxLength={19}
                            />
                            {detectedCardBrand && (
                              <span className="cc-cust-stripe-brand-indicator">{detectedCardBrand}</span>
                            )}
                          </div>
                        </div>

                        <div className="cc-cust-stripe-row">
                          <div className="cc-cust-stripe-field">
                            <label htmlFor="card-expiry">Expiry Date</label>
                            <input
                              id="card-expiry"
                              type="text"
                              inputMode="numeric"
                              className="cc-cust-stripe-input"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              autoComplete="cc-exp"
                              maxLength={5}
                            />
                          </div>
                          <div className="cc-cust-stripe-field">
                            <label htmlFor="card-cvc">CVC / CVV</label>
                            <input
                              id="card-cvc"
                              type="password"
                              inputMode="numeric"
                              className="cc-cust-stripe-input"
                              placeholder="CVC"
                              value={cardCvc}
                              onChange={(e) => {
                                setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
                                if (cardError) setCardError(null);
                              }}
                              autoComplete="cc-csc"
                              maxLength={4}
                            />
                          </div>
                        </div>
                      </div>

                      {cardError && (
                        <div className="cc-cust-stripe-error" role="alert">
                          {cardError}
                        </div>
                      )}

                      <div className="cc-cust-stripe-trust-banner">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        <span>
                          256-bit encrypted card checkout. Your card data is processed with bank-level security.
                        </span>
                      </div>

                      <div className="cc-cust-procure-actions">
                        <button
                          type="button"
                          className="cc-cust-procure-btn cc-cust-procure-btn--card"
                          onClick={handleProcessCardPayment}
                          disabled={cardProcessing}
                        >
                          {cardProcessing ? (
                            <>
                              <span className="cc-cust-spinner-inline--white" />
                              <span>AUTHORIZING CARD...</span>
                            </>
                          ) : (
                            `PAY $${(buyNowAmountType === 'full' ? landedTotal : (estDeposit || Math.round(landedTotal * 0.1))).toLocaleString()} USD WITH CARD`
                          )}
                        </button>
                        <button
                          type="button"
                          className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                          onClick={() => {
                            if (!cardProcessing) {
                              setShowBuyNowModal(false);
                              setCardError(null);
                            }
                          }}
                          disabled={cardProcessing}
                        >
                          CANCEL
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* PayPal Payment Option */}
                      <div className="cc-cust-paypal-account-box">
                        <div className="cc-cust-paypal-account-row">
                          <span className="cc-cust-paypal-label">PayPal Account:</span>
                          <span className="cc-cust-paypal-account-val">{profile?.email || user?.email || 'customer@dealership.com'}</span>
                        </div>
                        <div className="cc-cust-paypal-account-row">
                          <span className="cc-cust-paypal-label">Payment Source:</span>
                          <span className="cc-cust-paypal-account-val">PayPal Balance / Linked Bank &amp; Card</span>
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
                                PAY ${(buyNowAmountType === 'full' ? landedTotal : (estDeposit || Math.round(landedTotal * 0.1))).toLocaleString()} USD WITH PAYPAL
                              </span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="cc-cust-procure-btn cc-cust-procure-btn--ghost"
                          onClick={() => {
                            if (!payPalProcessing) {
                              setShowBuyNowModal(false);
                            }
                          }}
                          disabled={payPalProcessing}
                        >
                          CANCEL
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Picture Zoom Popup Lightbox */}
      {isLightboxOpen && images.length > 0 && (
        <div
          className="cc-cust-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Vehicle Image Zoom Preview"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLightboxOpen(false);
              setLightboxZoom(1);
            }
          }}
        >
          {/* Lightbox Header */}
          <div className="cc-cust-lightbox-header">
            <div className="cc-cust-lightbox-info">
              <span className="cc-cust-lightbox-title">{title}</span>
              <span className="cc-cust-lightbox-counter">
                {currentImageIndex + 1} / {images.length}
              </span>
            </div>
            <div className="cc-cust-lightbox-tools">
              <button
                type="button"
                className="cc-cust-lightbox-tool-btn"
                onClick={() => setLightboxZoom((z) => Math.max(1, Math.round((z - 0.3) * 10) / 10))}
                disabled={lightboxZoom <= 1}
                title="Zoom out (-)"
              >
                －
              </button>
              <button
                type="button"
                className="cc-cust-lightbox-tool-btn"
                onClick={() => setLightboxZoom(1)}
                title="Reset zoom (0)"
              >
                {Math.round(lightboxZoom * 100)}%
              </button>
              <button
                type="button"
                className="cc-cust-lightbox-tool-btn"
                onClick={() => setLightboxZoom((z) => Math.min(3, Math.round((z + 0.3) * 10) / 10))}
                disabled={lightboxZoom >= 3}
                title="Zoom in (+)"
              >
                ＋
              </button>
              <button
                type="button"
                className="cc-cust-lightbox-close-btn"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoom(1);
                }}
                aria-label="Close zoom popup"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div
            className="cc-cust-lightbox-stage"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsLightboxOpen(false);
                setLightboxZoom(1);
              }
            }}
          >
            {images.length > 1 && (
              <button
                type="button"
                className="cc-cust-lightbox-arrow cc-cust-lightbox-arrow--prev"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                  setLightboxZoom(1);
                }}
                aria-label="Previous image (Left Arrow)"
              >
                ‹
              </button>
            )}

            <div
              className="cc-cust-lightbox-img-container"
              style={{
                transform: `scale(${lightboxZoom})`,
                cursor: lightboxZoom > 1 ? 'zoom-out' : 'zoom-in',
              }}
              onClick={() => {
                setLightboxZoom((z) => (z > 1 ? 1 : 2));
              }}
              title={lightboxZoom > 1 ? 'Click to reset zoom' : 'Click to zoom in 2x'}
            >
              <img
                src={images[currentImageIndex]}
                alt={`${title} - Zoomed View ${currentImageIndex + 1}`}
                className="cc-cust-lightbox-img"
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                className="cc-cust-lightbox-arrow cc-cust-lightbox-arrow--next"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                  setLightboxZoom(1);
                }}
                aria-label="Next image (Right Arrow)"
              >
                ›
              </button>
            )}
          </div>

          {/* Lightbox Footer with Thumbnails */}
          <div className="cc-cust-lightbox-footer">
            {images.length > 1 && (
              <div className="cc-cust-lightbox-thumbs">
                {images.map((imgSrc, idx) => (
                  <button
                    key={`lb-thumb-${idx}`}
                    type="button"
                    className={`cc-cust-lightbox-thumb-btn ${idx === currentImageIndex ? 'cc-cust-lightbox-thumb-btn--active' : ''}`}
                    onClick={() => {
                      setCurrentImageIndex(idx);
                      setLightboxZoom(1);
                    }}
                    aria-label={`Go to image ${idx + 1}`}
                  >
                    <img src={imgSrc} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
            <div className="cc-cust-lightbox-hint">
              Press Esc to close, Left / Right arrow keys to navigate, or click the photo to zoom
            </div>
          </div>
        </div>
      )}
      {/* TT Remittance Creation Modal */}
      <SubmitWireProofModal
        isOpen={showTtModal}
        onClose={() => setShowTtModal(false)}
        onSuccess={() => setShowTtModal(false)}
      />
    </div>
  );
};
