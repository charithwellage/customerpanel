import React from 'react';
import type { CustomerVehicleDepositInfo } from '@carchief/domain';

export interface DepositSummaryCardProps {
  totalAmountUsd: number;
  deposit?: CustomerVehicleDepositInfo;
  invoiceId?: string;
  proformaInvoiceId?: string;
  paymentDeadline?: string;
}

export const DepositSummaryCard: React.FC<DepositSummaryCardProps> = ({
  totalAmountUsd,
  deposit,
  invoiceId,
  proformaInvoiceId,
  paymentDeadline,
}) => {
  const paidPercent = totalAmountUsd > 0 && deposit
    ? Math.round((deposit.paidAmountUsd / totalAmountUsd) * 100)
    : 0;

  return (
    <div className="cc-cust-fleet-card cc-cust-fleet-deposit-card" aria-label="Financial and Deposit Summary">
      <h3 className="cc-cust-fleet-section-title">Financial & Deposit Summary</h3>

      <div className="cc-cust-fleet-deposit-card__stats">
        <div className="cc-cust-fleet-stat">
          <span className="cc-cust-fleet-stat__label">Total Vehicle Price</span>
          <span className="cc-cust-fleet-stat__value">${totalAmountUsd.toLocaleString()} USD</span>
        </div>

        {deposit ? (
          <>
            <div className="cc-cust-fleet-stat">
              <span className="cc-cust-fleet-stat__label">Required Deposit ({deposit.requiredPercent}%)</span>
              <span className="cc-cust-fleet-stat__value">${deposit.requiredAmountUsd.toLocaleString()} USD</span>
            </div>

            <div className="cc-cust-fleet-stat">
              <span className="cc-cust-fleet-stat__label">Paid Amount ({paidPercent}%)</span>
              <span className="cc-cust-fleet-stat__value cc-cust-fleet-stat__value--success">
                ${deposit.paidAmountUsd.toLocaleString()} USD
              </span>
            </div>

            <div className="cc-cust-fleet-stat">
              <span className="cc-cust-fleet-stat__label">Remaining Balance</span>
              <span className="cc-cust-fleet-stat__value cc-cust-fleet-stat__value--highlight">
                ${deposit.remainingAmountUsd.toLocaleString()} USD
              </span>
            </div>
          </>
        ) : (
          <div className="cc-cust-fleet-stat">
            <span className="cc-cust-fleet-stat__label">Deposit Requirement</span>
            <span className="cc-cust-fleet-stat__value">Pending Proforma Invoice</span>
          </div>
        )}
      </div>

      <div className="cc-cust-fleet-deposit-card__references">
        {proformaInvoiceId && (
          <div className="cc-cust-fleet-ref">
            <span className="cc-cust-fleet-ref__label">Proforma Invoice:</span>
            <span className="cc-cust-fleet-ref__code">{proformaInvoiceId.toUpperCase()}</span>
          </div>
        )}
        {invoiceId && (
          <div className="cc-cust-fleet-ref">
            <span className="cc-cust-fleet-ref__label">Commercial Invoice:</span>
            <span className="cc-cust-fleet-ref__code">{invoiceId.toUpperCase()}</span>
          </div>
        )}
        {paymentDeadline && (
          <div className="cc-cust-fleet-ref">
            <span className="cc-cust-fleet-ref__label">Payment Deadline:</span>
            <time className="cc-cust-fleet-ref__time" dateTime={paymentDeadline}>
              {new Date(paymentDeadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        )}
      </div>
    </div>
  );
};
