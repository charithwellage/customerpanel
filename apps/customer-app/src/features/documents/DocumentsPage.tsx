import React from 'react';
import type { CustomerDocument } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import { useDocuments } from './useDocuments.js';

export const DOCUMENT_CATEGORIES = [
  'Proforma Invoice',
  'Commercial Invoice',
  'Bill of Lading',
  'Inspection Certificate',
  'Export Certificate',
  'Insurance',
  'Packing List',
  'Vehicle Photos',
  'Auction Sheet',
  'Other',
] as const;

type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

function categoryFor(document: CustomerDocument): DocumentCategory {
  if (document.type === 'Invoice') return 'Commercial Invoice';
  if (document.type === 'ShippingLabel') return 'Bill of Lading';
  return 'Other';
}

function statusLabel(status: CustomerDocument['status']): string {
  if (status === 'Available') return 'Available to customer';
  if (status === 'Pending') return 'Not released';
  return 'Unavailable';
}

export const DocumentsPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { data: documents, isLoading, error, refetch } = useDocuments();
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<DocumentCategory | 'All'>('All');

  React.useEffect(() => {
    setActiveRoute('/documents');
  }, [setActiveRoute]);

  const filteredDocuments = (documents ?? []).filter((document) => {
    const documentCategory = categoryFor(document);
    const matchesCategory = category === 'All' || documentCategory === category;
    const searchable = `${document.id} ${document.vehicleId ?? ''} ${document.shipmentId ?? ''} ${documentCategory}`.toLowerCase();
    return matchesCategory && searchable.includes(query.trim().toLowerCase());
  });

  return (
    <section className="cc-cust-documents" aria-labelledby="documents-title">
      <header className="cc-cust-documents__header">
        <div>
          <p className="cc-cust-documents__eyebrow">Secure Vault</p>
          <h1 id="documents-title" className="cc-cust-documents__title">Customer documents</h1>
          <p className="cc-cust-documents__subtitle">Customer-visible records released by the authorised operations team.</p>
        </div>
        <span className="cc-cust-documents__boundary">Metadata only until document access is approved.</span>
      </header>

      <div className="cc-cust-documents__controls" role="search" aria-label="Document search and filters">
        <label className="cc-cust-documents__field">
          <span>Search documents</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ID, vehicle or shipment"
          />
        </label>
        <label className="cc-cust-documents__field">
          <span>Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as DocumentCategory | 'All')}>
            <option value="All">All categories</option>
            {DOCUMENT_CATEGORIES.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      {isLoading && <p className="cc-cust-documents__state" role="status" aria-live="polite">Loading secure documents…</p>}

      {error && (
        <div className="cc-cust-documents__state cc-cust-documents__state--error" role="alert">
          <p>Documents are temporarily unavailable.</p>
          <button type="button" className="cc-cust-documents__retry" onClick={() => void refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !error && documents && documents.length === 0 && (
        <p className="cc-cust-documents__state" role="status">No customer-visible documents are available yet.</p>
      )}

      {!isLoading && !error && documents && documents.length > 0 && filteredDocuments.length === 0 && (
        <p className="cc-cust-documents__state" role="status">No documents match this search or category.</p>
      )}

      {!isLoading && !error && filteredDocuments.length > 0 && (
        <div className="cc-cust-documents__grid" aria-label="Customer document records">
          {filteredDocuments.map((document) => (
            <article className="cc-cust-document-card" key={document.id}>
              <p className="cc-cust-document-card__category">{categoryFor(document)}</p>
              <h2 className="cc-cust-document-card__title">{document.id}</h2>
              <dl className="cc-cust-document-card__details">
                {document.vehicleId && <><dt>Vehicle</dt><dd>{document.vehicleId}</dd></>}
                {document.shipmentId && <><dt>Shipment</dt><dd>{document.shipmentId}</dd></>}
                <dt>Status</dt><dd>{statusLabel(document.status)}</dd>
                <dt>Created</dt><dd><time dateTime={document.createdAt}>{new Date(document.createdAt).toLocaleDateString()}</time></dd>
              </dl>
              <p className="cc-cust-document-card__notice">Preview and download are available only after the authorised document-access workflow.</p>
            </article>
          ))}
        </div>
      )}

      <section className="cc-cust-documents__categories" aria-labelledby="document-categories-title">
        <h2 id="document-categories-title">Document categories</h2>
        <ul>
          {DOCUMENT_CATEGORIES.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </section>
  );
};
