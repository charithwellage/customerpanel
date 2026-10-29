import React, { useState, useMemo, useEffect } from 'react';
import { useCustomerShell } from '../shell/index.js';
import type { CustomerDemandRecord, MatchedVehicle, DemandSourceType } from './types.js';
import { SEED_DEMANDS } from './mockDemandData.js';
import './demand.css';

const LOCAL_STORAGE_KEY = 'carchief_customer_demands_v2';

// Modern Executive Automotive Vector Graphic for Demand & Sourcing Management
export const VehicleVectorIcon: React.FC<{ bodyType?: string; className?: string }> = ({
  bodyType,
  className = '',
}) => {
  const norm = (bodyType || '').toLowerCase();
  const isSuv =
    norm.includes('suv') ||
    norm.includes('4wd') ||
    norm.includes('crossover') ||
    norm.includes('prado') ||
    norm.includes('harrier') ||
    norm.includes('forester');
  const isTruck =
    norm.includes('pickup') || norm.includes('truck') || norm.includes('hilux');
  const isVan =
    norm.includes('van') ||
    norm.includes('minivan') ||
    norm.includes('bus') ||
    norm.includes('hiace') ||
    norm.includes('alphard');
  const isHatch =
    norm.includes('hatch') ||
    norm.includes('aqua') ||
    norm.includes('prius') ||
    norm.includes('compact');

  return (
    <svg
      width="64"
      height="38"
      viewBox="0 0 96 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cc-demand-vector-svg ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Metallic Dark Slate Body Gradient */}
        <linearGradient id="ccBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Tinted Luxury Automotive Glass Gradient */}
        <linearGradient id="ccGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#0284c7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
        </linearGradient>

        {/* Alloy Rim Gradient */}
        <linearGradient id="ccAlloyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="60%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        {/* Ground Contact Shadow */}
        <radialGradient id="ccGroundShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#0f172a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft Ground Shadow Under Tires */}
      <ellipse cx="48" cy="46.5" rx="42" ry="3" fill="url(#ccGroundShadow)" />

      {/* --- BODY STYLES --- */}
      {isSuv ? (
        /* ================== LUXURY SUV / 4WD ================== */
        <g>
          {/* Roof Rails */}
          <path d="M28 10.5h32" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="33" y1="10.5" x2="33" y2="13" stroke="#475569" strokeWidth="1.6" />
          <line x1="55" y1="10.5" x2="55" y2="13" stroke="#475569" strokeWidth="1.6" />

          {/* SUV Aerodynamic Body */}
          <path
            d="M8 36L8 26C8 23.5 10 21 14 20L22 13C24 12 27 12 30 12H60C63 12 66 14 68 18L76 22L86 24C88.5 24.5 90 26 90 28.5L89 33.5C89 35.5 87 37 85 37H81A9 9 0 0 0 63 37H33A9 9 0 0 0 15 37H8V36Z"
            fill="url(#ccBodyGrad)"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* SUV Glass Panels */}
          {/* Rear quarter window */}
          <path
            d="M17 21L23 14H38V21H17Z"
            fill="url(#ccGlassGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          {/* Front & Center side windows + Windshield */}
          <path
            d="M41 14H59L71 21H41V14Z"
            fill="url(#ccGlassGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          {/* B-Pillar */}
          <line x1="53" y1="14" x2="53" y2="21" stroke="#1e293b" strokeWidth="1.8" />
          {/* Glass Glare Reflections */}
          <path
            d="M26 14L19 21M49 14L42 21"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />

          {/* Shoulder Character Crease Line */}
          <path
            d="M9 25.5Q48 26 86 26.5"
            stroke="#94a3b8"
            strokeWidth="0.9"
            strokeOpacity="0.75"
          />

          {/* Aerodynamic Door Seam */}
          <line x1="53" y1="21" x2="53" y2="35" stroke="#334155" strokeWidth="0.9" />

          {/* Side Mirror */}
          <path d="M66 20.5H70L71.5 23H66Z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />

          {/* LED Cyber Headlight DRL Bar (Cyan Glow) */}
          <path d="M82 25L88 27.5" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          {/* LED Slim Crimson Taillight */}
          <path d="M8 26.5H14" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

          {/* Lower Skirt Cladding */}
          <path d="M33 36H63" stroke="#475569" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ) : isTruck ? (
        /* ================== RUGGED PICKUP / TRUCK ================== */
        <g>
          {/* Sports Roll Bar in Bed */}
          <path
            d="M27 25L32 13H36L31 25"
            fill="#475569"
            stroke="#334155"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          {/* Truck Body */}
          <path
            d="M5 36V25H29L30 15C30.5 13.5 32 12 34 12H58C61.5 12 64.5 14 66.5 18L74 22L86 23.5C88.5 24 90 25.5 90 27.5V34C89 36 87 37 85 37H81A9 9 0 0 0 63 37H33A9 9 0 0 0 15 37H5V36Z"
            fill="url(#ccBodyGrad)"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Cab Windows */}
          <path
            d="M34 14H43V21H34V14Z"
            fill="url(#ccGlassGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          <path
            d="M46 14H57L67 21H46V14Z"
            fill="url(#ccGlassGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          {/* Window glare */}
          <path
            d="M52 14L46 21"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />

          {/* Character line */}
          <path d="M6 25.5H86" stroke="#94a3b8" strokeWidth="0.9" strokeOpacity="0.75" />
          {/* Headlight & Taillight */}
          <path d="M82 24.5L88 26.5" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M5 26.5H10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : isVan ? (
        /* ================== LUXURY VIP VAN / MINIVAN ================== */
        <g>
          {/* Van High-Roof Body */}
          <path
            d="M6 36V15C6 13.5 7.5 12 9 12H60C64 12 68 15 71 19L77 24L87 28C88.5 28.5 90 30 90 32V35C88.5 36.5 86.5 37 84 37H79A9 9 0 0 0 61 37H33A9 9 0 0 0 15 37H6V36Z"
            fill="url(#ccBodyGrad)"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Panoramic VIP Windows */}
          <path d="M10 14H28V22H10V14Z" fill="url(#ccGlassGrad)" stroke="#1e293b" strokeWidth="0.8" />
          <path d="M31 14H48V22H31V14Z" fill="url(#ccGlassGrad)" stroke="#1e293b" strokeWidth="0.8" />
          <path d="M51 14H60L70 22H51V14Z" fill="url(#ccGlassGrad)" stroke="#1e293b" strokeWidth="0.8" />
          {/* Glass Glare */}
          <path
            d="M22 14L15 22M41 14L34 22"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.35"
            strokeLinecap="round"
          />

          {/* Chrome Sliding Door Guide Rail */}
          <line x1="12" y1="26" x2="52" y2="26" stroke="#cbd5e1" strokeWidth="0.9" />
          <line x1="33" y1="36" x2="61" y2="36" stroke="#94a3b8" strokeWidth="1.2" />

          {/* Lights */}
          <path d="M81 29L88 31" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M6 20V27" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : isHatch ? (
        /* ================== SPORTY HATCHBACK ================== */
        <g>
          {/* Rear Aero Spoiler */}
          <path d="M13 14L18 12.5" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />

          {/* Hatchback Body */}
          <path
            d="M8 36L9 26C9.5 22 13 17.5 16 14.5L22 13H56C60 13 64 15.5 67 19.5L73 22L86 25C88 25.5 89 27 89 29L88 34C87 36 85 37 83 37H80A9 9 0 0 0 62 37H34A9 9 0 0 0 16 37H8V36Z"
            fill="url(#ccBodyGrad)"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Hatch Windows */}
          <path d="M17 21L22 14.5H36V21H17Z" fill="url(#ccGlassGrad)" stroke="#1e293b" strokeWidth="0.8" />
          <path d="M39 14.5H54L65 21H39V14.5Z" fill="url(#ccGlassGrad)" stroke="#1e293b" strokeWidth="0.8" />
          {/* Glare */}
          <path d="M47 14.5L40 21" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />

          {/* Waistline Crease */}
          <path d="M10 25.5Q48 25 85 26.5" stroke="#94a3b8" strokeWidth="0.9" strokeOpacity="0.75" />

          {/* Lights */}
          <path d="M80 26L87 28" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 25H14" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        </g>
      ) : (
        /* ================== LUXURY SEDAN / SALOON / COUPE ================== */
        <g>
          {/* Sleek Fastback Sedan Body */}
          <path
            d="M6 36L8 26C9 24.5 12 24 16 23.5L23 23C27 18 36 12 48 12C58 12 66 16 72 21.5L87 25C89 25.5 90 27 90 29L88 34C87 36 85 37 83 37H81A9 9 0 0 0 63 37H33A9 9 0 0 0 15 37H6V36Z"
            fill="url(#ccBodyGrad)"
            stroke="#334155"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Aerodynamic Continuous Glass Canopy */}
          <path
            d="M24 22C28 17 38 13.5 48 13.5C57 13.5 64 16.5 69 21.5H24Z"
            fill="url(#ccGlassGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          {/* B-Pillar Divider */}
          <line x1="47" y1="13.5" x2="47" y2="22" stroke="#1e293b" strokeWidth="1.8" />
          {/* Diagonal Glass Sheen */}
          <path
            d="M38 14L32 21.5M55 14L49 21.5"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />

          {/* Sweeping Shoulder Contour Line */}
          <path
            d="M10 25Q48 24.5 86 27"
            stroke="#94a3b8"
            strokeWidth="0.9"
            strokeOpacity="0.75"
          />

          {/* Side Mirror */}
          <path d="M64 21.5H68L69.5 24H64Z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />

          {/* Front LED DRL Light Blade (Cyan Glow) */}
          <path d="M82 26.5L88 28.5" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          {/* Rear LED Light Blade */}
          <path d="M7 26.5L14 26" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

          {/* Front Splitter Accent */}
          <path d="M83 36L88 35" stroke="#0ea5e9" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {/* --- ALLOY WHEELS & BRAKE DETAILS (COMMON TO ALL MODELS) --- */}
      {/* Rear Wheel (cx=24, cy=38) */}
      <g>
        {/* Outer Tire */}
        <circle cx="24" cy="38" r="7.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
        {/* Brake Disc & Red Caliper */}
        <circle cx="24" cy="38" r="5.2" fill="#475569" />
        <path d="M20.5 36A3.5 3.5 0 0 1 23 34" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        {/* Dual-Tone Alloy Rim */}
        <circle cx="24" cy="38" r="5" fill="none" stroke="url(#ccAlloyGrad)" strokeWidth="1.4" />
        {/* Rim Spoke Cross */}
        <line x1="20" y1="38" x2="28" y2="38" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="24" y1="34" x2="24" y2="42" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="21.2" y1="35.2" x2="26.8" y2="40.8" stroke="#cbd5e1" strokeWidth="0.9" />
        <line x1="26.8" y1="35.2" x2="21.2" y2="40.8" stroke="#cbd5e1" strokeWidth="0.9" />
        {/* Center Cap */}
        <circle cx="24" cy="38" r="1.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.6" />
      </g>

      {/* Front Wheel (cx=72, cy=38) */}
      <g>
        {/* Outer Tire */}
        <circle cx="72" cy="38" r="7.5" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
        {/* Brake Disc & Red Caliper */}
        <circle cx="72" cy="38" r="5.2" fill="#475569" />
        <path d="M68.5 36A3.5 3.5 0 0 1 71 34" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        {/* Dual-Tone Alloy Rim */}
        <circle cx="72" cy="38" r="5" fill="none" stroke="url(#ccAlloyGrad)" strokeWidth="1.4" />
        {/* Rim Spoke Cross */}
        <line x1="68" y1="38" x2="76" y2="38" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="72" y1="34" x2="72" y2="42" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="69.2" y1="35.2" x2="74.8" y2="40.8" stroke="#cbd5e1" strokeWidth="0.9" />
        <line x1="74.8" y1="35.2" x2="69.2" y2="40.8" stroke="#cbd5e1" strokeWidth="0.9" />
        {/* Center Cap */}
        <circle cx="72" cy="38" r="1.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.6" />
      </g>
    </svg>
  );
};

