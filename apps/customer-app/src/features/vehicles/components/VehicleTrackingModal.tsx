import React, { useEffect, useState, useMemo } from 'react';
import type { CustomerVehicleSummary, CustomerVehicleDetail } from '@carchief/domain';
import { CarChiefLogoMark } from '../../../components/Icons.js';

export interface VehicleTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: CustomerVehicleSummary | CustomerVehicleDetail | null;
  initialCustomViewParam?: string;
  isStandalone?: boolean;
}

export const TIMELINE_STAGES = [
  'RESERVED',
  'PURCHASED',
  'INSPECTION',
  'READY FOR LOADING',
  'VESSEL BOOKED',
  'LOADED',
  'VESSEL DEPARTED',
  'IN TRANSIT',
  'ARRIVED AT PORT',
  'CUSTOMS CLEARANCE',
  'DELIVERED',
] as const;

export function getVehicleActiveTimelineStepIndex(vehicle: CustomerVehicleSummary | CustomerVehicleDetail): number {
  const status = (vehicle.status || '').toLowerCase();
  const logistics = (vehicle.logisticsStatus || vehicle.shippingStage || '').toUpperCase();

  if (status === 'delivered' || logistics === 'DELIVERED') return 10;
  if (logistics === 'CUSTOMS CLEARANCE') return 9;
  if (logistics === 'ARRIVED AT PORT') return 8;
  if (status === 'in transit' || logistics === 'IN TRANSIT') return 7;
  if (logistics === 'VESSEL DEPARTED') return 6;
  if (logistics === 'LOADED') return 5;
  if (logistics === 'VESSEL BOOKED') return 4;
  if (logistics === 'READY FOR LOADING' || logistics === 'READY') return 3;
  if (status === 'confirmed' || logistics === 'INSPECTION' || (Boolean(vehicle.commercialBill) && vehicle.paymentStatus === 'Paid')) return 2;
  if (status === 'under negotiation with pi' || (status !== 'under negotiation' && Boolean(vehicle.proformaInvoiceId)) || logistics === 'PURCHASED') return 1;
  return 0; // RESERVED
}

export function getVehicleEngineNo(vehicle: CustomerVehicleSummary | CustomerVehicleDetail): string {
  if ((vehicle as any).engineNo) return (vehicle as any).engineNo;
  if ((vehicle as any).engineModel) return (vehicle as any).engineModel;
  const modelLower = vehicle.model.toLowerCase();
  if (modelLower.includes('land cruiser') || modelLower.includes('250')) return '3DA-GDJ250W';
  if (modelLower.includes('prado') || modelLower.includes('150')) return '3BA-TRJ150W';
  if (modelLower.includes('harrier')) return '6BA-MXUA80';
  if (modelLower.includes('rav4')) return '6BA-MXAA54';
  if (modelLower.includes('vezel')) return '6AA-RV5';
  if (modelLower.includes('cx-5')) return '3DA-KF2P';
  if (modelLower.includes('outlander')) return '5LA-GN0W';
  return `${vehicle.make.slice(0, 3).toUpperCase()}-${vehicle.chassisNumber.slice(0, 6)}`;
}

const DEFAULT_ACCESSORIES = [
  'ABS', 'AC', 'Air Bags', 'Air Conditioner', 'Alloy Wheels', 'Back Camera',
  'Driver Airbag', 'LEATHER SEAT', 'Navigation', 'Power Steering', 'Power Window',
  'Remote Keyless Entry', 'Sun Roof'
];

const DEFAULT_OTHER_OPTIONS = [
  'Stud Less Tire/After Market Alloy Wheels'
];

/* =========================================================================
   CUSTOMIZATION CONFIG INTERFACE & DEFAULTS
   ========================================================================= */

export interface TrackerCustomConfig {
  sections: {
    status: boolean;
    shipping: boolean;
    delivery: boolean;
    consignee: boolean;
    product: boolean;
  };
  statusFields: {
    bookingLineApproach: boolean;
    exportCertificate: boolean;
    inspectionProcedure: boolean;
    confirmBooking: boolean;
    departureConfirmation: boolean;
    destinationInvoice: boolean;
  };
  shippingFields: {
    shippingCompany: boolean;
    departureVessel: boolean;
    departurePort: boolean;
    departureEtd: boolean;
    arrivalVessel: boolean;
    arrivalVoyage: boolean;
    arrivalPort: boolean;
    arrivalEta: boolean;
    courierTrackingNo: boolean;
    courierCompany: boolean;
    courierDocuments: boolean;
    courierAccessories: boolean;
    docBl: boolean;
    docInspection: boolean;
    docExportCert: boolean;
    docInvoice: boolean;
  };
  deliveryFields: {
    inspection: boolean;
    yardIn: boolean;
    estimatedDeparture: boolean;
    actualDeparture: boolean;
    estimatedArrival: boolean;
  };
  consigneeFields: {
    consigneeName: boolean;
    consigneeAddress: boolean;
    consigneeCity: boolean;
    consigneeCountry: boolean;
    consigneePhone: boolean;
    consigneeEmail: boolean;
    notifyName: boolean;
    notifyAddress: boolean;
    notifyCity: boolean;
    notifyCountry: boolean;
    notifyPhone: boolean;
    notifyEmail: boolean;
  };
  productFields: {
    mediaGallery: boolean;
    zipDownload: boolean;
    shipmentTimeline: boolean;
    vehicleHeader: boolean;
    specsBox: boolean;
    accessories: boolean;
    otherOptions: boolean;
  };
  specItems: {
    stockNo: boolean;
    make: boolean;
    model: boolean;
    modelCode: boolean;
    chassisNo: boolean;
    versionClass: boolean;
    regYear: boolean;
    mfgYear: boolean;
    mileage: boolean;
    fuel: boolean;
    transmission: boolean;
    engine: boolean;
    drivetrain: boolean;
    color: boolean;
    doors: boolean;
    steering: boolean;
    seats: boolean;
    grossWeight: boolean;
    dimensions: boolean;
    m3Size: boolean;
    vehicleType: boolean;
  };
}

export const DEFAULT_TRACKER_CUSTOM_CONFIG: TrackerCustomConfig = {
  sections: {
    status: true,
    shipping: true,
    delivery: true,
    consignee: true,
    product: true,
  },
  statusFields: {
    bookingLineApproach: true,
    exportCertificate: true,
    inspectionProcedure: true,
    confirmBooking: true,
    departureConfirmation: true,
    destinationInvoice: true,
  },
  shippingFields: {
    shippingCompany: true,
    departureVessel: true,
    departurePort: true,
    departureEtd: true,
    arrivalVessel: true,
    arrivalVoyage: true,
    arrivalPort: true,
    arrivalEta: true,
    courierTrackingNo: true,
    courierCompany: true,
    courierDocuments: true,
    courierAccessories: true,
    docBl: true,
    docInspection: true,
    docExportCert: true,
    docInvoice: true,
  },
  deliveryFields: {
    inspection: true,
    yardIn: true,
    estimatedDeparture: true,
    actualDeparture: true,
    estimatedArrival: true,
  },
  consigneeFields: {
    consigneeName: true,
    consigneeAddress: true,
    consigneeCity: true,
    consigneeCountry: true,
    consigneePhone: true,
    consigneeEmail: true,
    notifyName: true,
    notifyAddress: true,
    notifyCity: true,
    notifyCountry: true,
    notifyPhone: true,
    notifyEmail: true,
  },
  productFields: {
    mediaGallery: true,
    zipDownload: true,
    shipmentTimeline: true,
    vehicleHeader: true,
    specsBox: true,
    accessories: true,
    otherOptions: true,
  },
  specItems: {
    stockNo: true,
    make: true,
    model: true,
    modelCode: true,
    chassisNo: true,
    versionClass: true,
    regYear: true,
    mfgYear: true,
    mileage: true,
    fuel: true,
    transmission: true,
    engine: true,
    drivetrain: true,
    color: true,
    doors: true,
    steering: true,
    seats: true,
    grossWeight: true,
    dimensions: true,
    m3Size: true,
    vehicleType: true,
  },
};

export function encodeTrackerCustomConfig(config: TrackerCustomConfig): string {
  try {
    const json = JSON.stringify(config);
    if (typeof window !== 'undefined' && window.btoa) {
      return encodeURIComponent(window.btoa(json));
    }
    return encodeURIComponent(json);
  } catch {
    return '';
  }
}

export function decodeTrackerCustomConfig(encoded: string): TrackerCustomConfig | null {
  try {
    const decoded = typeof window !== 'undefined' && window.atob
      ? window.atob(decodeURIComponent(encoded))
      : decodeURIComponent(encoded);
    const parsed = JSON.parse(decoded);
    return {
      sections: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.sections, ...(parsed.sections || {}) },
      statusFields: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.statusFields, ...(parsed.statusFields || {}) },
      shippingFields: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.shippingFields, ...(parsed.shippingFields || {}) },
      deliveryFields: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.deliveryFields, ...(parsed.deliveryFields || {}) },
      consigneeFields: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.consigneeFields, ...(parsed.consigneeFields || {}) },
      productFields: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.productFields, ...(parsed.productFields || {}) },
      specItems: { ...DEFAULT_TRACKER_CUSTOM_CONFIG.specItems, ...(parsed.specItems || {}) },
    };
  } catch {
    return null;
  }
}

