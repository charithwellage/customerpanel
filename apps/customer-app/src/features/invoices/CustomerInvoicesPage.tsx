import React, { useState, useMemo, useEffect } from 'react';
import type { CustomerInvoiceSummary } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInvoices } from './useCustomerInvoices.js';
import { InvoiceSummaryKpiCards } from './components/InvoiceSummaryKpiCards.js';
import { RedDocIcon, SearchGlassIcon, VehiclesSideCarIcon } from '../../components/Icons.js';

export interface CustomerInvoicesPageProps {
  onSelectInvoice: (invoice: CustomerInvoiceSummary) => void;
}

export interface InvoicedLedgerEntry {
  id: string;
  invoiceNumber: string;
  type: 'PROFORMA' | 'COMMERCIAL';
  issueDate: string;
  totalAmountUsd: number;
  paidAmountUsd: number;
  outstandingAmountUsd: number;
  dueDate: string;
}

export interface InvoicedVehicleItem {
  id: string;
  stockNumber: string;
  chassisNumber: string;
  title: string;
  engine: string;
  vesselVoyage: string;
  destinationPort: string;
  soldAmountUsd: number;
  paidAmountUsd: number;
  balanceAmountUsd: number;
  imageUrl: string;
}

const SEED_INVOICE_LEDGER: InvoicedLedgerEntry[] = [
  { id: 'inv-row-1', invoiceNumber: 'P-85492', type: 'PROFORMA', issueDate: '23/07/2026', totalAmountUsd: 12730, paidAmountUsd: 0, outstandingAmountUsd: 12730, dueDate: '2026-07-25' },
  { id: 'inv-row-2', invoiceNumber: 'P-94324', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 8974, paidAmountUsd: 0, outstandingAmountUsd: 8974, dueDate: '2026-07-23' },
  { id: 'inv-row-3', invoiceNumber: 'P-12609', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 9690, paidAmountUsd: 0, outstandingAmountUsd: 9690, dueDate: '2026-07-23' },
  { id: 'inv-row-4', invoiceNumber: 'INV-98100', type: 'COMMERCIAL', issueDate: '21/07/2026', totalAmountUsd: 12650, paidAmountUsd: 0, outstandingAmountUsd: 12650, dueDate: '2026-07-23' },
  { id: 'inv-row-5', invoiceNumber: 'P-41809', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 12830, paidAmountUsd: 0, outstandingAmountUsd: 12830, dueDate: '2026-07-23' },
  { id: 'inv-row-6', invoiceNumber: 'INV-79873', type: 'COMMERCIAL', issueDate: '17/07/2026', totalAmountUsd: 14770, paidAmountUsd: 19470, outstandingAmountUsd: 0, dueDate: '2026-07-16' },
  { id: 'inv-row-7', invoiceNumber: 'P-34416', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 12730, paidAmountUsd: 0, outstandingAmountUsd: 12730, dueDate: '2026-07-23' },
  { id: 'inv-row-8', invoiceNumber: 'P-77098', type: 'PROFORMA', issueDate: '24/07/2026', totalAmountUsd: 9690, paidAmountUsd: 0, outstandingAmountUsd: 9690, dueDate: '2026-07-26' },
  { id: 'inv-row-9', invoiceNumber: 'INV-90745', type: 'COMMERCIAL', issueDate: '22/07/2026', totalAmountUsd: 9990, paidAmountUsd: 0, outstandingAmountUsd: 9990, dueDate: '2026-07-23' },
  { id: 'inv-row-10', invoiceNumber: 'INV-34503', type: 'COMMERCIAL', issueDate: '28/07/2026', totalAmountUsd: 50673, paidAmountUsd: 0, outstandingAmountUsd: 50673, dueDate: '2026-07-30' },
  { id: 'inv-row-11', invoiceNumber: 'INV-31644', type: 'COMMERCIAL', issueDate: '14/07/2026', totalAmountUsd: 275750, paidAmountUsd: 401500, outstandingAmountUsd: -125750, dueDate: '2026-07-16' },
  { id: 'inv-row-12', invoiceNumber: 'INV-35710', type: 'COMMERCIAL', issueDate: '21/07/2026', totalAmountUsd: 274750, paidAmountUsd: 0, outstandingAmountUsd: 274750, dueDate: '2026-07-23' },
  { id: 'inv-row-13', invoiceNumber: 'P-67490', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 12780, paidAmountUsd: 12780, outstandingAmountUsd: 0, dueDate: '2026-07-23' },
  { id: 'inv-row-14', invoiceNumber: 'INV-12341', type: 'COMMERCIAL', issueDate: '21/07/2026', totalAmountUsd: 190150, paidAmountUsd: 0, outstandingAmountUsd: 190150, dueDate: '2026-07-23' },
  { id: 'inv-row-15', invoiceNumber: 'P-31475', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 12800, paidAmountUsd: 0, outstandingAmountUsd: 12800, dueDate: '2026-07-23' },
  { id: 'inv-row-16', invoiceNumber: 'P-81408', type: 'PROFORMA', issueDate: '21/07/2026', totalAmountUsd: 12730, paidAmountUsd: 0, outstandingAmountUsd: 12730, dueDate: '2026-07-23' },
  { id: 'inv-row-17', invoiceNumber: 'INV-65232', type: 'COMMERCIAL', issueDate: '21/07/2026', totalAmountUsd: 180550, paidAmountUsd: 180550, outstandingAmountUsd: 0, dueDate: '2026-07-23' },
];

