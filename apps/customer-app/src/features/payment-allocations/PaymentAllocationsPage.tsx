import React, { useEffect, useMemo, useState } from 'react';
import type { CustomerPaymentAllocationSummary, ListCustomerPaymentAllocationsQuery } from '@carchief/domain';
import { CustomerPaymentService } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import { useHttpClient } from '../account/index.js';
import { useCustomerInvoiceDocument } from '../invoices/useCustomerInvoiceDocument.js';
import { PrintableInvoiceModal } from '../invoices/components/PrintableInvoiceModal.js';
import { useCustomerPaymentAllocations } from './useCustomerPaymentAllocations.js';

const usd = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const PaymentAllocationsPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const httpClient = useHttpClient();
  const [query, setQuery] = useState<ListCustomerPaymentAllocationsQuery>({ page: 1, limit: 10 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const data = useCustomerPaymentAllocations(query);
  const invoiceDocument = useCustomerInvoiceDocument(invoiceId || undefined, { enabled: Boolean(invoiceId) });

  useEffect(() => { setActiveRoute('/payment-allocations'); }, [setActiveRoute]);
  useEffect(() => {
    if (expanded && data.data && !data.data.items.some((item) => item.id === expanded)) setExpanded(null);
  }, [data.data, expanded]);

  const totals = data.data?.totals;
  const apply = (patch: Partial<ListCustomerPaymentAllocationsQuery>) => setQuery((current) => ({ ...current, ...patch, page: 1 }));
  const goToPage = (page: number) => setQuery((current) => ({ ...current, page }));
  const download = async (item: CustomerPaymentAllocationSummary) => {
    if (!httpClient || !item.invoice) return;
    const blob = await new CustomerPaymentService(httpClient).downloadCustomerInvoicePdf(item.invoice.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${item.invoice.invoiceNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const pages = useMemo(() => Math.max(1, Math.ceil((data.data?.total || 0) / (query.limit || 10))), [data.data?.total, query.limit]);

  return (
    <main className="cc-payment-allocations-page" data-testid="payment-allocations-page">
      <header className="cc-payment-allocations-header">
        <div>
          <p className="cc-payment-allocations-eyebrow">CUSTOMER FINANCE</p>
          <h1>TT Payments &amp; Allocations</h1>
          <p>Track each telegraphic transfer, its vehicle allocations, and the invoice generated for it.</p>
        </div>
      </header>

      <section className="cc-payment-allocation-kpis" aria-label="TT payment totals">
        <div><span>Total TT payments</span><strong>{usd(totals?.totalAmountUsd || 0)}</strong></div>
        <div><span>Allocated</span><strong className="cc-payment-allocation-positive">{usd(totals?.allocatedAmountUsd || 0)}</strong></div>
        <div><span>Unallocated</span><strong className="cc-payment-allocation-warning">{usd(totals?.unallocatedAmountUsd || 0)}</strong></div>
        <div><span>Invoices available</span><strong>{totals?.invoiceCount || 0}</strong></div>
      </section>

      <section className="cc-payment-allocation-filters" aria-label="Filter TT payments">
        <input aria-label="Search TT payments" value={query.query || ''} placeholder="Search TT reference, vehicle, or invoice" onChange={(event) => apply({ query: event.target.value })} />
        <select aria-label="Filter payment status" value={query.paymentStatus || ''} onChange={(event) => apply({ paymentStatus: event.target.value || undefined })}>
          <option value="">All payment statuses</option><option>Pending</option><option>Approved</option><option>Held</option><option>Rejected</option>
        </select>
        <select aria-label="Filter allocation status" value={query.allocationStatus || ''} onChange={(event) => apply({ allocationStatus: event.target.value || undefined })}>
          <option value="">All allocation statuses</option><option>Unallocated</option><option>PartiallyAllocated</option><option>FullyAllocated</option>
        </select>
        <select aria-label="Filter allocation scope" value={query.scope || ''} onChange={(event) => apply({ scope: event.target.value || undefined })}>
          <option value="">Single and bulk payments</option><option value="SingleVehicle">Single vehicle</option><option value="MultipleVehicles">Multiple vehicles</option>
        </select>
      </section>

      {data.isLoading && <p className="cc-payment-allocation-state">Loading TT payment allocations…</p>}
      {data.error && <p className="cc-payment-allocation-state cc-payment-allocation-state--error" role="alert">{data.error.message}</p>}
      {!data.isLoading && !data.error && data.data?.items.length === 0 && <p className="cc-payment-allocation-state">No TT payments match the selected filters.</p>}

      <section className="cc-payment-allocation-list" aria-label="TT payment allocation list">
        {data.data?.items.map((item) => {
          const isOpen = expanded === item.id;
          return <article className="cc-payment-allocation-card" key={item.id}>
            <button type="button" className="cc-payment-allocation-card__header" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : item.id)}>
              <span><strong>{item.reference}</strong><small>{item.bankName} · {new Date(item.paymentDate).toLocaleDateString()}</small></span>
              <span><strong>{usd(item.amountUsd)} {item.currency}</strong><small>{item.vehicleCount > 1 ? `Allocated to ${item.vehicleCount} vehicles` : item.vehicleCount === 1 ? 'Single vehicle payment' : 'Awaiting allocation'}</small></span>
              <span className={`cc-payment-allocation-status cc-payment-allocation-status--${item.allocationStatus}`}>{item.allocationStatus.replace(/([A-Z])/g, ' $1').trim()}</span>
            </button>
            <div
              className={`cc-payment-allocation-chart cc-payment-allocation-chart--${item.amountUsd > 0 ? item.allocationStatus : 'ZeroValue'}`}
              style={{ '--cc-payment-allocation-percent': `${item.amountUsd > 0 ? item.allocationPercent : 0}%` } as React.CSSProperties}
              role="img"
              aria-label={`${item.allocationPercent}% allocated: ${usd(item.allocatedAmountUsd)} allocated and ${usd(item.unallocatedAmountUsd)} unallocated`}
            >
              <span>{item.amountUsd > 0 ? `${item.allocationPercent}%` : '—'}</span>
            </div>
            <div className="cc-payment-allocation-card__summary"><span>{usd(item.allocatedAmountUsd)} allocated</span><span>{usd(item.unallocatedAmountUsd)} unallocated</span></div>
            {isOpen && <div className="cc-payment-allocation-card__detail">
              <h2>Vehicle allocations</h2>
              {item.allocations.length === 0 ? <p>This TT has been verified but has not yet been allocated by the sales team.</p> : <div className="cc-payment-allocation-lines">
                {item.allocations.map((line) => <div className="cc-payment-allocation-line" key={line.id}>
                  {line.vehicle.primaryImage ? <img src={line.vehicle.primaryImage} alt="" /> : <div className="cc-payment-allocation-line__image" />}
                  <div><strong>{line.vehicle.year} {line.vehicle.make} {line.vehicle.model}</strong><small>{line.vehicle.stockNumber} · {line.vehicle.chassisNumber}</small></div>
                  <div className="cc-payment-allocation-line__financials">
                    <span>Total price<strong>{usd(line.vehicleTotalAmountUsd)}</strong></span>
                    <span>Allocated<strong>{usd(line.vehicleAllocatedAmountUsd)}</strong></span>
                    <span>Balance<strong className={line.vehicleBalanceAmountUsd > 0 ? 'cc-payment-allocation-warning' : 'cc-payment-allocation-positive'}>{usd(line.vehicleBalanceAmountUsd)}</strong></span>
                  </div>
                  <span>{line.purpose}<small>Current TT: {usd(line.amountUsd)}</small></span>
                </div>)}
              </div>}
              {item.invoice && <div className="cc-payment-allocation-invoice">
                <div><strong>{item.invoice.invoiceNumber}</strong><small>{item.invoice.vehicleCount} vehicle{item.invoice.vehicleCount === 1 ? '' : 's'} · {item.invoice.status}</small></div>
                <div><button type="button" onClick={() => setInvoiceId(item.invoice!.id)}>View Invoice</button><button type="button" onClick={() => void download(item)}>Download Invoice</button></div>
              </div>}
            </div>}
          </article>;
        })}
      </section>
      {data.data && data.data.total > (query.limit || 10) && <nav className="cc-payment-allocation-pagination" aria-label="TT payment pages">
        <button disabled={(query.page || 1) <= 1} onClick={() => goToPage((query.page || 1) - 1)}>Previous</button>
        <span>Page {query.page} of {pages}</span>
        <button disabled={(query.page || 1) >= pages} onClick={() => goToPage((query.page || 1) + 1)}>Next</button>
      </nav>}
      <PrintableInvoiceModal isOpen={Boolean(invoiceId)} onClose={() => setInvoiceId(null)} document={invoiceDocument.data || null} isLoading={invoiceDocument.isLoading} />
    </main>
  );
};
