import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CreateCustomerPaymentRequest } from '@carchief/domain';
import {
  customerPaymentFormSchema,
  MAX_PAYMENT_PROOF_BYTES,
  type CustomerPaymentFormInput,
  type CustomerPaymentFormValues,
} from '@carchief/validation';
import { useCreateCustomerPayment } from '../useCreateCustomerPayment.js';
import { useCustomerOnlineStatus } from '../../pwa/useCustomerOnlineStatus.js';
import { CloseIcon, PaperPlaneIcon } from '../../../components/Icons.js';

function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'key-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
}

export interface SubmitWireProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubmitWireProofModal: React.FC<SubmitWireProofModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const online = useCustomerOnlineStatus();
  const createPayment = useCreateCustomerPayment();

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
      idempotencyKey: safeRandomUUID(),
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

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
        : 'PDF';
    setValue(
      'proof',
      fileType
        ? { fileName: file.name, fileType, sizeBytes: file.size, scanStatus: 'Pending' }
        : { fileName: file.name, fileType: 'PDF', sizeBytes: MAX_PAYMENT_PROOF_BYTES + 1, scanStatus: 'Pending' },
      { shouldValidate: true }
    );
  };

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
        idempotencyKey: safeRandomUUID(),
      });

      setTimeout(() => {
        setSubmitMessage(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Payment submission failed. Please retry.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="cc-remit-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remit-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
            onClick={onClose}
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
  );
};
