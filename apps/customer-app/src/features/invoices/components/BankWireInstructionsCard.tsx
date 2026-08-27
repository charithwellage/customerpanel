import React, { useState } from 'react';
import type { CustomerInvoiceBankDetails } from '@carchief/domain';
import { formatUsdAmount } from '../formatters.js';

export interface BankWireInstructionsCardProps {
  bankDetails?: CustomerInvoiceBankDetails;
  referenceFallback?: string;
  depositRequiredUsd?: number;
  isProforma?: boolean;
}

export const BankWireInstructionsCard: React.FC<BankWireInstructionsCardProps> = ({
  bankDetails,
  referenceFallback,
  depositRequiredUsd,
  isProforma,
}) => {
  const [copied, setCopied] = useState(false);

  if (!bankDetails) {
    return (
      <div className="cc-bank-wire-card cc-bank-wire-card--unavailable" data-testid="bank-wire-instructions-card">
        <div className="cc-bank-wire-card__header">
          <div className="cc-bank-wire-card__title-wrap">
            <span className="cc-bank-wire-card__icon" aria-hidden="true">🏦</span>
            <h3 className="cc-bank-wire-card__title">Bank Wire Transfer (T/T) Instructions</h3>
          </div>
          <span className="cc-bank-wire-card__badge">Pending Finance confirmation</span>
        </div>
        <p className="cc-bank-wire-card__unavailable" role="status">
          Bank instructions are unavailable pending Finance confirmation. No payment account details have been published for this invoice yet.
        </p>
      </div>
    );
  }

  const reference = bankDetails.reference || referenceFallback || 'INVOICE-REF';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="cc-bank-wire-card" data-testid="bank-wire-instructions-card">
      <div className="cc-bank-wire-card__header">
        <div className="cc-bank-wire-card__title-wrap">
          <span className="cc-bank-wire-card__icon" aria-hidden="true">🏦</span>
          <h3 className="cc-bank-wire-card__title">Bank Wire Transfer (T/T) Instructions</h3>
        </div>
        <span className="cc-bank-wire-card__badge">Official Bank Account</span>
      </div>

      <p className="cc-bank-wire-card__desc">
        Please instruct your remitting bank to transfer funds via Telegraphic Transfer (T/T) to CarChief International Co., Ltd. using the exact reference below:
      </p>

      {/* Reference highlight box */}
      <div className="cc-bank-wire-card__ref-box" data-testid="wire-reference-box">
        <div className="cc-bank-wire-card__ref-info">
          <span className="cc-bank-wire-card__ref-label">Mandatory Payment Reference:</span>
          <strong className="cc-bank-wire-card__ref-code" data-testid="wire-ref-code">{reference}</strong>
        </div>
        <button
          type="button"
          className="cc-bank-wire-card__copy-btn"
          data-testid="copy-reference-btn"
          onClick={handleCopy}
          aria-label={`Copy reference ${reference}`}
        >
          {copied ? '✓ Copied!' : 'Copy Reference'}
        </button>
      </div>

      {isProforma && depositRequiredUsd !== undefined && (
        <div className="cc-bank-wire-card__deposit-notice" data-testid="pi-deposit-notice">
          <span className="cc-bank-wire-card__notice-icon">ℹ️</span>
          <div>
            <strong>Minimum Deposit Required: </strong>
            <span>
              {formatUsdAmount(depositRequiredUsd)} USD must be received within 72 hours to confirm vehicle reservation.
            </span>
          </div>
        </div>
      )}

      {/* Bank Details Table */}
      <dl className="cc-bank-wire-card__grid">
        <div className="cc-bank-wire-card__row">
          <dt className="cc-bank-wire-card__dt">Beneficiary Bank:</dt>
          <dd className="cc-bank-wire-card__dd">{bankDetails.bankName}</dd>
        </div>

        <div className="cc-bank-wire-card__row">
          <dt className="cc-bank-wire-card__dt">SWIFT / BIC Code:</dt>
          <dd className="cc-bank-wire-card__dd">
            <strong className="cc-bank-wire-card__swift">{bankDetails.swiftCode}</strong>
          </dd>
        </div>

        <div className="cc-bank-wire-card__row">
          <dt className="cc-bank-wire-card__dt">Account Name:</dt>
          <dd className="cc-bank-wire-card__dd">{bankDetails.accountName}</dd>
        </div>

        <div className="cc-bank-wire-card__row">
          <dt className="cc-bank-wire-card__dt">Account Number:</dt>
          <dd className="cc-bank-wire-card__dd">
            <strong>{bankDetails.accountNumber}</strong>
          </dd>
        </div>

        {bankDetails.branchName && (
          <div className="cc-bank-wire-card__row">
            <dt className="cc-bank-wire-card__dt">Branch Name:</dt>
            <dd className="cc-bank-wire-card__dd">{bankDetails.branchName}</dd>
          </div>
        )}

        {bankDetails.bankAddress && (
          <div className="cc-bank-wire-card__row">
            <dt className="cc-bank-wire-card__dt">Bank Address:</dt>
            <dd className="cc-bank-wire-card__dd">{bankDetails.bankAddress}</dd>
          </div>
        )}
      </dl>

      <div className="cc-bank-wire-card__footer-notes">
        <p>• All bank remittance fees (intermediary and receiving charges) must be borne by the remitter (OUR).</p>
        <p>• Please upload your TT wire transfer copy in the Payments section once payment is initiated.</p>
      </div>
    </div>
  );
};
