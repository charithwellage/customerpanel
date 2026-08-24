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
import { PaymentDetailModal, type PaymentDetailRecord } from './components/PaymentDetailModal.js';
import { PaymentAllocationHistoryModal } from './components/PaymentAllocationHistoryModal.js';
import {
  CheckmarkCircleIcon,
  ClockCircleIcon,
  DollarCircleIcon,
  PlusIcon,
  CloseIcon,
  PaperPlaneIcon,
  SearchGlassIcon,
} from '../../components/Icons.js';

export interface RemittanceJournalEntry {
  id: string;
  reference: string;
  paymentDate: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  remainingBalanceUsd: number;
  allocatedAmountUsd: number;
  depositorName: string;
  customerName: string;
  approvedDate?: string;
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
  const { setActiveRoute, user } = useCustomerShell();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modals state (FRD 5.7 & 5.8)
  const [selectedDetailPayment, setSelectedDetailPayment] = useState<PaymentDetailRecord | null>(null);
  const [selectedHistoryRef, setSelectedHistoryRef] = useState<string | null>(null);

  // Filters state (FRD 5.3)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 10;

  const online = useCustomerOnlineStatus();
  const createPayment = useCreateCustomerPayment();
  const paymentsQuery = useCustomerPayments();
  const notificationsQuery = useCustomerPaymentNotifications();

  const apiPayments = paymentsQuery.data?.items ?? [];
  const notifications = notificationsQuery.data?.items ?? [];

  useEffect(() => {
    setActiveRoute('/payments');
  }, [setActiveRoute]);

  // Map live payments from store and mock entries
  const allEntries = useMemo<RemittanceJournalEntry[]>(() => {
    const raw: RemittanceJournalEntry[] = [
      {
        id: 'tt-seed-1',
        reference: 'TT2400005',
        paymentDate: '2024-10-20',
        bankName: 'Mizuho Bank Tokyo (USD)',
        currency: 'USD',
        amountUsd: 100000,
        allocatedAmountUsd: 40000,
        remainingBalanceUsd: 60000,
        depositorName: 'Depositor1',
        customerName: user?.name || 'Charith Wellage',
        approvedDate: '2024-10-20',
        remarks: 'Main TT deposit',
        status: 'APPROVED - AVAILABLE',
      },
      {
        id: 'tt-seed-2',
        reference: 'TT2400003',
        paymentDate: '2024-10-20',
        bankName: 'MUFG Bank Japan (JPY)',
        currency: 'JPY',
        amountUsd: 4000000,
        allocatedAmountUsd: 0,
        remainingBalanceUsd: 4000000,
        depositorName: 'Depositor1',
        customerName: user?.name || 'Charith Wellage',
        approvedDate: '2024-10-20',
        remarks: 'On Hold verification',
        status: 'UNDER REVIEW',
      },
      {
        id: 'tt-seed-3',
        reference: 'TT2400001',
        paymentDate: '2024-10-19',
        bankName: 'Sumitomo Mitsui Banking (USD)',
        currency: 'USD',
        amountUsd: 70000,
        allocatedAmountUsd: 4000,
        remainingBalanceUsd: 66000,
        depositorName: 'Depositor2',
        customerName: user?.name || 'Charith Wellage',
        approvedDate: '2024-10-19',
        remarks: 'Pending swift validation',
        status: 'UNDER REVIEW',
      },
    ];

    if (apiPayments.length > 0) {
      apiPayments.forEach((p) => {
        if (!raw.some((r) => r.reference === p.reference)) {
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

          raw.unshift({
            id: p.id,
            reference: p.reference,
            paymentDate: p.paymentDate,
            bankName: p.bankName ? (p.bankName.includes('(') ? p.bankName : `${p.bankName} (${p.currency || 'USD'})`) : `Direct Wire (${p.currency || 'USD'})`,
            currency: p.currency || 'USD',
            amountUsd: p.amountUsd,
            allocatedAmountUsd: p.amountUsd - (p.remainingBalanceUsd ?? p.amountUsd),
            remainingBalanceUsd: p.remainingBalanceUsd ?? p.amountUsd,
            depositorName: user?.name || 'Charith Wellage',
            customerName: user?.name || 'Charith Wellage',
            approvedDate: p.paymentDate,
            remarks: p.remarks || 'None',
            status: statusType,
          });
        }
      });
    }

    return raw;
  }, [apiPayments, notifications, user?.name]);

