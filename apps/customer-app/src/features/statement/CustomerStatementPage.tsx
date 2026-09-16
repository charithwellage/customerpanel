import React, { useState, useMemo, useEffect } from 'react';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerStatement } from './useCustomerStatement.js';
import { CarChiefLoadingButton } from '../../components/CarChiefLoadingButton.js';
import type { CustomerStatementSummary } from '@carchief/domain';
import './statement.css';

const DEFAULT_MOCK_STATEMENT: CustomerStatementSummary = {
  customerId: 'cust-123',
  customerName: 'Global Auto Imports Ltd',
  currency: 'USD',
  openingBalanceUsd: 0,
  totalDebitsUsd: 48500,
  totalCreditsUsd: 35000,
  closingBalanceUsd: 13500,
  fromDate: '2026-06-01',
  toDate: '2026-09-09',
  entries: [
    {
      id: 'stmt-001',
      date: '2026-06-15',
      referenceNo: 'TT-984012',
      description: 'Telegraphic Transfer Deposit - Standard Chartered Wire',
      debitUsd: 0,
      creditUsd: 25000,
      runningBalanceUsd: -25000,
      isOpeningBalance: false,
    },
    {
      id: 'stmt-002',
      date: '2026-07-02',
      referenceNo: 'INV-40520',
      description: 'Vehicle Purchase Invoice - Toyota Corolla Fielder 1.5G 2021',
      debitUsd: 14500,
      creditUsd: 0,
      runningBalanceUsd: -10500,
      isOpeningBalance: false,
    },
    {
      id: 'stmt-003',
      date: '2026-07-20',
      referenceNo: 'TT-989104',
      description: 'Telegraphic Transfer Payment - MUFG Bank Wire',
      debitUsd: 0,
      creditUsd: 10000,
      runningBalanceUsd: -20500,
      isOpeningBalance: false,
    },
    {
      id: 'stmt-004',
      date: '2026-08-10',
      referenceNo: 'INV-40890',
      description: 'Vehicle Purchase Invoice - Nissan X-Trail 20X Hybrid 2020',
      debitUsd: 34000,
      creditUsd: 0,
      runningBalanceUsd: 13500,
      isOpeningBalance: false,
    },
  ],
};

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
  const [mobileViewMode, setMobileViewMode] = useState<'feed' | 'cards'>('feed');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const { data: statementData, isLoading } = useCustomerStatement({ fromDate, toDate });

  const effectiveStatement = statementData || DEFAULT_MOCK_STATEMENT;

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
    const entries = effectiveStatement?.entries ?? [];
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
      totalDebits: effectiveStatement?.totalDebitsUsd ?? 0,
      totalCredits: effectiveStatement?.totalCreditsUsd ?? 0,
      totalBalance: effectiveStatement?.closingBalanceUsd ?? 0,
      openingBalance: effectiveStatement?.openingBalanceUsd ?? 0,
    };
  }, [effectiveStatement]);

  const isCredit = totalBalance < 0;
  const isZero = totalBalance === 0;

  return (
    <div className="cc-stmt-page" data-testid="customer-statement-page">
      {/* 1. TOP HEADER & FILTER BAR (FRD 3.1 & 3.2) */}
      <section className="cc-stmt-header-card" aria-labelledby="statement-heading">
        <div className="cc-stmt-header-top">
          <div>
            <h1 id="statement-heading" className="cc-stmt-title cc-portal-page-title">
              <span className="sr-only">My Statement</span>
              <span aria-hidden="true">MY <span className="cc-stmt-title-highlight">STATEMENT</span></span>
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Print Statement</span>
            </button>
            <button
              type="button"
              className="cc-stmt-action-btn cc-stmt-action-btn--excel"
              onClick={handleDownloadExcel}
              title="Download Excel / CSV"
              data-testid="statement-excel-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download Excel</span>
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

        {/* 2. TOTAL METRICS SUMMARY BAR (Merged into the Header Card) */}
        <div className="cc-stmt-kpi-bar" aria-label="Statement Totals">
          <div className="cc-stmt-kpi-item cc-stmt-kpi-item--debit">
            <span className="cc-stmt-kpi-label">Total Debits:</span>
            <span className="cc-stmt-kpi-val cc-stmt-val--debit">
              ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="cc-stmt-kpi-item cc-stmt-kpi-item--credit">
            <span className="cc-stmt-kpi-label">Total Credits:</span>
            <span className="cc-stmt-kpi-val cc-stmt-val--credit">
              ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className={`cc-stmt-kpi-item ${isCredit ? 'cc-stmt-kpi-item--credit-bal' : 'cc-stmt-kpi-item--due-bal'}`}>
            <span className="cc-stmt-kpi-label">Total Balance:</span>
            <span
              className={`cc-stmt-kpi-val ${
                isCredit ? 'cc-stmt-val--credit' : isZero ? 'cc-stmt-val--neutral' : 'cc-stmt-val--due'
              }`}
              data-testid="statement-total-balance"
            >
              ${Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </section>

      {isLoading && (
        <CarChiefLoadingButton label="Loading transactions…" variant="overlay" size="md" />
      )}

      {/* 3. RUNNING BALANCE TRANSACTION TABLE (FRD 3.3) */}
      <section className="cc-stmt-table-section" aria-label="Transaction Ledger Table">
        {/* Desktop Table View (hidden on mobile <= 768px) */}
        <div className="cc-stmt-table-scroll-wrap cc-stmt-desktop-view" role="region" aria-label="Scrollable Statement Table">
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
                <td colSpan={3}>
                  Opening Balance
                </td>
                <td className="cc-stmt-td--right">-</td>
                <td className="cc-stmt-td--right">-</td>
                <td className="cc-stmt-td--right cc-stmt-val--debit">
                  ${openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Transactions List */}
              {filteredRows.map((row) => (
                <tr key={row.id} className="cc-stmt-tr">
                  <td className="cc-stmt-td-mono">{row.date}</td>
                  <td className="cc-stmt-td-mono">{row.refNumber}</td>
                  <td className="cc-stmt-td-desc">{row.description}</td>
                  <td className="cc-stmt-td--right cc-stmt-td-mono">
                    {row.debitAmountUsd > 0
                      ? `$${row.debitAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td className="cc-stmt-td--right cc-stmt-td-mono">
                    {row.creditAmountUsd > 0
                      ? `$${row.creditAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                      : '-'}
                  </td>
                  <td
                    className={`cc-stmt-td--right cc-stmt-td-mono ${
                      row.runningBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'
                    }`}
                  >
                    ${Math.abs(row.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}

              {/* Total Summary Row */}
              <tr className="cc-stmt-tr--total">
                <td colSpan={3}>
                  Total
                </td>
                <td className="cc-stmt-td--right cc-stmt-td-mono">
                  ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="cc-stmt-td--right cc-stmt-td-mono">
                  ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td
                  className={`cc-stmt-td--right cc-stmt-td-mono ${
                    totalBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--due'
                  }`}
                >
                  ${Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Single-View Ledger (visible only on <= 768px, no horizontal scroll) */}
        <div className="cc-stmt-mobile-view" role="region" aria-label="Mobile Statement Ledger">
          {/* Mobile View Switcher: Modern Timeline Feed vs Detailed Ledger Cards */}
          <div className="cc-stmt-mobile-view-toolbar">
            <span className="cc-stmt-mobile-toolbar-title">Activity ({filteredRows.length})</span>
            <div className="cc-stmt-mobile-segmented-control" role="tablist" aria-label="Statement display format">
              <button
                type="button"
                className={`cc-stmt-segment-btn ${mobileViewMode === 'feed' ? 'cc-stmt-segment-btn--active' : ''}`}
                onClick={() => setMobileViewMode('feed')}
                role="tab"
                aria-selected={mobileViewMode === 'feed'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>Timeline</span>
              </button>
              <button
                type="button"
                className={`cc-stmt-segment-btn ${mobileViewMode === 'cards' ? 'cc-stmt-segment-btn--active' : ''}`}
                onClick={() => setMobileViewMode('cards')}
                role="tab"
                aria-selected={mobileViewMode === 'cards'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Cards</span>
              </button>
            </div>
          </div>

          {/* Opening Balance Item */}
          <div className="cc-stmt-mobile-opening">
            <div className="cc-stmt-mobile-opening-label">
              <span className="cc-stmt-mobile-badge-opening">Opening</span>
              <span className="cc-stmt-mobile-opening-title">Opening Balance</span>
            </div>
            <div className="cc-stmt-mobile-opening-amount cc-stmt-val--debit">
              ${openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
          </div>

          {/* VIEW 1: ELEGANT FINTECH TIMELINE FEED (Default) */}
          {mobileViewMode === 'feed' && (
            <div className="cc-stmt-feed-list">
              {filteredRows.map((row) => {
                const isCreditTx = row.creditAmountUsd > 0;
                const isExpanded = expandedRowId === row.id;
                const txAmount = isCreditTx ? row.creditAmountUsd : row.debitAmountUsd;
                const sign = isCreditTx ? '+' : '-';

                return (
                  <div
                    key={row.id}
                    className={`cc-stmt-feed-item ${isExpanded ? 'cc-stmt-feed-item--expanded' : ''}`}
                    onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedRowId(isExpanded ? null : row.id);
                      }
                    }}
                    aria-expanded={isExpanded}
                  >
                    <div className="cc-stmt-feed-main">
                      {/* Direction Glyph */}
                      <div className={`cc-stmt-feed-icon cc-stmt-feed-icon--${isCreditTx ? 'credit' : 'debit'}`}>
                        {isCreditTx ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="7" y1="7" x2="17" y2="17" />
                            <polyline points="17 7 17 17 7 17" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                        )}
                      </div>

                      {/* Content Description & Subtitle */}
                      <div className="cc-stmt-feed-content">
                        <div className="cc-stmt-feed-title">{row.description}</div>
                        <div className="cc-stmt-feed-meta">
                          <span className="cc-stmt-feed-date">{row.date}</span>
                          <span className="cc-stmt-feed-dot">•</span>
                          <span className="cc-stmt-feed-ref">{row.refNumber}</span>
                        </div>
                      </div>

                      {/* Amounts: Signed Transaction + Resulting Balance */}
                      <div className="cc-stmt-feed-amounts">
                        <div className={`cc-stmt-feed-tx-amount ${isCreditTx ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'}`}>
                          {sign}${txAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                        <div className="cc-stmt-feed-balance">
                          Bal: ${Math.abs(row.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div className="cc-stmt-feed-chevron">
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Expandable Accounting Breakdown Drawer */}
                    {isExpanded && (
                      <div className="cc-stmt-feed-detail-pane">
                        <div className="cc-stmt-feed-detail-row">
                          <span className="cc-stmt-detail-label">Reference No:</span>
                          <span className="cc-stmt-detail-val cc-stmt-td-mono">{row.refNumber}</span>
                        </div>
                        <div className="cc-stmt-feed-detail-row">
                          <span className="cc-stmt-detail-label">Transaction Date:</span>
                          <span className="cc-stmt-detail-val cc-stmt-td-mono">{row.date}</span>
                        </div>
                        <div className="cc-stmt-feed-detail-row">
                          <span className="cc-stmt-detail-label">Entry Type:</span>
                          <span className={`cc-stmt-detail-val ${isCreditTx ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'}`}>
                            {isCreditTx ? 'Credit (Payment Received)' : 'Debit (Invoice / Charge)'}
                          </span>
                        </div>
                        <div className="cc-stmt-feed-detail-row">
                          <span className="cc-stmt-detail-label">Debit (Outflow):</span>
                          <span className="cc-stmt-detail-val cc-stmt-td-mono">
                            {row.debitAmountUsd > 0 ? `$${row.debitAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : '-'}
                          </span>
                        </div>
                        <div className="cc-stmt-feed-detail-row">
                          <span className="cc-stmt-detail-label">Credit (Inflow):</span>
                          <span className="cc-stmt-detail-val cc-stmt-td-mono">
                            {row.creditAmountUsd > 0 ? `$${row.creditAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD` : '-'}
                          </span>
                        </div>
                        <div className="cc-stmt-feed-detail-row cc-stmt-feed-detail-row--total">
                          <span className="cc-stmt-detail-label">Running Balance:</span>
                          <span className={`cc-stmt-detail-val cc-stmt-td-mono ${row.runningBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'}`}>
                            ${Math.abs(row.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: DETAILED LEDGER CARDS */}
          {mobileViewMode === 'cards' && (
            <div className="cc-stmt-cards-list">
              {filteredRows.map((row) => (
                <div key={row.id} className="cc-stmt-mobile-card">
                  <div className="cc-stmt-mobile-card__header">
                    <span className="cc-stmt-mobile-card__date">{row.date}</span>
                    <span className="cc-stmt-mobile-card__ref">{row.refNumber}</span>
                  </div>
                  <div className="cc-stmt-mobile-card__desc">{row.description}</div>
                  <div className="cc-stmt-mobile-card__fin-grid">
                    <div className="cc-stmt-mobile-card__fin-col">
                      <span className="cc-stmt-mobile-card__fin-label">Debit:</span>
                      <span className={`cc-stmt-mobile-card__fin-val ${row.debitAmountUsd > 0 ? 'cc-stmt-val--debit' : 'cc-stmt-val--neutral'}`}>
                        {row.debitAmountUsd > 0
                          ? `$${row.debitAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                          : '-'}
                      </span>
                    </div>
                    <div className="cc-stmt-mobile-card__fin-col">
                      <span className="cc-stmt-mobile-card__fin-label">Credit:</span>
                      <span className={`cc-stmt-mobile-card__fin-val ${row.creditAmountUsd > 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--neutral'}`}>
                        {row.creditAmountUsd > 0
                          ? `$${row.creditAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                          : '-'}
                      </span>
                    </div>
                    <div className="cc-stmt-mobile-card__fin-col cc-stmt-mobile-card__fin-col--balance">
                      <span className="cc-stmt-mobile-card__fin-label">Balance:</span>
                      <span
                        className={`cc-stmt-mobile-card__fin-val ${
                          row.runningBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--debit'
                        }`}
                      >
                        ${Math.abs(row.runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredRows.length === 0 && (
            <div className="cc-stmt-mobile-empty">
              No transactions found in this date range.
            </div>
          )}

          {/* Mobile Total Summary Card */}
          <div className="cc-stmt-mobile-total">
            <div className="cc-stmt-mobile-total-title">Statement Summary</div>
            <div className="cc-stmt-mobile-card__fin-grid">
              <div className="cc-stmt-mobile-card__fin-col">
                <span className="cc-stmt-mobile-card__fin-label">Total Debits:</span>
                <span className="cc-stmt-mobile-card__fin-val cc-stmt-val--debit">
                  ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cc-stmt-mobile-card__fin-col">
                <span className="cc-stmt-mobile-card__fin-label">Total Credits:</span>
                <span className="cc-stmt-mobile-card__fin-val cc-stmt-val--credit">
                  ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="cc-stmt-mobile-card__fin-col cc-stmt-mobile-card__fin-col--balance">
                <span className="cc-stmt-mobile-card__fin-label">Net Balance:</span>
                <span
                  className={`cc-stmt-mobile-card__fin-val ${
                    totalBalance <= 0 ? 'cc-stmt-val--credit' : 'cc-stmt-val--due'
                  }`}
                >
                  ${Math.abs(totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
