import React, { useState, useMemo, useEffect } from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInvoices } from '../invoices/useCustomerInvoices.js';
import { useCustomerStatement } from './useCustomerStatement.js';
import './statement.css';

export interface StatementTransactionItem {
  id: string;
  date: string;
  refNumber: string;
  description: 'Invoice created' | 'Invoice cancelled' | 'Debit Note' | 'Credit Note' | 'Payment received';
  debitAmountUsd: number;
  creditAmountUsd: number;
  type: 'INVOICE' | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'PAYMENT' | 'CANCELLATION';
}

export const SEED_STATEMENT_TRANSACTIONS: StatementTransactionItem[] = [
  {
    id: 'tx-1',
    date: '2024-10-01',
    refNumber: 'I-2020',
    description: 'Invoice created',
    debitAmountUsd: 5000,
    creditAmountUsd: 0,
    type: 'INVOICE',
  },
  {
    id: 'tx-2',
    date: '2024-10-04',
    refNumber: 'DN2400001',
    description: 'Debit Note',
    debitAmountUsd: 250,
    creditAmountUsd: 0,
    type: 'DEBIT_NOTE',
  },
  {
    id: 'tx-3',
    date: '2024-10-20',
    refNumber: 'TT2400002',
    description: 'Payment received',
    debitAmountUsd: 0,
    creditAmountUsd: 16000,
    type: 'PAYMENT',
  },
  {
    id: 'tx-4',
    date: '2024-10-30',
    refNumber: 'CR2400005',
    description: 'Credit Note',
    debitAmountUsd: 0,
    creditAmountUsd: 400,
    type: 'CREDIT_NOTE',
  },
  {
    id: 'tx-5',
    date: '2024-10-31',
    refNumber: 'I-2022',
    description: 'Invoice created',
    debitAmountUsd: 3400,
    creditAmountUsd: 0,
    type: 'INVOICE',
  },
  {
    id: 'tx-6',
    date: '2024-11-05',
    refNumber: 'TT2400003',
    description: 'Payment received',
    debitAmountUsd: 0,
    creditAmountUsd: 4000,
    type: 'PAYMENT',
  },
  {
    id: 'tx-7',
    date: '2024-11-12',
    refNumber: 'DN2400008',
    description: 'Debit Note',
    debitAmountUsd: 1000,
    creditAmountUsd: 0,
    type: 'DEBIT_NOTE',
  },
  {
    id: 'tx-8',
    date: '2024-11-20',
    refNumber: 'I-3456',
    description: 'Invoice created',
    debitAmountUsd: 3500,
    creditAmountUsd: 0,
    type: 'INVOICE',
  },
];

