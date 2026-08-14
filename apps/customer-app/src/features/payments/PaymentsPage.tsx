import React, { useEffect, useMemo, useState } from 'react';
import type { CustomerPayment, CustomerPaymentNotification } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerPaymentNotifications, useCustomerPayments } from './useCustomerPayments.js';

const statusLabels = ['All', 'Pending', 'Held', 'Resubmitted', 'Approved', 'Rejected', 'Allocated'] as const;

export function getCustomerPaymentStatus(payment: CustomerPayment, notifications: CustomerPaymentNotification[]): string {
  const events = notifications.filter((event) => event.paymentId === payment.id);
  if (events.some((event) => event.event === 'PaymentAllocated')) return 'Allocated';
  if (payment.status === 'Rejected') return 'Rejected';
  if (events.some((event) => event.event === 'PaymentApproved') || payment.status === 'Approved') return 'Approved';
  if (events.some((event) => event.event === 'PaymentResubmitted')) return 'Resubmitted';
  if (events.some((event) => event.event === 'PaymentHeld')) return 'Held';
  return 'Pending';
}

export const PaymentsPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const [statusFilter, setStatusFilter] = useState<(typeof statusLabels)[number]>('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const paymentsQuery = useCustomerPayments();
  const notificationsQuery = useCustomerPaymentNotifications();
  const payments = paymentsQuery.data?.items ?? [];
  const notifications = notificationsQuery.data?.items ?? [];

  useEffect(() => setActiveRoute('/payments'), [setActiveRoute]);

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const status = getCustomerPaymentStatus(payment, notifications);
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || `${payment.reference} ${payment.invoiceId} ${payment.bankName}`.toLowerCase().includes(needle);
    return matchesStatus && matchesSearch;
  }), [payments, notifications, search, statusFilter]);

  const selected = filteredPayments.find((payment) => payment.id === selectedId) ?? filteredPayments[0];
  const selectedEvents = selected ? notifications.filter((event) => event.paymentId === selected.id) : [];

  return (
    <section className="cc-cust-payments-page" aria-labelledby="payments-title" data-testid="customer-payments-page">
      <header className="cc-cust-payments-header">
        <p className="cc-cust-payments-eyebrow">Payments & remittance</p>
        <h1 id="payments-title" className="cc-cust-payments-title">TT payment journal</h1>
        <p className="cc-cust-payments-subtitle">Track submitted transfer references and server-confirmed payment states. Email delivery is represented by queued notification records.</p>
      </header>

      <div className="cc-cust-payments-controls" data-testid="payment-controls">
        <label className="cc-cust-payments-label" htmlFor="payment-search">Search payments</label>
        <input id="payment-search" className="cc-cust-payments-input" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Reference, invoice or bank" />
        <div className="cc-cust-payments-filters" role="group" aria-label="Payment status filters">
          {statusLabels.map((status) => (
            <button key={status} type="button" className={`cc-cust-payments-filter ${statusFilter === status ? 'cc-cust-payments-filter--active' : ''}`} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{status}</button>
          ))}
        </div>
      </div>

      {paymentsQuery.isLoading && <p className="cc-cust-payments-state" role="status" aria-live="polite">Loading payment journal…</p>}
      {paymentsQuery.error && <div className="cc-cust-payments-state cc-cust-payments-state--error" role="alert"><p>Payment journal is temporarily unavailable.</p><button type="button" className="cc-cust-payments-retry" onClick={() => void paymentsQuery.refetch()}>Retry</button></div>}
      {!paymentsQuery.isLoading && !paymentsQuery.error && filteredPayments.length === 0 && <p className="cc-cust-payments-state" role="status">No matching payment records are available.</p>}

      {!paymentsQuery.isLoading && !paymentsQuery.error && filteredPayments.length > 0 && (
        <div className="cc-cust-payments-layout">
          <div className="cc-cust-payments-list" aria-label="Customer payment journal">
            {filteredPayments.map((payment) => {
              const status = getCustomerPaymentStatus(payment, notifications);
              return <button type="button" key={payment.id} className={`cc-cust-payment-card ${selected?.id === payment.id ? 'cc-cust-payment-card--selected' : ''}`} aria-pressed={selected?.id === payment.id} onClick={() => setSelectedId(payment.id)}>
                <span className="cc-cust-payment-card__reference">{payment.reference}</span>
                <span className="cc-cust-payment-card__meta">{payment.invoiceId} · {payment.paymentDate}</span>
                <span className={`cc-cust-payment-card__status cc-cust-payment-card__status--${status.toLowerCase()}`}>{status}</span>
                <strong className="cc-cust-payment-card__amount">${payment.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} {payment.currency}</strong>
              </button>;
            })}
          </div>
          {selected && <article className="cc-cust-payment-detail" data-testid="payment-detail">
            <header><p className="cc-cust-payments-eyebrow">Payment detail</p><h2>{selected.reference}</h2><span className={`cc-cust-payment-card__status cc-cust-payment-card__status--${getCustomerPaymentStatus(selected, notifications).toLowerCase()}`}>{getCustomerPaymentStatus(selected, notifications)}</span></header>
            <dl className="cc-cust-payment-detail__facts"><dt>Invoice</dt><dd>{selected.invoiceId}</dd><dt>Transfer date</dt><dd>{selected.paymentDate}</dd><dt>Amount submitted</dt><dd>${selected.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} {selected.currency}</dd><dt>Approved allocated</dt><dd>${(selected.allocatedAmountUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd><dt>Remaining invoice balance</dt><dd>${(selected.remainingBalanceUsd ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd></dl>
            {selected.holdReason && <p className="cc-cust-payment-detail__notice" role="status">Hold reason: {selected.holdReason}</p>}
            <h3>Notification history</h3>
            {selectedEvents.length > 0 ? <ol className="cc-cust-payment-events">{selectedEvents.map((event) => <li key={event.id}><strong>{event.event}</strong><span>{event.deliveryStatus} · {new Date(event.createdAt).toLocaleString()}</span></li>)}</ol> : <p className="cc-cust-payments-muted">No notification events recorded.</p>}
          </article>}
        </div>
      )}
    </section>
  );
};
