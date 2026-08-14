import { describe, expect, it } from 'vitest';
import { DOCUMENT_CATEGORIES } from '../DocumentsPage.js';

describe('Customer Secure Vault (D02-P07-T003)', () => {
  it('presents all ten approved MVP category labels', () => {
    expect(DOCUMENT_CATEGORIES).toHaveLength(10);
    expect(DOCUMENT_CATEGORIES).toContain('Proforma Invoice');
    expect(DOCUMENT_CATEGORIES).toContain('Auction Sheet');
    expect(DOCUMENT_CATEGORIES).toContain('Other');
  });

  it('keeps the document page class-styled without static inline styles', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(new URL('../DocumentsPage.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('style={{');
    expect(source).toContain('cc-cust-document-card');
  });
});
