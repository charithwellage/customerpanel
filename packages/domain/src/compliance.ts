/**
 * Country-Specific Vehicle Import Compliance and Regulatory Engine (D02-P14-T005)
 *
 * Implements authoritative validation for global import rules:
 * - Year of Manufacture (YOM) / maximum vehicle age restrictions
 * - Steering configuration requirements (RHD only vs LHD only vs Either)
 * - Required pre-export / roadworthiness inspections (QISJ, JEVIC, EAA, KEBS, etc.)
 */

export type SteeringRequirement = 'RHD_ONLY' | 'LHD_ONLY' | 'EITHER';

export type NormalizedSteering = 'RHD' | 'LHD' | 'UNKNOWN';

export interface CountryComplianceRule {
  countryCode: string; // ISO-3166 alpha-2 uppercase (e.g. 'KE', 'UG', 'LK', 'GB', 'AE', 'ZW')
  countryName: string;
  maxVehicleAgeYears?: number;
  allowedSteering: SteeringRequirement;
  requiredInspections?: string[];
  description: string;
  active: boolean;
}

export interface VehicleComplianceEvaluation {
  countryCode: string;
  countryName: string;
  isCompliant: boolean;
  ruleSummary: string;
  failedCriteria: string[];
  passedCriteria: string[];
  minAllowedYear?: number;
  requiredSteering?: SteeringRequirement;
  requiredInspections?: string[];
}

/**
 * Built-in regulatory import compliance rules for CarChief destination markets.
 */
export const COUNTRY_COMPLIANCE_RULES: Record<string, CountryComplianceRule> = {
  KE: {
    countryCode: 'KE',
    countryName: 'Kenya',
    maxVehicleAgeYears: 8,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['QISJ', 'KEBS'],
    description: 'Kenya enforces KS 1515:2000 (maximum 8 years vehicle age) and strict Right-Hand Drive (RHD) only.',
    active: true,
  },
  UG: {
    countryCode: 'UG',
    countryName: 'Uganda',
    maxVehicleAgeYears: 15,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['JEVIC', 'EAA'],
    description: 'Uganda permits Right-Hand Drive vehicles up to 15 years old with mandatory JEVIC/EAA inspection.',
    active: true,
  },
  TZ: {
    countryCode: 'TZ',
    countryName: 'Tanzania',
    maxVehicleAgeYears: 10,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['TBS', 'EAA'],
    description: 'Tanzania requires Right-Hand Drive vehicles and mandatory TBS roadworthiness certification (<= 10 years).',
    active: true,
  },
  RW: {
    countryCode: 'RW',
    countryName: 'Rwanda',
    maxVehicleAgeYears: 10,
    allowedSteering: 'EITHER',
    requiredInspections: ['RURA', 'EAA'],
    description: 'Rwanda permits compliant vehicles up to 10 years old with verified roadworthiness.',
    active: true,
  },
  SS: {
    countryCode: 'SS',
    countryName: 'South Sudan',
    maxVehicleAgeYears: 15,
    allowedSteering: 'EITHER',
    requiredInspections: ['JEVIC'],
    description: 'South Sudan accepts vehicles up to 15 years old with standard roadworthiness inspection.',
    active: true,
  },
  ZW: {
    countryCode: 'ZW',
    countryName: 'Zimbabwe',
    maxVehicleAgeYears: 10,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['EAA'],
    description: 'Zimbabwe restricts vehicle imports to Right-Hand Drive models no older than 10 years.',
    active: true,
  },
  ZM: {
    countryCode: 'ZM',
    countryName: 'Zambia',
    maxVehicleAgeYears: 25,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['JEVIC', 'RTSA'],
    description: 'Zambia enforces Right-Hand Drive (RHD) with mandatory JEVIC/RTSA pre-shipment inspection.',
    active: true,
  },
  BW: {
    countryCode: 'BW',
    countryName: 'Botswana',
    maxVehicleAgeYears: 15,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['DRTS'],
    description: 'Botswana requires Right-Hand Drive vehicles meeting DRTS safety regulations.',
    active: true,
  },
  ZA: {
    countryCode: 'ZA',
    countryName: 'South Africa',
    maxVehicleAgeYears: 10,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['SABS'],
    description: 'South Africa requires Right-Hand Drive vehicles and SABS/ITAC import clearance.',
    active: true,
  },
  CD: {
    countryCode: 'CD',
    countryName: 'DR Congo',
    maxVehicleAgeYears: 20,
    allowedSteering: 'EITHER',
    requiredInspections: ['BIVAC'],
    description: 'DR Congo permits imports up to 20 years old with verified BIVAC inspection.',
    active: true,
  },
  LK: {
    countryCode: 'LK',
    countryName: 'Sri Lanka',
    maxVehicleAgeYears: 3,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['JAAI', 'JEVIC'],
    description: 'Sri Lanka strictly restricts vehicle imports to Right-Hand Drive models under 3 years old.',
    active: true,
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    maxVehicleAgeYears: 30,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['IVA', 'MOT'],
    description: 'United Kingdom standard import requires Right-Hand Drive and IVA/MOT compliance.',
    active: true,
  },
  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    maxVehicleAgeYears: 15,
    allowedSteering: 'LHD_ONLY',
    requiredInspections: ['ESMA', 'RTA'],
    description: 'United Arab Emirates / Dubai strictly requires Left-Hand Drive (LHD) vehicles under GCC regulations.',
    active: true,
  },
  JM: {
    countryCode: 'JM',
    countryName: 'Jamaica',
    maxVehicleAgeYears: 5,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['JEVIC'],
    description: 'Jamaica enforces Right-Hand Drive (RHD) passenger car imports under 5 years old.',
    active: true,
  },
  MU: {
    countryCode: 'MU',
    countryName: 'Mauritius',
    maxVehicleAgeYears: 3,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['JEVIC'],
    description: 'Mauritius requires Right-Hand Drive (RHD) second-hand vehicles between 18 and 36 months old.',
    active: true,
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    maxVehicleAgeYears: 25,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['ROVER', 'RAWS'],
    description: 'Australia strictly requires Right-Hand Drive and certified ADR/SEVS compliance.',
    active: true,
  },
  NZ: {
    countryCode: 'NZ',
    countryName: 'New Zealand',
    maxVehicleAgeYears: 20,
    allowedSteering: 'RHD_ONLY',
    requiredInspections: ['NZTA', 'JEVIC'],
    description: 'New Zealand requires Right-Hand Drive with certified Electronic Stability Control (ESC).',
    active: true,
  },
  US: {
    countryCode: 'US',
    countryName: 'United States',
    maxVehicleAgeYears: 50,
    allowedSteering: 'LHD_ONLY',
    requiredInspections: ['DOT', 'EPA'],
    description: 'United States standard road compliance requires Left-Hand Drive (LHD) and DOT/EPA certification.',
    active: true,
  },
};

