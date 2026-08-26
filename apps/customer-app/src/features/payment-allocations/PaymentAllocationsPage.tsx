import React, { useEffect, useMemo, useState } from 'react';
import type { CustomerPaymentAllocationSummary, ListCustomerPaymentAllocationsQuery } from '@carchief/domain';
import { CustomerPaymentService } from '@carchief/api-client';
import { useCustomerShell } from '../shell/index.js';
import { useHttpClient } from '../account/index.js';
import { useCustomerInvoiceDocument } from '../invoices/useCustomerInvoiceDocument.js';
import { PrintableInvoiceModal } from '../invoices/components/PrintableInvoiceModal.js';
import { useCustomerPaymentAllocations } from './useCustomerPaymentAllocations.js';
import { getPaymentTypeLabel } from '../payments/paymentLabels.js';

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
          <p className="cc-payment-allocations-eyebrow cc-portal-page-eyebrow">CUSTOMER FINANCE</p>
          <h1 className="cc-portal-page-title">Payment Allocations</h1>
          <p className="cc-portal-page-description">Track each telegraphic transfer, its vehicle allocations, and the invoice generated for it.</p>
        </div>
      </header>

      <section className="cc-payment-allocation-kpis" aria-label="TT payment totals">
        <div><span>Total TT payments</span><strong className="cc-portal-financial-amount">{usd(totals?.totalAmountUsd || 0)}</strong></div>
        <div><span>Allocated</span><strong className="cc-portal-financial-amount cc-payment-allocation-positive">{usd(totals?.allocatedAmountUsd || 0)}</strong></div>
        <div><span>Unallocated</span><strong className="cc-portal-financial-amount cc-payment-allocation-warning">{usd(totals?.unallocatedAmountUsd || 0)}</strong></div>
        <div><span>Invoices available</span><strong className="cc-portal-financial-amount">{totals?.invoiceCount || 0}</strong></div>
      </section>

      <section className="cc-payment-allocation-filters" aria-label="Filter TT payments">
        <div className="cc-search-input-wrapper cc-payment-allocation-search">
          <span className="cc-search-input-icon" aria-hidden="true">⌕</span>
          <input className="cc-search-input" aria-label="Search TT payments" value={query.query || ''} placeholder="Search TT reference, vehicle, or invoice" onChange={(event) => apply({ query: event.target.value })} />
        </div>
        <select className="cc-filter-select" aria-label="Filter payment status" value={query.paymentStatus || ''} onChange={(event) => apply({ paymentStatus: event.target.value || undefined })}>
          <option value="">All payment statuses</option><option>Pending</option><option>Approved</option><option>Held</option><option>Rejected</option>
        </select>
        <select className="cc-filter-select" aria-label="Filter allocation status" value={query.allocationStatus || ''} onChange={(event) => apply({ allocationStatus: event.target.value || undefined })}>
          <option value="">All allocation statuses</option><option>Unallocated</option><option>PartiallyAllocated</option><option>FullyAllocated</option>
        </select>
        <select className="cc-filter-select" aria-label="Filter allocation scope" value={query.scope || ''} onChange={(event) => apply({ scope: event.target.value || undefined })}>
          <option value="">Single and bulk payments</option><option value="SingleVehicle">Single vehicle</option><option value="MultipleVehicles">Multiple vehicles</option>
        </select>
      </section>

      {data.isLoading && <p className="cc-payment-allocation-state">Loading TT payment allocations…</p>}
      {data.error && <p className="cc-payment-allocation-state cc-payment-allocation-state--error" role="alert">{data.error.message}</p>}
      {!data.isLoading && !data.error && data.data?.items.length === 0 && <p className="cc-payment-allocation-state">No TT payments match the selected filters.</p>}

      <section className="cc-payment-allocation-table-wrap" aria-label="TT payment allocation list">
        <table className="cc-payment-allocation-table">
          <caption className="cc-sr-only">Telegraphic transfer payments and vehicle allocations</caption>
          <thead>
            <tr>
              <th scope="col">Ref.No</th>
              <th scope="col">Payment Type</th>
              <th scope="col">Payment Date</th>
              <th scope="col">Receiving Bank</th>
              <th scope="col">Currency</th>
              <th scope="col" className="cc-payment-allocation-number"><span>Received</span><span>Amount</span></th>
              <th scope="col" className="cc-payment-allocation-number"><span>Allocated</span><span>Amount</span></th>
              <th scope="col" className="cc-payment-allocation-number"><span>Unallocated</span><span>Amount</span></th>
              <th scope="col" className="cc-payment-allocation-number"><span>No. Of</span><span>Vehicles</span></th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
          {data.data?.items.map((item) => {
          const isOpen = expanded === item.id;
          const totalAmount = Math.max(item.amountUsd, 0);
          const allocatedAmount = Math.max(item.allocatedAmountUsd, 0);
          const unallocatedAmount = Math.max(item.unallocatedAmountUsd, 0);
          const allocatedPercent = totalAmount > 0
            ? Math.min(100, Math.max(0, (allocatedAmount / totalAmount) * 100))
            : 0;
          const toggle = () => setExpanded(isOpen ? null : item.id);
          const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggle();
            }
          };
          const detailId = `payment-allocation-detail-${item.id}`;
          return <React.Fragment key={item.id}>
            <tr
              className={`cc-payment-allocation-row${isOpen ? ' cc-payment-allocation-row--expanded' : ''}`}
              tabIndex={0}
              aria-expanded={isOpen}
              aria-controls={detailId}
              onClick={toggle}
              onKeyDown={handleKeyDown}
            >
              <th scope="row"><strong>{item.reference}</strong></th>
              <td>{getPaymentTypeLabel(item.paymentMethod)}</td>
              <td>{new Date(item.paymentDate).toLocaleDateString()}</td>
              <td>{item.bankName}</td>
              <td>{item.currency}</td>
              <td className="cc-payment-allocation-money cc-payment-allocation-number">{usd(totalAmount)}</td>
              <td className="cc-payment-allocation-money cc-payment-allocation-number cc-payment-allocation-positive">{usd(allocatedAmount)}</td>
              <td className="cc-payment-allocation-money cc-payment-allocation-number cc-payment-allocation-warning">{usd(unallocatedAmount)}</td>
              <td className="cc-payment-allocation-number">{item.vehicleCount}</td>
              <td className="cc-payment-allocation-status-cell">
                <strong className={`cc-payment-allocation-status cc-payment-allocation-status--${item.allocationStatus}`}>{item.allocationStatus.replace(/([A-Z])/g, ' $1').trim()}</strong>
                <div
                  className={`cc-payment-allocation-bar cc-payment-allocation-bar--${totalAmount > 0 ? item.allocationStatus : 'ZeroValue'}`}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={allocatedPercent}
                  aria-label={`${usd(allocatedAmount)} allocated and ${usd(unallocatedAmount)} unallocated from ${usd(totalAmount)} total TT amount`}
                >
                  <span className="cc-payment-allocation-bar__allocated" style={{ width: `${allocatedPercent}%` }} />
                  <span className="cc-payment-allocation-bar__unallocated" style={{ width: `${totalAmount > 0 ? 100 - allocatedPercent : 100}%` }} />
                </div>
              </td>
            </tr>
            {isOpen && <tr className="cc-payment-allocation-detail-row" id={detailId}>
              <td colSpan={10}>
                <div className="cc-payment-allocation-detail">
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
                    </div>)}
                  </div>}
                  {item.invoice && <div className="cc-payment-allocation-invoice">
                    <div><strong>{item.invoice.invoiceNumber}</strong><small>{item.invoice.vehicleCount} vehicle{item.invoice.vehicleCount === 1 ? '' : 's'} · {item.invoice.status}</small></div>
                    <div>
                      <button type="button" onClick={(event) => { event.stopPropagation(); setInvoiceId(item.invoice!.id); }}>View Invoice</button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); void download(item); }}>Download Invoice</button>
                    </div>
                  </div>}
                </div>
              </td>
            </tr>}
          </React.Fragment>;
        })}
          </tbody>
        </table>
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
