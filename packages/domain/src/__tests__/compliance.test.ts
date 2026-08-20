import { describe, it, expect } from 'vitest';
import {
  evaluateVehicleCompliance,
  isVehicleCompliantForCountry,
  getCountryComplianceRule,
  normalizeCountryCode,
  normalizeVehicleSteering,
  getAllCountryComplianceRules,
} from '../compliance.js';

describe('Country Vehicle Compliance Engine (D02-P14-T005)', () => {
  const REF_YEAR = 2026;

  describe('normalizeCountryCode', () => {
    it('normalizes uppercase ISO codes', () => {
      expect(normalizeCountryCode('KE')).toBe('KE');
      expect(normalizeCountryCode('ug')).toBe('UG');
      expect(normalizeCountryCode('lk')).toBe('LK');
    });

    it('maps country names and common aliases', () => {
      expect(normalizeCountryCode('Kenya')).toBe('KE');
      expect(normalizeCountryCode('Sri Lanka')).toBe('LK');
      expect(normalizeCountryCode('United Kingdom')).toBe('GB');
      expect(normalizeCountryCode('UK')).toBe('GB');
      expect(normalizeCountryCode('United Arab Emirates')).toBe('AE');
      expect(normalizeCountryCode('Dubai')).toBe('AE');
      expect(normalizeCountryCode('DR Congo')).toBe('CD');
      expect(normalizeCountryCode('South Africa')).toBe('ZA');
      expect(normalizeCountryCode('Zimbabwe')).toBe('ZW');
      expect(normalizeCountryCode('Zambia')).toBe('ZM');
      expect(normalizeCountryCode('Botswana')).toBe('BW');
      expect(normalizeCountryCode('Jamaica')).toBe('JM');
      expect(normalizeCountryCode('Mauritius')).toBe('MU');
    });

    it('returns empty string for empty inputs', () => {
      expect(normalizeCountryCode('')).toBe('');
      expect(normalizeCountryCode(undefined)).toBe('');
      expect(normalizeCountryCode(null)).toBe('');
    });
  });

  describe('normalizeVehicleSteering', () => {
    it('normalizes right-hand drive values', () => {
      expect(normalizeVehicleSteering('Right')).toBe('RHD');
      expect(normalizeVehicleSteering('RHD')).toBe('RHD');
      expect(normalizeVehicleSteering('Right Hand Drive')).toBe('RHD');
      expect(normalizeVehicleSteering('right')).toBe('RHD');
    });

    it('normalizes left-hand drive values', () => {
      expect(normalizeVehicleSteering('Left')).toBe('LHD');
      expect(normalizeVehicleSteering('LHD')).toBe('LHD');
      expect(normalizeVehicleSteering('Left Hand Drive')).toBe('LHD');
      expect(normalizeVehicleSteering('left')).toBe('LHD');
    });

    it('returns UNKNOWN for missing or unrecognized values', () => {
      expect(normalizeVehicleSteering(undefined)).toBe('UNKNOWN');
      expect(normalizeVehicleSteering('')).toBe('UNKNOWN');
      expect(normalizeVehicleSteering('Center')).toBe('UNKNOWN');
    });
  });

  describe('Kenya (KE) Regulatory Rules (KS 1515:2000)', () => {
    it('allows a 7-year-old RHD vehicle (2019 in 2026)', () => {
      const vehicle = { year: 2019, steering: 'Right Hand Drive' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'Kenya', REF_YEAR);

      expect(evaluation.isCompliant).toBe(true);
      expect(evaluation.failedCriteria).toHaveLength(0);
      expect(evaluation.countryCode).toBe('KE');
      expect(evaluation.minAllowedYear).toBe(2018);
      expect(isVehicleCompliantForCountry(vehicle, 'Kenya', REF_YEAR)).toBe(true);
    });

    it('allows an 8-year-old RHD vehicle (2018 in 2026)', () => {
      const vehicle = { year: 2018, steering: 'RHD' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'KE', REF_YEAR);

      expect(evaluation.isCompliant).toBe(true);
      expect(evaluation.failedCriteria).toHaveLength(0);
    });

    it('REJECTS a 9-year-old vehicle (2017 in 2026) due to the 8-year rule', () => {
      const vehicle = { year: 2017, steering: 'Right' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'Kenya', REF_YEAR);

      expect(evaluation.isCompliant).toBe(false);
      expect(evaluation.failedCriteria).toEqual(
        expect.arrayContaining([
          expect.stringContaining('exceeds Kenya import limit of 8 years (minimum allowed year: 2018)'),
        ])
      );
      expect(isVehicleCompliantForCountry(vehicle, 'Kenya', REF_YEAR)).toBe(false);
    });

    it('REJECTS a Left-Hand Drive (LHD) vehicle even if year is valid', () => {
      const vehicle = { year: 2023, steering: 'Left Hand Drive' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'Kenya', REF_YEAR);

      expect(evaluation.isCompliant).toBe(false);
      expect(evaluation.failedCriteria).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Left-Hand Drive (LHD) steering is not permitted for import into Kenya'),
        ])
      );
    });
  });

  describe('Sri Lanka (LK) Regulatory Rules', () => {
    it('allows a 2-year-old RHD vehicle (2024 in 2026)', () => {
      const vehicle = { year: 2024, steering: 'Right' };
      expect(isVehicleCompliantForCountry(vehicle, 'Sri Lanka', REF_YEAR)).toBe(true);
    });

    it('REJECTS a 4-year-old vehicle (2022 in 2026) under the strict 3-year rule', () => {
      const vehicle = { year: 2022, steering: 'Right' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'Sri Lanka', REF_YEAR);
      expect(evaluation.isCompliant).toBe(false);
      expect(evaluation.failedCriteria[0]).toContain('exceeds Sri Lanka import limit of 3 years');
    });

    it('REJECTS an LHD vehicle for Sri Lanka', () => {
      const vehicle = { year: 2025, steering: 'Left' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'LK', REF_YEAR);
      expect(evaluation.isCompliant).toBe(false);
      expect(evaluation.failedCriteria[0]).toContain('Left-Hand Drive (LHD) steering is not permitted for import into Sri Lanka');
    });
  });

  describe('United Arab Emirates / Dubai (AE) Regulatory Rules', () => {
    it('allows Left-Hand Drive (LHD) vehicles under 15 years old', () => {
      const vehicle = { year: 2021, steering: 'Left' };
      expect(isVehicleCompliantForCountry(vehicle, 'United Arab Emirates', REF_YEAR)).toBe(true);
      expect(isVehicleCompliantForCountry(vehicle, 'Dubai', REF_YEAR)).toBe(true);
    });

    it('REJECTS Right-Hand Drive (RHD) vehicles for standard UAE registration', () => {
      const vehicle = { year: 2022, steering: 'Right' };
      const evaluation = evaluateVehicleCompliance(vehicle, 'AE', REF_YEAR);
      expect(evaluation.isCompliant).toBe(false);
      expect(evaluation.failedCriteria[0]).toContain('Right-Hand Drive (RHD) steering is not permitted for import into United Arab Emirates');
    });
  });

  describe('United Kingdom (GB) Regulatory Rules', () => {
    it('allows Right-Hand Drive vehicles compliant with MOT/IVA', () => {
      const vehicle = { year: 2016, steering: 'Right' };
      expect(isVehicleCompliantForCountry(vehicle, 'UK', REF_YEAR)).toBe(true);
    });

    it('REJECTS Left-Hand Drive vehicles under standard import rule', () => {
      const vehicle = { year: 2020, steering: 'Left' };
      expect(isVehicleCompliantForCountry(vehicle, 'United Kingdom', REF_YEAR)).toBe(false);
    });
  });

  describe('Uganda (UG) Regulatory Rules', () => {
    it('allows vehicles up to 15 years old (2011 in 2026)', () => {
      const vehicle = { year: 2012, steering: 'Right' };
      expect(isVehicleCompliantForCountry(vehicle, 'Uganda', REF_YEAR)).toBe(true);
    });

    it('REJECTS a 16-year-old vehicle (2010 in 2026)', () => {
      const vehicle = { year: 2010, steering: 'Right' };
      expect(isVehicleCompliantForCountry(vehicle, 'Uganda', REF_YEAR)).toBe(false);
    });
  });

  describe('getAllCountryComplianceRules', () => {
    it('returns all active compliance rules', () => {
      const rules = getAllCountryComplianceRules();
      expect(rules.length).toBeGreaterThanOrEqual(10);
      expect(rules.some((r) => r.countryCode === 'KE')).toBe(true);
      expect(rules.some((r) => r.countryCode === 'UG')).toBe(true);
      expect(rules.some((r) => r.countryCode === 'LK')).toBe(true);
      expect(rules.some((r) => r.countryCode === 'AE')).toBe(true);
    });
  });
});