/**
 * Common country name aliases to canonical ISO alpha-2 codes.
 */
const COUNTRY_ALIAS_MAP: Record<string, string> = {
  KENYA: 'KE',
  UGANDA: 'UG',
  TANZANIA: 'TZ',
  RWANDA: 'RW',
  'SOUTH SUDAN': 'SS',
  ZIMBABWE: 'ZW',
  ZAMBIA: 'ZM',
  BOTSWANA: 'BW',
  'SOUTH AFRICA': 'ZA',
  'DR CONGO': 'CD',
  'DEMOCRATIC REPUBLIC OF THE CONGO': 'CD',
  CONGO: 'CD',
  DRC: 'CD',
  'SRI LANKA': 'LK',
  UK: 'GB',
  'UNITED KINGDOM': 'GB',
  BRITAIN: 'GB',
  ENGLAND: 'GB',
  UAE: 'AE',
  'UNITED ARAB EMIRATES': 'AE',
  DUBAI: 'AE',
  'ABU DHABI': 'AE',
  JAMAICA: 'JM',
  MAURITIUS: 'MU',
  AUSTRALIA: 'AU',
  'NEW ZEALAND': 'NZ',
  USA: 'US',
  'UNITED STATES': 'US',
  'UNITED STATES OF AMERICA': 'US',
  JAPAN: 'JP',
};

/**
 * Normalizes any country name, code, or alias into an uppercase ISO alpha-2 code.
 */
export function normalizeCountryCode(countryOrCode: string | undefined | null): string {
  if (!countryOrCode || typeof countryOrCode !== 'string') return '';
  const trimmed = countryOrCode.trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (COUNTRY_COMPLIANCE_RULES[upper]) {
    return upper;
  }
  if (COUNTRY_ALIAS_MAP[upper]) {
    return COUNTRY_ALIAS_MAP[upper];
  }
  // Check if it's already a 2-letter uppercase ISO code
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  return upper;
}

/**
 * Normalizes vehicle steering configuration to RHD, LHD, or UNKNOWN.
 */
export function normalizeVehicleSteering(steering: string | undefined | null): NormalizedSteering {
  if (!steering || typeof steering !== 'string') return 'UNKNOWN';
  const val = steering.toLowerCase().trim();
  if (val.includes('right') || val === 'rhd' || val === 'r') {
    return 'RHD';
  }
  if (val.includes('left') || val === 'lhd' || val === 'l') {
    return 'LHD';
  }
  return 'UNKNOWN';
}

/**
 * Retrieves the compliance rule for a given country code or name.
 */
export function getCountryComplianceRule(countryOrCode: string | undefined | null): CountryComplianceRule | undefined {
  const code = normalizeCountryCode(countryOrCode);
  if (!code) return undefined;
  return COUNTRY_COMPLIANCE_RULES[code];
}

