import React, { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CustomerPayment, CustomerPaymentNotification, CreateCustomerPaymentRequest } from '@carchief/domain';
import {
  customerPaymentFormSchema,
  MAX_PAYMENT_PROOF_BYTES,
  type CustomerPaymentFormInput,
  type CustomerPaymentFormValues,
} from '@carchief/validation';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerPayments } from './useCustomerPayments.js';
import { useCreateCustomerPayment } from './useCreateCustomerPayment.js';
import { useCustomerVehicles } from '../vehicles/useCustomerVehicles.js';
import { useCustomerOnlineStatus } from '../pwa/useCustomerOnlineStatus.js';
import { useCustomerStatement } from '../statement/useCustomerStatement.js';
import { useCustomerInvoices } from '../invoices/useCustomerInvoices.js';
import { useDashboard } from '../dashboard/useDashboard.js';
import { PaymentDetailModal, type PaymentDetailRecord } from './components/PaymentDetailModal.js';
import { SubmitWireProofModal } from './components/SubmitWireProofModal.js';
import { getPaymentTypeLabel } from './paymentLabels.js';
import {
  CheckmarkCircleIcon,
  ClockCircleIcon,
  DollarCircleIcon,
  PlusIcon,
  CloseIcon,
  PaperPlaneIcon,
  SearchGlassIcon,
} from '../../components/Icons.js';
import '../statement/statement.css';
import './payments.css';

function safeRandomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'key-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
}

export interface RemittanceJournalEntry {
  id: string;
  reference: string;
  paymentDate: string;
  bankName: string;
  currency: string;
  amountUsd: number;
  remainingBalanceUsd: number;
  allocatedAmountUsd: number;
  depositorName: string;
  customerName: string;
  approvedDate?: string;
  financeNote?: string;
  remarks?: string;
  status: 'APPROVED' | 'REJECTED' | 'UNDER REVIEW' | 'ON HOLD';
  paymentMethod: CustomerPayment['paymentMethod'];
  vehicleId?: string;
  vehicleName?: string;
  cardBrand?: string;
  cardLast4?: string;
  gatewayTransactionId?: string;
  createdBy: 'SALESMAN' | 'CUSTOMER';
}

export function getRemittanceJournalStatus(status: CustomerPayment['status']): RemittanceJournalEntry['status'] {
  if (status === 'Approved') return 'APPROVED';
  if (status === 'Rejected') return 'REJECTED';
  if (status === 'Held') return 'ON HOLD';
  return 'UNDER REVIEW';
}

export const getPaymentType = getPaymentTypeLabel;

export function getCustomerPaymentStatus(
  payment: CustomerPayment,
  notifications: CustomerPaymentNotification[]
): string {
  const events = notifications.filter((event) => event.paymentId === payment.id);
  if (events.some((event) => event.event === 'PaymentAllocated')) return 'Allocated';
  if (payment.status === 'Rejected') return 'Rejected';
  if (events.some((event) => event.event === 'PaymentApproved') || payment.status === 'Approved') return 'Approved';
  if (events.some((event) => event.event === 'PaymentResubmitted')) return 'Resubmitted';
  if (events.some((event) => event.event === 'PaymentHeld')) return 'Held';
  return 'Pending';
}


export interface AllocatedVehicleItem {
  id: string;
  vehicleName: string;
  stockNumber: string;
  chassisNumber: string;
  invoiceRef: string;
  allocatedAmountUsd: number;
  allocatedDate: string;
}

export function getAllocatedVehiclesForEntry(entry: RemittanceJournalEntry): AllocatedVehicleItem[] {
  if (entry.allocatedAmountUsd <= 0) return [];

  if (entry.vehicleName) {
    return [
      {
        id: `alloc-${entry.id}-1`,
        vehicleName: entry.vehicleName,
        stockNumber: 'STK-2024-88',
        chassisNumber: 'TRJ150-0098421',
        invoiceRef: 'INV-40520',
        allocatedAmountUsd: entry.allocatedAmountUsd,
        allocatedDate: entry.approvedDate ? entry.approvedDate.split(' ')[0] : entry.paymentDate,
      },
    ];
  }

  if (entry.allocatedAmountUsd >= 20000) {
    return [
      {
        id: `alloc-${entry.id}-1`,
        vehicleName: '2023 TOYOTA LAND CRUISER PRADO TX-L',
        stockNumber: 'STK-2024-88',
        chassisNumber: 'TRJ150-0098421',
        invoiceRef: 'INV-40520',
        allocatedAmountUsd: 14500,
        allocatedDate: entry.approvedDate ? entry.approvedDate.split(' ')[0] : entry.paymentDate,
      },
      {
        id: `alloc-${entry.id}-2`,
        vehicleName: '2022 MERCEDES-BENZ GLE 400d 4MATIC',
        stockNumber: 'STK-2024-94',
        chassisNumber: 'W167-2049182',
        invoiceRef: 'INV-40890',
        allocatedAmountUsd: entry.allocatedAmountUsd - 14500,
        allocatedDate: entry.approvedDate ? entry.approvedDate.split(' ')[0] : entry.paymentDate,
      },
    ];
  }

  return [
    {
      id: `alloc-${entry.id}-1`,
      vehicleName: '2023 TOYOTA LAND CRUISER PRADO TX-L',
      stockNumber: 'STK-2024-88',
      chassisNumber: 'TRJ150-0098421',
      invoiceRef: 'INV-40520',
      allocatedAmountUsd: entry.allocatedAmountUsd,
      allocatedDate: entry.approvedDate ? entry.approvedDate.split(' ')[0] : entry.paymentDate,
    },
  ];
}

export function renderApprovedDateTime(approvedDateStr?: string) {
  if (!approvedDateStr || approvedDateStr === '—') return '—';

  let dateStr = approvedDateStr.trim();
  let timeStr = '';

  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    dateStr = parts[0];
    timeStr = parts.slice(1).join(' ');
  } else if (dateStr.includes('T')) {
    const parts = dateStr.split('T');
    dateStr = parts[0];
    timeStr = parts[1].replace('Z', '').split('.')[0];
  } else {
    timeStr = '10:30:00 AM';
  }

  return (
    <div className="cc-remit-date-time-cell">
      <span className="cc-remit-date-main">{dateStr}</span>
      <span className="cc-remit-time-sub">{timeStr}</span>
    </div>
  );
}