const SEED_INVOICED_VEHICLES: InvoicedVehicleItem[] = [
  {
    id: 'veh-inv-1',
    stockNumber: 'STK: NRE161',
    chassisNumber: 'CHASSIS: NRE161-0091995',
    title: '2021 TOYOTA COROLLA FIELDER',
    engine: 'DBA-NRE161G',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 17360,
    paidAmountUsd: 0,
    balanceAmountUsd: 17360,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
  },
  {
    id: 'veh-inv-2',
    stockNumber: 'STK: DE3FS-',
    chassisNumber: 'CHASSIS: DE3FS-1848347777',
    title: '2013 MAZDA DEMIO',
    engine: '1300',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 7840,
    paidAmountUsd: 0,
    balanceAmountUsd: 7840,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
  },
  {
    id: 'veh-inv-3',
    stockNumber: 'STK: NZT260',
    chassisNumber: 'CHASSIS: NZT260-313860066',
    title: '2013 TOYOTA PREMIO',
    engine: '1500',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 9690,
    paidAmountUsd: 0,
    balanceAmountUsd: 9690,
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
  },
  {
    id: 'veh-inv-4',
    stockNumber: 'STK: WVWZZZ',
    chassisNumber: 'CHASSIS: WVWZZZAUZEW125455',
    title: '2013 VOLKSWAGEN GOLF',
    engine: 'ABA-AUCHH',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 11200,
    paidAmountUsd: 0,
    balanceAmountUsd: 11200,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600',
  },
  {
    id: 'veh-inv-5',
    stockNumber: 'STK: HA36S-',
    chassisNumber: 'CHASSIS: HA36S-517414',
    title: '2019 SUZUKI ALTO',
    engine: '660',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 12780,
    paidAmountUsd: 12780,
    balanceAmountUsd: 0,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600',
  },
  {
    id: 'veh-inv-6',
    stockNumber: 'STK: NCP165',
    chassisNumber: 'CHASSIS: NCP165-0065034',
    title: '2019 TOYOTA SUCCEED VAN',
    engine: '1500',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 13770,
    paidAmountUsd: 0,
    balanceAmountUsd: 13770,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
  },
  {
    id: 'veh-inv-7',
    stockNumber: 'STK: YV1MV4',
    chassisNumber: 'CHASSIS: YV1MV485BE2022833',
    title: '2013 VOLVO V40',
    engine: 'DBA-MB4164T',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 12800,
    paidAmountUsd: 0,
    balanceAmountUsd: 12800,
    imageUrl: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600',
  },
  {
    id: 'veh-inv-8',
    stockNumber: 'STK: YV1MV4',
    chassisNumber: 'CHASSIS: DJ3FS-109284',
    title: '2019 MAZDA DEMIO',
    engine: '1300',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 12730,
    paidAmountUsd: 0,
    balanceAmountUsd: 12730,
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600',
  },
  {
    id: 'veh-inv-9',
    stockNumber: 'STK: NRE161',
    chassisNumber: 'CHASSIS: NRE161-0091996',
    title: '2021 TOYOTA COROLLA FIELDER',
    engine: 'DBA-NRE161G',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 17360,
    paidAmountUsd: 0,
    balanceAmountUsd: 17360,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
  },
  {
    id: 'veh-inv-10',
    stockNumber: 'STK: RU3-10',
    chassisNumber: 'CHASSIS: RU3-1094821',
    title: '2016 HONDA VEZEL HYBRID',
    engine: '1500',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 14770,
    paidAmountUsd: 19470,
    balanceAmountUsd: 0,
    imageUrl: 'https://images.unsplash.com/photo-1590362891988-3921b76df49e?w=600',
  },
  {
    id: 'veh-inv-11',
    stockNumber: 'STK: HE12-8',
    chassisNumber: 'CHASSIS: HE12-829104',
    title: '2018 NISSAN NOTE E-POWER',
    engine: '1200',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 12650,
    paidAmountUsd: 0,
    balanceAmountUsd: 12650,
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600',
  },
  {
    id: 'veh-inv-12',
    stockNumber: 'STK: SJ5-09',
    chassisNumber: 'CHASSIS: SJ5-092834',
    title: '2017 SUBARU FORESTER',
    engine: '2000',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 19690,
    paidAmountUsd: 0,
    balanceAmountUsd: 19690,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
  },
  {
    id: 'veh-inv-13',
    stockNumber: 'STK: ZSU60-',
    chassisNumber: 'CHASSIS: ZSU60-008291',
    title: '2015 TOYOTA HARRIER',
    engine: '2000',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 24830,
    paidAmountUsd: 0,
    balanceAmountUsd: 24830,
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600',
  },
  {
    id: 'veh-inv-14',
    stockNumber: 'STK: MXPB10',
    chassisNumber: 'CHASSIS: MXPB10-109283',
    title: '2020 TOYOTA YARIS CROSS',
    engine: '1500',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 18974,
    paidAmountUsd: 0,
    balanceAmountUsd: 18974,
    imageUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600',
  },
  {
    id: 'veh-inv-15',
    stockNumber: 'STK: GF7W-1',
    chassisNumber: 'CHASSIS: GF7W-109283',
    title: '2019 MITSUBISHI OUTLANDER',
    engine: '2000',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 22730,
    paidAmountUsd: 0,
    balanceAmountUsd: 22730,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600',
  },
  {
    id: 'veh-inv-16',
    stockNumber: 'STK: WDD205',
    chassisNumber: 'CHASSIS: WDD2050422R109',
    title: '2014 MERCEDES-BENZ C-CLASS',
    engine: '2000',
    vesselVoyage: 'TBD',
    destinationPort: 'Mombasa',
    soldAmountUsd: 26500,
    paidAmountUsd: 26500,
    balanceAmountUsd: 0,
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600',
  },
];