export const CustomerStatementPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const defaultToDate = new Date().toISOString().slice(0, 10);
  const defaultFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState<string>('2024-10-01');
  const [toDate, setToDate] = useState<string>('2026-12-31');

  const { data: invoicesData } = useCustomerInvoices();
  const { data: statementData } = useCustomerStatement({ fromDate, toDate });

  useEffect(() => {
    setActiveRoute('/statement');
  }, [setActiveRoute]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const headers = 'Date,Ref Number,Description,Debit (USD),Credit (USD),Balance (USD)\n';
    const rows = filteredRows.map(
      (r) =>
        `"${r.date}","${r.refNumber}","${r.description}","${r.debitAmountUsd.toFixed(2)}","${r.creditAmountUsd.toFixed(2)}","${r.runningBalance.toFixed(2)}"`
    );
    const csvContent = headers + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customer-statement-${fromDate}-to-${toDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const OPENING_BALANCE_DEFAULT = 10000.0; // USD opening carry forward balance

  // Filter and calculate running balances (FRD 3.3)
  const { filteredRows, totalDebits, totalCredits, totalBalance, openingBalance } = useMemo(() => {
    if (statementData?.entries && statementData.entries.length > 0) {
      const nonOpening = statementData.entries.filter((e) => !e.isOpeningBalance);
      return {
        filteredRows: nonOpening.map((e) => ({
          id: e.id,
          date: e.date,
          refNumber: e.referenceNo || 'N/A',
          description: e.description as StatementTransactionItem['description'],
          debitAmountUsd: e.debitUsd,
          creditAmountUsd: e.creditUsd,
          runningBalance: e.runningBalanceUsd,
          type: (e.debitUsd > 0 ? 'INVOICE' : 'PAYMENT') as StatementTransactionItem['type'],
        })),
        totalDebits: statementData.totalDebitsUsd,
        totalCredits: statementData.totalCreditsUsd,
        totalBalance: statementData.closingBalanceUsd,
        openingBalance: statementData.openingBalanceUsd,
      };
    }

    const rawTransactions = [...SEED_STATEMENT_TRANSACTIONS];

    // Combine any live invoices into the statement
    if (invoicesData?.items) {
      invoicesData.items.forEach((inv) => {
        if (!rawTransactions.some((t) => t.refNumber === inv.invoiceNumber)) {
          rawTransactions.push({
            id: `inv-${inv.id}`,
            date: inv.issuedAt ? inv.issuedAt.slice(0, 10) : '2026-07-21',
            refNumber: inv.invoiceNumber,
            description: 'Invoice created',
            debitAmountUsd: inv.totalAmountUsd,
            creditAmountUsd: 0,
            type: 'INVOICE',
          });
        }
      });
    }

    // Sort ascending by date
    rawTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter by selected range
    const filtered = rawTransactions.filter((t) => {
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      return true;
    });

    let currentBalance = OPENING_BALANCE_DEFAULT;
    let sumDebits = 0;
    let sumCredits = 0;

    const rowsWithBalance = filtered.map((item) => {
      sumDebits += item.debitAmountUsd;
      sumCredits += item.creditAmountUsd;
      currentBalance = currentBalance + item.debitAmountUsd - item.creditAmountUsd;

      return {
        ...item,
        runningBalance: currentBalance,
      };
    });

    return {
      filteredRows: rowsWithBalance,
      totalDebits: sumDebits,
      totalCredits: sumCredits,
      totalBalance: currentBalance,
      openingBalance: OPENING_BALANCE_DEFAULT,
    };
  }, [statementData, invoicesData, fromDate, toDate]);

  const isCredit = totalBalance <= 0;

  return (
    <div className="cc-stmt-page" data-testid="customer-statement-page">
      {/* 1. TOP HEADER & FILTER BAR (FRD 3.1 & 3.2) */}
      <section className="cc-stmt-header-card" aria-labelledby="statement-heading">
        <div className="cc-stmt-header-top">
          <div>
            <h1 id="statement-heading" className="cc-stmt-title">
              My Statement
            </h1>
            <p className="cc-stmt-subtitle">
              Comprehensive running balance statement, debits, credits, and wire remittances.
            </p>
          </div>

          {/* Print & Excel Actions (FRD 3.1) */}
          <div className="cc-stmt-actions">
            <button
              type="button"
              className="cc-stmt-action-btn"
              onClick={handlePrint}
              title="Print Statement"
              data-testid="statement-print-btn"
            >
              <span className="cc-stmt-action-icon" aria-hidden="true">🖨️</span> Print Statement
            </button>
            <button
              type="button"
              className="cc-stmt-action-btn cc-stmt-action-btn--excel"
              onClick={handleDownloadExcel}
              title="Download Excel / CSV"
              data-testid="statement-excel-btn"
            >
              <span className="cc-stmt-action-icon" aria-hidden="true">📊</span> Download Excel
            </button>
          </div>
        </div>

        {/* Date Filter Bar (FRD 3.1 & 3.2) */}
        <div className="cc-stmt-filter-bar">
          <div className="cc-stmt-filter-group">
            <label htmlFor="stmt-from-date" className="cc-stmt-filter-label">
              Transaction Date:
            </label>
            <div className="cc-stmt-date-inputs">
              <input
                id="stmt-from-date"
                type="date"
                className="cc-stmt-date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="stmt-from-date"
              />
              <span className="cc-stmt-date-sep">to</span>
              <input
                id="stmt-to-date"
                type="date"
                className="cc-stmt-date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="stmt-to-date"
              />
            </div>
          </div>

          <button
            type="button"
            className="cc-stmt-reset-btn"
            onClick={() => {
              setFromDate(defaultFromDate);
              setToDate(defaultToDate);
            }}
          >
            Reset Range
          </button>
        </div>
      </section>

      {/* 2. TOTAL METRICS SUMMARY BAR (FRD 3.1: Green for Credit, Red for Debit) */}
      <section className="cc-stmt-kpi-bar" aria-label="Statement Totals">
        <div className="cc-stmt-kpi-item">
          <span className="cc-stmt-kpi-label">Total Debits:</span>
          <span className="cc-stmt-kpi-val cc-stmt-val--debit">
            ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>

        <div className="cc-stmt-kpi-divider" aria-hidden="true" />

        <div className="cc-stmt-kpi-item">
          <span className="cc-stmt-kpi-label">Total Credits:</span>
          <span className="cc-stmt-kpi-val cc-stmt-val--credit">
            ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>

        <div className="cc-stmt-kpi-divider" aria-hidden="true" />

        <div className="cc-stmt-kpi-item">
          <span className="cc-stmt-kpi-label">Total Balance:</span>
          <span
            className={`cc-stmt-kpi-val ${
              isCredit ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'
            }`}
            data-testid="statement-total-balance"
          >
            ${Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>
      </section>

      {/* 3. RUNNING BALANCE TRANSACTION TABLE (FRD 3.3) */}
      <section className="cc-stmt-table-section" aria-label="Transaction Ledger Table">
        <div className="cc-stmt-table-scroll-wrap" role="region" aria-label="Scrollable Statement Table">
          <table className="cc-stmt-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Ref Number</th>
                <th scope="col">Description</th>
                <th scope="col" className="cc-stmt-th--right">Debit (USD)</th>
                <th scope="col" className="cc-stmt-th--right">Credit (USD)</th>
                <th scope="col" className="cc-stmt-th--right">Balance (USD)</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance Row (FRD 3.3) */}
              <tr className="cc-stmt-tr--opening">
                <td className="cc-stmt-td-bold" colSpan={3}>
                  Opening Balance
                </td>
                <td className="cc-stmt-td--right">-</td>
                <td className="cc-stmt-td--right">-</td>
                <td className="cc-stmt-td--right cc-stmt-val--debit cc-stmt-td-bold">
                  ${openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Transactions List */}
              {filteredRows.map((row) => (
                <tr key={row.id} className="cc-stmt-tr">
                  <td className="cc-stmt-td-mono">{row.date}</td>
                  <td className="cc-stmt-td-mono cc-stmt-td-bold">{row.refNumber}</td>
                  <td className="cc-stmt-td-desc">{row.description}</td>
                  <td className="cc-stmt-td--right cc-stmt-td-mono">
                    {row.debitAmountUsd > 0
                      ? `$${row.debitAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="cc-stmt-td--right cc-stmt-td-mono">
                    {row.creditAmountUsd > 0
                      ? `$${row.creditAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td
                    className={`cc-stmt-td--right cc-stmt-td-mono cc-stmt-td-bold ${
                      row.runningBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'
                    }`}
                  >
                    ${Math.abs(row.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="cc-stmt-tr--total">
                <td className="cc-stmt-td-bold" colSpan={3}>
                  Total
                </td>
                <td className="cc-stmt-td--right cc-stmt-td-bold cc-stmt-td-mono">
                  ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="cc-stmt-td--right cc-stmt-td-bold cc-stmt-td-mono">
                  ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td
                  className={`cc-stmt-td--right cc-stmt-td-bold cc-stmt-td-mono ${
                    totalBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'
                  }`}
                >
                  ${Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