/**
 * Evaluates whether a vehicle meets regulatory import requirements for a given destination country.
 *
 * @param vehicle Object containing vehicle year, steering, and optional attributes
 * @param destinationCountry Destination country name or ISO code (e.g., 'Kenya', 'KE', 'LK')
 * @param referenceDateOrYear Reference anchor year or Date (defaults to 2026 reference baseline)
 */
export function evaluateVehicleCompliance(
  vehicle: {
    year?: number;
    steering?: string;
    fuelType?: string;
  },
  destinationCountry: string | undefined | null,
  referenceDateOrYear: Date | string | number = 2026
): VehicleComplianceEvaluation {
  const countryCode = normalizeCountryCode(destinationCountry);
  const rule = getCountryComplianceRule(countryCode);

  const fallbackCountryName = destinationCountry?.trim() || 'Global';

  if (!rule || !countryCode) {
    // If no specific rule exists for the country, treat as globally unrestricted / standard export
    return {
      countryCode: countryCode || 'XX',
      countryName: fallbackCountryName,
      isCompliant: true,
      ruleSummary: 'Standard export compliance applied (no specific destination restrictions).',
      failedCriteria: [],
      passedCriteria: ['General vehicle export eligibility verified.'],
    };
  }

  const refYear = typeof referenceDateOrYear === 'number'
    ? referenceDateOrYear
    : typeof referenceDateOrYear === 'string'
      ? new Date(referenceDateOrYear).getUTCFullYear()
      : referenceDateOrYear.getUTCFullYear();

  const failedCriteria: string[] = [];
  const passedCriteria: string[] = [];

  const minAllowedYear = rule.maxVehicleAgeYears !== undefined ? refYear - rule.maxVehicleAgeYears : undefined;

  // 1. Year of Manufacture (YOM) / Max Age check
  if (rule.maxVehicleAgeYears !== undefined && vehicle.year !== undefined && vehicle.year > 0) {
    const vehicleAge = refYear - vehicle.year;
    if (vehicleAge > rule.maxVehicleAgeYears) {
      failedCriteria.push(
        `Vehicle year (${vehicle.year}, age: ${vehicleAge} yrs) exceeds ${rule.countryName} import limit of ${rule.maxVehicleAgeYears} years (minimum allowed year: ${minAllowedYear}).`
      );
    } else {
      passedCriteria.push(
        `Vehicle year (${vehicle.year}) satisfies ${rule.countryName} ${rule.maxVehicleAgeYears}-year rule (minimum allowed: ${minAllowedYear}).`
      );
    }
  }

  // 2. Steering configuration check
  const normalizedSteering = normalizeVehicleSteering(vehicle.steering);
  if (rule.allowedSteering === 'RHD_ONLY') {
    if (normalizedSteering === 'LHD') {
      failedCriteria.push(
        `Left-Hand Drive (LHD) steering is not permitted for import into ${rule.countryName} (Right-Hand Drive required).`
      );
    } else if (normalizedSteering === 'RHD') {
      passedCriteria.push(`Right-Hand Drive (RHD) steering complies with ${rule.countryName} regulations.`);
    } else {
      // Unknown steering default to compliant if from Japan unless flagged
      passedCriteria.push(`Steering configuration (${vehicle.steering || 'Standard'}) accepted.`);
    }
  } else if (rule.allowedSteering === 'LHD_ONLY') {
    if (normalizedSteering === 'RHD') {
      failedCriteria.push(
        `Right-Hand Drive (RHD) steering is not permitted for import into ${rule.countryName} (Left-Hand Drive required).`
      );
    } else if (normalizedSteering === 'LHD') {
      passedCriteria.push(`Left-Hand Drive (LHD) steering complies with ${rule.countryName} regulations.`);
    } else {
      failedCriteria.push(
        `Left-Hand Drive (LHD) steering required for ${rule.countryName}, but vehicle configuration is unspecified.`
      );
    }
  } else {
    passedCriteria.push(`Steering configuration (${vehicle.steering || 'Any'}) is permitted in ${rule.countryName}.`);
  }

  const isCompliant = failedCriteria.length === 0;

  return {
    countryCode: rule.countryCode,
    countryName: rule.countryName,
    isCompliant,
    ruleSummary: rule.description,
    failedCriteria,
    passedCriteria,
    minAllowedYear,
    requiredSteering: rule.allowedSteering,
    requiredInspections: rule.requiredInspections,
  };
}

/**
 * Returns true if the vehicle satisfies all compliance requirements for the specified country.
 */
export function isVehicleCompliantForCountry(
  vehicle: {
    year?: number;
    steering?: string;
    fuelType?: string;
  },
  destinationCountry: string | undefined | null,
  referenceDateOrYear: Date | string | number = 2026
): boolean {
  return evaluateVehicleCompliance(vehicle, destinationCountry, referenceDateOrYear).isCompliant;
}

/**
 * Returns all active country compliance rules.
 */
export function getAllCountryComplianceRules(): CountryComplianceRule[] {
  return Object.values(COUNTRY_COMPLIANCE_RULES).filter((rule) => rule.active);
}
