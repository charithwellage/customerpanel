import { describe, expect, it } from 'vitest';

describe('Customer profile (D02-P08-T003)', () => {
  it('keeps identity fields read-only and uses semantic profile classes', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ProfilePage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('Verified identity');
    expect(source).toContain('Name and email are fixed');
    expect(source).toContain('cc-cust-profile__field');
    expect(source).not.toContain('style={{');
  });

  it('keeps password handling as an identity-provider handoff', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../ProfilePage.tsx', import.meta.url), 'utf8');
    expect(source).toContain('does not store passwords');
    expect(source).not.toMatch(/password\s*[:=]/i);
  });
});
