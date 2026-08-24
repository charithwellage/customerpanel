import React, { useState, useEffect } from 'react';
import { useCustomerShell } from '../shell/index.js';
import { formatInvoiceDate, formatUsdAmount, getInvoiceStatusBadgeClass } from './formatters.js';
import { useCustomerInvoiceDetail } from './useCustomerInvoiceDetail.js';
import { useCustomerInvoiceDocument } from './useCustomerInvoiceDocument.js';
import { BankWireInstructionsCard } from './components/BankWireInstructionsCard.js';
import { InvoiceLineItemsTable } from './components/InvoiceLineItemsTable.js';
import { PaymentAllocationsTable } from './components/PaymentAllocationsTable.js';
import { PrintableInvoiceModal } from './components/PrintableInvoiceModal.js';

export interface CustomerInvoiceDetailPageProps {
  invoiceId: string;
  onBack: () => void;
}

export const CustomerInvoiceDetailPage: React.FC<CustomerInvoiceDetailPageProps> = ({
  invoiceId,
  onBack,
}) => {
  const { setActiveRoute } = useCustomerShell();
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  useEffect(() => {
    setActiveRoute(`/invoices/${invoiceId}`);
  }, [setActiveRoute, invoiceId]);

  const { data: invoice, isLoading, error, refetch } = useCustomerInvoiceDetail(invoiceId);
  const { data: docData, isLoading: isDocLoading } = useCustomerInvoiceDocument(invoiceId, {
    enabled: isDocModalOpen,
  });

  if (isLoading) {
    return (
      <div className="cc-invoice-detail-page cc-invoice-detail-page--loading" data-testid="invoice-detail-loading">
        <div className="cc-invoice-spinner" />
        <p>Loading invoice & financial breakdown...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="cc-invoice-detail-page" data-testid="invoice-detail-error">
        <div className="cc-cust-invoices-error" role="alert">
          <span className="cc-cust-invoices-error-icon" aria-hidden="true">⚠️</span>
          <div className="cc-cust-invoices-error-text">
            <h3>Invoice Not Found</h3>
            <p>{error?.message || `Invoice '${invoiceId}' could not be loaded or is not accessible.`}</p>
          </div>
          <div className="cc-invoice-detail-error-actions">
            <button
              type="button"
              className="cc-cust-invoices-retry-btn"
              data-testid="retry-detail-btn"
              onClick={() => refetch()}
            >
              Retry
            </button>
            <button
              type="button"
              className="cc-invoice-back-btn"
              data-testid="back-to-invoices-btn"
              onClick={onBack}
            >
              ← Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isProforma = invoice.type === 'Proforma';
  const formattedTotal = formatUsdAmount(invoice.totalAmountUsd);
  const formattedPaid = formatUsdAmount(invoice.paidAmountUsd);
  const formattedOutstanding = formatUsdAmount(invoice.outstandingAmountUsd);

  return (
    <div className="cc-invoice-detail-page" data-testid="customer-invoice-detail-page">
      {/* Top Navigation */}
      <div className="cc-invoice-detail-nav">
        <button
          type="button"
          className="cc-invoice-back-link"
          data-testid="invoice-detail-back-btn"
          onClick={onBack}
        >
          ← Back to Invoices
        </button>
        <span className="cc-invoice-detail-breadcrumb">/ {invoice.invoiceNumber}</span>
      </div>

      {/* Hero Header */}
      <header className="cc-invoice-detail-header" data-testid="invoice-detail-header">
        <div className="cc-invoice-detail-header__main">
          <div className="cc-invoice-detail-header__badges">
            <span className={`cc-invoice-type-pill ${isProforma ? 'cc-invoice-type-pill--pi' : 'cc-invoice-type-pill--comm'}`}>
              {isProforma ? 'Proforma Invoice (PI)' : 'Commercial Invoice'}
            </span>
            <span className={`cc-invoice-badge ${getInvoiceStatusBadgeClass(invoice.status)}`} data-testid="invoice-detail-status">
              {invoice.status}
            </span>
          </div>
          <h1 className="cc-invoice-detail-title" data-testid="invoice-detail-number">
            {invoice.invoiceNumber}
          </h1>
          <p className="cc-invoice-detail-subtitle">
            Vehicle Reference: <strong>{invoice.vehicle.year} {invoice.vehicle.make} {invoice.vehicle.model}</strong> ({invoice.vehicle.chassisNumber})
          </p>
        </div>

        <div className="cc-invoice-detail-header__actions">
          <button
            type="button"
            className="cc-invoice-action-btn cc-invoice-action-btn--print"
            data-testid="open-printable-doc-btn"
            onClick={() => setIsDocModalOpen(true)}
          >
            🖨️ View / Print Document
          </button>
        </div>
      </header>

      {/* Financial Overview KPI Row */}
      <div className="cc-invoice-detail-kpi-grid">
        <div className="cc-invoice-detail-kpi-card" data-testid="detail-kpi-total">
          <span className="cc-invoice-detail-kpi-lbl">Total Invoiced Amount</span>
          <span className="cc-invoice-detail-kpi-val">{formattedTotal}</span>
          <span className="cc-invoice-detail-kpi-sub">Currency: {invoice.currency}</span>
        </div>

        <div className="cc-invoice-detail-kpi-card" data-testid="detail-kpi-paid">
          <span className="cc-invoice-detail-kpi-lbl">Total Paid / Allocated</span>
          <span className="cc-invoice-detail-kpi-val cc-invoice-detail-kpi-val--paid">{formattedPaid}</span>
          <span className="cc-invoice-detail-kpi-sub">{invoice.allocations.length} confirmed allocation(s)</span>
        </div>

        <div
          className={`cc-invoice-detail-kpi-card ${
            invoice.outstandingAmountUsd > 0 ? 'cc-invoice-detail-kpi-card--outstanding' : 'cc-invoice-detail-kpi-card--settled'
          }`}
          data-testid="detail-kpi-outstanding"
        >
          <span className="cc-invoice-detail-kpi-lbl">Balance Outstanding</span>
          <span className="cc-invoice-detail-kpi-val">{formattedOutstanding}</span>
          <span className="cc-invoice-detail-kpi-sub">
            {invoice.outstandingAmountUsd > 0 ? 'Due for full vehicle release' : 'Fully settled'}
          </span>
        </div>
      </div>

      {/* Deposit & 72h Payment Deadline Notice (RULE-07) */}
      {isProforma && (
        <div className="cc-invoice-pi-banner" data-testid="proforma-deadline-banner">
          <div className="cc-invoice-pi-banner__icon">⏱️</div>
          <div className="cc-invoice-pi-banner__content">
            <h3>72-Hour Payment Deadline & Deposit Requirement</h3>
            <p>
              Under CarChief trade rules, a minimum deposit of{' '}
              <strong>
                {invoice.depositRequiredUsd !== undefined ? `${formatUsdAmount(invoice.depositRequiredUsd)} USD` : 'the required amount'}
              </strong>{' '}
              must be remitted via wire transfer by{' '}
              <strong>{formatInvoiceDate(invoice.paymentDeadline || invoice.dueDate)}</strong> to lock this vehicle reservation.
            </p>
            {invoice.isExpired && (
              <p className="cc-invoice-pi-banner__expired" data-testid="pi-expired-alert">
                ⚠️ This Proforma Invoice has expired. The reservation has been released to sale.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Itemized Table & Payment Allocations */}
      <div className="cc-invoice-detail-grid">
        <div className="cc-invoice-detail-main">
          {/* Line items table */}
          <InvoiceLineItemsTable
            lineItems={invoice.lineItems}
            totalAmountUsd={invoice.totalAmountUsd}
            paidAmountUsd={invoice.paidAmountUsd}
            outstandingAmountUsd={invoice.outstandingAmountUsd}
          />

          {/* Payment allocations table */}
          <PaymentAllocationsTable
            allocations={invoice.allocations}
            paidAmountUsd={invoice.paidAmountUsd}
          />
        </div>

        {/* Sidebar: Bank Details & Metadata */}
        <aside className="cc-invoice-detail-sidebar">
          {/* Bank wire instructions */}
          <BankWireInstructionsCard
            bankDetails={invoice.bankDetails}
            referenceFallback={invoice.invoiceNumber}
            depositRequiredUsd={invoice.depositRequiredUsd}
            isProforma={isProforma}
          />

          {/* Key Dates & Information */}
          <div className="cc-invoice-meta-card" data-testid="invoice-meta-card">
            <h4 className="cc-invoice-meta-card__title">Invoice Information</h4>
            <dl className="cc-invoice-meta-list">
              <div className="cc-invoice-meta-row">
                <dt>Invoice Reference:</dt>
                <dd><strong>{invoice.invoiceNumber}</strong></dd>
              </div>
              <div className="cc-invoice-meta-row">
                <dt>Issue Date:</dt>
                <dd>{formatInvoiceDate(invoice.issuedAt)}</dd>
              </div>
              <div className="cc-invoice-meta-row">
                <dt>{isProforma ? 'Payment Deadline:' : 'Due Date:'}</dt>
                <dd>{formatInvoiceDate(invoice.dueDate || invoice.paymentDeadline)}</dd>
              </div>
              <div className="cc-invoice-meta-row">
                <dt>Vehicle Chassis:</dt>
                <dd>{invoice.vehicle.chassisNumber}</dd>
              </div>
              <div className="cc-invoice-meta-row">
                <dt>Customer Account:</dt>
                <dd>{invoice.customerId}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      {/* Printable Modal Projection */}
      <PrintableInvoiceModal
        document={docData || null}
        isOpen={isDocModalOpen}
        isLoading={isDocLoading}
        onClose={() => setIsDocModalOpen(false)}
      />
    </div>
  );
};