  // Compute KPI totals (FRD 5.2)
  const { totalTtAmount, totalAllocatedAmount, totalAvailableAmount } = useMemo(() => {
    let tt = 0;
    let allocated = 0;
    let available = 0;

    for (const entry of allEntries) {
      tt += entry.amountUsd;
      allocated += entry.allocatedAmountUsd;
      if (entry.status === 'APPROVED - AVAILABLE') {
        available += entry.remainingBalanceUsd;
      }
    }

    return {
      totalTtAmount: tt,
      totalAllocatedAmount: allocated,
      totalAvailableAmount: available,
    };
  }, [allEntries]);

  // Filtered entries (FRD 5.3)
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const match =
          entry.reference.toLowerCase().includes(q) ||
          entry.bankName.toLowerCase().includes(q) ||
          entry.depositorName.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (currencyFilter !== 'ALL' && entry.currency !== currencyFilter) {
        return false;
      }

      if (approvalFilter !== 'ALL') {
        if (approvalFilter === 'APPROVED' && entry.status !== 'APPROVED - AVAILABLE') return false;
        if (approvalFilter === 'UNDER_REVIEW' && entry.status !== 'UNDER REVIEW') return false;
        if (approvalFilter === 'REJECTED' && entry.status !== 'REJECTED') return false;
      }

