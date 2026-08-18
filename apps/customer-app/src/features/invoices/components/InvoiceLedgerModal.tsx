import React, { useEffect } from 'react';
import { BrandBuildingIcon } from '../../../components/Icons.js';
import type { InvoicedLedgerEntry, InvoicedVehicleItem } from '../CustomerInvoicesPage.js';

export interface InvoiceLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ledgerEntry: InvoicedLedgerEntry | null;
  clientName?: string;
  clientCompany?: string;
  clientAddress?: string;
  clientPhone?: string;
  vehicles?: InvoicedVehicleItem[];
}

export const InvoiceLedgerModal: React.FC<InvoiceLedgerModalProps> = ({
  isOpen,
  onClose,
  ledgerEntry,
  clientName = 'Charith Wellage',
  clientCompany = 'charith wellage',
  clientAddress = 'gampaha, sri lanka, Kenya',
  clientPhone = '+94715991619',
  vehicles = [],
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ledgerEntry) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob(
      [
        `CAR CHIEF CO., LTD.\n` +
          `INVOICE: ${ledgerEntry.invoiceNumber}\n` +
          `TYPE: ${ledgerEntry.type}\n` +
          `DATE: ${ledgerEntry.issueDate}\n` +
          `DUE DATE: ${ledgerEntry.dueDate}\n` +
          `CLIENT: ${clientName}\n` +
          `TOTAL AMOUNT: $${ledgerEntry.totalAmountUsd.toLocaleString()}\n`
      ],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = `${ledgerEntry.invoiceNumber}-ledger.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // If vehicle list is provided, use it; otherwise provide a mapped fallback line item
  const displayVehicles =
    vehicles.length > 0
      ? vehicles
      : [
          {
            id: 'veh-single-1',
            stockNumber: 'STK: ' + ledgerEntry.invoiceNumber,
            chassisNumber: 'CHASSIS: ' + ledgerEntry.invoiceNumber + '-001',
            title: 'SOURCED VEHICLE SHIPMENT',
            engine: '2000cc',
            vesselVoyage: 'TBD',
            destinationPort: 'Mombasa',
            soldAmountUsd: ledgerEntry.totalAmountUsd,
            paidAmountUsd: ledgerEntry.paidAmountUsd,
            balanceAmountUsd: ledgerEntry.outstandingAmountUsd,
            imageUrl: '',
          },
        ];

  return (
    <div
      className="cc-ledger-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ledger-modal-title"
      data-testid="invoice-ledger-modal"
    >
      <div className="cc-ledger-modal-backdrop" onClick={onClose} />
      <div className="cc-ledger-modal-dialog">
        {/* Top Modal Header */}
        <div className="cc-ledger-modal-header">
          <div className="cc-ledger-modal-header__left">
            <BrandBuildingIcon size={20} className="cc-ledger-brand-icon" />
            <span id="ledger-modal-title" className="cc-ledger-header-title">
              CAR CHIEF ACCOUNTS DEPT
            </span>
          </div>

          <div className="cc-ledger-modal-header__actions">
            <button
              type="button"
              className="cc-ledger-action-btn"
              onClick={handlePrint}
              aria-label="Print Document"
              title="Print Document"
              data-testid="ledger-print-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>

            <button
              type="button"
              className="cc-ledger-action-btn"
              onClick={handleDownload}
              aria-label="Download Document"
              title="Download Document"
              data-testid="ledger-download-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>

            <button
              type="button"
              className="cc-ledger-action-btn"
              onClick={onClose}
              aria-label="Close Modal"
              title="Close Modal"
              data-testid="ledger-close-btn"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Inner Document Sheet */}
        <div className="cc-ledger-sheet">
          {/* Company & Document Header Row */}
          <div className="cc-ledger-sheet__header">
            <div className="cc-ledger-sheet__company">
              <h1 className="cc-ledger-sheet__brand">
                CAR<span className="cc-ledger-sheet__brand-accent">CHIEF</span> CO., LTD.
              </h1>
              <p className="cc-ledger-sheet__corp-line">Prestige Vehicle Exporters</p>
              <p className="cc-ledger-sheet__corp-line">Tokyo Corporate Head Office</p>
              <p className="cc-ledger-sheet__corp-line">Minato-ku, Tokyo, Japan</p>
            </div>

            <div className="cc-ledger-sheet__meta">
              <span className="cc-ledger-sheet__doc-badge">
                {ledgerEntry.type === 'PROFORMA' ? 'PROFORMA INVOICE' : 'COMMERCIAL INVOICE'}
              </span>
              <div className="cc-ledger-sheet__doc-number">{ledgerEntry.invoiceNumber}</div>
              <div className="cc-ledger-sheet__doc-date">Date: {ledgerEntry.issueDate}</div>
            </div>
          </div>

          {/* Consignee / Client & Payment Schedule */}
          <div className="cc-ledger-sheet__parties">
            <div className="cc-ledger-sheet__consignee">
              <span className="cc-ledger-sheet__section-label">CONSIGNEE / CLIENT:</span>
              <div className="cc-ledger-sheet__client-name">{clientName}</div>
              <div className="cc-ledger-sheet__client-company">{clientCompany}</div>
              <div className="cc-ledger-sheet__client-address">{clientAddress}</div>
              <div className="cc-ledger-sheet__client-contact">Contact: {clientPhone}</div>
            </div>

            <div className="cc-ledger-sheet__schedule">
              <span className="cc-ledger-sheet__section-label">PAYMENT SCHEDULE:</span>
              <div className="cc-ledger-sheet__sched-row">
                <span className="cc-ledger-sheet__sched-label">Due Date:</span>
                <span className="cc-ledger-sheet__sched-val cc-ledger-sheet__sched-val--due">
                  {ledgerEntry.dueDate}
                </span>
              </div>
              <div className="cc-ledger-sheet__sched-row">
                <span className="cc-ledger-sheet__sched-label">Terms:</span>
                <span className="cc-ledger-sheet__sched-val">Net 30</span>
              </div>
              <div className="cc-ledger-sheet__sched-row">
                <span className="cc-ledger-sheet__sched-label">Currency:</span>
                <span className="cc-ledger-sheet__sched-val">USD</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="cc-ledger-sheet__items-table-wrap">
            <table className="cc-ledger-sheet__table">
              <thead>
                <tr>
                  <th scope="col" className="cc-ledger-th--desc">
                    SOURCING DESCRIPTION &amp; VEHICLE IDENTIFICATION
                  </th>
                  <th scope="col" className="cc-ledger-th--qty">
                    QTY
                  </th>
                  <th scope="col" className="cc-ledger-th--price">
                    UNIT PRICE
                  </th>
                  <th scope="col" className="cc-ledger-th--amount">
                    TOTAL AMOUNT
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayVehicles.map((veh) => {
                  const stockFormatted = veh.stockNumber.replace(/^STK:\s*/i, '');
                  const chassisFormatted = veh.chassisNumber.replace(/^CHASSIS:\s*/i, '');

                  return (
                    <tr key={veh.id} className="cc-ledger-tr">
                      <td className="cc-ledger-td--desc">
                        <div className="cc-ledger-item__title">{veh.title}</div>
                        <div className="cc-ledger-item__sub">
                          Chassis No: {chassisFormatted} | Stock ID: {stockFormatted} | Engine: {veh.engine}
                        </div>
                      </td>
                      <td className="cc-ledger-td--qty">1</td>
                      <td className="cc-ledger-td--price">
                        ${veh.soldAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="cc-ledger-td--amount">
                        ${veh.soldAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Financial Summary Calculation (Gross subtotal, Deposit Received, Balance Due) */}
          <div className="cc-ledger-sheet__summary-wrap">
            <div className="cc-ledger-sheet__summary">
              <div className="cc-ledger-sheet__summary-row">
                <span className="cc-ledger-sheet__summary-label">Gross subtotal:</span>
                <span className="cc-ledger-sheet__summary-val">
                  ${ledgerEntry.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cc-ledger-sheet__summary-row cc-ledger-sheet__summary-row--deposit">
                <span className="cc-ledger-sheet__summary-label">Deposit Received:</span>
                <span className="cc-ledger-sheet__summary-val cc-ledger-sheet__summary-val--green">
                  -${ledgerEntry.paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cc-ledger-sheet__summary-divider" />
              <div className="cc-ledger-sheet__summary-row cc-ledger-sheet__summary-row--balance">
                <span className="cc-ledger-sheet__summary-label-balance">BALANCE DUE:</span>
                <span className="cc-ledger-sheet__summary-val-balance">
                  ${ledgerEntry.outstandingAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Telegraphic Bank Remittance Instructions */}
          <div className="cc-ledger-sheet__bank-box">
            <div className="cc-ledger-sheet__bank-title">TELEGRAPHIC BANK REMITTANCE INSTRUCTIONS:</div>
            <div className="cc-ledger-sheet__bank-grid">
              <div className="cc-ledger-sheet__bank-row">
                <span className="cc-ledger-sheet__bank-label">Beneficiary Bank:</span>
                <span className="cc-ledger-sheet__bank-val">SUMITOMO MITSUI BANKING CORP (SMBC) TOKYO</span>
              </div>
              <div className="cc-ledger-sheet__bank-row">
                <span className="cc-ledger-sheet__bank-label">SWIFT Identifier:</span>
                <span className="cc-ledger-sheet__bank-val">SMBCJPJTXXX</span>
              </div>
              <div className="cc-ledger-sheet__bank-row">
                <span className="cc-ledger-sheet__bank-label">Account Number:</span>
                <span className="cc-ledger-sheet__bank-val">882-11009382-USD</span>
              </div>
              <div className="cc-ledger-sheet__bank-row">
                <span className="cc-ledger-sheet__bank-label">Reference parameter:</span>
                <span className="cc-ledger-sheet__bank-val cc-ledger-sheet__bank-val--ref">
                  MUST REFERENCE {ledgerEntry.invoiceNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
