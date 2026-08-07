import { describe, it, expect } from 'vitest';
import { isValidVehicleStatus, validateEmail } from '../index.js';

describe('Validation Package Unit Tests', () => {
  it('validates vehicle status vocabulary correctly', () => {
    expect(isValidVehicleStatus('Available')).toBe(true);
    expect(isValidVehicleStatus('ReservedWithPI')).toBe(true);
    expect(isValidVehicleStatus('InvalidStatus')).toBe(false);
  });

  it('validates email addresses correctly', () => {
    expect(validateEmail('test@carchief.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
  });
});