      return true;
    });
  }, [allEntries, searchKeyword, currencyFilter, approvalFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / paymentsPerPage));
  const paginatedEntries = useMemo(
    () => filteredEntries.slice((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage),
    [currentPage, filteredEntries]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, currencyFilter, approvalFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

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
      {/* Top Strip: 3 KPI Cards + 1 Action Button (FRD 5.2) */}
          <div className="cc-remit-top-strip">
            <div className="cc-remit-kpi-card cc-remit-kpi-card--approved">
              <div className="cc-remit-kpi-card__content">
                <span className="cc-remit-kpi-card__label">TOTAL TT AMOUNT</span>
                <span className="cc-remit-kpi-card__value cc-remit-kpi-card__value--green">
                  ${totalTtAmount.toLocaleString()}
                </span>
              </div>
              <div className="cc-remit-kpi-card__icon-badge cc-remit-kpi-card__icon-badge--green">
                <CheckmarkCircleIcon size={24} />
              </div>
            </div>

            <div className="cc-remit-kpi-card cc-remit-kpi-card--review">
              <div className="cc-remit-kpi-card__content">
                <span className="cc-remit-kpi-card__label">TOTAL ALLOCATED</span>
                <span className="cc-remit-kpi-card__value cc-remit-kpi-card__value--gold">
                  ${totalAllocatedAmount.toLocaleString()}
                </span>
              </div>
              <div className="cc-remit-kpi-card__icon-badge cc-remit-kpi-card__icon-badge--gold">
                <ClockCircleIcon size={24} />
              </div>
            </div>

            <div className="cc-remit-kpi-card cc-remit-kpi-card--balance">
              <div className="cc-remit-kpi-card__content">
                <span className="cc-remit-kpi-card__label">TOTAL AVAILABLE</span>
                <span className="cc-remit-kpi-card__value cc-remit-kpi-card__value--green">
                  ${totalAvailableAmount.toLocaleString()}
                </span>
              </div>
              <div className="cc-remit-kpi-card__icon-badge cc-remit-kpi-card__icon-badge--green">
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

          {/* Filter Toolbar (FRD 5.3) */}
          <div className="cc-remit-filter-bar">
            <div className="cc-remit-search-box">
              <SearchGlassIcon size={16} className="cc-remit-search-icon" />
              <input
                type="search"
                className="cc-remit-search-input"
                placeholder="Search TT ref nu, bank, depositor..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                data-testid="payments-search-input"
              />
            </div>

            <div className="cc-remit-filter-dropdowns">
              <select
                className="cc-remit-filter-select"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              >
                <option value="ALL">All Currencies</option>
                <option value="USD">USD</option>
                <option value="JPY">JPY</option>
                <option value="GBP">GBP</option>
              </select>

              <select
                className="cc-remit-filter-select"
                value={approvalFilter}
                onChange={(e) => setApprovalFilter(e.target.value)}
              >
                <option value="ALL">All Approval Status</option>
                <option value="APPROVED">Approved</option>
                <option value="UNDER_REVIEW">Under Review / On Hold</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Journal Table Title */}
          <div className="cc-remit-section-header">
            <h2 className="cc-remit-section-title">CUSTOMER TT REMITTANCE JOURNAL</h2>
          </div>

          {/* Main Journal Table (FRD 5.5, 5.7, 5.8) */}
          <div className="cc-remit-table-container" role="region" aria-label="Customer TT Remittance Journal">
            <table className="cc-remit-table">
              <thead>
                <tr>
                  <th scope="col">ACTION</th>
                  <th scope="col">TT REF NU</th>
                  <th scope="col">DEPOSITOR</th>
                  <th scope="col">CURRENCY</th>
                  <th scope="col">TT AMOUNT</th>
                  <th scope="col">ALLOCATED</th>
                  <th scope="col">BALANCE</th>
                  <th scope="col">APPROVAL</th>
                  <th scope="col">APPROVED DATE</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry) => {
                  const statusClass =
                    entry.status === 'APPROVED - AVAILABLE'
                      ? 'cc-remit-status--approved'
                      : entry.status === 'REJECTED'
                        ? 'cc-remit-status--rejected'
                        : 'cc-remit-status--review';

                  return (
                    <tr key={entry.id}>
                      <td className="cc-remit-td--actions">
                        <div className="cc-remit-action-icons-row">
                          {/* Eye icon for Detailed View (FRD 5.7) */}
                          <button
                            type="button"
                            className="cc-remit-icon-btn"
                            onClick={() =>
                              setSelectedDetailPayment({
                                id: entry.id,
                                reference: entry.reference,
                                createdDate: entry.paymentDate,
                                receivingBank: entry.bankName,
                                depositorName: entry.depositorName,
                                customerName: entry.customerName,
                                currency: entry.currency,
                                ttAmount: entry.amountUsd,
                                approvedDate: entry.approvedDate,
                              })
                            }
                            title="Detailed View (Eye icon)"
                            data-testid={`btn-detail-${entry.reference}`}
                          >
                            👁️
                          </button>

                          {/* History icon for Allocation History (FRD 5.8) */}
                          <button
                            type="button"
                            className="cc-remit-icon-btn"
                            onClick={() => setSelectedHistoryRef(entry.reference)}
                            title="Allocation History"
                            data-testid={`btn-history-${entry.reference}`}
                          >
                            🕒
                          </button>
                        </div>
                      </td>
                      <td className="cc-remit-td--ref">
                        <span className="cc-remit-ref-text">{entry.reference}</span>
                      </td>
                      <td className="cc-remit-td--depositor">{entry.depositorName}</td>
                      <td className="cc-remit-td--currency cc-remit-td-mono">{entry.currency}</td>
                      <td className="cc-remit-td--amount cc-remit-td-mono cc-remit-td-bold">
                        ${entry.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td className="cc-remit-td--allocated cc-remit-td-mono">
                        ${entry.allocatedAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td className="cc-remit-td--remaining cc-remit-td-mono cc-remit-td-bold">
                        <span className="cc-remit-remaining-green">
                          ${entry.remainingBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="cc-remit-td--status">
                        <span className={`cc-remit-status-pill ${statusClass}`}>{entry.status}</span>
                      </td>
                      <td className="cc-remit-td--date cc-remit-td-mono">{entry.approvedDate || entry.paymentDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav className="cc-remit-pagination" aria-label="Payment journal pagination">
              <button
                type="button"
                className="cc-remit-pagination__button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="cc-remit-pagination__status" aria-live="polite">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="cc-remit-pagination__button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </nav>
          )}

          {/* Detailed View Modal (FRD 5.7) */}
          <PaymentDetailModal
            isOpen={selectedDetailPayment !== null}
            onClose={() => setSelectedDetailPayment(null)}
            payment={selectedDetailPayment}
          />

          {/* Allocation History Modal (FRD 5.8) */}
          <PaymentAllocationHistoryModal
            isOpen={selectedHistoryRef !== null}
            onClose={() => setSelectedHistoryRef(null)}
            reference={selectedHistoryRef || ''}
          />
      {/* Modal: UPLOAD CUSTOMER TT PROOF */}
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

            {!online && (
              <div className="cc-remit-alert cc-remit-alert--warning" role="status">
                You are offline. TT submission is blocked until the connection is restored.
              </div>
            )}

            {submitMessage && (
              <div className="cc-remit-alert cc-remit-alert--success" role="status">
                {submitMessage}
              </div>
            )}

            {submitError && (
              <div className="cc-remit-alert cc-remit-alert--error" role="alert">
                {submitError}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="cc-remit-form">
              <input type="hidden" {...register('invoiceId')} value="INV-GENERAL" />

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