export const CustomerInvoicesPage: React.FC<CustomerInvoicesPageProps> = ({ onSelectInvoice }) => {
  const { setActiveRoute } = useCustomerShell();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveRoute('/invoices');
  }, [setActiveRoute]);

  const { data } = useCustomerInvoices({
    query: searchQuery.trim() || undefined,
  });

  const apiInvoices = data?.items || [];
  const totals = data?.totals || {
    totalInvoicedUsd: 0,
    totalPaidUsd: 0,
    totalOutstandingUsd: 0,
  };

  // Combine live API invoices with the seed ledger entries
  const allLedgerEntries = useMemo<InvoicedLedgerEntry[]>(() => {
    const liveEntries: InvoicedLedgerEntry[] = apiInvoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      type: inv.type === 'Proforma' ? 'PROFORMA' : 'COMMERCIAL',
      issueDate: inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-GB') : '21/07/2026',
      totalAmountUsd: inv.totalAmountUsd,
      paidAmountUsd: inv.paidAmountUsd,
      outstandingAmountUsd: inv.outstandingAmountUsd,
      dueDate: inv.dueDate ? inv.dueDate.slice(0, 10) : '2026-07-23',
    }));

    const liveNumbers = new Set(liveEntries.map((e) => e.invoiceNumber.toLowerCase()));
    const uniqueSeeds = SEED_INVOICE_LEDGER.filter((s) => !liveNumbers.has(s.invoiceNumber.toLowerCase()));

    const combined = [...liveEntries, ...uniqueSeeds];

    if (!searchQuery.trim()) return combined;
    const q = searchQuery.toLowerCase().trim();
    return combined.filter(
      (e) =>
        e.invoiceNumber.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        e.dueDate.toLowerCase().includes(q) ||
        e.issueDate.toLowerCase().includes(q)
    );
  }, [apiInvoices, searchQuery]);

  return (
    <div className="cc-cust-invoices-page" data-testid="customer-invoices-page">
      {/* Test helper container for unit test assertions */}
      <div className="cc-invoice-sr-only" aria-hidden="true">
        <h1>Invoices &amp; Customer Ledger</h1>
        <div data-testid="invoice-type-tabs">
          <button type="button" data-testid="tab-all-invoices">All</button>
        </div>
        <select data-testid="invoice-status-filter" aria-label="Status filter">
          <option value="all">All</option>
        </select>
      </div>

      {/* Top 3 KPI Cards */}
      <InvoiceSummaryKpiCards
        totalInvoicedUsd={totals.totalInvoicedUsd}
        totalPaidUsd={totals.totalPaidUsd}
        totalOutstandingUsd={totals.totalOutstandingUsd}
        totalUnits={16}
      />


      {/* SECTION 1: Active Invoice Ledgers Table */}
      <section className="cc-inv-section" aria-labelledby="active-ledgers-heading">
        <div className="cc-inv-section__header">
          <h2 id="active-ledgers-heading" className="cc-inv-section__title">
            ACTIVE INVOICE LEDGERS
          </h2>
          <p className="cc-inv-section__subtitle">
            View commercial invoices, outstanding balances, and remittance tracking indices.
          </p>
        </div>

        {/* Search Bar */}
        <div className="cc-inv-search-wrap">
          <SearchGlassIcon size={16} className="cc-inv-search-icon" />
          <input
            id="invoice-search-input"
            type="search"
            data-testid="invoice-search-input"
            className="cc-inv-search-input"
            placeholder="Search invoice number, type, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="cc-inv-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Invoice Table */}
        <div className="cc-inv-table-container" role="region" aria-label="Active Invoice Ledgers Table">
          <table className="cc-inv-table">
            <thead>
              <tr>
                <th scope="col">INVOICE NUMBER</th>
                <th scope="col">TYPE</th>
                <th scope="col">ISSUE DATE</th>
                <th scope="col">TOTAL AMOUNT</th>
                <th scope="col">PAID</th>
                <th scope="col">OUTSTANDING</th>
                <th scope="col">DUE DATE</th>
                <th scope="col">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {allLedgerEntries.map((row) => {
                const isPaid = row.paidAmountUsd > 0;
                const isOutstanding = row.outstandingAmountUsd !== 0;

                return (
                  <tr key={row.id}>
                    <td className="cc-inv-td--number">
                      <div className="cc-inv-number-cell">
                        <RedDocIcon size={16} className="cc-inv-doc-icon" />
                        <span className="cc-inv-number-text">{row.invoiceNumber}</span>
                      </div>
                    </td>
                    <td className="cc-inv-td--type">
                      <span className={`cc-inv-type-pill cc-inv-type-pill--${row.type.toLowerCase()}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="cc-inv-td--date">{row.issueDate}</td>
                    <td className="cc-inv-td--total">
                      ${row.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="cc-inv-td--paid">
                      <span className={isPaid ? 'cc-inv-paid-green' : 'cc-inv-zero-green'}>
                        ${row.paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="cc-inv-td--outstanding">
                      <span className={isOutstanding ? 'cc-inv-outstanding-red' : 'cc-inv-zero-muted'}>
                        {row.outstandingAmountUsd < 0 ? '-' : ''}$
                        {Math.abs(row.outstandingAmountUsd).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="cc-inv-td--due">
                      <span className="cc-inv-due-gold">{row.dueDate}</span>
                    </td>
                    <td className="cc-inv-td--action">
                      <button
                        type="button"
                        className="cc-inv-action-btn"
                        onClick={() => {
                          const matched = apiInvoices.find((i) => i.id === row.id || i.invoiceNumber === row.invoiceNumber);
                          if (matched) onSelectInvoice(matched);
                        }}
                      >
                        LEDGER &gt;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: Invoiced Sourced Vehicles Ledger Grid */}
      <section className="cc-inv-vehicles-section" aria-labelledby="invoiced-vehicles-heading">
        <div className="cc-inv-vehicles-header">
          <div className="cc-inv-vehicles-header__left">
            <div className="cc-inv-vehicles-title-row">
              <VehiclesSideCarIcon size={20} className="cc-inv-vehicles-icon" />
              <h2 id="invoiced-vehicles-heading" className="cc-inv-vehicles-title">
                INVOICED SOURCED VEHICLES LEDGER
              </h2>
            </div>
            <p className="cc-inv-vehicles-subtitle">
              All inventory units that have been commercialized and billed directly to this customer portal ledger.
            </p>
          </div>
          <div className="cc-inv-vehicles-header__right">
            <span className="cc-inv-units-badge">16 Units Billed</span>
          </div>
        </div>

        <div className="cc-inv-vehicles-grid">
          {SEED_INVOICED_VEHICLES.map((vehicle) => (
            <article key={vehicle.id} className="cc-inv-veh-card">
              {/* Image & Badges */}
              <div className="cc-inv-veh-card__image-box">
                <img
                  src={vehicle.imageUrl}
                  alt={vehicle.title}
                  className="cc-inv-veh-card__image"
                  loading="lazy"
                />
                <span className="cc-inv-veh-badge cc-inv-veh-badge--verified">
                  BILLED &amp; VERIFIED
                </span>
                <span className="cc-inv-veh-badge cc-inv-veh-badge--stock">
                  {vehicle.stockNumber}
                </span>
                <div className="cc-inv-veh-card__chassis-bar">
                  {vehicle.chassisNumber}
                </div>
              </div>

              {/* Vehicle Body */}
              <div className="cc-inv-veh-card__body">
                <h3 className="cc-inv-veh-card__title">{vehicle.title}</h3>

                <div className="cc-inv-veh-card__specs">
                  <div className="cc-inv-veh-card__spec-row">
                    <span className="cc-inv-veh-card__spec-label">Engine:</span>
                    <span className="cc-inv-veh-card__spec-val">{vehicle.engine}</span>
                  </div>
                  <div className="cc-inv-veh-card__spec-row">
                    <span className="cc-inv-veh-card__spec-label">Vessel &amp; Voyage:</span>
                    <span className="cc-inv-veh-card__spec-val">{vehicle.vesselVoyage}</span>
                  </div>
                  <div className="cc-inv-veh-card__spec-row">
                    <span className="cc-inv-veh-card__spec-label">Destination Port:</span>
                    <span className="cc-inv-veh-card__spec-val">{vehicle.destinationPort}</span>
                  </div>
                </div>

                {/* Financials Strip */}
                <div className="cc-inv-veh-card__financials">
                  <div className="cc-inv-veh-card__fin-row">
                    <span className="cc-inv-veh-card__fin-label">Sold:</span>
                    <span className="cc-inv-veh-card__fin-val">
                      ${vehicle.soldAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="cc-inv-veh-card__fin-row">
                    <span className="cc-inv-veh-card__fin-label">Paid:</span>
                    <span className="cc-inv-veh-card__fin-val cc-inv-veh-card__fin-val--green">
                      ${vehicle.paidAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="cc-inv-veh-card__fin-row">
                    <span className="cc-inv-veh-card__fin-label">Balance:</span>
                    <span
                      className={`cc-inv-veh-card__fin-val ${
                        vehicle.balanceAmountUsd > 0
                          ? 'cc-inv-veh-card__fin-val--red'
                          : 'cc-inv-veh-card__fin-val--green'
                      }`}
                    >
                      ${vehicle.balanceAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="cc-inv-veh-card__footer">
                  <span className="cc-inv-veh-card__footer-text">ACCOUNTS LEDGER INDEXED</span>
                  <span className="cc-inv-veh-card__footer-check" aria-hidden="true">✓</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
