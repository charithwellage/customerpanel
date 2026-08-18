import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CustomerPayment, CustomerPaymentNotification, CreateCustomerPaymentRequest } from '@carchief/domain';
import {
  customerPaymentFormSchema,
  MAX_PAYMENT_PROOF_BYTES,
  type CustomerPaymentFormInput,
  type CustomerPaymentFormValues,
} from '@carchief/validation';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerPaymentNotifications, useCustomerPayments } from './useCustomerPayments.js';
import { useCreateCustomerPayment } from './useCreateCustomerPayment.js';
import { useCustomerOnlineStatus } from '../pwa/useCustomerOnlineStatus.js';
import {
  CheckmarkCircleIcon,
  ClockCircleIcon,
  DollarCircleIcon,
  PlusIcon,
  CloseIcon,
  PaperPlaneIcon,
} from '../../components/Icons.js';

export interface RemittanceJournalEntry {
  id: string;
  reference: string;
  paymentDate: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  remainingBalanceUsd: number;
  remarks?: string;
  status: 'APPROVED - AVAILABLE' | 'REJECTED' | 'UNDER REVIEW';
}



export function getCustomerPaymentStatus(
  payment: CustomerPayment,
  notifications: CustomerPaymentNotification[]
): string {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const online = useCustomerOnlineStatus();
  const createPayment = useCreateCustomerPayment();
  const paymentsQuery = useCustomerPayments();
  const notificationsQuery = useCustomerPaymentNotifications();

  const apiPayments = paymentsQuery.data?.items ?? [];
  const notifications = notificationsQuery.data?.items ?? [];

  useEffect(() => {
    setActiveRoute('/payments');
  }, [setActiveRoute]);

  // Map live PostgreSQL database payments
  const allEntries = useMemo<RemittanceJournalEntry[]>(() => {
    return apiPayments.map((p) => {
      const statusText = getCustomerPaymentStatus(p, notifications);
      let statusType: RemittanceJournalEntry['status'] = 'APPROVED - AVAILABLE';
      if (statusText === 'Rejected' || p.status === 'Rejected') {
        statusType = 'REJECTED';
      } else if (
        statusText === 'Pending' ||
        statusText === 'Held' ||
        statusText === 'Resubmitted' ||
        p.status === 'Pending' ||
        p.status === 'Held' ||
        p.status === 'Resubmitted'
      ) {
        statusType = 'UNDER REVIEW';
      }

      return {
        id: p.id,
        reference: p.reference,
        paymentDate: p.paymentDate,
        bankName: p.bankName ? (p.bankName.includes('(') ? p.bankName : `${p.bankName} (${p.currency || 'USD'})`) : `Direct Wire (${p.currency || 'USD'})`,
        currency: p.currency || 'USD',
        amountUsd: p.amountUsd,
        remainingBalanceUsd: p.remainingBalanceUsd ?? p.amountUsd,
        remarks: p.remarks || 'None',
        status: statusType,
      };
    });
  }, [apiPayments, notifications]);

  // Compute KPI card totals directly from database records
  const { totalApprovedPaid, totalUnderReview, totalRemainingBalance } = useMemo(() => {
    let approved = 0;
    let review = 0;
    let remaining = 0;

    for (const entry of allEntries) {
      if (entry.status === 'APPROVED - AVAILABLE') {
        approved += entry.amountUsd;
        remaining += entry.remainingBalanceUsd;
      } else if (entry.status === 'UNDER REVIEW') {
        review += entry.amountUsd;
      }
    }

    return {
      totalApprovedPaid: approved,
      totalUnderReview: review,
      totalRemainingBalance: remaining,
    };
  }, [allEntries]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerPaymentFormInput, unknown, CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentFormSchema),
    defaultValues: {
      invoiceId: 'INV-GENERAL',
      currency: 'USD',
      paymentDate: new Date().toISOString().slice(0, 10),
      remarks: '',
      proof: { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' },
      idempotencyKey: crypto.randomUUID(),
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: CustomerPaymentFormValues) => {
    setSubmitMessage(null);
    setSubmitError(null);
    try {
      const request: CreateCustomerPaymentRequest = {
        invoiceId: values.invoiceId?.trim() || 'INV-GENERAL',
        reference: values.reference.trim(),
        bankName: values.bankName.trim(),
        currency: values.currency,
        amountUsd: values.amountUsd,
        paymentDate: values.paymentDate,
        ...(values.remarks?.trim() ? { remarks: values.remarks.trim() } : {}),
        proof: values.proof,
        idempotencyKey: values.idempotencyKey,
      };

      const payment = await createPayment.mutateAsync(request);
      setSubmitMessage(`Payment ${payment.reference} submitted successfully for finance review!`);
      setProofFile(null);
      reset({
        invoiceId: 'INV-GENERAL',
        currency: 'USD',
        paymentDate: new Date().toISOString().slice(0, 10),
        remarks: '',
        proof: { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' },
        idempotencyKey: crypto.randomUUID(),
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitMessage(null);
      }, 1200);
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
    const fileType =
      extension === 'JPG' || extension === 'JPEG'
        ? 'JPG'
        : extension === 'PNG'
          ? 'PNG'
          : extension === 'PDF'
            ? 'PDF'
            : undefined;

    setValue(
      'proof',
      fileType
        ? { fileName: file.name, fileType, sizeBytes: file.size, scanStatus: 'Pending' }
        : { fileName: file.name, fileType: 'PDF', sizeBytes: MAX_PAYMENT_PROOF_BYTES + 1, scanStatus: 'Pending' },
      { shouldValidate: true }
    );
  };

  return (
    <section className="cc-cust-remittance-page" aria-label="Customer Wire Remittance" data-testid="customer-payments-page">
      {/* Top Strip: 3 KPI Cards + 1 Action Button */}
      <div className="cc-remit-top-strip">
        <div className="cc-remit-kpi-card cc-remit-kpi-card--approved">
          <div className="cc-remit-kpi-card__content">
            <span className="cc-remit-kpi-card__label">TOTAL APPROVED PAID</span>
            <span className="cc-remit-kpi-card__value cc-remit-kpi-card__value--green">
              ${totalApprovedPaid.toLocaleString()}
            </span>
          </div>
          <div className="cc-remit-kpi-card__icon-badge cc-remit-kpi-card__icon-badge--green">
            <CheckmarkCircleIcon size={24} />
          </div>
        </div>

        <div className="cc-remit-kpi-card cc-remit-kpi-card--review">
          <div className="cc-remit-kpi-card__content">
            <span className="cc-remit-kpi-card__label">UNDER REVIEW (WIRE)</span>
            <span className="cc-remit-kpi-card__value cc-remit-kpi-card__value--gold">
              ${totalUnderReview.toLocaleString()}
            </span>
          </div>
          <div className="cc-remit-kpi-card__icon-badge cc-remit-kpi-card__icon-badge--gold">
            <ClockCircleIcon size={24} />
          </div>
        </div>

        <div className="cc-remit-kpi-card cc-remit-kpi-card--balance">
          <div className="cc-remit-kpi-card__content">
            <span className="cc-remit-kpi-card__label">REMAINING BALANCE</span>
            <span className="cc-remit-kpi-card__value cc-remit-kpi-card__value--red">
              ${totalRemainingBalance.toLocaleString()}
            </span>
          </div>
          <div className="cc-remit-kpi-card__icon-badge cc-remit-kpi-card__icon-badge--red">
            <DollarCircleIcon size={24} />
          </div>
        </div>

        <div className="cc-remit-action-card">
          <button
            type="button"
            className="cc-remit-btn-submit-proof"
            onClick={() => setIsModalOpen(true)}
            data-testid="btn-submit-payment-proof"
          >
            <PlusIcon size={16} />
            <span>SUBMIT PAYMENT PROOF</span>
          </button>
        </div>
      </div>

      {/* Journal Table Title */}
      <div className="cc-remit-section-header">
        <h2 className="cc-remit-section-title">CUSTOMER TT REMITTANCE JOURNAL</h2>
      </div>

      {/* Main Journal Table */}
      <div className="cc-remit-table-container" role="region" aria-label="Customer TT Remittance Journal">
        <table className="cc-remit-table">
          <thead>
            <tr>
              <th scope="col">TT NUMBER / REF</th>
              <th scope="col">TT DATE</th>
              <th scope="col">BANK &amp; CURRENCY</th>
              <th scope="col">ORIGINAL AMOUNT</th>
              <th scope="col">REMAINING BALANCE</th>
              <th scope="col">REMARKS</th>
              <th scope="col">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {allEntries.map((entry) => {
              const statusClass =
                entry.status === 'APPROVED - AVAILABLE'
                  ? 'cc-remit-status--approved'
                  : entry.status === 'REJECTED'
                    ? 'cc-remit-status--rejected'
                    : 'cc-remit-status--review';

              return (
                <tr key={entry.id}>
                  <td className="cc-remit-td--ref">
                    <span className="cc-remit-ref-text">{entry.reference}</span>
                  </td>
                  <td className="cc-remit-td--date">{entry.paymentDate}</td>
                  <td className="cc-remit-td--bank">{entry.bankName}</td>
                  <td className="cc-remit-td--amount">
                    <strong>
                      {entry.currency} {entry.amountUsd.toLocaleString()}
                    </strong>
                  </td>
                  <td className="cc-remit-td--remaining">
                    <span className="cc-remit-remaining-green">
                      {entry.currency} {entry.remainingBalanceUsd.toLocaleString()}
                    </span>
                  </td>
                  <td className="cc-remit-td--remarks">
                    <span className="cc-remit-remarks-text">{entry.remarks || 'None'}</span>
                  </td>
                  <td className="cc-remit-td--status">
                    <span className={`cc-remit-status-pill ${statusClass}`}>{entry.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: UPLOAD CUSTOMER TT PROOF (Image 2) */}
      {isModalOpen && (
        <div
          className="cc-remit-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remit-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="cc-remit-modal-card">
            {/* Modal Header */}
            <div className="cc-remit-modal-header">
              <div className="cc-remit-modal-tag">
                <span className="cc-remit-modal-tag__icon" aria-hidden="true">🏛️</span>
                <span>TT REMITTANCE CREATION</span>
              </div>
              <button
                type="button"
                className="cc-remit-modal-close"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <h3 id="remit-modal-title" className="cc-remit-modal-title">
              UPLOAD CUSTOMER TT PROOF
            </h3>
            <p className="cc-remit-modal-subtitle">
              Submit wire transfer details. Finance will verify and approve for invoice allocation.
            </p>

            {/* Offline Alert */}
            {!online && (
              <div className="cc-remit-alert cc-remit-alert--warning" role="status">
                You are offline. TT submission is blocked until the connection is restored.
              </div>
            )}

            {/* Success Alert */}
            {submitMessage && (
              <div className="cc-remit-alert cc-remit-alert--success" role="status">
                {submitMessage}
              </div>
            )}

            {/* Error Alert */}
            {submitError && (
              <div className="cc-remit-alert cc-remit-alert--error" role="alert">
                {submitError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="cc-remit-form">
              {/* Hidden Invoice ID to satisfy schema */}
              <input type="hidden" {...register('invoiceId')} value="INV-GENERAL" />

              {/* Row 1: 2 Columns */}
              <div className="cc-remit-form-row cc-remit-form-row--2col">
                <div className="cc-remit-form-field">
                  <label htmlFor="remit-ref-input" className="cc-remit-form-label">
                    TT NUMBER / SWIFT REF *
                  </label>
                  <input
                    id="remit-ref-input"
                    className="cc-remit-form-input"
                    placeholder="e.g. TT-984021-SW"
                    {...register('reference')}
                    aria-invalid={Boolean(errors.reference)}
                  />
                  {errors.reference && (
                    <span className="cc-remit-field-error">{errors.reference.message}</span>
                  )}
                </div>

                <div className="cc-remit-form-field">
                  <label htmlFor="remit-bank-input" className="cc-remit-form-label">
                    REMITTING BANK *
                  </label>
                  <input
                    id="remit-bank-input"
                    className="cc-remit-form-input"
                    placeholder="e.g. Barclays Bank"
                    {...register('bankName')}
                    aria-invalid={Boolean(errors.bankName)}
                  />
                  {errors.bankName && (
                    <span className="cc-remit-field-error">{errors.bankName.message}</span>
                  )}
                </div>
              </div>

              {/* Row 2: 3 Columns */}
              <div className="cc-remit-form-row cc-remit-form-row--3col">
                <div className="cc-remit-form-field">
                  <label htmlFor="remit-currency-select" className="cc-remit-form-label">
                    TT CURRENCY *
                  </label>
                  <select
                    id="remit-currency-select"
                    className="cc-remit-form-select"
                    {...register('currency')}
                    data-testid="remit-currency-select"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="KES">KES (KSh) - Kenyan Shilling</option>
                    <option value="AED">AED (AED) - UAE Dirham</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                    <option value="NZD">NZD (NZ$) - New Zealand Dollar</option>
                    <option value="SGD">SGD (S$) - Singapore Dollar</option>
                  </select>
                </div>

                <div className="cc-remit-form-field">
                  <label htmlFor="remit-amount-input" className="cc-remit-form-label">
                    ORIGINAL AMOUNT *
                  </label>
                  <input
                    id="remit-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="cc-remit-form-input"
                    placeholder="e.g. 15000.00"
                    {...register('amountUsd')}
                    aria-invalid={Boolean(errors.amountUsd)}
                  />
                  {errors.amountUsd && (
                    <span className="cc-remit-field-error">{errors.amountUsd.message}</span>
                  )}
                </div>

                <div className="cc-remit-form-field">
                  <label htmlFor="remit-date-input" className="cc-remit-form-label">
                    TT DATE *
                  </label>
                  <input
                    id="remit-date-input"
                    type="date"
                    className="cc-remit-form-input"
                    {...register('paymentDate')}
                    aria-invalid={Boolean(errors.paymentDate)}
                  />
                  {errors.paymentDate && (
                    <span className="cc-remit-field-error">{errors.paymentDate.message}</span>
                  )}
                </div>
              </div>

              {/* Row 3: Attachment */}
              <div className="cc-remit-form-field cc-remit-form-field--full">
                <label htmlFor="remit-proof-input" className="cc-remit-form-label">
                  TT COPY ATTACHMENT (PDF / IMAGE)
                </label>
                <div className="cc-remit-file-upload-box">
                  <input
                    id="remit-proof-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleProofChange}
                    className="cc-remit-file-native-input"
                  />
                </div>
                {proofFile && (
                  <span className="cc-remit-file-selected-info">
                    Selected: {proofFile.name} ({Math.ceil(proofFile.size / 1024)} KB)
                  </span>
                )}
                {errors.proof && (
                  <span className="cc-remit-field-error">
                    {errors.proof.message?.toString() || 'Please choose a valid TT proof file.'}
                  </span>
                )}
              </div>

              {/* Row 4: Remarks */}
              <div className="cc-remit-form-field cc-remit-form-field--full">
                <label htmlFor="remit-remarks-input" className="cc-remit-form-label">
                  REMARKS (OPTIONAL)
                </label>
                <textarea
                  id="remit-remarks-input"
                  rows={3}
                  className="cc-remit-form-textarea"
                  placeholder="e.g. Wire transfer deposit for future vehicle allocation."
                  {...register('remarks')}
                  aria-invalid={Boolean(errors.remarks)}
                />
                {errors.remarks && (
                  <span className="cc-remit-field-error">{errors.remarks.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="cc-remit-modal-submit-btn"
                disabled={!online || createPayment.isPending}
              >
                <span>{createPayment.isPending ? 'SUBMITTING...' : 'SUBMIT TT FOR FINANCE APPROVAL'}</span>
                <PaperPlaneIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