// Vectors for "How CarChief Demand Sourcing Works"
export const VectorClipboardSpec: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="#2563eb" fill="#eff6ff" />
    <path d="M9 12l2 2 4-4" strokeWidth="2" stroke="#2563eb" />
    <line x1="9" y1="17" x2="15" y2="17" stroke="#3b82f6" />
  </svg>
);

export const VectorRadarScanner: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="#7c3aed" />
    <circle cx="12" cy="12" r="5" stroke="#a855f7" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="1.5" fill="#7c3aed" stroke="#7c3aed" />
    <line x1="12" y1="12" x2="18.5" y2="7.5" stroke="#7c3aed" strokeWidth="2" />
    <circle cx="17.5" cy="7.5" r="1.5" fill="#7c3aed" stroke="#7c3aed" />
    <line x1="12" y1="3" x2="12" y2="5" stroke="#7c3aed" />
    <line x1="12" y1="19" x2="12" y2="21" stroke="#7c3aed" />
    <line x1="3" y1="12" x2="5" y2="12" stroke="#7c3aed" />
    <line x1="19" y1="12" x2="21" y2="12" stroke="#7c3aed" />
  </svg>
);

export const VectorInspectionSearch: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#059669" />
    <polyline points="14 2 14 8 20 8" stroke="#059669" />
    <line x1="7" y1="12" x2="11" y2="12" stroke="#10b981" />
    <line x1="7" y1="16" x2="10" y2="16" stroke="#10b981" />
    <circle cx="15.5" cy="15.5" r="3" stroke="#059669" strokeWidth="1.8" fill="#ecfdf5" />
    <line x1="17.8" y1="17.8" x2="21" y2="21" stroke="#059669" strokeWidth="2" />
    <path d="M14.5 15.5l.8.8 1.5-1.5" stroke="#059669" strokeWidth="1.6" />
  </svg>
);

export const VectorOceanRoRoShip: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Ocean waves */}
    <path d="M2 19.5c2.5 1 4.5-1 7 0s4.5-1 7 0 4-1 6 0" stroke="#d97706" />
    {/* Ship Hull */}
    <path d="M3.5 16.5h17l1.5-4H2l1.5 4z" stroke="#d97706" fill="#fffbeb" />
    {/* Superstructure cabin */}
    <path d="M6 12.5V8.5h8v4" stroke="#b45309" />
    <line x1="9" y1="8.5" x2="9" y2="6" stroke="#b45309" />
    {/* Cargo box / car container outline */}
    <rect x="15" y="9.5" width="4" height="3" rx="0.5" stroke="#d97706" fill="#fef3c7" />
  </svg>
);

export const VectorShieldCheck: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#ecfdf5" stroke="#059669" />
    <path d="M9 12l2 2 4-4" stroke="#059669" strokeWidth="2" />
  </svg>
);

export const VectorPriceLock: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.8" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#2563eb" strokeWidth="1.8" />
    <circle cx="12" cy="15.5" r="1.5" fill="#2563eb" stroke="#2563eb" />
    <line x1="12" y1="17" x2="12" y2="18.5" stroke="#2563eb" strokeWidth="1.8" />
  </svg>
);

export const VectorAgentDesk: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#7c3aed" strokeWidth="1.8" />
    <circle cx="12" cy="7" r="4" fill="#faf5ff" stroke="#7c3aed" strokeWidth="1.8" />
    {/* Headset arc & mic */}
    <path d="M8 7a4 4 0 0 1 8 0v2.5" stroke="#7c3aed" strokeWidth="1.5" />
    <path d="M16 9.5a2 2 0 0 1-2 2h-1" stroke="#7c3aed" strokeWidth="1.5" />
    <circle cx="12.5" cy="11.5" r="0.8" fill="#7c3aed" stroke="#7c3aed" />
  </svg>
);

