import React, { useState, useEffect, useRef } from 'react';
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

export type LedgerExportFormat = 'pdf' | 'csv' | 'txt' | 'json';

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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isExportMenuOpen) {
          setIsExportMenuOpen(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, isExportMenuOpen]);

  if (!isOpen || !ledgerEntry) return null;

  const handlePrint = () => {
    window.print();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportFormat = (format: LedgerExportFormat) => {
    setIsExportMenuOpen(false);

    if (format === 'pdf') {
      window.print();
      return;
    }

    if (format === 'csv') {
      const csvRows: string[] = [
        `"CAR CHIEF CO., LTD. - INVOICE LEDGER STATEMENT"`,
        `"Invoice Number","${ledgerEntry.invoiceNumber}"`,
        `"Document Type","${ledgerEntry.type}"`,
        `"Issue Date","${ledgerEntry.issueDate}"`,
        `"Due Date","${ledgerEntry.dueDate}"`,
        `"Consignee / Client","${clientName.replace(/"/g, '""')}"`,
        `"Company","${clientCompany.replace(/"/g, '""')}"`,
        `"Address","${clientAddress.replace(/"/g, '""')}"`,
        `"Contact","${clientPhone.replace(/"/g, '""')}"`,
        `""`,
        `"Line #","Vehicle Title","Chassis Number","Stock ID","Engine","Destination Port","Qty","Unit Price (USD)","Total Amount (USD)"`,
      ];

      displayVehicles.forEach((v, idx) => {
        const stockFormatted = v.stockNumber.replace(/^STK:\s*/i, '');
        const chassisFormatted = v.chassisNumber.replace(/^CHASSIS:\s*/i, '');
        csvRows.push(
          `"${idx + 1}","${v.title.replace(/"/g, '""')}","${chassisFormatted.replace(/"/g, '""')}","${stockFormatted.replace(/"/g, '""')}","${v.engine}","${v.destinationPort}",1,${v.soldAmountUsd},${v.soldAmountUsd}`
        );
      });

      csvRows.push(`""`);
      csvRows.push(`"Gross Subtotal (USD)",,,,,,,${ledgerEntry.totalAmountUsd}`);
      csvRows.push(`"Deposit Received (USD)",,,,,,,${ledgerEntry.paidAmountUsd}`);
      csvRows.push(`"Balance Due (USD)",,,,,,,${ledgerEntry.outstandingAmountUsd}`);
      csvRows.push(`""`);
      csvRows.push(`"Remittance Beneficiary Bank","SUMITOMO MITSUI BANKING CORP (SMBC) TOKYO"`);
      csvRows.push(`"SWIFT Identifier","SMBCJPJTXXX"`);
      csvRows.push(`"Account Number","882-11009382-USD"`);
      csvRows.push(`"Payment Reference Parameter","MUST REFERENCE ${ledgerEntry.invoiceNumber}"`);

      const csvContent = '\uFEFF' + csvRows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, `${ledgerEntry.invoiceNumber}-ledger.csv`);
      return;
    }

    if (format === 'txt') {
      const divider = '='.repeat(80);
      const subDivider = '-'.repeat(80);
      const txtLines: string[] = [
        divider,
        `CAR CHIEF CO., LTD. | ACCOUNTS DEPARTMENT`,
        `Prestige Vehicle Exporters - Tokyo Corporate Head Office, Minato-ku, Tokyo, Japan`,
        divider,
        `DOCUMENT:   ${ledgerEntry.type} INVOICE LEDGER`,
        `NUMBER:     ${ledgerEntry.invoiceNumber}`,
        `DATE:       ${ledgerEntry.issueDate}`,
        `DUE DATE:   ${ledgerEntry.dueDate}`,
        subDivider,
        `CONSIGNEE:  ${clientName} (${clientCompany})`,
        `ADDRESS:    ${clientAddress}`,
        `CONTACT:    ${clientPhone}`,
        subDivider,
        `LINE ITEMS:`,
      ];

      displayVehicles.forEach((v, idx) => {
        const stockFormatted = v.stockNumber.replace(/^STK:\s*/i, '');
        const chassisFormatted = v.chassisNumber.replace(/^CHASSIS:\s*/i, '');
        txtLines.push(
          `[${idx + 1}] ${v.title}`,
          `    Chassis: ${chassisFormatted} | Stock: ${stockFormatted} | Engine: ${v.engine}`,
          `    Destination: ${v.destinationPort} | QTY: 1 | Price: $${v.soldAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`,
          ``
        );
      });

      txtLines.push(
        subDivider,
        `GROSS SUBTOTAL:   $${ledgerEntry.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`,
        `DEPOSIT RECEIVED: $${ledgerEntry.paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`,
        `BALANCE DUE:      $${ledgerEntry.outstandingAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`,
        subDivider,
        `TELEGRAPHIC BANK REMITTANCE INSTRUCTIONS:`,
        `Beneficiary Bank:    SUMITOMO MITSUI BANKING CORP (SMBC) TOKYO`,
        `SWIFT Identifier:    SMBCJPJTXXX`,
        `Account Number:      882-11009382-USD`,
        `Reference Parameter: MUST REFERENCE ${ledgerEntry.invoiceNumber}`,
        divider
      );

      const blob = new Blob([txtLines.join('\n')], { type: 'text/plain;charset=utf-8;' });
      downloadBlob(blob, `${ledgerEntry.invoiceNumber}-ledger.txt`);
      return;
    }

    if (format === 'json') {
      const exportData = {
        organization: {
          name: 'CAR CHIEF CO., LTD.',
          department: 'Accounts Department',
          headOffice: 'Tokyo Corporate Head Office, Minato-ku, Tokyo, Japan',
          currency: 'USD',
        },
        document: {
          invoiceNumber: ledgerEntry.invoiceNumber,
          type: ledgerEntry.type,
          issueDate: ledgerEntry.issueDate,
          dueDate: ledgerEntry.dueDate,
          exportedAt: new Date().toISOString(),
        },
        consignee: {
          name: clientName,
          company: clientCompany,
          address: clientAddress,
          contact: clientPhone,
        },
        items: displayVehicles.map((v, i) => ({
          lineNumber: i + 1,
          title: v.title,
          chassisNumber: v.chassisNumber.replace(/^CHASSIS:\s*/i, ''),
          stockNumber: v.stockNumber.replace(/^STK:\s*/i, ''),
          engine: v.engine,
          vesselVoyage: v.vesselVoyage,
          destinationPort: v.destinationPort,
          quantity: 1,
          unitPriceUsd: v.soldAmountUsd,
          totalAmountUsd: v.soldAmountUsd,
          paidAmountUsd: v.paidAmountUsd,
          balanceAmountUsd: v.balanceAmountUsd,
        })),
        financials: {
          grossSubtotalUsd: ledgerEntry.totalAmountUsd,
          depositReceivedUsd: ledgerEntry.paidAmountUsd,
          balanceDueUsd: ledgerEntry.outstandingAmountUsd,
        },
        remittanceInstructions: {
          beneficiaryBank: 'SUMITOMO MITSUI BANKING CORP (SMBC) TOKYO',
          swiftIdentifier: 'SMBCJPJTXXX',
          accountNumber: '882-11009382-USD',
          referenceParameter: `MUST REFERENCE ${ledgerEntry.invoiceNumber}`,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, `${ledgerEntry.invoiceNumber}-ledger.json`);
    }
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

            {/* Download Button & Enterprise Format Selector Menu */}
            <div className="cc-ledger-export-wrap" ref={exportMenuRef}>
              <button
                type="button"
                className={`cc-ledger-action-btn ${isExportMenuOpen ? 'cc-ledger-action-btn--active' : ''}`}
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                aria-label="Download Document"
                aria-haspopup="true"
                aria-expanded={isExportMenuOpen}
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

              {isExportMenuOpen && (
                <div
                  className="cc-ledger-export-dropdown"
                  role="menu"
                  aria-label="Select export format"
                  data-testid="ledger-export-dropdown"
                >
                  <div className="cc-ledger-export-dropdown__header">
                    <span className="cc-ledger-export-dropdown__title">EXPORT LEDGER STATEMENT</span>
                    <span className="cc-ledger-export-dropdown__subtitle">Select enterprise statement format</span>
                  </div>

                  <div className="cc-ledger-export-dropdown__list">
                    {/* PDF Statement */}
                    <button
                      type="button"
                      className="cc-ledger-export-item"
                      data-testid="export-format-pdf"
                      onClick={() => handleExportFormat('pdf')}
                    >
                      <div className="cc-ledger-export-item__icon cc-ledger-export-item__icon--pdf">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <div className="cc-ledger-export-item__info">
                        <div className="cc-ledger-export-item__title-row">
                          <span className="cc-ledger-export-item__title">PDF Statement (.pdf)</span>
                          <span className="cc-ledger-export-item__badge cc-ledger-export-item__badge--pdf">OFFICIAL</span>
                        </div>
                        <span className="cc-ledger-export-item__desc">Printable proforma with CarChief letterhead &amp; seal</span>
                      </div>
                    </button>

                    {/* Accounting CSV */}
                    <button
                      type="button"
                      className="cc-ledger-export-item"
                      data-testid="export-format-csv"
                      onClick={() => handleExportFormat('csv')}
                    >
                      <div className="cc-ledger-export-item__icon cc-ledger-export-item__icon--csv">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 3h18v18H3z" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="3" y1="15" x2="21" y2="15" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                          <line x1="15" y1="3" x2="15" y2="21" />
                        </svg>
                      </div>
                      <div className="cc-ledger-export-item__info">
                        <div className="cc-ledger-export-item__title-row">
                          <span className="cc-ledger-export-item__title">Spreadsheet CSV (.csv)</span>
                          <span className="cc-ledger-export-item__badge cc-ledger-export-item__badge--csv">ERP / SAP</span>
                        </div>
                        <span className="cc-ledger-export-item__desc">Structured format for QuickBooks, Xero &amp; Excel</span>
                      </div>
                    </button>

                    {/* Text Monospace */}
                    <button
                      type="button"
                      className="cc-ledger-export-item"
                      data-testid="export-format-txt"
                      onClick={() => handleExportFormat('txt')}
                    >
                      <div className="cc-ledger-export-item__icon cc-ledger-export-item__icon--txt">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="4 7 4 4 20 4 20 7" />
                          <line x1="9" y1="20" x2="15" y2="20" />
                          <line x1="12" y1="4" x2="12" y2="20" />
                        </svg>
                      </div>
                      <div className="cc-ledger-export-item__info">
                        <div className="cc-ledger-export-item__title-row">
                          <span className="cc-ledger-export-item__title">Plain Text Ledger (.txt)</span>
                          <span className="cc-ledger-export-item__badge cc-ledger-export-item__badge--txt">ASCII</span>
                        </div>
                        <span className="cc-ledger-export-item__desc">Formatted monospace ASCII statement summary</span>
                      </div>
                    </button>

                    {/* Enterprise JSON */}
                    <button
                      type="button"
                      className="cc-ledger-export-item"
                      data-testid="export-format-json"
                      onClick={() => handleExportFormat('json')}
                    >
                      <div className="cc-ledger-export-item__icon cc-ledger-export-item__icon--json">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="16 18 22 12 16 6" />
                          <polyline points="8 6 2 12 8 18" />
                        </svg>
                      </div>
                      <div className="cc-ledger-export-item__info">
                        <div className="cc-ledger-export-item__title-row">
                          <span className="cc-ledger-export-item__title">Enterprise JSON (.json)</span>
                          <span className="cc-ledger-export-item__badge cc-ledger-export-item__badge--json">B2B DATA</span>
                        </div>
                        <span className="cc-ledger-export-item__desc">Machine-readable ledger schema with audit indices</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
