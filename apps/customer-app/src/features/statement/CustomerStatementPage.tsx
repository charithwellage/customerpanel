import React, { useState, useMemo, useEffect } from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerStatement } from './useCustomerStatement.js';
import './statement.css';

const formatDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateMonthsAgo = (months: number): string => {
  const date = new Date();
  const originalDay = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() - months);
  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return formatDateInputValue(date);
};

export const CustomerStatementPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const defaultToDate = formatDateInputValue(new Date());
  const defaultFromDate = getDateMonthsAgo(3);

  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>(defaultToDate);

  const { data: statementData, isLoading, isError, error } = useCustomerStatement({ fromDate, toDate });

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

  const { filteredRows, totalDebits, totalCredits, totalBalance, openingBalance } = useMemo(() => {
    const entries = statementData?.entries ?? [];
    const nonOpening = entries.filter((entry) => !entry.isOpeningBalance);
    return {
      filteredRows: nonOpening.map((entry) => ({
        id: entry.id,
        date: entry.date,
        refNumber: entry.referenceNo || 'N/A',
        description: entry.description,
        debitAmountUsd: entry.debitUsd,
        creditAmountUsd: entry.creditUsd,
        runningBalance: entry.runningBalanceUsd,
      })),
      totalDebits: statementData?.totalDebitsUsd ?? 0,
      totalCredits: statementData?.totalCreditsUsd ?? 0,
      totalBalance: statementData?.closingBalanceUsd ?? 0,
      openingBalance: statementData?.openingBalanceUsd ?? 0,
    };
  }, [statementData]);

  const isCredit = totalBalance <= 0;

  return (
    <div className="cc-stmt-page" data-testid="customer-statement-page">
      {/* 1. TOP HEADER & FILTER BAR (FRD 3.1 & 3.2) */}
      <section className="cc-stmt-header-card" aria-labelledby="statement-heading">
        <div className="cc-stmt-header-top">
          <div>
            <h1 id="statement-heading" className="cc-stmt-title cc-portal-page-title">
              My Statement
            </h1>
            <p className="cc-stmt-subtitle cc-portal-page-description">
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

      {isLoading && (
        <p className="cc-stmt-state" role="status">Loading statement transactions…</p>
      )}
      {isError && (
        <p className="cc-stmt-state cc-stmt-state--error" role="alert">
          {error instanceof Error ? error.message : 'Unable to load statement transactions.'}
        </p>
      )}

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