export const CustomerDemandPage: React.FC = () => {
  const { setActiveRoute, activeRoute } = useCustomerShell();

  // Load demands from localStorage or initialize with seed demands
  const [demands, setDemands] = useState<CustomerDemandRecord[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error('Failed to load demands from localStorage', e);
      }
    }
    return SEED_DEMANDS;
  });

  // Persist to localStorage whenever demands state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demands));
      } catch (e) {
        console.error('Failed to save demands to localStorage', e);
      }
    }
  }, [demands]);

  // Filters & Search
  const [selectedTab, setSelectedTab] = useState<'all' | 'matches' | 'hunting' | 'future' | 'fulfilled'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | DemandSourceType>('all');

  // Minimized / Maximized details grids state per demand card (default to all Minimized)
  const [collapsedGrids, setCollapsedGrids] = useState<Record<string, boolean>>({});

  const toggleCardGrid = (demandId: string) => {
    setCollapsedGrids((prev) => {
      const current = prev[demandId] !== undefined ? prev[demandId] : true;
      return {
        ...prev,
        [demandId]: !current,
      };
    });
  };

  // Modals state
  const [isNewDemandModalOpen, setIsNewDemandModalOpen] = useState<boolean>(false);
  const [editingDemand, setEditingDemand] = useState<CustomerDemandRecord | null>(null);
  const [viewingMatchesDemand, setViewingMatchesDemand] = useState<CustomerDemandRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for creating/editing demand
  const [formSourceType, setFormSourceType] = useState<DemandSourceType>('cant_find_stock');
  const [formMake, setFormMake] = useState<string>('Toyota');
  const [formModel, setFormModel] = useState<string>('');
  const [formYearMin, setFormYearMin] = useState<number>(2020);
  const [formYearMax, setFormYearMax] = useState<number>(2024);
  const [formBudget, setFormBudget] = useState<number>(15000);
  const [formPort, setFormPort] = useState<string>('Mombasa, Kenya');
  const [formBodyType, setFormBodyType] = useState<string>('SUV');
  const [formFuelType, setFormFuelType] = useState<string>('Petrol');
  const [formTransmission, setFormTransmission] = useState<string>('Automatic');
  const [formDriveType, setFormDriveType] = useState<string>('4WD / AWD');
  const [formMileage, setFormMileage] = useState<string>('Under 60,000 km');
  const [formColor, setFormColor] = useState<string>('Pearl White');
  const [formGrade, setFormGrade] = useState<string>('4.5+');
  const [formHorizon, setFormHorizon] = useState<string>('Immediate (1-2 weeks)');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>('');
  const [formNotifyEmail, setFormNotifyEmail] = useState<boolean>(true);
  const [formNotifyWhatsApp, setFormNotifyWhatsApp] = useState<boolean>(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Reset form to defaults
  const resetForm = () => {
    setFormSourceType('cant_find_stock');
    setFormMake('Toyota');
    setFormModel('');
    setFormYearMin(2020);
    setFormYearMax(2024);
    setFormBudget(15000);
    setFormPort('Mombasa, Kenya');
    setFormBodyType('SUV');
    setFormFuelType('Petrol');
    setFormTransmission('Automatic');
    setFormDriveType('4WD / AWD');
    setFormMileage('Under 60,000 km');
    setFormColor('Pearl White');
    setFormGrade('4.5+');
    setFormHorizon('Immediate (1-2 weeks)');
    setFormNotes('');
    setFormPhotoUrl('');
    setFormNotifyEmail(true);
    setFormNotifyWhatsApp(true);
    setEditingDemand(null);
  };

  // Handle shortcuts or deep-links (e.g. from Dashboard Quick Shortcuts)
  useEffect(() => {
    if (!activeRoute) return;
    if (activeRoute.includes('action=create_future') || activeRoute.includes('future')) {
      resetForm();
      setFormSourceType('future_purchase_plan');
      setFormHorizon('1-3 months');
      setIsNewDemandModalOpen(true);
    } else if (activeRoute.includes('action=create') || activeRoute.includes('create=true')) {
      resetForm();
      setIsNewDemandModalOpen(true);
    }
  }, [activeRoute]);

  // Open modal with prefilled data for editing
  const handleOpenEdit = (demand: CustomerDemandRecord) => {
    setEditingDemand(demand);
    setFormSourceType(demand.sourceType);
    setFormMake(demand.make);
    setFormModel(demand.model);
    setFormYearMin(demand.yearMin);
    setFormYearMax(demand.yearMax);
    setFormBudget(demand.targetBudgetCifUsd);
    setFormPort(demand.destinationPort);
    setFormBodyType(demand.bodyType || 'SUV');
    setFormFuelType(demand.fuelType || 'Petrol');
    setFormTransmission(demand.transmission || 'Automatic');
    setFormDriveType(demand.driveType || '4WD / AWD');
    setFormMileage(demand.mileagePreference || 'Under 60,000 km');
    setFormColor(demand.colorPreference || 'Pearl White');
    setFormGrade(demand.minAuctionGrade || '4.5+');
    setFormHorizon(demand.purchaseHorizon);
    setFormNotes(demand.additionalNotes || '');
    setFormPhotoUrl(demand.referenceImageUrl || '');
    setFormNotifyEmail(demand.notifyChannels.includes('Email'));
    setFormNotifyWhatsApp(demand.notifyChannels.includes('WhatsApp'));
    setIsNewDemandModalOpen(true);
  };

  // Submit Demand
  const handleSubmitDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formModel.trim()) return;

    const channels: string[] = ['Portal Alerts'];
    if (formNotifyEmail) channels.push('Email');
    if (formNotifyWhatsApp) channels.push('WhatsApp');

    if (editingDemand) {
      // Update existing
      setDemands((prev) =>
        prev.map((d) =>
          d.id === editingDemand.id
            ? {
                ...d,
                sourceType: formSourceType,
                make: formMake,
                model: formModel.trim(),
                yearMin: formYearMin,
                yearMax: formYearMax,
                targetBudgetCifUsd: formBudget,
                destinationPort: formPort,
                bodyType: formBodyType,
                fuelType: formFuelType,
                transmission: formTransmission,
                driveType: formDriveType,
                mileagePreference: formMileage,
                colorPreference: formColor,
                minAuctionGrade: formGrade,
                purchaseHorizon: formHorizon,
                additionalNotes: formNotes.trim() || undefined,
                referenceImageUrl: undefined,
                notifyChannels: channels,
              }
            : d
        )
      );
      showToast(`✓ Demand request for ${formMake} ${formModel.trim()} updated successfully.`);
    } else {
      // Create new
      const newRefNum = `DMD-2024-${String(demands.length + 1).padStart(3, '0')}`;
      const nowStr = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const newRecord: CustomerDemandRecord = {
        id: `dmd-${Date.now()}`,
        demandNumber: newRefNum,
        createdAt: nowStr,
        sourceType: formSourceType,
        status: 'hunting',
        make: formMake,
        model: formModel.trim(),
        yearMin: formYearMin,
        yearMax: formYearMax,
        targetBudgetCifUsd: formBudget,
        destinationPort: formPort,
        bodyType: formBodyType,
        fuelType: formFuelType,
        transmission: formTransmission,
        driveType: formDriveType,
        mileagePreference: formMileage,
        colorPreference: formColor,
        minAuctionGrade: formGrade,
        purchaseHorizon: formHorizon,
        additionalNotes: formNotes.trim() || undefined,
        notifyChannels: channels,
        agentAssigned: {
          name: 'Kenji Sato',
          desk: 'USS Tokyo Procurement Desk',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
        },
      };

      setDemands((prev) => [newRecord, ...prev]);
      showToast(`🎉 Demand posted! Assigned to Kenji Sato (USS Tokyo Procurement Desk) (${newRefNum}).`);
    }

    setIsNewDemandModalOpen(false);
    resetForm();
    if (activeRoute && activeRoute.includes('?')) {
      setActiveRoute('/demand');
    }
  };

  // Toggle Pause/Active
  const handleTogglePause = (demandId: string) => {
    setDemands((prev) =>
      prev.map((d) => {
        if (d.id === demandId) {
          const newStatus = d.status === 'paused' ? 'hunting' : 'paused';
          showToast(
            newStatus === 'paused'
              ? `Demand ${d.demandNumber} paused.`
              : `Demand ${d.demandNumber} resumed hunting.`
          );
          return { ...d, status: newStatus };
        }
        return d;
      })
    );
  };

  // Delete demand
  const handleDeleteDemand = (demandId: string) => {
    if (window.confirm('Are you sure you want to remove this sourcing demand?')) {
      setDemands((prev) => prev.filter((d) => d.id !== demandId));
      showToast('Demand removed.');
    }
  };

  // Stats calculation
  const totalDemands = demands.length;
  const matchesCount = demands.filter((d) => d.status === 'matches_found').length;
  const huntingCount = demands.filter((d) => d.status === 'hunting').length;
  const futureCount = demands.filter((d) => d.sourceType === 'future_purchase_plan').length;
  const fulfilledCount = demands.filter((d) => d.status === 'fulfilled').length;

  // Filtered demands
  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      // Tab filter
      if (selectedTab === 'matches' && d.status !== 'matches_found') return false;
      if (selectedTab === 'hunting' && d.status !== 'hunting') return false;
      if (selectedTab === 'future' && d.sourceType !== 'future_purchase_plan') return false;
      if (selectedTab === 'fulfilled' && d.status !== 'fulfilled') return false;

      // Source type filter
      if (sourceTypeFilter !== 'all' && d.sourceType !== sourceTypeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullText = `${d.demandNumber} ${d.make} ${d.model} ${d.destinationPort} ${d.fuelType} ${d.colorPreference || ''} ${d.additionalNotes || ''}`.toLowerCase();
        return fullText.includes(q);
      }

      return true;
    });
  }, [demands, selectedTab, sourceTypeFilter, searchQuery]);

  const areAllCollapsed = useMemo(() => {
    if (filteredDemands.length === 0) return true;
    return filteredDemands.every((d) => (collapsedGrids[d.id] !== undefined ? collapsedGrids[d.id] : true));
  }, [filteredDemands, collapsedGrids]);

  const handleToggleCollapseAll = () => {
    if (areAllCollapsed) {
      // Maximize all grids
      const next: Record<string, boolean> = {};
      filteredDemands.forEach((d) => {
        next[d.id] = false;
      });
      setCollapsedGrids(next);
    } else {
      // Minimize all grids
      const next: Record<string, boolean> = {};
      filteredDemands.forEach((d) => {
        next[d.id] = true;
      });
      setCollapsedGrids(next);
    }
  };

  return (
    <div className="cc-demand-page" data-testid="customer-demand-page">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="cc-demand-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
          <button
            type="button"
            className="cc-demand-toast-close"
            onClick={() => setToastMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Executive Page Header */}
      <div className="cc-demand-header">
        <div className="cc-demand-header-title-block">
          <div className="cc-demand-header-badge-row">
            <span className="cc-demand-pill">
              <span className="cc-demand-radar-pulse" />
              Direct Japan Auction Sourcing
            </span>
          </div>
          <h1 className="cc-demand-header-title">
            DEMAND &amp; <span className="cc-demand-title-highlight">SOURCING MANAGEMENT</span>
          </h1>
          <p className="cc-demand-header-desc">
            Can't find a vehicle in stock or planning upcoming purchases? Post your target criteria and our Tokyo procurement desk will source matching auction units.
          </p>
        </div>

        <div className="cc-demand-header-actions">
          <button
            type="button"
            className="cc-demand-primary-btn"
            onClick={() => {
              resetForm();
              setIsNewDemandModalOpen(true);
            }}
            id="btn-post-new-demand"
          >
            <span>+ Post New Demand</span>
          </button>
          <button
            type="button"
            className="cc-demand-secondary-btn"
            onClick={() => setActiveRoute('/inventory')}
          >
            <span>Browse Stock</span>
          </button>
        </div>
      </div>

      {/* Main Filter Tabs & Search Controls */}
      <section className="cc-demand-filter-section">
        <div className="cc-demand-filter-tabs">
          <button
            type="button"
            className={`cc-demand-tab-btn ${selectedTab === 'all' ? 'cc-demand-tab-btn--active' : ''}`}
            onClick={() => setSelectedTab('all')}
          >
            <span className="cc-demand-tab-label">All Demands</span>
            <span className="cc-demand-tab-count">{totalDemands}</span>
          </button>
          <button
            type="button"
            className={`cc-demand-tab-btn ${selectedTab === 'hunting' ? 'cc-demand-tab-btn--active' : ''}`}
            onClick={() => setSelectedTab('hunting')}
          >
            <span className="cc-demand-tab-label">Active Hunting</span>
            <span className="cc-demand-tab-count">{huntingCount}</span>
          </button>
          <button
            type="button"
            className={`cc-demand-tab-btn ${selectedTab === 'matches' ? 'cc-demand-tab-btn--active' : ''}`}
            onClick={() => setSelectedTab('matches')}
          >
            <span className="cc-demand-tab-label">Matches Found</span>
            <span className="cc-demand-tab-count">{matchesCount}</span>
          </button>
          <button
            type="button"
            className={`cc-demand-tab-btn ${selectedTab === 'future' ? 'cc-demand-tab-btn--active' : ''}`}
            onClick={() => setSelectedTab('future')}
          >
            <span className="cc-demand-tab-label">Future Pipeline</span>
            <span className="cc-demand-tab-count">{futureCount}</span>
          </button>
          <button
            type="button"
            className={`cc-demand-tab-btn ${selectedTab === 'fulfilled' ? 'cc-demand-tab-btn--active' : ''}`}
            onClick={() => setSelectedTab('fulfilled')}
          >
            <span className="cc-demand-tab-label">Fulfilled</span>
            <span className="cc-demand-tab-count">{fulfilledCount}</span>
          </button>
        </div>

        <div className="cc-demand-search-bar">
          <div className="cc-demand-search-input-wrap">
            <span className="cc-demand-search-icon">🔍</span>
            <input
              type="text"
              className="cc-demand-search-input"
              placeholder="Search by make, model, port, or demand number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search demands"
            />
            {searchQuery && (
              <button
                type="button"
                className="cc-demand-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          <div className="cc-demand-select-wrap">
            <select
              className="cc-demand-select"
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value as any)}
              aria-label="Filter by sourcing reason"
            >
              <option value="all">All Sourcing Reasons</option>
              <option value="cant_find_stock">Couldn't Find in Stock</option>
              <option value="future_purchase_plan">Future Purchase Planning</option>
            </select>
          </div>

          <button
            type="button"
            className="cc-demand-collapse-all-btn"
            onClick={handleToggleCollapseAll}
            title={areAllCollapsed ? 'Maximize all details' : 'Minimize all details'}
          >
            {areAllCollapsed ? '⤢ Maximize All Grids' : '⤡ Minimize All Grids'}
          </button>
        </div>
      </section>

      {/* Demands Cards List */}
      <section className="cc-demand-list-section">
        {filteredDemands.length === 0 ? (
          <div className="cc-demand-empty-state">
            <div className="cc-demand-empty-icon">🎯</div>
            <h3>No demand requests match your filter</h3>
            <p>
              Couldn't find what you're looking for in stock? Post a new demand and our procurement desk will source it directly from Japan.
            </p>
            <button
              type="button"
              className="cc-demand-primary-btn"
              onClick={() => {
                resetForm();
                setIsNewDemandModalOpen(true);
              }}
            >
              + Post Your Demand Request
            </button>
          </div>
        ) : (
          <div className="cc-demand-grid">
            {filteredDemands.map((demand) => {
              const matchesAvailable = demand.matchedVehicles && demand.matchedVehicles.length > 0;
              const isCardCollapsed = collapsedGrids[demand.id] !== undefined ? collapsedGrids[demand.id] : true;

              return (
                <div key={demand.id} className="cc-demand-card" data-testid={`demand-card-${demand.id}`}>
                  {/* Card Header */}
                  <div className="cc-demand-card__header">
                    <div className="cc-demand-card__id-group">
                      <span className="cc-demand-card__ref">{demand.demandNumber}</span>
                      <span className="cc-demand-card__dot">•</span>
                      <span className="cc-demand-card__date">Lodged {demand.createdAt}</span>
                    </div>

                    <div className="cc-demand-card__badges">
                      {demand.sourceType === 'cant_find_stock' ? (
                        <span className="cc-demand-source-tag cc-demand-source-tag--stock">
                          Couldn't Find in Stock
                        </span>
                      ) : (
                        <span className="cc-demand-source-tag cc-demand-source-tag--future">
                          Future Purchase Plan
                        </span>
                      )}

                      {demand.status === 'matches_found' && (
                        <span className="cc-demand-status-badge cc-demand-status-badge--matches">
                          Matches Available ({demand.matchedVehicles?.length})
                        </span>
                      )}
                      {demand.status === 'hunting' && (
                        <span className="cc-demand-status-badge cc-demand-status-badge--hunting">
                          <span className="cc-demand-pulse-dot" />
                          Active Hunting
                        </span>
                      )}
                      {demand.status === 'under_quotation' && (
                        <span className="cc-demand-status-badge cc-demand-status-badge--quoted">
                          Under Quotation
                        </span>
                      )}
                      {demand.status === 'fulfilled' && (
                        <span className="cc-demand-status-badge cc-demand-status-badge--fulfilled">
                          Fulfilled
                        </span>
                      )}
                      {demand.status === 'paused' && (
                        <span className="cc-demand-status-badge cc-demand-status-badge--paused">
                          Paused
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="cc-demand-card__body">
                    {/* Vehicle Title & Vector Icon */}
                    <div className="cc-demand-card__main-info">
                      <div
                        className="cc-demand-card__vector-wrap"
                        title={`${demand.make} ${demand.model} (${demand.bodyType || 'Vehicle'})`}
                      >
                        <VehicleVectorIcon bodyType={demand.bodyType} />
                      </div>
                      <div className="cc-demand-card__title-col">
                        <h3 className="cc-demand-card__vehicle-title">
                          {demand.yearMin}–{demand.yearMax} {demand.make} {demand.model}
                        </h3>
                        <div className="cc-demand-card__chips">
                          {demand.bodyType && <span className="cc-demand-chip">{demand.bodyType}</span>}
                          {demand.fuelType && <span className="cc-demand-chip">{demand.fuelType}</span>}
                          {demand.driveType && <span className="cc-demand-chip">{demand.driveType}</span>}
                          {demand.transmission && <span className="cc-demand-chip">{demand.transmission}</span>}
                          {demand.minAuctionGrade && (
                            <span className="cc-demand-chip">
                              Grade {demand.minAuctionGrade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Specifications Header with Minimize / Maximize Option */}
                    <div className="cc-demand-specs-header">
                      <span className="cc-demand-specs-section-title">
                        Demand Specifications &amp; Requirements
                      </span>
                      <button
                        type="button"
                        className="cc-demand-toggle-grid-btn"
                        onClick={() => toggleCardGrid(demand.id)}
                        aria-expanded={!isCardCollapsed}
                        title={isCardCollapsed ? 'Maximize details grid' : 'Minimize details grid'}
                      >
                        {isCardCollapsed ? (
                          <>
                            <span className="cc-demand-toggle-icon">⤢</span> Maximize Details
                          </>
                        ) : (
                          <>
                            <span className="cc-demand-toggle-icon">⤡</span> Minimize Details
                          </>
                        )}
                      </button>
                    </div>

                    {!isCardCollapsed ? (
                      <>
                        {/* Specifications Grid */}
                        <div className="cc-demand-card__specs-grid">
                          <div className="cc-demand-spec-item">
                            <span className="cc-demand-spec-label">Target Budget (CIF)</span>
                            <span className="cc-demand-spec-val">
                              ${demand.targetBudgetCifUsd.toLocaleString()} USD
                            </span>
                          </div>
                          <div className="cc-demand-spec-item">
                            <span className="cc-demand-spec-label">Destination Port</span>
                            <span className="cc-demand-spec-val">{demand.destinationPort}</span>
                          </div>
                          <div className="cc-demand-spec-item">
                            <span className="cc-demand-spec-label">Purchase Timeline</span>
                            <span className="cc-demand-spec-val">
                              {demand.purchaseHorizon}
                            </span>
                          </div>
                          <div className="cc-demand-spec-item">
                            <span className="cc-demand-spec-label">Color Preference</span>
                            <span className="cc-demand-spec-val">{demand.colorPreference || 'Any Color'}</span>
                          </div>
                        </div>

                        {/* Customer Notes */}
                        {demand.additionalNotes && (
                          <div className="cc-demand-card__notes-box">
                            <span className="cc-demand-notes-label">Customer Notes:</span>
                            <p className="cc-demand-notes-text">"{demand.additionalNotes}"</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        className="cc-demand-specs-collapsed-bar"
                        onClick={() => toggleCardGrid(demand.id)}
                        title="Click to maximize details grid"
                      >
                        <span className="cc-demand-collapsed-pill">
                          <strong>Budget:</strong> ${demand.targetBudgetCifUsd.toLocaleString()} CIF
                        </span>
                        <span className="cc-demand-collapsed-pill">
                          <strong>Port:</strong> {demand.destinationPort}
                        </span>
                        <span className="cc-demand-collapsed-pill">
                          <strong>Timeline:</strong> {demand.purchaseHorizon}
                        </span>
                        <span className="cc-demand-collapsed-pill">
                          <strong>Color:</strong> {demand.colorPreference || 'Any Color'}
                        </span>
                        <span className="cc-demand-collapsed-hint">Click to maximize details ▾</span>
                      </div>
                    )}

                    {/* Matches Available Callout Banner */}
                    {matchesAvailable && (
                      <div className="cc-demand-card__matches-banner">
                        <div className="cc-demand-matches-banner-left">
                          <span className="cc-demand-matches-star">✦</span>
                          <div>
                            <strong>{demand.matchedVehicles!.length} matching vehicle{demand.matchedVehicles!.length > 1 ? 's' : ''} identified</strong>
                            <span>Direct auction &amp; port yard matches ready for inspection &amp; quotation</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="cc-demand-view-matches-btn"
                          onClick={() => setViewingMatchesDemand(demand)}
                        >
                          View Matches ({demand.matchedVehicles!.length}) →
                        </button>
                      </div>
                    )}

                    {/* Assigned Desk & Alert Channels */}
                    <div className="cc-demand-card__footer-meta">
                      {demand.agentAssigned && (
                        <div className="cc-demand-assigned-agent">
                          <img
                            src={demand.agentAssigned.avatar}
                            alt={demand.agentAssigned.name}
                            className="cc-demand-agent-avatar"
                          />
                          <div>
                            <span className="cc-demand-agent-name">{demand.agentAssigned.name}</span>
                            <span className="cc-demand-agent-desk">{demand.agentAssigned.desk}</span>
                          </div>
                        </div>
                      )}

                      <div className="cc-demand-alert-channels">
                        <span className="cc-demand-alert-lbl">Alert Channels:</span>
                        {demand.notifyChannels.map((c) => (
                          <span key={c} className="cc-demand-channel-tag">
                            {c === 'Email' && 'Email'}
                            {c === 'WhatsApp' && 'WhatsApp'}
                            {c === 'Portal Alerts' && 'Portal'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="cc-demand-card__actions">
                    {matchesAvailable && (
                      <button
                        type="button"
                        className="cc-demand-card-action-btn cc-demand-card-action-btn--primary"
                        onClick={() => setViewingMatchesDemand(demand)}
                      >
                        View {demand.matchedVehicles!.length} Matched Unit{demand.matchedVehicles!.length > 1 ? 's' : ''}
                      </button>
                    )}
                    <button
                      type="button"
                      className="cc-demand-card-action-btn"
                      onClick={() => handleOpenEdit(demand)}
                    >
                      Edit Demand
                    </button>
                    <button
                      type="button"
                      className={`cc-demand-card-action-btn ${demand.status === 'paused' ? 'cc-demand-card-action-btn--resume' : 'cc-demand-card-action-btn--pause'}`}
                      onClick={() => handleTogglePause(demand.id)}
                      title={demand.status === 'paused' ? 'Resume sourcing for this demand' : 'Pause sourcing for this demand'}
                    >
                      {demand.status === 'paused' ? (
                        <>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            className="cc-demand-action-icon"
                          >
                            <polygon points="6 4 20 12 6 20 6 4" />
                          </svg>
                          <span>Resume Sourcing</span>
                        </>
                      ) : (
                        <>
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            className="cc-demand-action-icon"
                          >
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                          <span>Pause Sourcing</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="cc-demand-card-action-btn cc-demand-card-action-btn--danger"
                      onClick={() => handleDeleteDemand(demand.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How Demand Management Works (Visual Guide) */}
      <section className="cc-demand-how-it-works">
        <div className="cc-demand-how-header-row">
          <div className="cc-demand-how-header-left">
            <div className="cc-demand-how-pill">
              <span className="cc-demand-how-pulse-dot" />
              <span>4-Step Procurement Pipeline</span>
            </div>
            <h2 className="cc-demand-how-title">How CarChief Demand Sourcing Works</h2>
            <p className="cc-demand-how-subtitle">
              From your exact vehicle specifications to physical port discharge — seamless end-to-end procurement powered by our USS Tokyo desk.
            </p>
          </div>
          <div className="cc-demand-how-header-actions">
            <button
              type="button"
              className="cc-demand-how-cta-btn"
              onClick={() => {
                resetForm();
                setIsNewDemandModalOpen(true);
              }}
            >
              <span>+ Post Demand Now</span>
            </button>
          </div>
        </div>

        <div className="cc-demand-steps-grid">
          {/* Step 1 */}
          <div className="cc-demand-step-card">
            <div className="cc-demand-step-top">
              <span className="cc-demand-step-badge">STEP 01</span>
              <div className="cc-demand-step-icon cc-demand-step-icon--blue">
                <VectorClipboardSpec />
              </div>
            </div>
            <h3 className="cc-demand-step-card-title">Define Specifications &amp; Budget</h3>
            <p className="cc-demand-step-card-desc">
              Submit your desired make, model, target budget, and required options for future fleet purchase or hard-to-find models.
            </p>
            <div className="cc-demand-step-pills">
              <span>Target CIF Port</span>
              <span>Year &amp; Mileage Limit</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="cc-demand-step-card">
            <div className="cc-demand-step-top">
              <span className="cc-demand-step-badge">STEP 02</span>
              <div className="cc-demand-step-icon cc-demand-step-icon--purple">
                <VectorRadarScanner />
              </div>
            </div>
            <h3 className="cc-demand-step-card-title">130+ Daily Japanese Auctions</h3>
            <p className="cc-demand-step-card-desc">
              Our automated scanners crawl USS Tokyo, TAA, CAA, JU &amp; ARAI daily auctions plus bonded dealer stocks in real time.
            </p>
            <div className="cc-demand-step-pills">
              <span>USS Tokyo Live Feed</span>
              <span>100,000+ Units / Week</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="cc-demand-step-card">
            <div className="cc-demand-step-top">
              <span className="cc-demand-step-badge">STEP 03</span>
              <div className="cc-demand-step-icon cc-demand-step-icon--emerald">
                <VectorInspectionSearch />
              </div>
            </div>
            <h3 className="cc-demand-step-card-title">Sheet Translation &amp; Yard Check</h3>
            <p className="cc-demand-step-card-desc">
              Kenji Sato translates authentic auction inspector sheets, checks rust &amp; mechanics, and sends landed CIF quotes with zero surprise fees.
            </p>
            <div className="cc-demand-step-pills">
              <span>Grade 4.0+ Verification</span>
              <span>Engine &amp; Frame Audit</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="cc-demand-step-card">
            <div className="cc-demand-step-top">
              <span className="cc-demand-step-badge">STEP 04</span>
              <div className="cc-demand-step-icon cc-demand-step-icon--amber">
                <VectorOceanRoRoShip />
              </div>
            </div>
            <h3 className="cc-demand-step-card-title">Bid Win &amp; Ocean Transport</h3>
            <p className="cc-demand-step-card-desc">
              We win your car at wholesale hammer price, manage Japan export customs, and book priority RoRo or container ocean shipping.
            </p>
            <div className="cc-demand-step-pills">
              <span>Priority Vessel Booking</span>
              <span>Bill of Lading Tracking</span>
            </div>
          </div>
        </div>

        {/* Guarantees & Desk strip */}
        <div className="cc-demand-how-footer-strip">
          <div className="cc-demand-how-trust-item">
            <div className="cc-demand-how-trust-icon">
              <VectorShieldCheck />
            </div>
            <div className="cc-demand-how-trust-text">
              <strong>100% Verified Auction Sheets</strong>
              <span>Genuine USS &amp; TAA grading with Japanese translation</span>
            </div>
          </div>
          <div className="cc-demand-how-trust-item">
            <div className="cc-demand-how-trust-icon">
              <VectorPriceLock />
            </div>
            <div className="cc-demand-how-trust-text">
              <strong>Landed CIF Price Lock</strong>
              <span>Ocean freight, radiation inspection &amp; customs export documentation included</span>
            </div>
          </div>
          <div className="cc-demand-how-trust-item">
            <div className="cc-demand-how-trust-icon">
              <VectorAgentDesk />
            </div>
            <div className="cc-demand-how-trust-text">
              <strong>Dedicated Agent: Kenji Sato</strong>
              <span>USS Tokyo Procurement Desk handles bidding to shipping</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          MODAL: POST / EDIT DEMAND REQUEST
          ==================================================================== */}
      {isNewDemandModalOpen && (
        <div
          className="cc-modal-overlay"
          onClick={() => {
            setIsNewDemandModalOpen(false);
            resetForm();
            if (activeRoute && activeRoute.includes('?')) {
              setActiveRoute('/demand');
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="demand-modal-title"
        >
          <div
            className="cc-modal-dialog cc-demand-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-modal-header cc-demand-modal-header">
              <div className="cc-demand-modal-title-group">
                <span className="cc-demand-modal-icon">🎯</span>
                <div>
                  <h2 id="demand-modal-title">
                    {editingDemand ? 'Edit Sourcing Demand Request' : 'Post Vehicle Sourcing Demand'}
                  </h2>
                  <span className="cc-demand-modal-sub">
                    Specify vehicles you couldn't find or plan to buy in upcoming months
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => {
                  setIsNewDemandModalOpen(false);
                  resetForm();
                  if (activeRoute && activeRoute.includes('?')) {
                    setActiveRoute('/demand');
                  }
                }}
                aria-label="Close demand modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDemand}>
              <div className="cc-modal-body cc-demand-modal-body">
                {/* Reason / Intent Selector */}
                <div className="cc-demand-form-section">
                  <label className="cc-demand-form-label">
                    What is the primary reason for this demand? <span className="cc-demand-req">*</span>
                  </label>
                  <div className="cc-demand-radio-cards">
                    <label
                      className={`cc-demand-radio-card ${
                        formSourceType === 'cant_find_stock' ? 'cc-demand-radio-card--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="sourceType"
                        value="cant_find_stock"
                        checked={formSourceType === 'cant_find_stock'}
                        onChange={() => setFormSourceType('cant_find_stock')}
                      />
                      <div className="cc-demand-radio-card-content">
                        <strong>🔍 Couldn't Find in Current Stock</strong>
                        <span>I searched CarChief inventory but didn't find the exact car or trim</span>
                      </div>
                    </label>

                    <label
                      className={`cc-demand-radio-card ${
                        formSourceType === 'future_purchase_plan' ? 'cc-demand-radio-card--selected' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="sourceType"
                        value="future_purchase_plan"
                        checked={formSourceType === 'future_purchase_plan'}
                        onChange={() => setFormSourceType('future_purchase_plan')}
                      />
                      <div className="cc-demand-radio-card-content">
                        <strong>⏳ Planning to Buy in Future</strong>
                        <span>I plan to purchase within 1–6 months and want to track market prices</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Two-Column Specification Fields */}
                <div className="cc-demand-form-grid">
                  {/* Left Column: Vehicle Specs */}
                  <div className="cc-demand-form-col">
                    <h4 className="cc-demand-col-title">Vehicle Specifications</h4>

                    <div className="cc-demand-fields-row">
                      <div className="cc-demand-field">
                        <label htmlFor="demand-make" className="cc-demand-form-label">
                          Make <span className="cc-demand-req">*</span>
                        </label>
                        <select
                          id="demand-make"
                          className="cc-demand-input"
                          value={formMake}
                          onChange={(e) => setFormMake(e.target.value)}
                          required
                        >
                          <option value="Toyota">Toyota</option>
                          <option value="Nissan">Nissan</option>
                          <option value="Honda">Honda</option>
                          <option value="Mazda">Mazda</option>
                          <option value="Subaru">Subaru</option>
                          <option value="Mitsubishi">Mitsubishi</option>
                          <option value="Suzuki">Suzuki</option>
                          <option value="Lexus">Lexus</option>
                          <option value="Mercedes-Benz">Mercedes-Benz</option>
                          <option value="BMW">BMW</option>
                          <option value="Land Rover">Land Rover</option>
                          <option value="Other">Other / Specialty</option>
                        </select>
                      </div>

                      <div className="cc-demand-field">
                        <label htmlFor="demand-model" className="cc-demand-form-label">
                          Model &amp; Trim <span className="cc-demand-req">*</span>
                        </label>
                        <input
                          id="demand-model"
                          type="text"
                          className="cc-demand-input"
                          placeholder="e.g. Prado TX-L, CX-5"
                          value={formModel}
                          onChange={(e) => setFormModel(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="cc-demand-fields-row">
                      <div className="cc-demand-field">
                        <label htmlFor="demand-year-min" className="cc-demand-form-label">
                          Min Year
                        </label>
                        <select
                          id="demand-year-min"
                          className="cc-demand-input"
                          value={formYearMin}
                          onChange={(e) => setFormYearMin(Number(e.target.value))}
                        >
                          {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>

                      <div className="cc-demand-field">
                        <label htmlFor="demand-year-max" className="cc-demand-form-label">
                          Max Year
                        </label>
                        <select
                          id="demand-year-max"
                          className="cc-demand-input"
                          value={formYearMax}
                          onChange={(e) => setFormYearMax(Number(e.target.value))}
                        >
                          {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="cc-demand-fields-row">
                      <div className="cc-demand-field">
                        <label htmlFor="demand-body-type" className="cc-demand-form-label">
                          Body Style
                        </label>
                        <select
                          id="demand-body-type"
                          className="cc-demand-input"
                          value={formBodyType}
                          onChange={(e) => setFormBodyType(e.target.value)}
                        >
                          <option value="SUV">SUV</option>
                          <option value="Sedan">Sedan</option>
                          <option value="Hatchback">Hatchback</option>
                          <option value="Van / Minivan">Van / Minivan</option>
                          <option value="Pickup / Truck">Pickup / Truck</option>
                          <option value="Coupe">Coupe</option>
                          <option value="Wagon">Wagon</option>
                        </select>
                      </div>

                      <div className="cc-demand-field">
                        <label htmlFor="demand-fuel" className="cc-demand-form-label">
                          Fuel Type
                        </label>
                        <select
                          id="demand-fuel"
                          className="cc-demand-input"
                          value={formFuelType}
                          onChange={(e) => setFormFuelType(e.target.value)}
                        >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="Hybrid">Hybrid</option>
                          <option value="Electric">Electric</option>
                          <option value="Any">Any Fuel</option>
                        </select>
                      </div>
                    </div>

                    <div className="cc-demand-fields-row">
                      <div className="cc-demand-field">
                        <label htmlFor="demand-drive" className="cc-demand-form-label">
                          Drive Type
                        </label>
                        <select
                          id="demand-drive"
                          className="cc-demand-input"
                          value={formDriveType}
                          onChange={(e) => setFormDriveType(e.target.value)}
                        >
                          <option value="4WD / AWD">4WD / AWD</option>
                          <option value="2WD">2WD</option>
                          <option value="Any">Any Drive</option>
                        </select>
                      </div>

                      <div className="cc-demand-field">
                        <label htmlFor="demand-grade" className="cc-demand-form-label">
                          Min Auction Grade
                        </label>
                        <select
                          id="demand-grade"
                          className="cc-demand-input"
                          value={formGrade}
                          onChange={(e) => setFormGrade(e.target.value)}
                        >
                          <option value="4.5+">4.5+ (Very Clean)</option>
                          <option value="4.0+">4.0+ (Good Condition)</option>
                          <option value="5.0 / S">5.0 / S (Like New)</option>
                          <option value="3.5+">3.5+ (Standard)</option>
                          <option value="Any">Any Grade</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Financials, Horizon, & Port */}
                  <div className="cc-demand-form-col">
                    <h4 className="cc-demand-col-title">Destination &amp; Timing</h4>

                    <div className="cc-demand-fields-row">
                      <div className="cc-demand-field">
                        <label htmlFor="demand-budget" className="cc-demand-form-label">
                          Target Budget (CIF) <span className="cc-demand-req">*</span>
                        </label>
                        <div className="cc-demand-currency-wrap">
                          <span className="cc-demand-currency-symbol">$</span>
                          <input
                            id="demand-budget"
                            type="number"
                            step="500"
                            min="1000"
                            className="cc-demand-input cc-demand-input--currency"
                            value={formBudget}
                            onChange={(e) => setFormBudget(Number(e.target.value))}
                            required
                          />
                          <span className="cc-demand-currency-suffix">USD</span>
                        </div>
                      </div>

                      <div className="cc-demand-field">
                        <label htmlFor="demand-port" className="cc-demand-form-label">
                          Destination Port <span className="cc-demand-req">*</span>
                        </label>
                        <select
                          id="demand-port"
                          className="cc-demand-input"
                          value={formPort}
                          onChange={(e) => setFormPort(e.target.value)}
                          required
                        >
                          <option value="Mombasa, Kenya">Mombasa, Kenya</option>
                          <option value="Dar es Salaam, Tanzania">Dar es Salaam, Tanzania</option>
                          <option value="Kingston, Jamaica">Kingston, Jamaica</option>
                          <option value="Georgetown, Guyana">Georgetown, Guyana</option>
                          <option value="Durban, South Africa">Durban, South Africa</option>
                          <option value="Maputo, Mozambique">Maputo, Mozambique</option>
                          <option value="Walvis Bay, Namibia">Walvis Bay, Namibia</option>
                          <option value="Jebel Ali, Dubai">Jebel Ali, Dubai</option>
                          <option value="Port Louis, Mauritius">Port Louis, Mauritius</option>
                          <option value="Other Port">Other Destination Port</option>
                        </select>
                      </div>
                    </div>

                    <div className="cc-demand-fields-row">
                      <div className="cc-demand-field">
                        <label htmlFor="demand-horizon" className="cc-demand-form-label">
                          Purchase Horizon <span className="cc-demand-req">*</span>
                        </label>
                        <select
                          id="demand-horizon"
                          className="cc-demand-input"
                          value={formHorizon}
                          onChange={(e) => setFormHorizon(e.target.value)}
                          required
                        >
                          <option value="Immediate (1-2 weeks)">Immediate (1–2 weeks)</option>
                          <option value="Within 1 month">Within 1 month</option>
                          <option value="1-3 months">1–3 months</option>
                          <option value="3-6 months">3–6 months</option>
                          <option value="Flexible / Browsing">Flexible / Browsing</option>
                        </select>
                      </div>

                      <div className="cc-demand-field">
                        <label htmlFor="demand-color" className="cc-demand-form-label">
                          Color Preference
                        </label>
                        <input
                          id="demand-color"
                          type="text"
                          className="cc-demand-input"
                          placeholder="e.g. Pearl White, Black"
                          value={formColor}
                          onChange={(e) => setFormColor(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="cc-demand-field">
                      <label className="cc-demand-form-label">
                        Vehicle Vector Graphic
                      </label>
                      <div className="cc-demand-form-vector-preview">
                        <div className="cc-demand-card__vector-wrap">
                          <VehicleVectorIcon bodyType={formBodyType} />
                        </div>
                        <div className="cc-demand-form-vector-desc">
                          <span>Automotive vector auto-matched to body style: <strong>{formBodyType || 'SUV'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Notes & Specific Trim Requirements */}
                <div className="cc-demand-form-section">
                  <label htmlFor="demand-notes" className="cc-demand-form-label">
                    Specific Requirements &amp; Equipment Notes
                  </label>
                  <textarea
                    id="demand-notes"
                    className="cc-demand-textarea"
                    rows={2}
                    placeholder="Mention specific options like leather interior, sunroof, 360 camera, roof rails, 7 seats, or acceptable mileage..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                  />
                </div>

                {/* Notification Preferences */}
                <div className="cc-demand-form-section cc-demand-notify-section">
                  <span className="cc-demand-form-label">Notification Channels when matching cars are found:</span>
                  <div className="cc-demand-notify-checkboxes">
                    <label className="cc-demand-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formNotifyEmail}
                        onChange={(e) => setFormNotifyEmail(e.target.checked)}
                      />
                      <span>Email Alerts with Auction Sheets</span>
                    </label>
                    <label className="cc-demand-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formNotifyWhatsApp}
                        onChange={(e) => setFormNotifyWhatsApp(e.target.checked)}
                      />
                      <span>WhatsApp Instant Notification</span>
                    </label>
                    <label className="cc-demand-checkbox-label">
                      <input type="checkbox" checked disabled />
                      <span>Portal Notification Bulletins (Active)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="cc-modal-footer cc-demand-modal-footer">
                <button
                  type="button"
                  className="cc-demand-cancel-btn"
                  onClick={() => {
                    setIsNewDemandModalOpen(false);
                    resetForm();
                    if (activeRoute && activeRoute.includes('?')) {
                      setActiveRoute('/demand');
                    }
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="cc-demand-submit-btn">
                  <span>{editingDemand ? '✓ Update Sourcing Demand' : '🎯 Submit Sourcing Demand'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: VIEW MATCHED VEHICLES DETAILS
          ==================================================================== */}
      {viewingMatchesDemand && (
        <div
          className="cc-modal-overlay"
          onClick={() => setViewingMatchesDemand(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="matches-modal-title"
        >
          <div
            className="cc-modal-dialog cc-demand-matches-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cc-modal-header cc-demand-matches-header">
              <div className="cc-demand-matches-header-left">
                <div className="cc-demand-matches-badge-icon">✨</div>
                <div>
                  <h2 id="matches-modal-title">
                    Matched Units for {viewingMatchesDemand.demandNumber}
                  </h2>
                  <span className="cc-demand-matches-sub">
                    {viewingMatchesDemand.make} {viewingMatchesDemand.model} • Target Budget: ${viewingMatchesDemand.targetBudgetCifUsd.toLocaleString()} CIF {viewingMatchesDemand.destinationPort}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="cc-modal-close"
                onClick={() => setViewingMatchesDemand(null)}
                aria-label="Close matches modal"
              >
                ✕
              </button>
            </div>

            <div className="cc-modal-body cc-demand-matches-body">
              <div className="cc-demand-matches-intro">
                <span>🎯</span>
                <p>
                  Our Japan auction desk and live stock scanners matched the following vehicles meeting your exact specification and target budget. You can request inspection sheets or place pre-auction bids immediately.
                </p>
              </div>

              <div className="cc-demand-matches-grid">
                {viewingMatchesDemand.matchedVehicles?.map((veh) => (
                  <div key={veh.id} className="cc-matched-veh-card">
                    <div className="cc-matched-veh-card__img-wrap">
                      <img src={veh.imageUrl} alt={veh.title} className="cc-matched-veh-card__img" />
                      <span className="cc-matched-veh-grade-tag">Grade {veh.grade}</span>
                      <span className="cc-matched-veh-status-tag">{veh.status}</span>
                    </div>

                    <div className="cc-matched-veh-card__content">
                      <div className="cc-matched-veh-card__top">
                        <h4 className="cc-matched-veh-card__title">{veh.title}</h4>
                        <span className="cc-matched-veh-card__source">{veh.auctionSource}</span>
                      </div>

                      <div className="cc-matched-veh-card__specs">
                        <div><span>Chassis:</span> <strong>{veh.chassisNumber}</strong></div>
                        <div><span>Mileage:</span> <strong>{veh.mileageKm.toLocaleString()} km</strong></div>
                        <div><span>Color:</span> <strong>{veh.color}</strong></div>
                        <div><span>Engine:</span> <strong>{veh.engineCc} cc ({veh.fuelType})</strong></div>
                        <div><span>Yard:</span> <strong>{veh.location}</strong></div>
                        <div><span>Schedule:</span> <strong>{veh.availableDate}</strong></div>
                      </div>

                      <div className="cc-matched-veh-card__price-row">
                        <div className="cc-matched-veh-price-left">
                          <span className="cc-matched-veh-price-lbl">Estimated Landed CIF</span>
                          <span className="cc-matched-veh-price-val">
                            ${veh.estimatedCifUsd.toLocaleString()} USD
                          </span>
                        </div>

                        <div className="cc-matched-veh-card__btn-group">
                          <button
                            type="button"
                            className="cc-matched-veh-inquire-btn"
                            onClick={() => {
                              showToast(`Quotation inquiry for ${veh.chassisNumber} forwarded to Japan procurement desk.`);
                              setViewingMatchesDemand(null);
                            }}
                          >
                            Request Inspection Sheet
                          </button>
                          <button
                            type="button"
                            className="cc-matched-veh-reserve-btn"
                            onClick={() => {
                              showToast(`Pre-auction hold requested for ${veh.title}. Agent Kenji Sato (USS Tokyo Procurement Desk) will contact you.`);
                              setViewingMatchesDemand(null);
                            }}
                          >
                            Lock &amp; Bid
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cc-modal-footer cc-demand-matches-footer">
              <span className="cc-demand-matches-footer-note">
                Need a custom bidding limit or more auction photos? WhatsApp desk: +81 3 5555 0192
              </span>
              <button
                type="button"
                className="cc-demand-close-btn"
                onClick={() => setViewingMatchesDemand(null)}
              >
                Close Matches
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerDemandPage;
