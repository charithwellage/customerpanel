import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CustomerPayment, CustomerPaymentNotification, CreateCustomerPaymentRequest } from '@carchief/domain';
import { customerPaymentFormSchema, MAX_PAYMENT_PROOF_BYTES, type CustomerPaymentFormInput, type CustomerPaymentFormValues } from '@carchief/validation';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerPaymentNotifications, useCustomerPayments } from './useCustomerPayments.js';
import { useCreateCustomerPayment } from './useCreateCustomerPayment.js';
import { useResubmitCustomerPayment } from './useResubmitCustomerPayment.js';
import { useCustomerOnlineStatus } from '../pwa/useCustomerOnlineStatus.js';

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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const online = useCustomerOnlineStatus();
  const createPayment = useCreateCustomerPayment();
  const resubmitPayment = useResubmitCustomerPayment();
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
  const selectedStatus = selected ? getCustomerPaymentStatus(selected, notifications) : '';

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CustomerPaymentFormInput, unknown, CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentFormSchema),
    defaultValues: { currency: 'USD', paymentDate: new Date().toISOString().slice(0, 10), remarks: '', proof: { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' }, idempotencyKey: crypto.randomUUID() },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: CustomerPaymentFormValues) => {
    setSubmitMessage(null);
    setSubmitError(null);
    try {
      const request: CreateCustomerPaymentRequest = {
        invoiceId: values.invoiceId.trim(), reference: values.reference.trim(), bankName: values.bankName.trim(),
        currency: values.currency, amountUsd: values.amountUsd, paymentDate: values.paymentDate,
        ...(values.remarks?.trim() ? { remarks: values.remarks.trim() } : {}), proof: values.proof, idempotencyKey: values.idempotencyKey,
      };
      const payment = await createPayment.mutateAsync(request);
      setSubmitMessage(`Payment ${payment.reference} was submitted for review. The server recorded proof scanning as pending.`);
      setSelectedId(payment.id);
      setProofFile(null);
      reset({ currency: 'USD', paymentDate: new Date().toISOString().slice(0, 10), remarks: '', proof: { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' }, idempotencyKey: crypto.randomUUID() });
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Payment submission failed. Please retry.');
    }
  };

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setProofFile(file);
    if (!file) {
      setValue('proof', { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' }, { shouldValidate: true });
      return;
    }
    const extension = file.name.split('.').pop()?.toUpperCase();
    const fileType = extension === 'JPG' || extension === 'JPEG' ? 'JPG' : extension === 'PNG' ? 'PNG' : extension === 'PDF' ? 'PDF' : undefined;
    setValue('proof', fileType ? { fileName: file.name, fileType, sizeBytes: file.size, scanStatus: 'Pending' } : { fileName: file.name, fileType: 'PDF', sizeBytes: MAX_PAYMENT_PROOF_BYTES + 1, scanStatus: 'Pending' }, { shouldValidate: true });
  };

  return (
    <section className="cc-cust-payments-page" aria-labelledby="payments-title" data-testid="customer-payments-page">
      <header className="cc-cust-payments-header">
        <p className="cc-cust-payments-eyebrow">Payments & remittance</p>
        <h1 id="payments-title" className="cc-cust-payments-title">TT payment journal</h1>
        <p className="cc-cust-payments-subtitle">Track submitted transfer references and server-confirmed payment states. Email delivery is represented by queued notification records.</p>
      </header>

      <form className="cc-cust-payment-submit" aria-labelledby="payment-submit-title" onSubmit={(event) => void handleSubmit(onSubmit)(event)} noValidate>
        <div className="cc-cust-payment-submit__header">
          <div><p className="cc-cust-payments-eyebrow">Secure submission</p><h2 id="payment-submit-title">Submit a TT payment</h2></div>
          <p className="cc-cust-payments-muted">Only proof metadata is sent to this demo API; file contents never enter browser logs or persistence.</p>
        </div>
        {!online && <p className="cc-cust-payment-submit__offline" role="status">You are offline. TT submission is blocked until the connection is restored.</p>}
        {submitMessage && <p className="cc-cust-payment-submit__success" role="status">{submitMessage}</p>}
        {submitError && <div className="cc-cust-payment-submit__error" role="alert"><p>{submitError}</p><button type="button" className="cc-cust-payments-retry" onClick={() => void handleSubmit(onSubmit)()}>Retry submission</button></div>}
        <div className="cc-cust-payment-submit__grid">
          <label>Invoice ID<input {...register('invoiceId')} placeholder="e.g. inv-003" aria-invalid={Boolean(errors.invoiceId)} />{errors.invoiceId && <span className="cc-cust-payment-field-error">{errors.invoiceId.message}</span>}</label>
          <label>Transfer reference<input {...register('reference')} placeholder="e.g. TT-2026-001" aria-invalid={Boolean(errors.reference)} />{errors.reference && <span className="cc-cust-payment-field-error">{errors.reference.message}</span>}</label>
          <label>Bank name<input {...register('bankName')} placeholder="Sending bank" aria-invalid={Boolean(errors.bankName)} />{errors.bankName && <span className="cc-cust-payment-field-error">{errors.bankName.message}</span>}</label>
          <label>Currency<select {...register('currency')}><option value="USD">USD</option></select>{errors.currency && <span className="cc-cust-payment-field-error">{errors.currency.message}</span>}</label>
          <label>Amount (USD)<input {...register('amountUsd')} type="number" min="0.01" step="0.01" inputMode="decimal" aria-invalid={Boolean(errors.amountUsd)} />{errors.amountUsd && <span className="cc-cust-payment-field-error">{errors.amountUsd.message}</span>}</label>
          <label>Transfer date<input {...register('paymentDate')} type="date" aria-invalid={Boolean(errors.paymentDate)} />{errors.paymentDate && <span className="cc-cust-payment-field-error">{errors.paymentDate.message}</span>}</label>
          <label className="cc-cust-payment-submit__wide">Remarks<textarea {...register('remarks')} rows={3} placeholder="Optional context for Finance" aria-invalid={Boolean(errors.remarks)} />{errors.remarks && <span className="cc-cust-payment-field-error">{errors.remarks.message}</span>}</label>
          <label className="cc-cust-payment-submit__wide">Proof metadata (PDF, JPG or PNG; max {MAX_PAYMENT_PROOF_BYTES / (1024 * 1024)} MB)<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleProofChange} aria-invalid={Boolean(errors.proof)} />{proofFile && <span className="cc-cust-payment-file-meta">Selected metadata: {proofFile.name} · {Math.ceil(proofFile.size / 1024)} KB · scan pending</span>}{errors.proof && <span className="cc-cust-payment-field-error">{errors.proof.message?.toString() || 'Choose a valid proof file.'}</span>}</label>
        </div>
        <button className="cc-cust-payment-submit__button" type="submit" disabled={!online || createPayment.isPending}>{createPayment.isPending ? 'Submitting…' : 'Submit TT payment'}</button>
        <p className="cc-cust-payments-muted">Retrying uses the same idempotency key until the submission succeeds or you change the form.</p>
      </form>

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
              return <button type="button" key={payment.id} data-testid={`payment-card-${payment.id}`} className={`cc-cust-payment-card ${selected?.id === payment.id ? 'cc-cust-payment-card--selected' : ''}`} aria-pressed={selected?.id === payment.id} onClick={() => setSelectedId(payment.id)}>
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
            {selectedStatus === 'Held' && <div className="cc-cust-payment-resubmit"><p className="cc-cust-payments-muted">Correct the transfer evidence or details, then resubmit this held payment for Finance review.</p><button type="button" className="cc-cust-payments-retry" disabled={!online || resubmitPayment.isPending} onClick={() => void resubmitPayment.mutateAsync(selected.id)}>{resubmitPayment.isPending ? 'Resubmitting…' : 'Resubmit payment'}</button>{resubmitPayment.error && <p className="cc-cust-payment-submit__error" role="alert">{resubmitPayment.error.message}</p>}</div>}
            <h3>Notification history</h3>
            {selectedEvents.length > 0 ? <ol className="cc-cust-payment-events">{selectedEvents.map((event) => <li key={event.id}><strong>{event.event}</strong><span>{event.deliveryStatus} · {new Date(event.createdAt).toLocaleString()}</span></li>)}</ol> : <p className="cc-cust-payments-muted">No notification events recorded.</p>}
          </article>}
        </div>
      )}
    </section>
  );
};
