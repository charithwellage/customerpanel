import { describe, expect, it } from 'vitest';
import { NormalizedApiError } from '@carchief/api-client';
import { mapChangePasswordError } from '../ProfilePage.js';

describe('Customer profile — change password (D02-P12-T006)', () => {
  it('renders a wrong-current-password error on the current-password field, never as session expiry', () => {
    const error = new NormalizedApiError(401, 'Current password is incorrect', 'corr-401');
    const outcome = mapChangePasswordError(error);
    expect(outcome.field).toBe('currentPassword');
    expect(outcome.summary).toBeUndefined();
  });

  it('attaches a 400 policy-violation error to the field the Mock API named', () => {
    const error = new NormalizedApiError(400, 'Password must be at least 12 characters', 'corr-400', { field: 'newPassword' });
    const outcome = mapChangePasswordError(error);
    expect(outcome.field).toBe('newPassword');
  });

  it('attaches a mismatched-confirmation 400 error to confirmNewPassword', () => {
    const error = new NormalizedApiError(400, 'Passwords do not match', 'corr-400', { field: 'confirmNewPassword' });
    const outcome = mapChangePasswordError(error);
    expect(outcome.field).toBe('confirmNewPassword');
  });

  it('falls back to a form-level summary for a 400 with no known field', () => {
    const error = new NormalizedApiError(400, 'Malformed request', 'corr-400', {});
    const outcome = mapChangePasswordError(error);
    expect(outcome.field).toBeUndefined();
    expect(outcome.summary).toBe('Malformed request');
  });

  it('renders a connectivity summary for a network/5xx failure, not a field error', () => {
    const error = new NormalizedApiError(503, 'Service unavailable', 'corr-503');
    const outcome = mapChangePasswordError(error);
    expect(outcome.field).toBeUndefined();
    expect(outcome.summary).toContain('Unable to reach the server');
  });

  it('falls back to a generic summary for a non-API error', () => {
    const outcome = mapChangePasswordError(new Error('boom'));
    expect(outcome.field).toBeUndefined();
    expect(outcome.summary).toContain('could not be changed');
  });
});

describe('Customer profile — markup and copy (D02-P12-T006)', () => {
  it('renders the three password inputs with correct autocomplete and a live-region success message, and no static style', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ProfilePage.tsx', import.meta.url), 'utf8');
    expect(source).toContain("autoComplete=\"current-password\"");
    expect(source.match(/autoComplete="new-password"/g)?.length).toBe(2);
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('Your password was changed.');
    expect(source).toContain('setPasswordForm(emptyPasswordForm)');
    expect(source).not.toContain('style={{');
  });

  it('keeps the useCustomerProfile 409/expectedVersion conflict path untouched', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ProfilePage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('expectedVersion: profileQuery.data.version');
    expect(source).toContain('error.statusCode === 409');
    expect(source).toContain('This profile changed elsewhere. Refresh the profile before saving again.');
    expect(source).toContain('Refresh profile');

    const hookSource = await readFile(new URL('../useCustomerProfile.ts', import.meta.url), 'utf8');
    expect(hookSource).toContain("new CustomerProfileService(httpClient).update(request)");
  });

  it('blocks password changes while offline with an honest message', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ProfilePage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('You are offline. Password changes are disabled until connectivity returns.');
    expect(source).toContain('isMutationBlockedOffline()');
  });

  it('does not render any residual demo copy', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ProfilePage.tsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/demo session/i);
    expect(source).not.toMatch(/demo customer/i);
    expect(source).not.toMatch(/not a production identity/i);
    expect(source).not.toContain('identity-provider handoff');
  });
});

describe('Customer application — no residual demo copy anywhere (D02-P12-T006, CUST-30)', () => {
  it('finds no "demo session", "demo customer" or "not a production identity" copy in any .tsx source file', async () => {
    const { readdir, readFile } = await import('node:fs/promises');
    const path = await import('node:path');
    const forbidden = [/demo session/i, /demo customer/i, /not a production identity/i];
    const root = path.default.resolve(new URL('../../..', import.meta.url).pathname);
    const offenders: string[] = [];

    async function walk(dir: string): Promise<void> {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
        const full = path.default.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          const text = await readFile(full, 'utf8');
          if (forbidden.some((pattern) => pattern.test(text))) offenders.push(full);
        }
      }
    }

    await walk(root);
    expect(offenders).toEqual([]);
  });
});
