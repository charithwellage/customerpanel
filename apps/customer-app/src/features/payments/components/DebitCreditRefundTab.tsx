import React, { useState, useMemo } from 'react';

export interface DebitCreditRecord {
  id: string;
  refNumber: string;
  type: 'Debit' | 'Credit' | 'Refund';
  cashInDate: string;
  stockId: string;
  currency: string;
  amount: number;
  balanceAmount: number;
  paidInCash: boolean;
  approvedDate: string;
  customerNotes?: string;
  notesVisibleToCustomer?: boolean;
}

export const SEED_DEBIT_CREDIT_RECORDS: DebitCreditRecord[] = [
  {
    id: 'dc-1',
    refNumber: 'DN2400008',
    type: 'Debit',
    cashInDate: '2024-10-31',
    stockId: 'J24013263',
    currency: 'USD',
    amount: 1000,
    balanceAmount: 1000,
    paidInCash: false,
    approvedDate: '2024-10-31',
    customerNotes: 'Storage & documentation demurrage adjustment.',
    notesVisibleToCustomer: true,
  },
  {
    id: 'dc-2',
    refNumber: 'RF2400006',
    type: 'Refund',
    cashInDate: '2024-10-25',
    stockId: '-',
    currency: 'USD',
    amount: 5000,
    balanceAmount: 5000,
    paidInCash: true,
    approvedDate: '2024-10-25',
    customerNotes: 'Direct remittance excess wire refund.',
    notesVisibleToCustomer: true,
  },
  {
    id: 'dc-3',
    refNumber: 'CR2400008',
    type: 'Credit',
    cashInDate: '2024-10-24',
    stockId: '-',
    currency: 'USD',
    amount: 4500,
    balanceAmount: 4500,
    paidInCash: false,
    approvedDate: '2024-10-24',
    customerNotes: 'Ocean freight discount rebate credited to ledger.',
    notesVisibleToCustomer: true,
  },
  {
    id: 'dc-4',
    refNumber: 'DN2400001',
    type: 'Debit',
    cashInDate: '2024-10-04',
    stockId: 'NRE161',
    currency: 'USD',
    amount: 250,
    balanceAmount: 250,
    paidInCash: false,
    approvedDate: '2024-10-04',
    customerNotes: 'Inspection expediting fee.',
    notesVisibleToCustomer: true,
  },
  {
    id: 'dc-5',
    refNumber: 'CR2400005',
    type: 'Credit',
    cashInDate: '2024-09-30',
    stockId: 'DE3FS-',
    currency: 'USD',
    amount: 400,
    balanceAmount: 400,
    paidInCash: false,
    approvedDate: '2024-09-30',
    customerNotes: 'Port handling allowance credited.',
    notesVisibleToCustomer: true,
  },
];

import { useCustomerDebitCredit } from '../useCustomerPayments.js';

