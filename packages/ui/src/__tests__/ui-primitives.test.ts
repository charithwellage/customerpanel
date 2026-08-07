import { describe, it, expect } from 'vitest';
import { getButtonCssClass, renderInputFieldSkeleton, getStatusBadgeCssClass, getDialogAccessibilityAttributes, getErrorAlertAttributes } from '../index.js';

describe('UI Primitives Unit & Accessibility Tests', () => {
  it('generates accessible button CSS class names for variants', () => {
    const primaryClass = getButtonCssClass({ variant: 'primary', size: 'md' });
    expect(primaryClass).toContain('cc-btn-primary');
    expect(primaryClass).toContain('cc-btn-md');

    const disabledClass = getButtonCssClass({ disabled: true });
    expect(disabledClass).toContain('btn-disabled');
  });

  it('binds aria-labelledby and aria-describedby for input fields', () => {
    const skeleton = renderInputFieldSkeleton({ id: 'vehicle-vin', label: 'VIN Code', error: 'VIN is required' });
    expect(skeleton.labelId).toBe('vehicle-vin-label');
    expect(skeleton.errorId).toBe('vehicle-vin-error');
    expect(skeleton.hasError).toBe(true);
  });

  it('maps status badge variants correctly', () => {
    expect(getStatusBadgeCssClass('success')).toContain('cc-badge-success');
    expect(getStatusBadgeCssClass('error')).toContain('cc-badge-error');
  });

  it('sets dialog accessibility attributes', () => {
    const attrs = getDialogAccessibilityAttributes({ id: 'confirm-modal', isOpen: true, title: 'Confirm Action' });
    expect(attrs.role).toBe('dialog');
    expect(attrs['aria-modal']).toBe(true);
    expect(attrs['aria-labelledby']).toBe('confirm-modal-title');
  });

  it('configures live region announcements for error alerts', () => {
    const attrs = getErrorAlertAttributes({ id: 'server-error', message: 'Connection failed' });
    expect(attrs.role).toBe('alert');
    expect(attrs['aria-live']).toBe('assertive');
  });
});
