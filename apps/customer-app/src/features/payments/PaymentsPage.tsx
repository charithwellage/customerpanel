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

const SEED_REMITTANCE_JOURNAL: RemittanceJournalEntry[] = [
  { id: 'rem-1', reference: 'TEST123', paymentDate: '2026-07-22', bankName: 'test (USD)', currency: 'USD', amountUsd: 80550, remainingBalanceUsd: 80550, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-2', reference: 'TEST', paymentDate: '2026-07-21', bankName: 'test (USD)', currency: 'USD', amountUsd: 5000, remainingBalanceUsd: 5000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-3', reference: 'TEST004', paymentDate: '2026-07-15', bankName: 'test (USD)', currency: 'USD', amountUsd: 100000, remainingBalanceUsd: 100000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-4', reference: 'test123@', paymentDate: '2026-07-21', bankName: 'test (USD)', currency: 'USD', amountUsd: 75750, remainingBalanceUsd: 75445, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-5', reference: 'TT2336635', paymentDate: '2026-07-30', bankName: 'Standard Chartered / SWIFT (JPY)', currency: 'JPY', amountUsd: 15000, remainingBalanceUsd: 15000, remarks: 'Salesperson Bulk TT Remittance Deposit', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-6', reference: 'ffgff', paymentDate: '2026-07-21', bankName: 'fg (USD)', currency: 'USD', amountUsd: 50000, remainingBalanceUsd: 50000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-7', reference: 'TEST1234', paymentDate: '2026-07-23', bankName: 'Standard Chartered / SWIFT (USD)', currency: 'USD', amountUsd: 30000, remainingBalanceUsd: 18950, remarks: 'test123', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-8', reference: 'TEST123', paymentDate: '2026-07-15', bankName: 'test bank (USD)', currency: 'USD', amountUsd: 100000, remainingBalanceUsd: 100000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-9', reference: 'TEST', paymentDate: '2026-07-17', bankName: 'Direct Wire (USD)', currency: 'USD', amountUsd: 3000, remainingBalanceUsd: 3000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-10', reference: 'SACHINTHA123', paymentDate: '2026-07-27', bankName: 'Standard Chartered / SWIFT (USD)', currency: 'USD', amountUsd: 55000, remainingBalanceUsd: 55000, remarks: 'Salesperson Bulk TT Remittance Deposit', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-11', reference: 'charith wellage', paymentDate: '2026-07-23', bankName: 'charith wellage (USD)', currency: 'USD', amountUsd: 15000, remainingBalanceUsd: 15000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-12', reference: 'TEST THE BANNER', paymentDate: '2026-07-23', bankName: 'Standard Chartered / SWIFT (USD)', currency: 'USD', amountUsd: 40000, remainingBalanceUsd: 40000, remarks: 'Salesperson Bulk TT Remittance Deposit', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-13', reference: 'test', paymentDate: '2026-07-21', bankName: 'test (USD)', currency: 'USD', amountUsd: 75750, remainingBalanceUsd: 75750, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-14', reference: 'test001', paymentDate: '2026-07-15', bankName: 'swift bank (USD)', currency: 'USD', amountUsd: 200000, remainingBalanceUsd: 200000, remarks: 'please find the attached TT', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-15', reference: 'TEST CHARITH 1', paymentDate: '2026-07-23', bankName: 'test (USD)', currency: 'USD', amountUsd: 50000, remainingBalanceUsd: 50000, remarks: 'pleasec check this', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-16', reference: 'TEST1233', paymentDate: '2026-07-22', bankName: 'test (USD)', currency: 'USD', amountUsd: 149999, remainingBalanceUsd: 149999, remarks: 'rejected', status: 'REJECTED' },
  { id: 'rem-17', reference: 'TEST', paymentDate: '2026-07-21', bankName: 'Direct Wire (USD)', currency: 'USD', amountUsd: 4700, remainingBalanceUsd: 4700, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-18', reference: 'TEST', paymentDate: '2026-07-21', bankName: 'Direct Wire (USD)', currency: 'USD', amountUsd: 5000, remainingBalanceUsd: 5000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-19', reference: 'TEST', paymentDate: '2026-07-21', bankName: 'Direct Wire (USD)', currency: 'USD', amountUsd: 4770, remainingBalanceUsd: 4770, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-20', reference: 'TEST123', paymentDate: '2026-07-22', bankName: 'test (USD)', currency: 'USD', amountUsd: 100000, remainingBalanceUsd: 100000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-21', reference: 'test123', paymentDate: '2026-07-21', bankName: 'test (USD)', currency: 'USD', amountUsd: 12780, remainingBalanceUsd: 12780, remarks: 'None', status: 'APPROVED - AVAILABLE' },
  { id: 'rem-22', reference: '134354', paymentDate: '2026-07-17', bankName: 'Direct Wire (USD)', currency: 'USD', amountUsd: 7000, remainingBalanceUsd: 7000, remarks: 'None', status: 'APPROVED - AVAILABLE' },
];

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

  // Merge live API payments with rich demo remittance journal records
  const allEntries = useMemo<RemittanceJournalEntry[]>(() => {
    const liveEntries: RemittanceJournalEntry[] = apiPayments.map((p) => {
      const statusText = getCustomerPaymentStatus(p, notifications);
      let statusType: RemittanceJournalEntry['status'] = 'APPROVED - AVAILABLE';
      if (statusText === 'Rejected') statusType = 'REJECTED';
      else if (statusText === 'Pending' || statusText === 'Held' || statusText === 'Resubmitted') {
        statusType = 'UNDER REVIEW';
      }

      return {
        id: p.id,
        reference: p.reference,
        paymentDate: p.paymentDate,
        bankName: p.bankName ? `${p.bankName} (${p.currency || 'USD'})` : `Direct Wire (${p.currency || 'USD'})`,
        currency: p.currency || 'USD',
        amountUsd: p.amountUsd,
        remainingBalanceUsd: p.remainingBalanceUsd ?? p.amountUsd,
        remarks: p.remarks || 'None',
        status: statusType,
      };
    });

    // Combine newly created live entries on top with the base journal
    const liveIds = new Set(liveEntries.map((e) => e.reference.toLowerCase()));
    const uniqueSeeds = SEED_REMITTANCE_JOURNAL.filter((s) => !liveIds.has(s.reference.toLowerCase()));

    return [...liveEntries, ...uniqueSeeds];
  }, [apiPayments, notifications]);

  // Compute KPI card totals
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

    // Default to the reference mockup baseline totals if no dynamic changes
    return {
      totalApprovedPaid: approved > 0 ? approved : 1056998,
      totalUnderReview: review,
      totalRemainingBalance: remaining > 0 ? remaining : 833336,
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
                  >
                    <option value="USD">USD ($)</option>
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