export const DebitCreditRefundTab: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [refFilter, setRefFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [paidInCashFilter, setPaidInCashFilter] = useState<boolean | 'ALL'>('ALL');
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const { data: apiData } = useCustomerDebitCredit({
    type: typeFilter,
    currency: currencyFilter,
    query: keyword || refFilter,
  });

  // Filter & sort newest to oldest by cash in date (FRD 5.9 & 5.11)
  const filteredRecords = useMemo(() => {
    let result = (apiData?.items && apiData.items.length > 0) ? [...apiData.items] : [...SEED_DEBIT_CREDIT_RECORDS];

    if (keyword.trim()) {
      const q = keyword.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.refNumber.toLowerCase().includes(q) ||
          r.stockId.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q)
      );
    }

    if (refFilter.trim()) {
      result = result.filter((r) => r.refNumber.toLowerCase().includes(refFilter.toLowerCase().trim()));
    }

    if (currencyFilter !== 'ALL') {
      result = result.filter((r) => r.currency === currencyFilter);
    }

    if (typeFilter !== 'ALL') {
      result = result.filter((r) => r.type === typeFilter);
    }

    if (paidInCashFilter !== 'ALL') {
      result = result.filter((r) => r.paidInCash === paidInCashFilter);
    }

    // Default sorted with Cash in date from newest to oldest (FRD 5.9)
    result.sort((a, b) => new Date(b.cashInDate).getTime() - new Date(a.cashInDate).getTime());

    return result;
  }, [keyword, refFilter, currencyFilter, typeFilter, paidInCashFilter]);

  // Totals calculations (FRD 5.10)
  const totalDebits = useMemo(
    () => SEED_DEBIT_CREDIT_RECORDS.filter((r) => r.type === 'Debit').reduce((sum, r) => sum + r.amount, 0),
    []
  );

  const totalCredits = useMemo(
    () => SEED_DEBIT_CREDIT_RECORDS.filter((r) => r.type === 'Credit').reduce((sum, r) => sum + r.amount, 0),
    []
  );

  const totalRefunds = useMemo(
    () => SEED_DEBIT_CREDIT_RECORDS.filter((r) => r.type === 'Refund').reduce((sum, r) => sum + r.amount, 0),
    []
  );

  return (
    <div className="cc-debit-credit-tab" data-testid="debit-credit-tab">
      {/* 1. TOP KPI SUMMARY ROW (FRD 5.10) */}
      <section className="cc-dc-kpi-row" aria-label="Debit Credit Totals">
        <div className="cc-dc-kpi-card">
          <span className="cc-dc-kpi-label">TOTAL DEBITS:</span>
          <span className="cc-dc-kpi-val cc-dc-val--debit">
            ${totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
          <span className="cc-dc-kpi-subtext">Due Debits: ${totalDebits.toLocaleString()}</span>
        </div>

        <div className="cc-dc-kpi-card">
          <span className="cc-dc-kpi-label">TOTAL CREDITS:</span>
          <span className="cc-dc-kpi-val cc-dc-val--credit">
            ${totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
          <span className="cc-dc-kpi-subtext">Balance Credits: ${totalCredits.toLocaleString()}</span>
        </div>

        <div className="cc-dc-kpi-card">
          <span className="cc-dc-kpi-label">TOTAL REFUNDS:</span>
          <span className="cc-dc-kpi-val cc-dc-val--refund">
            ${totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
          <span className="cc-dc-kpi-subtext">In Cash: ${totalRefunds.toLocaleString()}</span>
        </div>
      </section>

      {/* 2. MULTI-FIELD FILTER TOOLBAR (FRD 5.11) */}
      <section className="cc-dc-filter-section" aria-label="Debit Credit Filtration">
        <div className="cc-dc-filter-grid">
          <div className="cc-dc-filter-item">
            <label htmlFor="dc-filter-kw" className="cc-dc-filter-label">Keyword:</label>
            <input
              id="dc-filter-kw"
              type="search"
              className="cc-dc-filter-input"
              placeholder="Search ref nu, stock, type..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="cc-dc-filter-item">
            <label htmlFor="dc-filter-ref" className="cc-dc-filter-label">Ref Nu:</label>
            <input
              id="dc-filter-ref"
              type="text"
              className="cc-dc-filter-input"
              placeholder="DN2400008..."
              value={refFilter}
              onChange={(e) => setRefFilter(e.target.value)}
            />
          </div>

          <div className="cc-dc-filter-item">
            <label htmlFor="dc-filter-curr" className="cc-dc-filter-label">Currency:</label>
            <select
              id="dc-filter-curr"
              className="cc-dc-filter-select"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD</option>
              <option value="JPY">JPY</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="cc-dc-filter-item">
            <label htmlFor="dc-filter-type" className="cc-dc-filter-label">Type:</label>
            <select
              id="dc-filter-type"
              className="cc-dc-filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
              <option value="Refund">Refund</option>
            </select>
          </div>

          <div className="cc-dc-filter-item cc-dc-filter-item--checkbox">
            <label className="cc-dc-checkbox-label">
              <input
                type="checkbox"
                checked={paidInCashFilter === true}
                onChange={(e) => setPaidInCashFilter(e.target.checked ? true : 'ALL')}
              />
              Paid in Cash
            </label>
          </div>
        </div>

        <div className="cc-dc-filter-actions">
          <button
            type="button"
            className="cc-dc-reset-btn"
            onClick={() => {
              setKeyword('');
              setRefFilter('');
              setCurrencyFilter('ALL');
              setTypeFilter('ALL');
              setPaidInCashFilter('ALL');
            }}
          >
            Reset Filters
          </button>
        </div>
      </section>

      {/* 3. TABLE OF DEBITS, CREDITS & REFUNDS (FRD 5.13) */}
      <section className="cc-dc-table-section" aria-label="Debit Credit Table">
        <div className="cc-dc-table-wrap">
          <table className="cc-dc-table">
            <thead>
              <tr>
                <th scope="col">Ref nu</th>
                <th scope="col">Type</th>
                <th scope="col">Cash in Date</th>
                <th scope="col">Stock Id</th>
                <th scope="col">Currency</th>
                <th scope="col" className="cc-dc-th--right">Amount</th>
                <th scope="col" className="cc-dc-th--right">Balance Amount</th>
                <th scope="col" className="cc-dc-th--center">Paid in Cash</th>
                <th scope="col">Approved Date</th>
                <th scope="col" className="cc-dc-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((row) => (
                <tr key={row.id} className="cc-dc-tr">
                  <td className="cc-dc-td-mono cc-dc-td-bold">{row.refNumber}</td>
                  <td>
                    <span className={`cc-dc-type-pill cc-dc-type-pill--${row.type.toLowerCase()}`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="cc-dc-td-mono">{row.cashInDate}</td>
                  <td className="cc-dc-td-mono">{row.stockId}</td>
                  <td className="cc-dc-td-mono">{row.currency}</td>
                  <td className="cc-dc-td--right cc-dc-td-mono cc-dc-td-bold">
                    ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="cc-dc-td--right cc-dc-td-mono">
                    ${row.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="cc-dc-td--center">
                    <input type="checkbox" checked={row.paidInCash} readOnly disabled />
                  </td>
                  <td className="cc-dc-td-mono">{row.approvedDate}</td>
                  <td className="cc-dc-td--center">
                    <button
                      type="button"
                      className="cc-dc-notes-btn"
                      onClick={() => setSelectedNote(row.customerNotes || 'No additional customer notes on record.')}
                      title="View Customer Notes"
                      data-testid={`btn-notes-${row.id}`}
                    >
                      👁️ Notes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Customer Notes Pop-up Modal (FRD 5.14) */}
      {selectedNote !== null && (
        <div className="cc-dc-notes-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="notes-title">
          <div className="cc-dc-notes-modal-backdrop" onClick={() => setSelectedNote(null)} />
          <div className="cc-dc-notes-modal-dialog">
            <div className="cc-dc-notes-modal-header">
              <h3 id="notes-title" className="cc-dc-notes-modal-title">Customer Notes</h3>
              <button
                type="button"
                className="cc-dc-notes-modal-close"
                onClick={() => setSelectedNote(null)}
                aria-label="Close notes modal"
              >
                ✕
              </button>
            </div>
            <div className="cc-dc-notes-modal-body">
              <p className="cc-dc-notes-text">{selectedNote}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