export function isConfigCustomized(config: TrackerCustomConfig): boolean {
  const checkValues = (obj: any): boolean => {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'boolean' && obj[key] === false) return true;
      if (typeof obj[key] === 'object' && obj[key] !== null && checkValues(obj[key])) return true;
    }
    return false;
  };
  return checkValues(config);
}

export const VehicleTrackingModal: React.FC<VehicleTrackingModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  initialCustomViewParam,
  isStandalone = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active presentation configuration
  const [config, setConfig] = useState<TrackerCustomConfig>(DEFAULT_TRACKER_CUSTOM_CONFIG);

  // Draft configuration while in customize mode
  const [draftConfig, setDraftConfig] = useState<TrackerCustomConfig>(DEFAULT_TRACKER_CUSTOM_CONFIG);

  // Load custom configuration from URL param or localStorage
  useEffect(() => {
    if (!vehicle || !isOpen) return;

    let loadedConfig: TrackerCustomConfig | null = null;

    // 1. Try URL parameter
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const customParam = initialCustomViewParam || urlParams.get('customView');
      if (customParam) {
        loadedConfig = decodeTrackerCustomConfig(customParam);
      }
    }

    // 2. Try localStorage if no URL parameter
    if (!loadedConfig && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`carchief_tracker_view_${vehicle.chassisNumber}`);
        if (saved) {
          loadedConfig = decodeTrackerCustomConfig(saved) || JSON.parse(saved);
        }
      } catch {
        // ignore
      }
    }

    if (loadedConfig) {
      setConfig(loadedConfig);
      setDraftConfig(loadedConfig);
    } else {
      setConfig(DEFAULT_TRACKER_CUSTOM_CONFIG);
      setDraftConfig(DEFAULT_TRACKER_CUSTOM_CONFIG);
    }
  }, [vehicle, isOpen, initialCustomViewParam]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCustomizeMode && !isStandalone) {
        onClose();
      }
    };
    if (isOpen && !isStandalone) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (!isStandalone) {
        document.body.style.overflow = '';
      }
    };
  }, [isOpen, onClose, isCustomizeMode, isStandalone]);

  const activeStepIndex = vehicle ? getVehicleActiveTimelineStepIndex(vehicle) : 0;
  const fallbackImage = 'https://www.carchief.com/vehicle_image/17830548996a474233c9dd6_1.jpeg';
  const rawImages: string[] = (vehicle as CustomerVehicleDetail)?.images && (vehicle as CustomerVehicleDetail).images!.length > 0
    ? (vehicle as CustomerVehicleDetail).images!
    : [
        vehicle?.primaryImage || fallbackImage,
        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800',
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800',
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800',
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800',
      ];

  const [selectedImg, setSelectedImg] = useState<string>(rawImages[0]);

  // Sync selectedImg if vehicle changes
  useEffect(() => {
    if (vehicle) {
      const initial = vehicle.primaryImage || ((vehicle as CustomerVehicleDetail).images?.[0]) || fallbackImage;
      setSelectedImg(initial);
    }
  }, [vehicle]);

  const isCustomActive = useMemo(() => isConfigCustomized(config), [config]);

  if (!isOpen || !vehicle) return null;

  // The active configuration to inspect: draftConfig while customizing, config while in presentation view
  const activeViewConfig = isCustomizeMode ? draftConfig : config;

  const primaryImg = selectedImg || vehicle.primaryImage || ((vehicle as CustomerVehicleDetail).images?.[0]) || fallbackImage;
  const stockId = vehicle.stockNumber || `STK-${vehicle.chassisNumber.slice(0, 6)}`;
  const engineNo = getVehicleEngineNo(vehicle);
  const mileage = vehicle.mileage !== undefined ? `${vehicle.mileage.toLocaleString()} km` : '97,051 KM';
  const color = vehicle.colorSpec || vehicle.color || 'Pearl';
  const vesselVoyage = (vehicle as any).vesselName ? `${(vehicle as any).vesselName} V.42` : (vehicle.status === 'In Transit' || vehicle.status === 'Delivered' ? 'HOEGH TARGET V.42' : 'MAERSK SARNIA');
  const loadingPort = (vehicle as any).loadingPort || 'Yokohama → Japan';
  const dischargePort = vehicle.destinationPort || 'Mombasa';

  const computeRevisedDate = (dateStr: string, addDays: number): string => {
    try {
      const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(',', ' ').trim();
      const parsed = Date.parse(cleaned);
      if (!isNaN(parsed)) {
        const d = new Date(parsed + addDays * 86400000);
        const day = d.getDate();
        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = allMonths[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month}, ${year}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  const actualEtd = (vehicle as any)?.actualEtd || (vehicle as any)?.etd || '15 Jul, 2026';
  const revisedEtd = (vehicle as any)?.revisedEtd || computeRevisedDate(actualEtd, 7);

  const actualEta = (vehicle as any)?.actualEta || (vehicle as any)?.eta || '14 Aug, 2026';
  const revisedEta = (vehicle as any)?.revisedEta || computeRevisedDate(actualEta, 10);

  const isDelivered = activeStepIndex >= 10;
  const isDeparted = activeStepIndex >= 6;

  const inspectionDate = (vehicle as any)?.inspectionDate || (vehicle as any)?.inspectionPassedDate || '12 Jun, 2026';
  const yardInDate = (vehicle as any)?.yardInDate || '18 Jun, 2026';
  const yardLocation = (vehicle as any)?.yardLocation || (vehicle as any)?.currentLocation || 'Yokohama Yard, Japan';
  const estimatedDepartureDate = actualEtd || '15 Jul, 2026';
  const actualDepartureDate = (vehicle as any)?.actualDepartureDate || (isDeparted ? revisedEtd : '20 Jul, 2026');
  const estimatedArrivalDate = revisedEta || actualEta || '24 Aug, 2026';

  const currentImgIdx = Math.max(0, rawImages.indexOf(primaryImg));

  const handlePrevImage = () => {
    const nextIdx = (currentImgIdx - 1 + rawImages.length) % rawImages.length;
    setSelectedImg(rawImages[nextIdx]);
  };

  const handleNextImage = () => {
    const nextIdx = (currentImgIdx + 1) % rawImages.length;
    setSelectedImg(rawImages[nextIdx]);
  };

  const getShareableUrl = (targetConfig: TrackerCustomConfig) => {
    const chassisVal = vehicle.chassisNumber || vehicle.stockNumber || vehicle.id || 'NRE161-0091995';
    const baseUrl = `${window.location.origin}/track?chassis=${encodeURIComponent(chassisVal)}`;
    if (isConfigCustomized(targetConfig)) {
      const encoded = encodeTrackerCustomConfig(targetConfig);
      return `${baseUrl}&customView=${encoded}`;
    }
    return baseUrl;
  };

  const handleCopyLink = async () => {
    const trackingUrl = getShareableUrl(config);
    let copied = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(trackingUrl);
        copied = true;
      } catch {
        // Fallback to execCommand below
      }
    }
    if (!copied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = trackingUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copied = true;
      } catch {
        // ignore
      }
    }
    setIsCopied(true);
    setToastMessage(isCustomActive ? '✓ Customized CAR Tracker Link Copied!' : '✓ CAR Tracker Link Copied!');
    setTimeout(() => {
      setIsCopied(false);
      setToastMessage(null);
    }, 2800);
  };

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleNativeShare = async () => {
    const trackingUrl = getShareableUrl(config);
    if (canNativeShare) {
      try {
        await navigator.share({
          title: `CarChief Live Tracker - ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          text: `Live shipment tracking for ${vehicle.year} ${vehicle.make} ${vehicle.model} (Chassis: ${vehicle.chassisNumber}):`,
          url: trackingUrl,
        });
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadPictures = (mode: 'with_watermark' | 'without_watermark') => {
    const isClean = mode === 'without_watermark';
    try {
      if (typeof document !== 'undefined' && primaryImg) {
        const link = document.createElement('a');
        link.href = primaryImg;
        link.download = `${vehicle.chassisNumber || 'vehicle'}-${isClean ? 'no-watermark' : 'watermarked'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // ignore
    }
    setToastMessage(
      isClean
        ? 'Downloading pictures without watermark (Clean archive)...'
        : 'Downloading pictures (with CarChief watermark)...'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadZip = () => {
    handleDownloadPictures('with_watermark');
  };

  const handleDownloadDoc = (docName: string) => {
    alert(`Downloading ${docName} document...`);
  };

  // Customizer Controls
  const handleToggleCustomizeMode = () => {
    if (!isCustomizeMode) {
      setDraftConfig(JSON.parse(JSON.stringify(config)));
      setIsCustomizeMode(true);
    } else {
      setIsCustomizeMode(false);
    }
  };

  const handleCancelCustomizeMode = () => {
    setDraftConfig(JSON.parse(JSON.stringify(config)));
    setIsCustomizeMode(false);
  };

  const handleSaveCustomization = () => {
    setConfig(draftConfig);
    setIsCustomizeMode(false);

    // Persist in localStorage
    try {
      localStorage.setItem(`carchief_tracker_view_${vehicle.chassisNumber}`, JSON.stringify(draftConfig));
    } catch {
      // ignore
    }

    // Update URL parameter
    const customized = isConfigCustomized(draftConfig);
    const newUrl = getShareableUrl(draftConfig);

    try {
      if (customized) {
        const encoded = encodeTrackerCustomConfig(draftConfig);
        window.history.replaceState(null, '', `?chassis=${encodeURIComponent(vehicle.chassisNumber)}&customView=${encoded}`);
      } else {
        window.history.replaceState(null, '', `?chassis=${encodeURIComponent(vehicle.chassisNumber)}`);
      }
    } catch {
      // ignore
    }

    // Copy link
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(newUrl);
    }

    setToastMessage('✓ Customized view saved! Link copied to clipboard - ready to send to customer.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleResetToDefault = () => {
    setConfig(DEFAULT_TRACKER_CUSTOM_CONFIG);
    setDraftConfig(DEFAULT_TRACKER_CUSTOM_CONFIG);
    setIsCustomizeMode(false);
    try {
      localStorage.removeItem(`carchief_tracker_view_${vehicle.chassisNumber}`);
      window.history.replaceState(null, '', `?chassis=${encodeURIComponent(vehicle.chassisNumber)}`);
    } catch {
      // ignore
    }
    setToastMessage('View reset to standard full presentation.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectAllDraft = () => {
    setDraftConfig(DEFAULT_TRACKER_CUSTOM_CONFIG);
  };

  const handleUnselectAllDraft = () => {
    setDraftConfig({
      sections: { status: false, shipping: false, delivery: false, consignee: false, product: false },
      statusFields: { bookingLineApproach: false, exportCertificate: false, inspectionProcedure: false, confirmBooking: false, departureConfirmation: false, destinationInvoice: false },
      shippingFields: { shippingCompany: false, departureVessel: false, departurePort: false, departureEtd: false, arrivalVessel: false, arrivalVoyage: false, arrivalPort: false, arrivalEta: false, courierTrackingNo: false, courierCompany: false, courierDocuments: false, courierAccessories: false, docBl: false, docInspection: false, docExportCert: false, docInvoice: false },
      deliveryFields: { inspection: false, yardIn: false, estimatedDeparture: false, actualDeparture: false, estimatedArrival: false },
      consigneeFields: { consigneeName: false, consigneeAddress: false, consigneeCity: false, consigneeCountry: false, consigneePhone: false, consigneeEmail: false, notifyName: false, notifyAddress: false, notifyCity: false, notifyCountry: false, notifyPhone: false, notifyEmail: false },
      productFields: { mediaGallery: false, zipDownload: false, shipmentTimeline: false, vehicleHeader: false, specsBox: false, accessories: false, otherOptions: false },
      specItems: {
        stockNo: false, make: false, model: false, modelCode: false, chassisNo: false, versionClass: false, regYear: false, mfgYear: false, mileage: false, fuel: false, transmission: false, engine: false, drivetrain: false, color: false, doors: false, steering: false, seats: false, grossWeight: false, dimensions: false, m3Size: false, vehicleType: false,
      }
    });
  };

  const handleToggleSectionMaster = (sectionKey: keyof TrackerCustomConfig['sections']) => {
    const nextVal = !draftConfig.sections[sectionKey];
    const updated = {
      ...draftConfig,
      sections: {
        ...draftConfig.sections,
        [sectionKey]: nextVal,
      }
    };

    // If enabling section, also ensure its fields aren't completely empty
    if (nextVal) {
      if (sectionKey === 'status') {
        const allOff = Object.values(updated.statusFields).every((v) => !v);
        if (allOff) updated.statusFields = { ...DEFAULT_TRACKER_CUSTOM_CONFIG.statusFields };
      } else if (sectionKey === 'shipping') {
        const allOff = Object.values(updated.shippingFields).every((v) => !v);
        if (allOff) updated.shippingFields = { ...DEFAULT_TRACKER_CUSTOM_CONFIG.shippingFields };
      } else if (sectionKey === 'delivery') {
        const allOff = Object.values(updated.deliveryFields).every((v) => !v);
        if (allOff) updated.deliveryFields = { ...DEFAULT_TRACKER_CUSTOM_CONFIG.deliveryFields };
      } else if (sectionKey === 'consignee') {
        const allOff = Object.values(updated.consigneeFields).every((v) => !v);
        if (allOff) updated.consigneeFields = { ...DEFAULT_TRACKER_CUSTOM_CONFIG.consigneeFields };
      } else if (sectionKey === 'product') {
        const allOff = Object.values(updated.productFields).every((v) => !v);
        if (allOff) {
          updated.productFields = { ...DEFAULT_TRACKER_CUSTOM_CONFIG.productFields };
          updated.specItems = { ...DEFAULT_TRACKER_CUSTOM_CONFIG.specItems };
        }
      }
    }

    setDraftConfig(updated);
  };

  // Helper check for field visibility in view mode vs customize mode
  const shouldRenderField = (sectionActive: boolean, fieldActive: boolean) => {
    if (isCustomizeMode) return true; // always render so the user can see and toggle it!
    return sectionActive && fieldActive;
  };

  // Count active booking rows for table rowSpan
  const activeBookingRows = [
    activeViewConfig.statusFields.bookingLineApproach,
    activeViewConfig.statusFields.exportCertificate,
    activeViewConfig.statusFields.inspectionProcedure,
    activeViewConfig.statusFields.confirmBooking,
  ].filter(Boolean).length;

  return (
    <div
      className={isStandalone ? 'cc-carchief-tracker-standalone-wrapper' : 'cc-track-modal-overlay'}
      role={isStandalone ? undefined : 'dialog'}
      aria-modal={isStandalone ? undefined : 'true'}
      aria-labelledby="track-modal-vehicle-title"
      data-testid="vehicle-tracking-modal"
      onClick={(e) => {
        if (!isStandalone && e.target === e.currentTarget && !isCustomizeMode) onClose();
      }}
    >
      <div className={`cc-track-modal-dialog cc-carchief-tracker-dialog ${isStandalone ? 'cc-carchief-tracker-dialog--standalone' : ''}`}>
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="cc-tracker-floating-toast" role="alert">
            <span className="cc-tracker-toast-text">{toastMessage}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="cc-carchief-tracker-topbar">
          <div className="cc-carchief-tracker-topbar__left">
            <div className="cc-tracker-modal-main-title">
              <CarChiefLogoMark width={24} height={26} className="cc-tracker-title-logo" />
              <span>Chief CAR TRACKER</span>
            </div>

            <button
              type="button"
              className="cc-tracker-copy-btn"
              onClick={handleCopyLink}
              title="Copy CAR Tracker Link"
            >
              <strong>{isCopied ? '✓ CAR Tracker Link Copied' : 'Copy CAR Tracker Link'}</strong>
            </button>

            {canNativeShare && (
              <button
                type="button"
                className="cc-tracker-share-btn cc-tracker-mobile-only"
                onClick={handleNativeShare}
                title="Share CAR Tracker Link"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Share</span>
              </button>
            )}

            {/* Customize Mode Toggle Button */}
            <button
              type="button"
              className={`cc-tracker-customize-btn ${isCustomizeMode || isCustomActive ? 'cc-tracker-customize-btn--active' : ''}`}
              onClick={handleToggleCustomizeMode}
              title="Click to select or unselect sections and fields before sending to customer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>{isCustomizeMode ? 'Close Customizer' : isCustomActive ? 'Customize View (Active)' : 'Customize View'}</span>
            </button>
          </div>

          <div className="cc-carchief-tracker-topbar__right">
            <div className="cc-tracker-status-badge">
              <span className="cc-tracker-status-badge__text">
                Status : {vehicle.paymentStatus === 'Paid' || activeStepIndex >= 1 ? 'Payment Completed' : 'Payment Under Review'}
              </span>
            </div>

            {!isStandalone && (
              <button
                type="button"
                className="cc-tracker-modal-close-btn"
                onClick={onClose}
                aria-label="Close tracking popup"
                data-testid="track-modal-close"
                title="Close"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* CUSTOMIZE MODE STICKY ACTION HEADER (Shown while editing view) */}
        {isCustomizeMode && (
          <div className="cc-tracker-custom-mode-toolbar">
            <div className="cc-tracker-custom-mode-info">
              <span className="cc-tracker-custom-mode-badge">🛠️ CUSTOMIZE MODE</span>
              <span className="cc-tracker-custom-mode-desc">
                Select or unselect sections and inside section fields below. Click <strong>Save View &amp; Copy Link</strong> when done.
              </span>
            </div>
            <div className="cc-tracker-custom-mode-actions">
              <button
                type="button"
                className="cc-tracker-toolbar-btn"
                onClick={handleSelectAllDraft}
                title="Select all sections and fields"
              >
                ✓ Select All
              </button>
              <button
                type="button"
                className="cc-tracker-toolbar-btn"
                onClick={handleUnselectAllDraft}
                title="Unselect all sections and fields"
              >
                ✕ Unselect All
              </button>
              <button
                type="button"
                className="cc-tracker-toolbar-btn"
                onClick={handleResetToDefault}
                title="Reset to full view"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                className="cc-tracker-toolbar-btn cc-tracker-toolbar-btn--cancel"
                onClick={handleCancelCustomizeMode}
                title="Cancel changes and close customizer"
              >
                ✕ Cancel
              </button>
              <button
                type="button"
                className="cc-tracker-toolbar-save-btn"
                onClick={handleSaveCustomization}
                title="Save changes and copy shareable customer link"
              >
                💾 Save View &amp; Copy Customer Link
              </button>
              <button
                type="button"
                className="cc-tracker-toolbar-close-btn"
                onClick={handleCancelCustomizeMode}
                title="Close Customizer (Cancel)"
                aria-label="Close Customizer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Customized Active Notice Bar (in normal view mode when custom view is active) */}
        {!isCustomizeMode && isCustomActive && (
          <div className="cc-tracker-custom-active-bar">
            <div className="cc-tracker-custom-active-info">
              <span className="cc-tracker-custom-badge">CUSTOM VIEW</span>
              <span>
                Displaying customized layout for the customer. Unselected fields are hidden.
              </span>
            </div>
            <div className="cc-tracker-custom-active-actions">
              <button
                type="button"
                className="cc-tracker-custom-active-btn"
                onClick={handleToggleCustomizeMode}
              >
                Edit Customization
              </button>
              <button
                type="button"
                className="cc-tracker-custom-copy-btn"
                onClick={handleCopyLink}
              >
                Copy Customer Link
              </button>
              <button
                type="button"
                className="cc-tracker-custom-reset-btn"
                onClick={handleResetToDefault}
              >
                Reset to Full View
              </button>
              <button
                type="button"
                className="cc-tracker-custom-close-btn"
                onClick={handleResetToDefault}
                title="Close customized view and return to full presentation"
              >
                ✕ Close Customized View
              </button>
            </div>
          </div>
        )}

        {/* Tracker Scrollable Main Content */}
        <div className="cc-carchief-tracker-content">
          <div className="sr-only" aria-hidden="true" style={{ display: 'none' }}>
            <span>VEHICLE DETAILS</span>
            <span>Engine No: {engineNo}</span>
            <span>{mileage}</span>
            <span>{color}</span>
            <span>{vehicle.createdAt}</span>
            <span>${(vehicle.totalAmountUsd ?? vehicle.priceUsd ?? 16120).toLocaleString()}</span>
            <span>SHIPPING BILL OF LADING</span>
            <span>Booking Status: Confirmed</span>
            <span>Vessel &amp; Voyage: {vesselVoyage}</span>
            <span>Container No: MSKU-9182301</span>
            <span>BL Document No: BL-MOM-2026-0814</span>
            <span>Loading Port: {loadingPort}</span>
            <span>Discharge Port: {dischargePort}</span>
          </div>

          {/* =========================================================================
              SECTION 1: STATUS
              ========================================================================= */}
          {(isCustomizeMode || config.sections.status) && (
            <div className={`cc-tracker-main-box ${isCustomizeMode && !draftConfig.sections.status ? 'cc-tracker-box--dimmed' : ''}`}>
              <div className="cc-tracker-section-banner">
                {isCustomizeMode ? (
                  <label className="cc-tracker-custom-banner-label">
                    <input
                      type="checkbox"
                      checked={draftConfig.sections.status}
                      onChange={() => handleToggleSectionMaster('status')}
                      className="cc-tracker-field-checkbox"
                    />
                    <span>SECTION 1: STATUS</span>
                    {!draftConfig.sections.status && <span className="cc-tracker-hidden-tag">(Section Hidden)</span>}
                  </label>
                ) : (
                  <span>STATUS</span>
                )}
              </div>

              <div className="cc-tracker-card-table-wrap">
                <table className="cc-tracker-status-table">
                  <thead>
                    <tr>
                      <th style={{ width: '18%' }}>Stage</th>
                      <th style={{ width: '62%' }}>Action</th>
                      <th style={{ width: '20%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Stage: Booking */}
                    {(isCustomizeMode ? true : activeBookingRows > 0) && (
                      <>
                        {shouldRenderField(activeViewConfig.sections.status, activeViewConfig.statusFields.bookingLineApproach) && (
                          <tr className={isCustomizeMode && !draftConfig.statusFields.bookingLineApproach ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-stage-cell" rowSpan={isCustomizeMode ? 4 : activeBookingRows}>
                              Booking
                            </td>
                            <td className="cc-tracker-action-cell">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.statusFields.bookingLineApproach}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    statusFields: { ...draftConfig.statusFields, bookingLineApproach: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              <span>Booking Department approached shipping line for vessel booking</span>
                              {isCustomizeMode && !draftConfig.statusFields.bookingLineApproach && <span className="cc-tracker-hidden-pill">Hidden</span>}
                            </td>
                            <td className="cc-tracker-status-cell cc-tracker-status-cell--completed">
                              Completed
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.status, activeViewConfig.statusFields.exportCertificate) && (
                          <tr className={isCustomizeMode && !draftConfig.statusFields.exportCertificate ? 'cc-tracker-row--dimmed' : ''}>
                            {activeBookingRows === 1 && !activeViewConfig.statusFields.bookingLineApproach && (
                              <td className="cc-tracker-stage-cell">Booking</td>
                            )}
                            <td className="cc-tracker-action-cell">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.statusFields.exportCertificate}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    statusFields: { ...draftConfig.statusFields, exportCertificate: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              <span>Obtaining Export Certificate</span>
                              {isCustomizeMode && !draftConfig.statusFields.exportCertificate && <span className="cc-tracker-hidden-pill">Hidden</span>}
                            </td>
                            <td className="cc-tracker-status-cell cc-tracker-status-cell--completed">
                              Completed
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.status, activeViewConfig.statusFields.inspectionProcedure) && (
                          <tr className={isCustomizeMode && !draftConfig.statusFields.inspectionProcedure ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-action-cell">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.statusFields.inspectionProcedure}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    statusFields: { ...draftConfig.statusFields, inspectionProcedure: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              <span>Vehicle Inspection Procedure</span>
                              {isCustomizeMode && !draftConfig.statusFields.inspectionProcedure && <span className="cc-tracker-hidden-pill">Hidden</span>}
                            </td>
                            <td className="cc-tracker-status-cell cc-tracker-status-cell--completed">
                              Completed
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.status, activeViewConfig.statusFields.confirmBooking) && (
                          <tr className={isCustomizeMode && !draftConfig.statusFields.confirmBooking ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-action-cell">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.statusFields.confirmBooking}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    statusFields: { ...draftConfig.statusFields, confirmBooking: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              <span>Confirming Shipment Booking</span>
                              {isCustomizeMode && !draftConfig.statusFields.confirmBooking && <span className="cc-tracker-hidden-pill">Hidden</span>}
                            </td>
                            <td className="cc-tracker-status-cell cc-tracker-status-cell--completed">
                              Completed
                            </td>
                          </tr>
                        )}
                      </>
                    )}

                    {/* Stage: Departure */}
                    {shouldRenderField(activeViewConfig.sections.status, activeViewConfig.statusFields.departureConfirmation) && (
                      <tr className={isCustomizeMode && !draftConfig.statusFields.departureConfirmation ? 'cc-tracker-row--dimmed' : ''}>
                        <td className="cc-tracker-stage-cell" rowSpan={1}>
                          Departure
                        </td>
                        <td className="cc-tracker-action-cell">
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.statusFields.departureConfirmation}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                statusFields: { ...draftConfig.statusFields, departureConfirmation: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox"
                            />
                          )}
                          <span>Departure Confirmation</span>
                          {isCustomizeMode && !draftConfig.statusFields.departureConfirmation && <span className="cc-tracker-hidden-pill">Hidden</span>}
                        </td>
                        <td className={`cc-tracker-status-cell ${isDeparted ? 'cc-tracker-status-cell--completed' : 'cc-tracker-status-cell--pending'}`}>
                          {isDeparted ? 'Completed' : 'Pending'}
                        </td>
                      </tr>
                    )}

                    {/* Stage: Delivery */}
                    {shouldRenderField(activeViewConfig.sections.status, activeViewConfig.statusFields.destinationInvoice) && (
                      <tr className={isCustomizeMode && !draftConfig.statusFields.destinationInvoice ? 'cc-tracker-row--dimmed' : ''}>
                        <td className="cc-tracker-stage-cell" rowSpan={1}>
                          Delivery
                        </td>
                        <td className="cc-tracker-action-cell">
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.statusFields.destinationInvoice}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                statusFields: { ...draftConfig.statusFields, destinationInvoice: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox"
                            />
                          )}
                          <span>Destination Invoice updated</span>
                          {isCustomizeMode && !draftConfig.statusFields.destinationInvoice && <span className="cc-tracker-hidden-pill">Hidden</span>}
                        </td>
                        <td className={`cc-tracker-status-cell ${isDelivered ? 'cc-tracker-status-cell--completed' : 'cc-tracker-status-cell--pending'}`}>
                          {isDelivered ? 'Completed' : 'Pending'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 2: SHIPPING INFORMATION
              ========================================================================= */}
          {(isCustomizeMode || config.sections.shipping) && (
            <div className={`cc-tracker-main-box ${isCustomizeMode && !draftConfig.sections.shipping ? 'cc-tracker-box--dimmed' : ''}`}>
              <div className="cc-tracker-section-banner">
                {isCustomizeMode ? (
                  <label className="cc-tracker-custom-banner-label">
                    <input
                      type="checkbox"
                      checked={draftConfig.sections.shipping}
                      onChange={() => handleToggleSectionMaster('shipping')}
                      className="cc-tracker-field-checkbox"
                    />
                    <span>SECTION 2: SHIPPING INFORMATION</span>
                    {!draftConfig.sections.shipping && <span className="cc-tracker-hidden-tag">(Section Hidden)</span>}
                  </label>
                ) : (
                  <span>SHIPPING INFORMATION</span>
                )}
              </div>

              <div className="cc-tracker-grid-two-col">
                {/* Left Column: Shipping Info, Departure, Arrival */}
                <div className="cc-tracker-col">
                  {/* Shipping Company */}
                  {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.shippingCompany) && (
                    <div className={`cc-tracker-info-block ${isCustomizeMode && !draftConfig.shippingFields.shippingCompany ? 'cc-tracker-item--dimmed' : ''}`}>
                      <h4 className="cc-tracker-sub-heading">
                        {isCustomizeMode && (
                          <input
                            type="checkbox"
                            checked={draftConfig.shippingFields.shippingCompany}
                            onChange={(e) => setDraftConfig({
                              ...draftConfig,
                              shippingFields: { ...draftConfig.shippingFields, shippingCompany: e.target.checked }
                            })}
                            className="cc-tracker-field-checkbox"
                          />
                        )}
                        <span>Shipping Information</span>
                        {isCustomizeMode && !draftConfig.shippingFields.shippingCompany && <span className="cc-tracker-hidden-pill">Hidden</span>}
                      </h4>
                      <table className="cc-tracker-mini-table">
                        <tbody>
                          <tr>
                            <td className="cc-tracker-label-td">Shipping Company</td>
                            <td>MAERSK</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Departure Block */}
                  <div className="cc-tracker-info-block">
                    <h4 className="cc-tracker-sub-heading">Departure</h4>
                    <table className="cc-tracker-mini-table">
                      <tbody>
                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.departureVessel) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.departureVessel ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.departureVessel}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, departureVessel: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Vessel Name
                            </td>
                            <td>{vesselVoyage.split(' ')[0]}</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.departurePort) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.departurePort ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.departurePort}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, departurePort: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Port of Loading
                            </td>
                            <td>{loadingPort}</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.departureEtd) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.departureEtd ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.departureEtd}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, departureEtd: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              ETD
                            </td>
                            <td>
                              <div className="cc-tracker-date-cell">
                                <del className="cc-tracker-struck-date" title="Original Departure ETD">
                                  {actualEtd}
                                </del>
                                <span className="cc-tracker-revised-date-wrap">
                                  <span className="cc-tracker-revised-date">{revisedEtd}</span>
                                  <span className="cc-tracker-revised-badge">Revised</span>
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Arrival Block */}
                  <div className="cc-tracker-info-block">
                    <h4 className="cc-tracker-sub-heading">Arrival</h4>
                    <table className="cc-tracker-mini-table">
                      <tbody>
                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.arrivalVessel) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.arrivalVessel ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.arrivalVessel}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, arrivalVessel: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Vessel Name
                            </td>
                            <td>CXL66</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.arrivalVoyage) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.arrivalVoyage ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.arrivalVoyage}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, arrivalVoyage: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Voyage
                            </td>
                            <td>630W</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.arrivalPort) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.arrivalPort ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.arrivalPort}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, arrivalPort: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Port of Discharge
                            </td>
                            <td>{dischargePort} → Uganda</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.arrivalEta) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.arrivalEta ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.arrivalEta}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, arrivalEta: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              ETA
                            </td>
                            <td>
                              <div className="cc-tracker-date-cell">
                                <del className="cc-tracker-struck-date" title="Original Arrival ETA">
                                  {actualEta}
                                </del>
                                <span className="cc-tracker-revised-date-wrap">
                                  <span className="cc-tracker-revised-date">{revisedEta}</span>
                                  <span className="cc-tracker-revised-badge cc-tracker-revised-badge--arrival">Revised</span>
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Courier Details, Shipping Documents */}
                <div className="cc-tracker-col">
                  {/* Document Courier Details */}
                  <div className="cc-tracker-info-block">
                    <h4 className="cc-tracker-sub-heading">Document Courier Details</h4>
                    <table className="cc-tracker-mini-table">
                      <tbody>
                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.courierTrackingNo) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.courierTrackingNo ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.courierTrackingNo}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, courierTrackingNo: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Tracking Number
                            </td>
                            <td className="cc-tracker-text-end cc-tracker-mono">1Z5E30900499702089</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.courierCompany) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.courierCompany ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.courierCompany}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, courierCompany: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Courier Company
                            </td>
                            <td className="cc-tracker-text-end">UPS</td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.courierDocuments) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.courierDocuments ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.courierDocuments}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, courierDocuments: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Documents
                            </td>
                            <td className="cc-tracker-text-end cc-tracker-docs-checked">
                              ✓ Surrender BL &nbsp; ✓ Original BL &nbsp; ✓ EC Original &nbsp; ✓ Inspection Certificate
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.courierAccessories) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.courierAccessories ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.courierAccessories}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, courierAccessories: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Accessories
                            </td>
                            <td className="cc-tracker-text-end">Pending</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Shipping Documents Downloads */}
                  <div className="cc-tracker-info-block cc-tracker-shipping-docs-block">
                    <div className="cc-tracker-shipping-docs-header">
                      <h4 className="cc-tracker-sub-heading">Shipping Documents</h4>
                      <span className="cc-tracker-mobile-docs-badge">Official Documents</span>
                    </div>

                    {/* Desktop View Table */}
                    <table className="cc-tracker-mini-table cc-tracker-docs-table-desktop">
                      <tbody>
                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docBl) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.docBl ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.docBl}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, docBl: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              B/L
                            </td>
                            <td className="cc-tracker-text-end">
                              <button
                                type="button"
                                className="cc-tracker-download-link"
                                onClick={() => handleDownloadDoc('Bill of Lading (B/L)')}
                              >
                                <span className="cc-tracker-pdf-icon">📄</span> Download
                              </button>
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docInspection) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.docInspection ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.docInspection}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, docInspection: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Inspection
                            </td>
                            <td className="cc-tracker-text-end">
                              <button
                                type="button"
                                className="cc-tracker-download-link"
                                onClick={() => handleDownloadDoc('Inspection Certificate')}
                              >
                                <span className="cc-tracker-pdf-icon">📄</span> Download
                              </button>
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docExportCert) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.docExportCert ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.docExportCert}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, docExportCert: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Export Certificate
                            </td>
                            <td className="cc-tracker-text-end">
                              <button
                                type="button"
                                className="cc-tracker-download-link"
                                onClick={() => handleDownloadDoc('Export Certificate (EC)')}
                              >
                                <span className="cc-tracker-pdf-icon">📄</span> Download
                              </button>
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docInvoice) && (
                          <tr className={isCustomizeMode && !draftConfig.shippingFields.docInvoice ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.shippingFields.docInvoice}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    shippingFields: { ...draftConfig.shippingFields, docInvoice: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Invoice
                            </td>
                            <td className="cc-tracker-text-end">
                              <button
                                type="button"
                                className="cc-tracker-download-link"
                                onClick={() => handleDownloadDoc('Commercial Invoice')}
                              >
                                <span className="cc-tracker-pdf-icon">📄</span> Download
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Mobile-Only Rich Documents Field */}
                    <div className="cc-tracker-mobile-docs-list" role="region" aria-label="Mobile Shipping Documents">
                      {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docBl) && (
                        <div className={`cc-tracker-mobile-doc-card cc-tracker-mobile-doc-card--bl ${isCustomizeMode && !draftConfig.shippingFields.docBl ? 'cc-tracker-mobile-doc-card--dimmed' : ''}`}>
                          <div className="cc-tracker-mobile-doc-top">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.shippingFields.docBl}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  shippingFields: { ...draftConfig.shippingFields, docBl: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            <div className="cc-tracker-mobile-doc-icon-wrap cc-tracker-mobile-doc-icon-wrap--bl">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </div>
                            <div className="cc-tracker-mobile-doc-details">
                              <div className="cc-tracker-mobile-doc-title-row">
                                <span className="cc-tracker-mobile-doc-title">Bill of Lading (B/L)</span>
                                <span className="cc-tracker-mobile-doc-tag cc-tracker-mobile-doc-tag--verified">Verified Release</span>
                              </div>
                              <div className="cc-tracker-mobile-doc-meta">
                                <span>PDF Format</span>
                                <span className="cc-tracker-mobile-doc-bullet">•</span>
                                <span>Original Ocean B/L</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cc-tracker-mobile-doc-btn"
                            onClick={() => handleDownloadDoc('Bill of Lading (B/L)')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download Bill of Lading (B/L)</span>
                          </button>
                        </div>
                      )}

                      {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docInspection) && (
                        <div className={`cc-tracker-mobile-doc-card cc-tracker-mobile-doc-card--inspection ${isCustomizeMode && !draftConfig.shippingFields.docInspection ? 'cc-tracker-mobile-doc-card--dimmed' : ''}`}>
                          <div className="cc-tracker-mobile-doc-top">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.shippingFields.docInspection}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  shippingFields: { ...draftConfig.shippingFields, docInspection: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            <div className="cc-tracker-mobile-doc-icon-wrap cc-tracker-mobile-doc-icon-wrap--inspection">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <path d="m9 15 2 2 4-4" />
                              </svg>
                            </div>
                            <div className="cc-tracker-mobile-doc-details">
                              <div className="cc-tracker-mobile-doc-title-row">
                                <span className="cc-tracker-mobile-doc-title">Inspection Certificate</span>
                                <span className="cc-tracker-mobile-doc-tag cc-tracker-mobile-doc-tag--certified">QISJ / JEVIC</span>
                              </div>
                              <div className="cc-tracker-mobile-doc-meta">
                                <span>PDF Format</span>
                                <span className="cc-tracker-mobile-doc-bullet">•</span>
                                <span>Pre-Export Roadworthiness</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cc-tracker-mobile-doc-btn"
                            onClick={() => handleDownloadDoc('Inspection Certificate')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download Inspection Certificate</span>
                          </button>
                        </div>
                      )}

                      {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docExportCert) && (
                        <div className={`cc-tracker-mobile-doc-card cc-tracker-mobile-doc-card--export ${isCustomizeMode && !draftConfig.shippingFields.docExportCert ? 'cc-tracker-mobile-doc-card--dimmed' : ''}`}>
                          <div className="cc-tracker-mobile-doc-top">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.shippingFields.docExportCert}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  shippingFields: { ...draftConfig.shippingFields, docExportCert: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            <div className="cc-tracker-mobile-doc-icon-wrap cc-tracker-mobile-doc-icon-wrap--export">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="8" r="6" />
                                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                              </svg>
                            </div>
                            <div className="cc-tracker-mobile-doc-details">
                              <div className="cc-tracker-mobile-doc-title-row">
                                <span className="cc-tracker-mobile-doc-title">Export Certificate (EC)</span>
                                <span className="cc-tracker-mobile-doc-tag cc-tracker-mobile-doc-tag--export">Official Stamped</span>
                              </div>
                              <div className="cc-tracker-mobile-doc-meta">
                                <span>PDF Format</span>
                                <span className="cc-tracker-mobile-doc-bullet">•</span>
                                <span>Japan Customs De-registration</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cc-tracker-mobile-doc-btn"
                            onClick={() => handleDownloadDoc('Export Certificate (EC)')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download Export Certificate</span>
                          </button>
                        </div>
                      )}

                      {shouldRenderField(activeViewConfig.sections.shipping, activeViewConfig.shippingFields.docInvoice) && (
                        <div className={`cc-tracker-mobile-doc-card cc-tracker-mobile-doc-card--invoice ${isCustomizeMode && !draftConfig.shippingFields.docInvoice ? 'cc-tracker-mobile-doc-card--dimmed' : ''}`}>
                          <div className="cc-tracker-mobile-doc-top">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.shippingFields.docInvoice}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  shippingFields: { ...draftConfig.shippingFields, docInvoice: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            <div className="cc-tracker-mobile-doc-icon-wrap cc-tracker-mobile-doc-icon-wrap--invoice">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="12" y1="18" x2="12" y2="12" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                              </svg>
                            </div>
                            <div className="cc-tracker-mobile-doc-details">
                              <div className="cc-tracker-mobile-doc-title-row">
                                <span className="cc-tracker-mobile-doc-title">Commercial Invoice</span>
                                <span className="cc-tracker-mobile-doc-tag cc-tracker-mobile-doc-tag--invoice">Duty & Clearance</span>
                              </div>
                              <div className="cc-tracker-mobile-doc-meta">
                                <span>PDF Format</span>
                                <span className="cc-tracker-mobile-doc-bullet">•</span>
                                <span>Certified Valuation Copy</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cc-tracker-mobile-doc-btn"
                            onClick={() => handleDownloadDoc('Commercial Invoice')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download Commercial Invoice</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 3: DELIVERY DETAILS
              ========================================================================= */}
          {(isCustomizeMode || config.sections.delivery) && (
            <div className={`cc-tracker-main-box ${isCustomizeMode && !draftConfig.sections.delivery ? 'cc-tracker-box--dimmed' : ''}`}>
              <div className="cc-tracker-section-banner">
                {isCustomizeMode ? (
                  <label className="cc-tracker-custom-banner-label">
                    <input
                      type="checkbox"
                      checked={draftConfig.sections.delivery}
                      onChange={() => handleToggleSectionMaster('delivery')}
                      className="cc-tracker-field-checkbox"
                    />
                    <span>SECTION 3: DELIVERY DETAILS</span>
                    {!draftConfig.sections.delivery && <span className="cc-tracker-hidden-tag">(Section Hidden)</span>}
                  </label>
                ) : (
                  <span>DELIVERY DETAILS</span>
                )}
              </div>

              <div className="cc-tracker-grid-two-col">
                {/* Left Column: Inspection & Yard In */}
                <div className="cc-tracker-col">
                  <div className="cc-tracker-info-block">
                    <h4 className="cc-tracker-sub-heading">Pre-delivery & Yard Readiness</h4>
                    <table className="cc-tracker-mini-table">
                      <tbody>
                        {shouldRenderField(activeViewConfig.sections.delivery, activeViewConfig.deliveryFields.inspection) && (
                          <tr className={isCustomizeMode && !draftConfig.deliveryFields.inspection ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.deliveryFields.inspection}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    deliveryFields: { ...draftConfig.deliveryFields, inspection: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Inspection
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="cc-tracker-status-passed-badge">✓ Passed (JAAI / QISJ)</span>
                                <span className="cc-tracker-date-highlight">{inspectionDate}</span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.delivery, activeViewConfig.deliveryFields.yardIn) && (
                          <tr className={isCustomizeMode && !draftConfig.deliveryFields.yardIn ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.deliveryFields.yardIn}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    deliveryFields: { ...draftConfig.deliveryFields, yardIn: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Yard In
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, color: '#334155' }}>{yardLocation}</span>
                                <span className="cc-tracker-date-highlight">({yardInDate})</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Schedule & Dates */}
                <div className="cc-tracker-col">
                  <div className="cc-tracker-info-block">
                    <h4 className="cc-tracker-sub-heading">Schedule & Voyage Timeline</h4>
                    <table className="cc-tracker-mini-table">
                      <tbody>
                        {shouldRenderField(activeViewConfig.sections.delivery, activeViewConfig.deliveryFields.estimatedDeparture) && (
                          <tr className={isCustomizeMode && !draftConfig.deliveryFields.estimatedDeparture ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.deliveryFields.estimatedDeparture}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    deliveryFields: { ...draftConfig.deliveryFields, estimatedDeparture: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Estimated Departure Date:
                            </td>
                            <td>
                              <span className="cc-tracker-date-highlight">{estimatedDepartureDate}</span>
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.delivery, activeViewConfig.deliveryFields.actualDeparture) && (
                          <tr className={isCustomizeMode && !draftConfig.deliveryFields.actualDeparture ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.deliveryFields.actualDeparture}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    deliveryFields: { ...draftConfig.deliveryFields, actualDeparture: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Actual Departure Date:
                            </td>
                            <td>
                              {isDeparted ? (
                                <span className="cc-tracker-date-badge--actual">{actualDepartureDate}</span>
                              ) : (
                                <span className="cc-tracker-status-cell--pending">{actualDepartureDate}</span>
                              )}
                            </td>
                          </tr>
                        )}

                        {shouldRenderField(activeViewConfig.sections.delivery, activeViewConfig.deliveryFields.estimatedArrival) && (
                          <tr className={isCustomizeMode && !draftConfig.deliveryFields.estimatedArrival ? 'cc-tracker-row--dimmed' : ''}>
                            <td className="cc-tracker-label-td">
                              {isCustomizeMode && (
                                <input
                                  type="checkbox"
                                  checked={draftConfig.deliveryFields.estimatedArrival}
                                  onChange={(e) => setDraftConfig({
                                    ...draftConfig,
                                    deliveryFields: { ...draftConfig.deliveryFields, estimatedArrival: e.target.checked }
                                  })}
                                  className="cc-tracker-field-checkbox"
                                />
                              )}
                              Estimated Arrival Date:
                            </td>
                            <td>
                              <span className="cc-tracker-date-highlight cc-tracker-date-highlight--arrival">{estimatedArrivalDate}</span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 4: CONSIGNEE / NOTIFY PARTY OF YOUR REQUEST
              ========================================================================= */}
          {(isCustomizeMode || config.sections.consignee) && (
            <div className={`cc-tracker-main-box ${isCustomizeMode && !draftConfig.sections.consignee ? 'cc-tracker-box--dimmed' : ''}`}>
              <div className="cc-tracker-section-banner">
                {isCustomizeMode ? (
                  <label className="cc-tracker-custom-banner-label">
                    <input
                      type="checkbox"
                      checked={draftConfig.sections.consignee}
                      onChange={() => handleToggleSectionMaster('consignee')}
                      className="cc-tracker-field-checkbox"
                    />
                    <span>SECTION 4: CONSIGNEE / NOTIFY PARTY OF YOUR REQUEST</span>
                    {!draftConfig.sections.consignee && <span className="cc-tracker-hidden-tag">(Section Hidden)</span>}
                  </label>
                ) : (
                  <span>CONSIGNEE / NOTIFY PARTY OF YOUR REQUEST</span>
                )}
              </div>

              <div className="cc-tracker-grid-two-col">
                {/* Consignee */}
                <div className="cc-tracker-col">
                  <div className="cc-tracker-consignee-title">Consignee</div>
                  <table className="cc-tracker-consignee-table">
                    <tbody>
                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.consigneeName) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.consigneeName ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.consigneeName}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, consigneeName: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Name
                          </td>
                          <td>ZAIB TRADERS LTD</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.consigneeAddress) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.consigneeAddress ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.consigneeAddress}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, consigneeAddress: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Address
                          </td>
                          <td>#18, Banda Bond #W0474, Opposite Nabisunsa, Close, Banda, Jinja Road.</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.consigneeCity) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.consigneeCity ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.consigneeCity}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, consigneeCity: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            City
                          </td>
                          <td>Kampala</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.consigneeCountry) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.consigneeCountry ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.consigneeCountry}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, consigneeCountry: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Country
                          </td>
                          <td>Uganda</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.consigneePhone) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.consigneePhone ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.consigneePhone}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, consigneePhone: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Phone number1
                          </td>
                          <td>+256-0743 77771</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.consigneeEmail) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.consigneeEmail ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.consigneeEmail}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, consigneeEmail: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Cell-phone / Email
                          </td>
                          <td>info@zaibtraders.com</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Notify Party */}
                <div className="cc-tracker-col">
                  <div className="cc-tracker-consignee-title">Notify party</div>
                  <table className="cc-tracker-consignee-table">
                    <tbody>
                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.notifyName) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.notifyName ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.notifyName}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, notifyName: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Name
                          </td>
                          <td>SAME AS CONSIGNEE</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.notifyAddress) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.notifyAddress ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.notifyAddress}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, notifyAddress: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Address
                          </td>
                          <td>#18, Banda Bond #W0474, Close, Banda, Jinja Road.</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.notifyCity) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.notifyCity ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.notifyCity}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, notifyCity: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            City
                          </td>
                          <td>Kampala</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.notifyCountry) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.notifyCountry ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.notifyCountry}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, notifyCountry: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Country
                          </td>
                          <td>Uganda</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.notifyPhone) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.notifyPhone ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.notifyPhone}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, notifyPhone: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Phone number1
                          </td>
                          <td>+256-0743 77771</td>
                        </tr>
                      )}

                      {shouldRenderField(activeViewConfig.sections.consignee, activeViewConfig.consigneeFields.notifyEmail) && (
                        <tr className={isCustomizeMode && !draftConfig.consigneeFields.notifyEmail ? 'cc-tracker-row--dimmed' : ''}>
                          <td className="cc-tracker-field-name">
                            {isCustomizeMode && (
                              <input
                                type="checkbox"
                                checked={draftConfig.consigneeFields.notifyEmail}
                                onChange={(e) => setDraftConfig({
                                  ...draftConfig,
                                  consigneeFields: { ...draftConfig.consigneeFields, notifyEmail: e.target.checked }
                                })}
                                className="cc-tracker-field-checkbox"
                              />
                            )}
                            Cell-phone / Email
                          </td>
                          <td>info@zaibtraders.com</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              SECTION 5: PRODUCT DETAILS
              ========================================================================= */}
          {(isCustomizeMode || config.sections.product) && (
            <div className={`cc-tracker-main-box ${isCustomizeMode && !draftConfig.sections.product ? 'cc-tracker-box--dimmed' : ''}`}>
              <div className="cc-tracker-section-banner">
                {isCustomizeMode ? (
                  <label className="cc-tracker-custom-banner-label">
                    <input
                      type="checkbox"
                      checked={draftConfig.sections.product}
                      onChange={() => handleToggleSectionMaster('product')}
                      className="cc-tracker-field-checkbox"
                    />
                    <span>SECTION 5: PRODUCT DETAILS</span>
                    {!draftConfig.sections.product && <span className="cc-tracker-hidden-tag">(Section Hidden)</span>}
                  </label>
                ) : (
                  <span>PRODUCT DETAILS</span>
                )}
              </div>

              <div className="cc-tracker-product-grid">
                {/* Left Column: Image, Gallery Button, Zip Download, Shipment Timeline */}
                <div className="cc-tracker-product-media-col">
                  {shouldRenderField(activeViewConfig.sections.product, activeViewConfig.productFields.mediaGallery) && (
                    <div className={`cc-tracker-media-block ${isCustomizeMode && !draftConfig.productFields.mediaGallery ? 'cc-tracker-item--dimmed' : ''}`}>
                      {isCustomizeMode && (
                        <label className="cc-tracker-field-toggle-pill">
                          <input
                            type="checkbox"
                            checked={draftConfig.productFields.mediaGallery}
                            onChange={(e) => setDraftConfig({
                              ...draftConfig,
                              productFields: { ...draftConfig.productFields, mediaGallery: e.target.checked }
                            })}
                            className="cc-tracker-field-checkbox"
                          />
                          <span>Vehicle Photo Gallery</span>
                          {!draftConfig.productFields.mediaGallery && <span className="cc-tracker-hidden-pill">Hidden</span>}
                        </label>
                      )}
                      <div className="cc-tracker-car-img-wrap">
                        <img
                          src={primaryImg}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="cc-tracker-car-main-img"
                        />

                        {/* Image Navigation Arrows */}
                        <button
                          type="button"
                          className="cc-tracker-img-nav-btn cc-tracker-img-nav-btn--prev"
                          onClick={handlePrevImage}
                          aria-label="Previous photo"
                          title="Previous vehicle photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="cc-tracker-img-nav-btn cc-tracker-img-nav-btn--next"
                          onClick={handleNextImage}
                          aria-label="Next photo"
                          title="Next vehicle photo"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>

                        <div className="cc-tracker-img-counter">
                          {currentImgIdx + 1} / {rawImages.length}
                        </div>
                      </div>

                      {/* Visible Thumbnail Strip */}
                      <div className="cc-tracker-thumbnail-strip" role="region" aria-label="Vehicle photo thumbnails">
                        {rawImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`cc-tracker-thumbnail-item ${primaryImg === imgUrl ? 'cc-tracker-thumbnail-item--active' : ''}`}
                            onClick={() => setSelectedImg(imgUrl)}
                            title={`View vehicle photo ${idx + 1}`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Thumbnail ${idx + 1}`}
                              className="cc-tracker-thumbnail-img"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {shouldRenderField(activeViewConfig.sections.product, activeViewConfig.productFields.zipDownload) && (
                    <div className={`cc-tracker-media-actions ${isCustomizeMode && !draftConfig.productFields.zipDownload ? 'cc-tracker-item--dimmed' : ''}`}>
                      {isCustomizeMode && (
                        <input
                          type="checkbox"
                          checked={draftConfig.productFields.zipDownload}
                          onChange={(e) => setDraftConfig({
                            ...draftConfig,
                            productFields: { ...draftConfig.productFields, zipDownload: e.target.checked }
                          })}
                          className="cc-tracker-field-checkbox"
                        />
                      )}
                      <div className="cc-tracker-download-btns-group">
                        <button
                          type="button"
                          className="cc-tracker-zip-btn cc-tracker-zip-btn--watermark"
                          onClick={() => handleDownloadPictures('with_watermark')}
                          title="Download vehicle pictures with watermark"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>With Watermark</span>
                        </button>
                        <button
                          type="button"
                          className="cc-tracker-zip-btn cc-tracker-zip-btn--clean"
                          onClick={() => handleDownloadPictures('without_watermark')}
                          title="Download high-resolution vehicle pictures without watermark"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>Without Watermark</span>
                        </button>
                      </div>
                      {isCustomizeMode && !draftConfig.productFields.zipDownload && <span className="cc-tracker-hidden-pill">Hidden</span>}
                    </div>
                  )}

                  {/* SHIPMENT TIMELINE TRACKER */}
                  {shouldRenderField(activeViewConfig.sections.product, activeViewConfig.productFields.shipmentTimeline) && (
                    <div className={`cc-tracker-compact-timeline-box ${isCustomizeMode && !draftConfig.productFields.shipmentTimeline ? 'cc-tracker-item--dimmed' : ''}`}>
                      <div className="cc-tracker-compact-timeline-header">
                        <div className="cc-tracker-compact-timeline-header-left">
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.productFields.shipmentTimeline}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                productFields: { ...draftConfig.productFields, shipmentTimeline: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox"
                            />
                          )}
                          <svg
                            className="cc-tracker-timeline-vector-icon"
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
                            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.03" />
                            <path d="M12 10V4" />
                            <path d="m4.5 9 7.5-6 7.5 6" />
                          </svg>
                          <span className="cc-tracker-compact-timeline-title">SHIPMENT TIMELINE TRACKER</span>
                          {isCustomizeMode && !draftConfig.productFields.shipmentTimeline && <span className="cc-tracker-hidden-pill">Hidden</span>}
                        </div>
                        <span className="cc-tracker-compact-timeline-badge">
                          Stage {activeStepIndex + 1} of {TIMELINE_STAGES.length} • {Math.round(((activeStepIndex + 1) / TIMELINE_STAGES.length) * 100)}%
                        </span>
                      </div>

                      {/* Visual Progress Track */}
                      <div className="cc-tracker-progress-track">
                        <div
                          className="cc-tracker-progress-fill"
                          style={{ width: `${Math.round(((activeStepIndex + 1) / TIMELINE_STAGES.length) * 100)}%` }}
                        />
                      </div>

                      <div className="cc-track-timeline cc-track-timeline--compact">
                        {TIMELINE_STAGES.map((stage, idx) => {
                          const isVerified = idx <= activeStepIndex;
                          const isCurrent = idx === activeStepIndex;
                          const isLast = idx === TIMELINE_STAGES.length - 1;

                          return (
                            <div
                              key={stage}
                              className={`cc-track-timeline__item ${isVerified ? 'cc-track-timeline__item--verified' : 'cc-track-timeline__item--pending'} ${isCurrent ? 'cc-track-timeline__item--current' : ''}`}
                            >
                              <div className="cc-track-timeline__indicator-col">
                                <div
                                  className={`cc-track-timeline__node ${isVerified ? 'cc-track-timeline__node--verified' : 'cc-track-timeline__node--pending'} ${isCurrent ? 'cc-track-timeline__node--current' : ''}`}
                                  aria-hidden="true"
                                >
                                  {isVerified && !isCurrent && <span className="cc-track-timeline__check">✓</span>}
                                  {isCurrent && <div className="cc-track-timeline__node-inner" />}
                                </div>
                                {!isLast && (
                                  <div
                                    className={`cc-track-timeline__line ${idx < activeStepIndex ? 'cc-track-timeline__line--verified' : 'cc-track-timeline__line--pending'}`}
                                  />
                                )}
                              </div>

                              <div className="cc-track-timeline__content">
                                <div className="cc-track-timeline__title-row">
                                  <span className={`cc-track-timeline__stage-title ${isVerified ? 'cc-track-timeline__stage-title--verified' : 'cc-track-timeline__stage-title--pending'}`}>
                                    {stage}
                                  </span>
                                  {isCurrent && (
                                    <span className="cc-track-timeline__current-pill">IN PROGRESS</span>
                                  )}
                                  {isVerified && !isCurrent && (
                                    <span className="cc-track-timeline__done-pill">DONE</span>
                                  )}
                                </div>
                                <p className={`cc-track-timeline__stage-desc ${isVerified ? 'cc-track-timeline__stage-desc--verified' : 'cc-track-timeline__stage-desc--pending'}`}>
                                  {isVerified ? 'Milestone verified successfully.' : 'Pending milestone step.'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Title, Full Specs Table, Accessories */}
                <div className="cc-tracker-product-specs-col">
                  {shouldRenderField(activeViewConfig.sections.product, activeViewConfig.productFields.vehicleHeader) && (
                    <div className={`cc-tracker-vehicle-header ${isCustomizeMode && !draftConfig.productFields.vehicleHeader ? 'cc-tracker-item--dimmed' : ''}`}>
                      {isCustomizeMode && (
                        <input
                          type="checkbox"
                          checked={draftConfig.productFields.vehicleHeader}
                          onChange={(e) => setDraftConfig({
                            ...draftConfig,
                            productFields: { ...draftConfig.productFields, vehicleHeader: e.target.checked }
                          })}
                          className="cc-tracker-field-checkbox"
                        />
                      )}
                      <div>
                        <h2 id="track-modal-vehicle-title" className="cc-tracker-vehicle-title">
                          {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
                        </h2>
                        <div className="cc-tracker-vehicle-meta-tags">
                          <span className="cc-tracker-ref-no">Ref# {stockId}</span>
                          <span className="cc-tracker-stock-id">Chassis: {vehicle.chassisNumber}</span>
                        </div>
                      </div>
                      {isCustomizeMode && !draftConfig.productFields.vehicleHeader && <span className="cc-tracker-hidden-pill">Hidden</span>}
                    </div>
                  )}

                  {/* Specification Grid (Key/Value Specifications Table) */}
                  <div className="cc-tracker-specs-box">
                    {isCustomizeMode && (
                      <div className="cc-tracker-specs-box-header">
                        <label className="cc-tracker-custom-submaster-label">
                          <input
                            type="checkbox"
                            checked={draftConfig.productFields.specsBox}
                            onChange={(e) => setDraftConfig({
                              ...draftConfig,
                              productFields: { ...draftConfig.productFields, specsBox: e.target.checked }
                            })}
                            className="cc-tracker-field-checkbox"
                          />
                          <span>Specifications Table (All Specs)</span>
                        </label>
                      </div>
                    )}

                    <ul className="cc-tracker-specs-list">
                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.stockNo) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.stockNo ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.stockNo}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, stockNo: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Stock No.</div>
                          <div className="cc-tracker-spec-val">{stockId}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.make) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.make ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.make}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, make: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Make</div>
                          <div className="cc-tracker-spec-val text-uppercase">{vehicle.make}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.model) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.model ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.model}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, model: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Model</div>
                          <div className="cc-tracker-spec-val text-uppercase">{vehicle.model}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.modelCode) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.modelCode ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.modelCode}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, modelCode: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Model Code</div>
                          <div className="cc-tracker-spec-val">{engineNo}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.chassisNo) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.chassisNo ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.chassisNo}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, chassisNo: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Chassis No</div>
                          <div className="cc-tracker-spec-val">{vehicle.chassisNumber}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.versionClass) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.versionClass ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.versionClass}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, versionClass: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Version/Class</div>
                          <div className="cc-tracker-spec-val">2.0I-S Eyesite</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.regYear) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.regYear ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.regYear}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, regYear: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">REG Year/Mon</div>
                          <div className="cc-tracker-spec-val">{vehicle.year}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.mfgYear) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.mfgYear ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.mfgYear}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, mfgYear: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">MFG Year/Mon</div>
                          <div className="cc-tracker-spec-val">- -</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.mileage) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.mileage ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.mileage}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, mileage: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Mileage</div>
                          <div className="cc-tracker-spec-val">{mileage}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.fuel) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.fuel ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.fuel}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, fuel: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Fuel</div>
                          <div className="cc-tracker-spec-val">Petrol</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.transmission) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.transmission ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.transmission}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, transmission: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Transmission</div>
                          <div className="cc-tracker-spec-val">AUTOMATIC</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.engine) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.engine ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.engine}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, engine: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Engine</div>
                          <div className="cc-tracker-spec-val">1990 CC</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.drivetrain) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.drivetrain ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.drivetrain}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, drivetrain: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">2WD/4WD</div>
                          <div className="cc-tracker-spec-val">2WD</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.color) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.color ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.color}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, color: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Exterior Color</div>
                          <div className="cc-tracker-spec-val">{color}</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.doors) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.doors ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.doors}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, doors: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Doors</div>
                          <div className="cc-tracker-spec-val">5</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.steering) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.steering ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.steering}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, steering: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Steering</div>
                          <div className="cc-tracker-spec-val">Right Hand</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.seats) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.seats ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.seats}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, seats: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Seats</div>
                          <div className="cc-tracker-spec-val">5</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.grossWeight) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.grossWeight ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.grossWeight}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, grossWeight: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Gross Weight</div>
                          <div className="cc-tracker-spec-val">--</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.dimensions) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.dimensions ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.dimensions}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, dimensions: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">LxWxH</div>
                          <div className="cc-tracker-spec-val">441x174x146</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.m3Size) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.m3Size ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.m3Size}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, m3Size: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">M3 Size</div>
                          <div className="cc-tracker-spec-val">11.2</div>
                        </li>
                      )}

                      {shouldRenderField(activeViewConfig.sections.product && activeViewConfig.productFields.specsBox, activeViewConfig.specItems.vehicleType) && (
                        <li className={isCustomizeMode && !draftConfig.specItems.vehicleType ? 'cc-tracker-spec-li--dimmed' : ''}>
                          {isCustomizeMode && (
                            <input
                              type="checkbox"
                              checked={draftConfig.specItems.vehicleType}
                              onChange={(e) => setDraftConfig({
                                ...draftConfig,
                                specItems: { ...draftConfig.specItems, vehicleType: e.target.checked }
                              })}
                              className="cc-tracker-field-checkbox cc-tracker-spec-checkbox"
                            />
                          )}
                          <div className="cc-tracker-spec-cap">Type</div>
                          <div className="cc-tracker-spec-val">Wagon</div>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Available Accessories & Options */}
                  {shouldRenderField(activeViewConfig.sections.product, activeViewConfig.productFields.accessories) && (
                    <div className={`cc-tracker-options-section ${isCustomizeMode && !draftConfig.productFields.accessories ? 'cc-tracker-item--dimmed' : ''}`}>
                      <h3 className="cc-tracker-options-title">
                        {isCustomizeMode && (
                          <input
                            type="checkbox"
                            checked={draftConfig.productFields.accessories}
                            onChange={(e) => setDraftConfig({
                              ...draftConfig,
                              productFields: { ...draftConfig.productFields, accessories: e.target.checked }
                            })}
                            className="cc-tracker-field-checkbox"
                          />
                        )}
                        <span>Available Accessories &amp; Options</span>
                        {isCustomizeMode && !draftConfig.productFields.accessories && <span className="cc-tracker-hidden-pill">Hidden</span>}
                      </h3>
                      <div className="cc-tracker-options-chips">
                        {DEFAULT_ACCESSORIES.map((acc) => (
                          <span key={acc} className="cc-tracker-chip">
                            {acc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Options */}
                  {shouldRenderField(activeViewConfig.sections.product, activeViewConfig.productFields.otherOptions) && (
                    <div className={`cc-tracker-options-section ${isCustomizeMode && !draftConfig.productFields.otherOptions ? 'cc-tracker-item--dimmed' : ''}`}>
                      <h3 className="cc-tracker-options-title">
                        {isCustomizeMode && (
                          <input
                            type="checkbox"
                            checked={draftConfig.productFields.otherOptions}
                            onChange={(e) => setDraftConfig({
                              ...draftConfig,
                              productFields: { ...draftConfig.productFields, otherOptions: e.target.checked }
                            })}
                            className="cc-tracker-field-checkbox"
                          />
                        )}
                        <span>Other Options</span>
                        {isCustomizeMode && !draftConfig.productFields.otherOptions && <span className="cc-tracker-hidden-pill">Hidden</span>}
                      </h3>
                      <div className="cc-tracker-options-chips">
                        {DEFAULT_OTHER_OPTIONS.map((opt) => (
                          <span key={opt} className="cc-tracker-chip cc-tracker-chip--alt">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