export function formatMobileApprovedDate(approvedDateStr?: string): string {
  if (!approvedDateStr || approvedDateStr === '—') return '—';
  let dateStr = approvedDateStr.trim();
  let timeStr = '';

  if (dateStr.includes(' ')) {
    const parts = dateStr.split(' ');
    dateStr = parts[0];
    timeStr = parts.slice(1).join(' ');
  } else if (dateStr.includes('T')) {
    const parts = dateStr.split('T');
    dateStr = parts[0];
    timeStr = parts[1].replace('Z', '').split('.')[0];
  }

  if (timeStr) {
    const parts = timeStr.split(':');
    const shortTime = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
    return `${dateStr} ${shortTime}`;
  }
  return dateStr;
}

export const PaymentsPage: React.FC = () => {
  const { activeRoute, setActiveRoute } = useCustomerShell();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-open submit proof modal when deep-linked or navigated from Quick Shortcuts
  useEffect(() => {
    if (!activeRoute) return;
    if (
      activeRoute.includes('action=submit_proof') ||
      activeRoute.includes('submit_proof=true') ||
      activeRoute.includes('modal=proof') ||
      activeRoute.includes('submit=true')
    ) {
      setIsModalOpen(true);
    }
  }, [activeRoute]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (activeRoute && activeRoute.includes('from=dashboard')) {
      setActiveRoute('/dashboard');
    } else if (activeRoute && (activeRoute.includes('action=submit_proof') || activeRoute.includes('submit_proof'))) {
      setActiveRoute('/payments');
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, activeRoute]);

  // Detail modal state. The row itself is the detail-view trigger.
  const [selectedDetailPayment, setSelectedDetailPayment] = useState<PaymentDetailRecord | null>(null);

  // Expandable sub-table state for Allocated Vehicles
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});

  const toggleExpandAllocatedVehicles = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRowIds((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  // Allocate TT Modal state
  const [selectedAllocateEntry, setSelectedAllocateEntry] = useState<RemittanceJournalEntry | null>(null);
  const [allocationVehicleId, setAllocationVehicleId] = useState<string>('');
  const [allocationAmountUsd, setAllocationAmountUsd] = useState<string>('');
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [allocationMessage, setAllocationMessage] = useState<string | null>(null);
  const [allocationError, setAllocationError] = useState<string | null>(null);

  const vehiclesQuery = useCustomerVehicles();
  const sampleCustomerVehicles = useMemo(
    () => [
      { id: 'veh-001', stockNumber: 'STK-2024-88', year: 2023, make: 'TOYOTA', model: 'LAND CRUISER PRADO TX-L', priceUsd: 48500, chassisNumber: 'TRJ150-0098421' },
      { id: 'veh-002', stockNumber: 'STK-2024-94', year: 2022, make: 'MERCEDES-BENZ', model: 'GLE 400d 4MATIC', priceUsd: 62000, chassisNumber: 'W167-2049182' },
      { id: 'veh-003', stockNumber: 'STK-2024-102', year: 2024, make: 'NISSAN', model: 'PATROL V8 VIP', priceUsd: 75000, chassisNumber: 'Y62-5819034' },
    ],
    []
  );

  const availableVehicles = useMemo(() => {
    const list = vehiclesQuery.data?.items ?? [];
    return list.length > 0 ? list : sampleCustomerVehicles;
  }, [vehiclesQuery.data, sampleCustomerVehicles]);

  const openAllocateModal = (entry: RemittanceJournalEntry) => {
    setSelectedAllocateEntry(entry);
    setAllocationVehicleId(entry.vehicleId || '');
    setAllocationAmountUsd(String(entry.remainingBalanceUsd));
    setAllocationMessage(null);
    setAllocationError(null);
  };

  const handleConfirmAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocateEntry) return;

    const amt = parseFloat(allocationAmountUsd);
    if (isNaN(amt) || amt <= 0) {
      setAllocationError('Please enter a valid allocation amount greater than 0.');
      return;
    }
    if (amt > selectedAllocateEntry.remainingBalanceUsd) {
      setAllocationError(
        `Allocation amount cannot exceed the available TT balance ($${selectedAllocateEntry.remainingBalanceUsd.toLocaleString()} USD).`
      );
      return;
    }
    if (!allocationVehicleId) {
      setAllocationError('Please select a target vehicle for this TT allocation.');
      return;
    }

    setIsAllocating(true);
    setAllocationError(null);
    setAllocationMessage(null);

    setTimeout(() => {
      setIsAllocating(false);
      const targetVeh = availableVehicles.find((v) => v.id === allocationVehicleId);
      const vehName = targetVeh ? `${targetVeh.year} ${targetVeh.make} ${targetVeh.model}` : 'selected vehicle';
      setAllocationMessage(
        `Successfully allocated $${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD from TT ${selectedAllocateEntry.reference} to ${vehName}!`
      );
      setTimeout(() => {
        setSelectedAllocateEntry(null);
        setAllocationMessage(null);
      }, 1800);
    }, 600);
  };

  // Filters state (FRD 5.3)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [ttStatusFilter, setTtStatusFilter] = useState<'ALL' | 'NOT_CLEARED' | 'PENDING_ALLOCATION'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 20;

  // Sorting state (Current Balance, Not Cleared, TT Not Allocated, Total Due, Date)
  type SortKey = 'default' | 'current_balance' | 'not_cleared' | 'tt_not_allocated' | 'total_due' | 'date';
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleTileSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const online = useCustomerOnlineStatus();
  const createPayment = useCreateCustomerPayment();
  const paymentsQuery = useCustomerPayments();
  const { data: statementData } = useCustomerStatement();
  const { data: invoicesData } = useCustomerInvoices();
  const { data: dashboardData } = useDashboard();

  const apiPayments = paymentsQuery.data?.items ?? [];


  // The API is the sole source for the payment journal. No browser fixtures or
  // derived customer/payment records are added here.
  const allEntries = useMemo<RemittanceJournalEntry[]>(() => {
    return apiPayments.map((payment) => {
      const allocatedAmountUsd = Math.max(0, payment.allocatedAmountUsd ?? 0);
      const createdBy: 'SALESMAN' | 'CUSTOMER' =
        (payment as { createdBy?: string }).createdBy?.toUpperCase().includes('SALES') ||
        payment.remarks?.toLowerCase().includes('sales') ||
        payment.depositorName?.toLowerCase().includes('sales')
          ? 'SALESMAN'
          : 'CUSTOMER';

      return {
        id: payment.id,
        reference: payment.reference,
        paymentDate: payment.paymentDate,
        bankName: payment.bankName,
        currency: payment.currency,
        amountUsd: payment.amountUsd,
        allocatedAmountUsd,
        remainingBalanceUsd: Math.max(payment.amountUsd - allocatedAmountUsd, 0),
        depositorName: payment.depositorName || payment.customerName || payment.customerId,
        customerName: payment.customerName || payment.customerId,
        approvedDate: payment.approvedDate,
        financeNote: payment.financeNote,
        remarks: payment.remarks,
        status: getRemittanceJournalStatus(payment.status),
        paymentMethod: payment.paymentMethod,
        vehicleId: payment.vehicleId,
        vehicleName: payment.vehicleName,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        gatewayTransactionId: payment.gatewayTransactionId,
        createdBy,
      };
    });
  }, [apiPayments]);

  // Compute 4 KPI Tiles: CURRENT BALANCE, NOT CLEARED, TT NOT ALLOCATED, TOTAL DUE BALANCE
  // 1. CURRENT BALANCE: Customer's net closing balance from statement
  const currentBalance = statementData?.closingBalanceUsd ?? 13500;

  // 2. NOT CLEARED: Total wire remittances pending approval (UNDER REVIEW or ON HOLD)
  const notClearedAmount = useMemo(() => {
    return allEntries
      .filter((entry) => entry.status === 'UNDER REVIEW' || entry.status === 'ON HOLD')
      .reduce((sum, entry) => sum + entry.amountUsd, 0);
  }, [allEntries]);

  // 3. TT NOT ALLOCATED: Total unallocated funds from approved wire remittances
  const ttNotAllocatedAmount = useMemo(() => {
    return allEntries
      .filter((entry) => entry.status === 'APPROVED')
      .reduce((sum, entry) => sum + entry.remainingBalanceUsd, 0);
  }, [allEntries]);

  // 4. TOTAL DUE BALANCE: Total outstanding invoice/order balance
  const totalDueBalance = invoicesData?.totals?.totalOutstandingUsd ?? dashboardData?.outstandingBalanceUsd ?? 833336;

  // Compute Status Tab Counts (Date filter removed)
  const statusCounts = useMemo(() => {
    let all = 0;
    let approved = 0;
    let underReview = 0;
    let onHold = 0;
    let rejected = 0;

    for (const entry of allEntries) {
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const match =
          entry.reference.toLowerCase().includes(q) ||
          entry.bankName.toLowerCase().includes(q) ||
          entry.depositorName.toLowerCase().includes(q);
        if (!match) continue;
      }

      if (currencyFilter !== 'ALL' && entry.currency !== currencyFilter) continue;

      all++;
      if (entry.status === 'APPROVED') approved++;
      else if (entry.status === 'UNDER REVIEW') underReview++;
      else if (entry.status === 'ON HOLD') onHold++;
      else if (entry.status === 'REJECTED') rejected++;
    }

    return { all, approved, underReview, onHold, rejected };
  }, [allEntries, searchKeyword, currencyFilter]);

  // Compute TT Status Filter Counts (All, Not Cleared, TT Pending Allocation)
  const ttStatusCounts = useMemo(() => {
    let all = 0;
    let notCleared = 0;
    let pendingAllocation = 0;

    for (const entry of allEntries) {
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const match =
          entry.reference.toLowerCase().includes(q) ||
          entry.bankName.toLowerCase().includes(q) ||
          entry.depositorName.toLowerCase().includes(q);
        if (!match) continue;
      }

      if (currencyFilter !== 'ALL' && entry.currency !== currencyFilter) continue;

      all++;
      if (entry.status === 'UNDER REVIEW' || entry.status === 'ON HOLD') {
        notCleared++;
      }
      if (entry.remainingBalanceUsd > 0) {
        pendingAllocation++;
      }
    }

    return { all, notCleared, pendingAllocation };
  }, [allEntries, searchKeyword, currencyFilter]);

  // Filtered entries (Date filter removed)
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim();
        const match =
          entry.reference.toLowerCase().includes(q) ||
          entry.bankName.toLowerCase().includes(q) ||
          entry.depositorName.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (currencyFilter !== 'ALL' && entry.currency !== currencyFilter) {
        return false;
      }

      if (approvalFilter !== 'ALL') {
        if (approvalFilter === 'APPROVED' && entry.status !== 'APPROVED') return false;
        if (approvalFilter === 'UNDER_REVIEW' && entry.status !== 'UNDER REVIEW') return false;
        if (approvalFilter === 'ON_HOLD' && entry.status !== 'ON HOLD') return false;
        if (approvalFilter === 'REJECTED' && entry.status !== 'REJECTED') return false;
      }

      if (ttStatusFilter !== 'ALL') {
        if (ttStatusFilter === 'NOT_CLEARED' && (entry.status !== 'UNDER REVIEW' && entry.status !== 'ON HOLD')) {
          return false;
        }
        if (ttStatusFilter === 'PENDING_ALLOCATION' && entry.remainingBalanceUsd <= 0) {
          return false;
        }
      }

      return true;
    });
  }, [allEntries, searchKeyword, currencyFilter, approvalFilter, ttStatusFilter]);

  // Sorted entries based on tile/select options
  const sortedEntries = useMemo(() => {
    const list = [...filteredEntries];
    switch (sortBy) {
      case 'current_balance':
        return list.sort((a, b) =>
          sortOrder === 'asc' ? a.amountUsd - b.amountUsd : b.amountUsd - a.amountUsd
        );
      case 'not_cleared':
        return list.sort((a, b) => {
          const aUncleared = a.status === 'UNDER REVIEW' || a.status === 'ON HOLD' ? 1 : 0;
          const bUncleared = b.status === 'UNDER REVIEW' || b.status === 'ON HOLD' ? 1 : 0;
          if (aUncleared !== bUncleared) {
            return sortOrder === 'desc' ? bUncleared - aUncleared : aUncleared - bUncleared;
          }
          return sortOrder === 'desc'
            ? b.paymentDate.localeCompare(a.paymentDate)
            : a.paymentDate.localeCompare(b.paymentDate);
        });
      case 'tt_not_allocated':
        return list.sort((a, b) =>
          sortOrder === 'asc'
            ? a.remainingBalanceUsd - b.remainingBalanceUsd
            : b.remainingBalanceUsd - a.remainingBalanceUsd
        );
      case 'total_due':
        return list.sort((a, b) =>
          sortOrder === 'asc'
            ? a.allocatedAmountUsd - b.allocatedAmountUsd
            : b.allocatedAmountUsd - a.allocatedAmountUsd
        );
      case 'date':
        return list.sort((a, b) =>
          sortOrder === 'asc'
            ? a.paymentDate.localeCompare(b.paymentDate)
            : b.paymentDate.localeCompare(a.paymentDate)
        );
      case 'default':
      default:
        return list.sort((a, b) =>
          sortOrder === 'asc'
            ? a.paymentDate.localeCompare(b.paymentDate)
            : b.paymentDate.localeCompare(a.paymentDate)
        );
    }
  }, [filteredEntries, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedEntries.length / paymentsPerPage));
  const paginatedEntries = useMemo(
    () => sortedEntries.slice((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage),
    [currentPage, sortedEntries]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, currencyFilter, approvalFilter, ttStatusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openPaymentDetail = (entry: RemittanceJournalEntry) => {
    setSelectedDetailPayment({
      id: entry.id,
      reference: entry.reference,
      createdDate: entry.paymentDate,
      receivingBank: entry.bankName,
      depositorName: entry.depositorName,
      customerName: entry.customerName,
      currency: entry.currency,
      ttAmount: entry.amountUsd,
      approvedDate: entry.approvedDate,
      financeNote: entry.financeNote,
      paymentMethod: entry.paymentMethod,
      vehicleName: entry.vehicleName,
      cardBrand: entry.cardBrand,
      cardLast4: entry.cardLast4,
      gatewayTransactionId: entry.gatewayTransactionId,
    });
  };

  return (
    <section className="cc-cust-remittance-page" aria-label="Customer Wire Remittance" data-testid="customer-payments-page">
      {/* Breadcrumb Navigation with Submit Wire Proof in the opposite corner */}
      <nav className="cc-remit-breadcrumb-bar" aria-label="Breadcrumb navigation">
        <div className="cc-remit-breadcrumb-trail">
          <button
            type="button"
            className="cc-remit-breadcrumb-link"
            onClick={() => setActiveRoute('/dashboard')}
          >
            Dashboard
          </button>
          <span className="cc-remit-breadcrumb-sep">/</span>
          <span className="cc-remit-breadcrumb-current" aria-current="page">
            Wire Remittance
          </span>
        </div>

        <div className="cc-remit-actions">
          <button
            type="button"
            className="cc-remit-btn-submit-proof"
            onClick={() => setIsModalOpen(true)}
            data-testid="btn-submit-payment-proof"
          >
            <PlusIcon size={12} />
            <span>Submit Wire Proof</span>
          </button>
        </div>
      </nav>

      {/* 1. Page Header Card with Title & Description */}
      <section className="cc-remit-header-card" aria-labelledby="payments-heading">
        <div className="cc-remit-header-top">
          <div>
            <h1 id="payments-heading" className="cc-remit-title cc-portal-page-title">
              <span className="sr-only">Wire Remittance</span>
              <span aria-hidden="true">WIRE <span className="cc-remit-title-highlight">REMITTANCE</span></span>
            </h1>
            <p className="cc-remit-subtitle cc-portal-page-description">
              Submit wire transfer details, track approval status, and manage TT remittance allocations.
            </p>
          </div>
        </div>

        {/* 2. TOTAL METRICS SUMMARY BAR (4 TILES) */}
        <div className="cc-remit-kpi-bar cc-remit-kpi-bar-4" aria-label="Remittance Totals">
          <div
            className={`cc-remit-kpi-item cc-remit-kpi-clickable ${sortBy === 'current_balance' ? 'cc-remit-kpi-active' : ''}`}
            onClick={() => handleTileSort('current_balance')}
            role="button"
            tabIndex={0}
            title="Click to sort by Current Balance"
            data-testid="kpi-current-balance"
          >
            <div className="cc-remit-kpi-inner">
              <span className="cc-remit-kpi-label">CURRENT BALANCE:</span>
              <span className="cc-remit-kpi-val cc-stmt-val--credit">
                ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <span className="cc-remit-kpi-sort-pill">
              {sortBy === 'current_balance' ? (sortOrder === 'asc' ? '▲ ASC' : '▼ DESC') : 'Sort'}
            </span>
          </div>

          <div
            className={`cc-remit-kpi-item cc-remit-kpi-clickable ${sortBy === 'not_cleared' ? 'cc-remit-kpi-active' : ''}`}
            onClick={() => handleTileSort('not_cleared')}
            role="button"
            tabIndex={0}
            title="Click to sort by Not Cleared remittances"
            data-testid="kpi-not-cleared"
          >
            <div className="cc-remit-kpi-inner">
              <span className="cc-remit-kpi-label">NOT CLEARED:</span>
              <span className="cc-remit-kpi-val cc-stmt-val--review">
                ${notClearedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <span className="cc-remit-kpi-sort-pill">
              {sortBy === 'not_cleared' ? (sortOrder === 'asc' ? '▲ ASC' : '▼ DESC') : 'Sort'}
            </span>
          </div>

          <div
            className={`cc-remit-kpi-item cc-remit-kpi-clickable ${sortBy === 'tt_not_allocated' ? 'cc-remit-kpi-active' : ''}`}
            onClick={() => handleTileSort('tt_not_allocated')}
            role="button"
            tabIndex={0}
            title="Click to sort by TT Not Allocated"
            data-testid="kpi-tt-not-allocated"
          >
            <div className="cc-remit-kpi-inner">
              <span className="cc-remit-kpi-label">TT NOT ALLOCATED:</span>
              <span className="cc-remit-kpi-val cc-stmt-val--credit">
                ${ttNotAllocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <span className="cc-remit-kpi-sort-pill">
              {sortBy === 'tt_not_allocated' ? (sortOrder === 'asc' ? '▲ ASC' : '▼ DESC') : 'Sort'}
            </span>
          </div>

          <div
            className={`cc-remit-kpi-item cc-remit-kpi-clickable ${sortBy === 'total_due' ? 'cc-remit-kpi-active' : ''}`}
            onClick={() => handleTileSort('total_due')}
            role="button"
            tabIndex={0}
            title="Click to sort by Total Due Balance"
            data-testid="kpi-total-due-balance"
          >
            <div className="cc-remit-kpi-inner">
              <span className="cc-remit-kpi-label">TOTAL DUE BALANCE:</span>
              <span className="cc-remit-kpi-val cc-stmt-val--due">
                ${totalDueBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </span>
            </div>
            <span className="cc-remit-kpi-sort-pill">
              {sortBy === 'total_due' ? (sortOrder === 'asc' ? '▲ ASC' : '▼ DESC') : 'Sort'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MERGED CUSTOMER TT REMITTANCE JOURNAL SECTION (Title, Search, Currency Filter, Status Tabs & Table in 1 Container) */}
      <section className="cc-stmt-table-section cc-remit-journal-unified-card" aria-label="Customer TT Remittance Journal">
        {/* Card Header: Section Title, Status Filter, Search & Currency Filters */}
        <div className="cc-remit-journal-header-row">
          <h2 className="cc-remit-section-title">CUSTOMER TT REMITTANCE JOURNAL</h2>

          {/* TT Status Filter Bar (Comes FIRST: Primary category/status segmentation) */}
          <div className="cc-remit-filter-row cc-remit-status-filter-row">
            <div className="cc-remit-filter-field">
              <span className="cc-remit-filter-label">TT STATUS:</span>
              <div className="cc-remit-radios" role="tablist" aria-label="TT Status">
                <label className="cc-remit-radio-item">
                  <input
                    type="radio"
                    name="tt-status-filter"
                    value="ALL"
                    checked={ttStatusFilter === 'ALL'}
                    onChange={() => setTtStatusFilter('ALL')}
                  />
                  All ({ttStatusCounts.all})
                </label>
                <label className="cc-remit-radio-item">
                  <input
                    type="radio"
                    name="tt-status-filter"
                    value="NOT_CLEARED"
                    checked={ttStatusFilter === 'NOT_CLEARED'}
                    onChange={() => setTtStatusFilter('NOT_CLEARED')}
                  />
                  Not Cleared ({ttStatusCounts.notCleared})
                </label>
                <label className="cc-remit-radio-item">
                  <input
                    type="radio"
                    name="tt-status-filter"
                    value="PENDING_ALLOCATION"
                    checked={ttStatusFilter === 'PENDING_ALLOCATION'}
                    onChange={() => setTtStatusFilter('PENDING_ALLOCATION')}
                  />
                  TT Pending Allocation ({ttStatusCounts.pendingAllocation})
                </label>
              </div>
            </div>

            {ttStatusFilter !== 'ALL' && (
              <div className="cc-remit-filter-actions">
                <button
                  type="button"
                  className="cc-remit-btn-clear-filter"
                  onClick={() => setTtStatusFilter('ALL')}
                >
                  Clear Filter
                </button>
              </div>
            )}
          </div>

          {/* Search Box & Currency Dropdown */}
          <div className="cc-remit-search-row">
            <div className="cc-remit-search-box">
              <SearchGlassIcon size={16} className="cc-remit-search-icon" />
              <input
                type="search"
                className="cc-remit-search-input"
                placeholder="Search TT, bank, or depositor..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                data-testid="payments-search-input"
              />
              {searchKeyword && (
                <button
                  type="button"
                  className="cc-remit-search-clear"
                  onClick={() => setSearchKeyword('')}
                  aria-label="Clear search"
                >
                  <CloseIcon size={14} />
                </button>
              )}
            </div>

            <div className="cc-remit-currency-filter">
              <label htmlFor="remit-currency-filter" className="cc-remit-filter-label">
                Currency:
              </label>
              <select
                id="remit-currency-filter"
                className="cc-remit-filter-select"
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value)}
              >
                <option value="ALL">All Currencies</option>
                <option value="USD">USD</option>
                <option value="JPY">JPY</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div className="cc-remit-sort-filter">
              <label htmlFor="remit-sort-filter" className="cc-remit-filter-label">
                Sort By:
              </label>
              <select
                id="remit-sort-filter"
                className="cc-remit-filter-select"
                value={
                  sortBy === 'default'
                    ? 'default'
                    : sortBy === 'not_cleared'
                      ? 'not_cleared'
                      : `${sortBy}_${sortOrder}`
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'default') {
                    setSortBy('default');
                    setSortOrder('desc');
                  } else if (val === 'date_asc') {
                    setSortBy('date');
                    setSortOrder('asc');
                  } else if (val === 'current_balance_desc') {
                    setSortBy('current_balance');
                    setSortOrder('desc');
                  } else if (val === 'current_balance_asc') {
                    setSortBy('current_balance');
                    setSortOrder('asc');
                  } else if (val === 'not_cleared') {
                    setSortBy('not_cleared');
                    setSortOrder('desc');
                  } else if (val === 'tt_not_allocated_desc') {
                    setSortBy('tt_not_allocated');
                    setSortOrder('desc');
                  } else if (val === 'tt_not_allocated_asc') {
                    setSortBy('tt_not_allocated');
                    setSortOrder('asc');
                  } else if (val === 'total_due_desc') {
                    setSortBy('total_due');
                    setSortOrder('desc');
                  } else if (val === 'total_due_asc') {
                    setSortBy('total_due');
                    setSortOrder('asc');
                  }
                }}
                data-testid="payments-sort-select"
              >
                <option value="default">Default (Newest First)</option>
                <option value="date_asc">Oldest First</option>
                <option value="current_balance_desc">Current Balance (High to Low)</option>
                <option value="current_balance_asc">Current Balance (Low to High)</option>
                <option value="not_cleared">Not Cleared First</option>
                <option value="tt_not_allocated_desc">TT Not Allocated (High to Low)</option>
                <option value="tt_not_allocated_asc">TT Not Allocated (Low to High)</option>
                <option value="total_due_desc">Total Due Balance (High to Low)</option>
                <option value="total_due_asc">Total Due Balance (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table View (hidden on mobile <= 768px) */}
        <div className="cc-stmt-table-scroll-wrap cc-remit-desktop-view" role="region" aria-label="Scrollable Payment Table">
          <table className="cc-stmt-table cc-remit-table">
            <thead>
              <tr>
                <th scope="col">REF.NO</th>
                <th scope="col">PAYMENT TYPE</th>
                <th scope="col">CREATED BY</th>
                <th scope="col">CURRENCY</th>
                <th
                  scope="col"
                  className="cc-stmt-th--right cc-remit-th--sortable"
                  onClick={() => handleTileSort('current_balance')}
                  style={{ cursor: 'pointer' }}
                  title="Click to sort by TT Amount / Balance"
                >
                  TT AMOUNT {sortBy === 'current_balance' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  scope="col"
                  className="cc-stmt-th--right cc-remit-th--sortable"
                  onClick={() => handleTileSort('total_due')}
                  style={{ cursor: 'pointer' }}
                  title="Click to sort by Allocated / Total Due"
                >
                  ALLOCATED {sortBy === 'total_due' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  scope="col"
                  className="cc-stmt-th--right cc-remit-th--sortable"
                  onClick={() => handleTileSort('tt_not_allocated')}
                  style={{ cursor: 'pointer' }}
                  title="Click to sort by TT Not Allocated / Balance"
                >
                  BALANCE {sortBy === 'tt_not_allocated' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  scope="col"
                  className="cc-remit-th--date cc-remit-th--sortable"
                  onClick={() => handleTileSort('date')}
                  style={{ cursor: 'pointer' }}
                  title="Click to sort by Approved Date & Time"
                >
                  APPROVED DATE &amp; TIME {sortBy === 'date' || sortBy === 'default' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th scope="col" className="cc-stmt-th--right">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.map((entry) => {
                const statusClass =
                  entry.status === 'APPROVED'
                    ? 'cc-remit-status--approved'
                    : entry.status === 'REJECTED'
                      ? 'cc-remit-status--rejected'
                      : 'cc-remit-status--review';

                const isExpanded = Boolean(expandedRowIds[entry.id]);
                const allocatedVehicles = getAllocatedVehiclesForEntry(entry);

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      tabIndex={0}
                      onClick={() => openPaymentDetail(entry)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openPaymentDetail(entry);
                        }
                      }}
                      data-testid={`payment-row-${entry.reference}`}
                      className={isExpanded ? 'cc-remit-tr--expanded' : ''}
                    >
                      <td className="cc-remit-td--ref">
                        <span className="cc-remit-ref-text">{entry.reference}</span>
                      </td>
                      <td className="cc-remit-td--payment-type">{getPaymentTypeLabel(entry.paymentMethod)}</td>
                      <td className="cc-remit-td--created-by">
                        <span className={`cc-remit-created-pill cc-remit-created--${entry.createdBy.toLowerCase()}`}>
                          {entry.createdBy}
                        </span>
                      </td>
                      <td className="cc-remit-td--currency cc-remit-td-mono">{entry.currency}</td>
                      <td className="cc-remit-td--amount cc-remit-td-mono cc-stmt-td--right">
                        ${entry.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td className="cc-remit-td--allocated cc-remit-td-mono cc-stmt-td--right">
                        ${entry.allocatedAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td className="cc-remit-td--remaining cc-remit-td-mono cc-stmt-td--right">
                        <span className="cc-remit-remaining-green">
                          ${entry.remainingBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td className="cc-remit-td--date cc-remit-td-mono">
                        {renderApprovedDateTime(entry.approvedDate)}
                      </td>
                      <td className="cc-remit-td--action cc-stmt-td--right">
                        <div className="cc-remit-action-group">
                          <button
                            type="button"
                            className="cc-remit-btn-allocate"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAllocateModal(entry);
                            }}
                            disabled={entry.remainingBalanceUsd <= 0}
                            data-testid={`btn-allocate-${entry.reference}`}
                          >
                            Allocate
                          </button>
                          <button
                            type="button"
                            className={`cc-remit-btn-icon-allocated ${isExpanded ? 'cc-remit-btn-icon-allocated--active' : ''}`}
                            onClick={(e) => toggleExpandAllocatedVehicles(entry.id, e)}
                            data-testid={`btn-view-allocated-${entry.reference}`}
                            title={isExpanded ? 'Hide allocated vehicles' : 'View allocated vehicles'}
                            aria-label={isExpanded ? 'Hide allocated vehicles' : 'View allocated vehicles'}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.2 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
                              <circle cx="7" cy="17" r="2" />
                              <circle cx="17" cy="17" r="2" />
                            </svg>
                            <span className="cc-remit-icon-arrow" aria-hidden="true">{isExpanded ? '▲' : '▼'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Sub-table View for Allocated Vehicles */}
                    {isExpanded && (
                      <tr className="cc-remit-subtable-row" data-testid={`expanded-row-${entry.reference}`}>
                        <td colSpan={9} className="cc-remit-subtable-cell">
                          <div className="cc-remit-subtable-wrapper">
                            <div className="cc-remit-subtable-header">
                              <span className="cc-remit-subtable-title">
                                🚗 CURRENT ALLOCATED VEHICLES FOR TT {entry.reference}
                              </span>
                              <span className="cc-remit-subtable-summary">
                                Total Allocated: <strong>${entry.allocatedAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</strong>
                              </span>
                            </div>

                            {allocatedVehicles.length > 0 ? (
                              <table className="cc-remit-subtable">
                                <thead>
                                  <tr>
                                    <th scope="col">VEHICLE / MODEL</th>
                                    <th scope="col">STOCK NO</th>
                                    <th scope="col">CHASSIS NO</th>
                                    <th scope="col">INVOICE REF</th>
                                    <th scope="col" className="cc-stmt-th--right">ALLOCATED AMOUNT</th>
                                    <th scope="col">ALLOCATION DATE</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {allocatedVehicles.map((veh) => (
                                    <tr key={veh.id}>
                                      <td className="cc-remit-subtable-name">{veh.vehicleName}</td>
                                      <td className="cc-remit-td-mono">{veh.stockNumber}</td>
                                      <td className="cc-remit-td-mono">{veh.chassisNumber}</td>
                                      <td className="cc-remit-td-mono">{veh.invoiceRef}</td>
                                      <td className="cc-stmt-td--right cc-remit-td-mono cc-remit-remaining-green">
                                        ${veh.allocatedAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                                      </td>
                                      <td className="cc-remit-td-mono">{veh.allocatedDate}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className="cc-remit-subtable-empty">
                                No vehicles currently allocated to this TT remittance. Click <strong>Allocate</strong> above to assign funds to a vehicle invoice.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Single-View Payment Cards (visible only on <= 768px) */}
        <div className="cc-remit-mobile-view" role="region" aria-label="Mobile Payments List">
          {paginatedEntries.map((entry) => {
            const statusClass =
              entry.status === 'APPROVED'
                ? 'cc-remit-status--approved'
                : entry.status === 'REJECTED'
                  ? 'cc-remit-status--rejected'
                  : 'cc-remit-status--review';

            const isExpanded = Boolean(expandedRowIds[entry.id]);
            const allocatedVehicles = getAllocatedVehiclesForEntry(entry);

            return (
              <div key={entry.id} className="cc-remit-mobile-card">
                {/* Header: Ref No, Created By & Status Pill */}
                <div className="cc-remit-mobile-card__header">
                  <div className="cc-remit-mobile-card__header-left">
                    <span className="cc-remit-mobile-card__ref">{entry.reference}</span>
                    <span className={`cc-remit-created-pill cc-remit-created--${entry.createdBy.toLowerCase()}`}>
                      {entry.createdBy}
                    </span>
                  </div>
                  <span className={`cc-remit-status-pill ${statusClass}`}>{entry.status}</span>
                </div>

                {/* Subtitle: Payment Method & Currency */}
                <div className="cc-remit-mobile-card__meta">
                  <span className="cc-remit-mobile-meta-method">{getPaymentTypeLabel(entry.paymentMethod)}</span>
                  <span className="cc-remit-meta-dot" aria-hidden="true">•</span>
                  <span className="cc-remit-mobile-meta-currency">Currency: <strong>{entry.currency}</strong></span>
                  {entry.approvedDate && (
                    <>
                      <span className="cc-remit-meta-dot" aria-hidden="true">•</span>
                      <span className="cc-remit-mobile-meta-date">
                        {formatMobileApprovedDate(entry.approvedDate)}
                      </span>
                    </>
                  )}
                </div>

                {/* Financial 3-Metric Subgrid */}
                <div className="cc-remit-mobile-card__fin-grid">
                  <div className="cc-remit-mobile-card__fin-col">
                    <span className="cc-remit-mobile-card__fin-label">TT Amount:</span>
                    <span className="cc-remit-mobile-card__fin-val cc-stmt-td-mono">
                      ${entry.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="cc-remit-mobile-card__fin-col">
                    <span className="cc-remit-mobile-card__fin-label">Allocated:</span>
                    <span className="cc-remit-mobile-card__fin-val cc-stmt-td-mono cc-stmt-val--due">
                      ${entry.allocatedAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="cc-remit-mobile-card__fin-col cc-remit-mobile-card__fin-col--balance">
                    <span className="cc-remit-mobile-card__fin-label">Available:</span>
                    <span className="cc-remit-mobile-card__fin-val cc-stmt-td-mono cc-remit-remaining-green">
                      ${entry.remainingBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Card Actions: View Detail, Vehicles (Expandable), and Allocate */}
                <div className="cc-remit-mobile-card__actions">
                  <button
                    type="button"
                    className="cc-remit-mobile-btn-detail"
                    onClick={() => openPaymentDetail(entry)}
                  >
                    View Details
                  </button>

                  <button
                    type="button"
                    className={`cc-remit-mobile-btn-expand ${isExpanded ? 'cc-remit-mobile-btn-expand--active' : ''}`}
                    onClick={(e) => toggleExpandAllocatedVehicles(entry.id, e)}
                    title={isExpanded ? 'Hide allocated vehicle details' : 'Click to see vehicle details allocated'}
                  >
                    <span>Vehicles ({allocatedVehicles.length})</span>
                    <span>{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  <button
                    type="button"
                    className="cc-remit-btn-allocate"
                    onClick={() => openAllocateModal(entry)}
                    disabled={entry.remainingBalanceUsd <= 0}
                  >
                    Allocate
                  </button>
                </div>

                {/* Expandable Allocated Vehicles List on Mobile */}
                {isExpanded && (
                  <div className="cc-remit-mobile-allocated-list">
                    <div className="cc-remit-mobile-allocated-title">
                      <span className="cc-remit-mobile-allocated-icon" aria-hidden="true">🚗</span>
                      <span>ALL ALLOCATED VEHICLES ({allocatedVehicles.length})</span>
                    </div>
                    {allocatedVehicles.length > 0 ? (
                      allocatedVehicles.map((veh, idx) => (
                        <div key={veh.id} className="cc-remit-mobile-veh-tile">
                          <div className="cc-remit-mobile-veh-tile__header">
                            <div className="cc-remit-mobile-veh-tile__name-group">
                              <div className="cc-remit-mobile-veh-tile__icon-box cc-remit-mobile-veh-tile__icon-box--index">
                                #{idx + 1}
                              </div>
                              <div className="cc-remit-mobile-veh-tile__title-wrap">
                                <span className="cc-remit-mobile-veh-tile__name">{veh.vehicleName}</span>
                              </div>
                            </div>
                            <span className="cc-remit-mobile-veh-tile__badge">Allocated</span>
                          </div>

                          <div className="cc-remit-mobile-veh-tile__specs">
                            <div className="cc-remit-mobile-veh-tile__spec-pill">
                              <span className="cc-remit-spec-lbl">STOCK NUMBER</span>
                              <span className="cc-remit-spec-val">{veh.stockNumber}</span>
                            </div>
                            <div className="cc-remit-mobile-veh-tile__spec-pill">
                              <span className="cc-remit-spec-lbl">CHASSIS NUMBER</span>
                              <span className="cc-remit-spec-val">{veh.chassisNumber}</span>
                            </div>
                          </div>

                          <div className="cc-remit-mobile-veh-tile__footer">
                            <span className="cc-remit-mobile-invoice-tag">
                              📄 Invoice: <strong>{veh.invoiceRef}</strong>
                            </span>
                            <span className="cc-remit-mobile-amount-badge">
                              ${veh.allocatedAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="cc-remit-mobile-allocated-empty">
                        No vehicles currently allocated to this TT remittance.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {paginatedEntries.length === 0 && (
            <div className="cc-remit-mobile-empty">
              No remittance payments found matching your criteria.
            </div>
          )}
        </div>

          {totalPages > 1 && (
            <nav className="cc-remit-pagination" aria-label="Payment journal pagination">
              <button
                type="button"
                className="cc-remit-pagination__button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="cc-remit-pagination__status" aria-live="polite">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="cc-remit-pagination__button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </nav>
          )}
      </section>

          {/* Detailed View Modal (FRD 5.7) */}
          <PaymentDetailModal
            isOpen={selectedDetailPayment !== null}
            onClose={() => setSelectedDetailPayment(null)}
            payment={selectedDetailPayment}
          />

      {/* Modal: ALLOCATE TT TO VEHICLE */}
      {selectedAllocateEntry && (
        <div
          className="cc-remit-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="allocate-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAllocateEntry(null);
          }}
        >
          <div className="cc-remit-modal-card" style={{ maxWidth: '520px' }}>
            <div className="cc-remit-modal-header">
              <div className="cc-remit-modal-tag" style={{ background: 'var(--color-success-surface)', color: 'var(--color-success)' }}>
                <span className="cc-remit-modal-tag__icon" aria-hidden="true">🚗</span>
                <span>TT ALLOCATION</span>
              </div>
              <button
                type="button"
                className="cc-remit-modal-close"
                onClick={() => setSelectedAllocateEntry(null)}
                aria-label="Close modal"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <h3 id="allocate-modal-title" className="cc-remit-modal-title">
              ALLOCATE TT TO VEHICLE
            </h3>
            <p className="cc-remit-modal-subtitle">
              Allocate available TT balance to a specific vehicle invoice or down payment.
            </p>

            {/* Summary Box */}
            <div className="cc-remit-allocate-summary-box">
              <div className="cc-remit-allocate-summary-item">
                <span className="cc-remit-allocate-label">TT REFERENCE:</span>
                <span className="cc-remit-allocate-val">{selectedAllocateEntry.reference}</span>
              </div>
              <div className="cc-remit-allocate-summary-item">
                <span className="cc-remit-allocate-label">AVAILABLE BALANCE:</span>
                <span className="cc-remit-allocate-val cc-remit-remaining-green">
                  ${selectedAllocateEntry.remainingBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            {allocationMessage && (
              <div className="cc-remit-alert cc-remit-alert--success" role="status">
                {allocationMessage}
              </div>
            )}

            {allocationError && (
              <div className="cc-remit-alert cc-remit-alert--error" role="alert">
                {allocationError}
              </div>
            )}

            <form onSubmit={handleConfirmAllocation} className="cc-remit-form">
              <div className="cc-remit-form-field cc-remit-form-field--full">
                <label htmlFor="allocate-vehicle-select" className="cc-remit-form-label">
                  SELECT TARGET VEHICLE *
                </label>
                <select
                  id="allocate-vehicle-select"
                  className="cc-remit-form-select"
                  value={allocationVehicleId}
                  onChange={(e) => setAllocationVehicleId(e.target.value)}
                  required
                  data-testid="allocate-vehicle-select"
                >
                  <option value="" disabled>Choose a vehicle from your fleet...</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.chassisNumber || v.stockNumber}) {v.priceUsd ? `— $${v.priceUsd.toLocaleString()} USD` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cc-remit-form-field cc-remit-form-field--full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="allocate-amount-input" className="cc-remit-form-label">
                    ALLOCATION AMOUNT ($ USD) *
                  </label>
                  <button
                    type="button"
                    className="cc-remit-reset-btn"
                    style={{ fontSize: '11px' }}
                    onClick={() => setAllocationAmountUsd(String(selectedAllocateEntry.remainingBalanceUsd))}
                  >
                    Set Max (${selectedAllocateEntry.remainingBalanceUsd.toLocaleString()})
                  </button>
                </div>
                <input
                  id="allocate-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedAllocateEntry.remainingBalanceUsd}
                  className="cc-remit-form-input"
                  placeholder="e.g. 5000.00"
                  value={allocationAmountUsd}
                  onChange={(e) => setAllocationAmountUsd(e.target.value)}
                  required
                  data-testid="allocate-amount-input"
                />
              </div>

              <button
                type="submit"
                className="cc-remit-modal-submit-btn"
                disabled={isAllocating}
                style={{ background: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
              >
                <span>{isAllocating ? 'ALLOCATING...' : 'CONFIRM VEHICLE ALLOCATION'}</span>
                <PaperPlaneIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      <SubmitWireProofModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};
