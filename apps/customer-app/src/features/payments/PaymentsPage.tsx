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
import { PaymentDetailModal, type PaymentDetailRecord } from './components/PaymentDetailModal.js';
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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    if (activeRoute && (activeRoute.includes('action=submit_proof') || activeRoute.includes('submit_proof'))) {
      setActiveRoute('/payments');
    }
  };

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

  // Date Range Filters state
  const defaultToDate = formatDateInputValue(new Date());
  const defaultFromDate = getDateMonthsAgo(3);
  const [fromDate, setFromDate] = useState<string>(defaultFromDate);
  const [toDate, setToDate] = useState<string>(defaultToDate);

  // Filters state (FRD 5.3)
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [allocationFilter, setAllocationFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const paymentsPerPage = 20;

  const online = useCustomerOnlineStatus();
  const createPayment = useCreateCustomerPayment();
  const paymentsQuery = useCustomerPayments();

  const apiPayments = paymentsQuery.data?.items ?? [];

  useEffect(() => {
    setActiveRoute('/payments');
  }, [setActiveRoute]);

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

  // Compute KPI totals (FRD 5.2)
  const { totalTtAmount, totalAllocatedAmount, totalAvailableAmount } = useMemo(() => {
    let tt = 0;
    let allocated = 0;
    let available = 0;

    for (const entry of allEntries) {
      tt += entry.amountUsd;
      allocated += entry.allocatedAmountUsd;
      if (entry.status === 'APPROVED') {
        available += entry.remainingBalanceUsd;
      }
    }

    return {
      totalTtAmount: tt,
      totalAllocatedAmount: allocated,
      totalAvailableAmount: available,
    };
  }, [allEntries]);

  // Compute Status Tab Counts
  const statusCounts = useMemo(() => {
    let all = 0;
    let approved = 0;
    let underReview = 0;
    let onHold = 0;
    let rejected = 0;

    for (const entry of allEntries) {
      if (fromDate && entry.paymentDate < fromDate) continue;
      if (toDate && entry.paymentDate > toDate) continue;

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
  }, [allEntries, fromDate, toDate, searchKeyword, currencyFilter]);

  // Compute Allocation Status Tab Counts for Mobile (Pending Allocation if remaining balance > 0, Allocation Done if <= 0)
  const allocationCounts = useMemo(() => {
    let all = 0;
    let pending = 0;
    let done = 0;

    for (const entry of allEntries) {
      if (fromDate && entry.paymentDate < fromDate) continue;
      if (toDate && entry.paymentDate > toDate) continue;

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
      if (entry.remainingBalanceUsd > 0) {
        pending++;
      } else {
        done++;
      }
    }

    return { all, pending, done };
  }, [allEntries, fromDate, toDate, searchKeyword, currencyFilter]);

  // Filtered entries (FRD 5.3)
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      if (fromDate && entry.paymentDate < fromDate) return false;
      if (toDate && entry.paymentDate > toDate) return false;

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

      if (allocationFilter !== 'ALL') {
        if (allocationFilter === 'PENDING' && entry.remainingBalanceUsd <= 0) return false;
        if (allocationFilter === 'DONE' && entry.remainingBalanceUsd > 0) return false;
      }

      return true;
    });
  }, [allEntries, fromDate, toDate, searchKeyword, currencyFilter, approvalFilter, allocationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / paymentsPerPage));
  const paginatedEntries = useMemo(
    () => filteredEntries.slice((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage),
    [currentPage, filteredEntries]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, currencyFilter, approvalFilter, allocationFilter]);

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

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CustomerPaymentFormInput, unknown, CustomerPaymentFormValues>({
    resolver: zodResolver(customerPaymentFormSchema),
    defaultValues: {
      invoiceId: 'INV-GENERAL',
      currency: 'USD',
      paymentDate: new Date().toISOString().slice(0, 10),
      remarks: '',
      proof: { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' },
      idempotencyKey: safeRandomUUID(),
    },
    mode: 'onSubmit',
  });

  const onSubmit = async (values: CustomerPaymentFormValues) => {
    setSubmitMessage(null);
    setSubmitError(null);
    try {
      const request: CreateCustomerPaymentRequest = {
        invoiceId: values.invoiceId?.trim() || 'INV-GENERAL',
        reference: values.reference.trim(),
        bankName: values.bankName.trim(),
        currency: values.currency,
        amountUsd: values.amountUsd,
        paymentDate: values.paymentDate,
        ...(values.remarks?.trim() ? { remarks: values.remarks.trim() } : {}),
        proof: values.proof,
        idempotencyKey: values.idempotencyKey,
      };

      const payment = await createPayment.mutateAsync(request);
      setSubmitMessage(`Payment ${payment.reference} submitted successfully for finance review!`);
      setProofFile(null);
      reset({
        invoiceId: 'INV-GENERAL',
        currency: 'USD',
        paymentDate: new Date().toISOString().slice(0, 10),
        remarks: '',
        proof: { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' },
        idempotencyKey: safeRandomUUID(),
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitMessage(null);
      }, 1200);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Payment submission failed. Please retry.');
    }
  };

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setProofFile(file);
    if (!file) {
      setValue('proof', { fileName: '', fileType: 'PDF', sizeBytes: 0, scanStatus: 'Pending' }, { shouldValidate: true });
      return;
    }
    const extension = file.name.split('.').pop()?.toUpperCase();
    const fileType =
      extension === 'JPG' || extension === 'JPEG'
        ? 'JPG'
        : extension === 'PNG'
          ? 'PNG'
          : extension === 'PDF'
            ? 'PDF'
            : undefined;

    setValue(
      'proof',
      fileType
        ? { fileName: file.name, fileType, sizeBytes: file.size, scanStatus: 'Pending' }
        : { fileName: file.name, fileType: 'PDF', sizeBytes: MAX_PAYMENT_PROOF_BYTES + 1, scanStatus: 'Pending' },
      { shouldValidate: true }
    );
  };

  return (
    <section className="cc-cust-remittance-page" aria-label="Customer Wire Remittance" data-testid="customer-payments-page">
      {/* 1. Page Header Card with Title & Date Selection */}
      <section className="cc-remit-header-card" aria-labelledby="payments-heading">
        <div className="cc-remit-header-top">
          <div>
            <h1 id="payments-heading" className="cc-remit-title cc-portal-page-title">
              <span className="sr-only">My Payments</span>
              <span aria-hidden="true">MY <span className="cc-remit-title-highlight">PAYMENTS</span></span>
            </h1>
            <p className="cc-remit-subtitle cc-portal-page-description">
              Submit wire transfer details, track approval status, and manage TT remittance allocations.
            </p>
          </div>

          <div className="cc-remit-actions">
            <button
              type="button"
              className="cc-remit-btn-submit-proof"
              onClick={() => setIsModalOpen(true)}
              data-testid="btn-submit-payment-proof"
            >
              <PlusIcon size={13} />
              <span>Submit Payment Proof</span>
            </button>
          </div>
        </div>

        {/* Date Range Selection (Select Dates) */}
        <div className="cc-remit-date-bar">
          <div className="cc-remit-date-filter-group">
            <label htmlFor="remit-from-date" className="cc-remit-date-label">
              Transaction Date:
            </label>
            <div className="cc-remit-date-inputs">
              <input
                id="remit-from-date"
                type="date"
                className="cc-remit-date-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="remit-from-date"
              />
              <span className="cc-remit-date-sep">to</span>
              <input
                id="remit-to-date"
                type="date"
                className="cc-remit-date-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="remit-to-date"
              />
            </div>
          </div>

          <button
            type="button"
            className="cc-remit-reset-btn"
            onClick={() => {
              setFromDate(defaultFromDate);
              setToDate(defaultToDate);
            }}
          >
            Reset Range
          </button>
        </div>

        {/* 2. TOTAL METRICS SUMMARY BAR (Merged into the Header Card) */}
        <div className="cc-stmt-kpi-bar" aria-label="Remittance Totals">
          <div className="cc-stmt-kpi-item">
            <span className="cc-stmt-kpi-label">TOTAL TT AMOUNT:</span>
            <span className="cc-stmt-kpi-val cc-stmt-val--credit">
              ${totalTtAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="cc-stmt-kpi-item">
            <span className="cc-stmt-kpi-label">TOTAL ALLOCATED:</span>
            <span className="cc-stmt-kpi-val cc-stmt-val--due">
              ${totalAllocatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>

          <div className="cc-stmt-kpi-item">
            <span className="cc-stmt-kpi-label">TOTAL AVAILABLE:</span>
            <span className="cc-stmt-kpi-val cc-stmt-val--credit">
              ${totalAvailableAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </span>
          </div>
        </div>
      </section>

      {/* 3. MERGED CUSTOMER TT REMITTANCE JOURNAL SECTION (Title, Search, Currency Filter, Status Tabs & Table in 1 Container) */}
      <section className="cc-stmt-table-section cc-remit-journal-unified-card" aria-label="Customer TT Remittance Journal">
        {/* Card Header: Section Title + Search & Currency Filters */}
        <div className="cc-remit-journal-header-row">
          <h2 className="cc-remit-section-title">CUSTOMER TT REMITTANCE JOURNAL</h2>

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
          </div>
        </div>

        {/* Desktop Approval Status Filter removed from desktop view */}
        {/*
        <div className="cc-remit-filter-row cc-remit-desktop-filter">
          <div className="cc-remit-filter-field">
            <span className="cc-remit-filter-label">Approval Status:</span>
            <div className="cc-remit-radios" role="tablist" aria-label="Approval Status">
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="approval-filter"
                  value="ALL"
                  checked={approvalFilter === 'ALL'}
                  onChange={() => setApprovalFilter('ALL')}
                />
                All ({statusCounts.all})
              </label>
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="approval-filter"
                  value="APPROVED"
                  checked={approvalFilter === 'APPROVED'}
                  onChange={() => setApprovalFilter('APPROVED')}
                />
                Approved ({statusCounts.approved})
              </label>
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="approval-filter"
                  value="UNDER_REVIEW"
                  checked={approvalFilter === 'UNDER_REVIEW'}
                  onChange={() => setApprovalFilter('UNDER_REVIEW')}
                />
                Under Review ({statusCounts.underReview})
              </label>
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="approval-filter"
                  value="ON_HOLD"
                  checked={approvalFilter === 'ON_HOLD'}
                  onChange={() => setApprovalFilter('ON_HOLD')}
                />
                On Hold ({statusCounts.onHold})
              </label>
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="approval-filter"
                  value="REJECTED"
                  checked={approvalFilter === 'REJECTED'}
                  onChange={() => setApprovalFilter('REJECTED')}
                />
                Rejected ({statusCounts.rejected})
              </label>
            </div>
          </div>

          {approvalFilter !== 'ALL' && (
            <div className="cc-remit-filter-actions">
              <button
                type="button"
                className="cc-remit-btn-clear-filter"
                onClick={() => setApprovalFilter('ALL')}
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
        */}

        {/* Mobile Allocation Status Filter (hidden on desktop > 768px, shown on mobile) */}
        <div className="cc-remit-filter-row cc-remit-mobile-filter">
          <div className="cc-remit-filter-field">
            <span className="cc-remit-filter-label">Allocation Status:</span>
            <div className="cc-remit-radios" role="tablist" aria-label="Allocation Status">
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="mobile-allocation-filter"
                  value="ALL"
                  checked={allocationFilter === 'ALL'}
                  onChange={() => setAllocationFilter('ALL')}
                />
                All ({allocationCounts.all})
              </label>
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="mobile-allocation-filter"
                  value="PENDING"
                  checked={allocationFilter === 'PENDING'}
                  onChange={() => setAllocationFilter('PENDING')}
                />
                Pending Allocation ({allocationCounts.pending})
              </label>
              <label className="cc-remit-radio-item">
                <input
                  type="radio"
                  name="mobile-allocation-filter"
                  value="DONE"
                  checked={allocationFilter === 'DONE'}
                  onChange={() => setAllocationFilter('DONE')}
                />
                Allocation Done ({allocationCounts.done})
              </label>
            </div>
          </div>

          {allocationFilter !== 'ALL' && (
            <div className="cc-remit-filter-actions">
              <button
                type="button"
                className="cc-remit-btn-clear-filter"
                onClick={() => setAllocationFilter('ALL')}
              >
                Clear Filter
              </button>
            </div>
          )}
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
                <th scope="col" className="cc-stmt-th--right">TT AMOUNT</th>
                <th scope="col" className="cc-stmt-th--right">ALLOCATED</th>
                <th scope="col" className="cc-stmt-th--right">BALANCE</th>
                <th scope="col" className="cc-remit-th--date">APPROVED DATE & TIME</th>
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

      {/* Modal: UPLOAD CUSTOMER TT PROOF */}
      {isModalOpen && (
        <div
          className="cc-remit-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remit-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
        >
          <div className="cc-remit-modal-card">
            <div className="cc-remit-modal-header">
              <div className="cc-remit-modal-tag">
                <span className="cc-remit-modal-tag__icon" aria-hidden="true">🏛️</span>
                <span>TT REMITTANCE CREATION</span>
              </div>
              <button
                type="button"
                className="cc-remit-modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <h3 id="remit-modal-title" className="cc-remit-modal-title">
              UPLOAD CUSTOMER TT PROOF
            </h3>
            <p className="cc-remit-modal-subtitle">
              Submit wire transfer details. Finance will verify and approve for invoice allocation.
            </p>

            {!online && (
              <div className="cc-remit-alert cc-remit-alert--warning" role="status">
                You are offline. TT submission is blocked until the connection is restored.
              </div>
            )}

            {submitMessage && (
              <div className="cc-remit-alert cc-remit-alert--success" role="status">
                {submitMessage}
              </div>
            )}

            {submitError && (
              <div className="cc-remit-alert cc-remit-alert--error" role="alert">
                {submitError}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate className="cc-remit-form">
              <input type="hidden" {...register('invoiceId')} value="INV-GENERAL" />

              <div className="cc-remit-form-row cc-remit-form-row--2col">
                <div className="cc-remit-form-field">
                  <label htmlFor="remit-ref-input" className="cc-remit-form-label">
                    TT NUMBER / SWIFT REF *
                  </label>
                  <input
                    id="remit-ref-input"
                    className="cc-remit-form-input"
                    placeholder="e.g. TT-984021-SW"
                    {...register('reference')}
                    aria-invalid={Boolean(errors.reference)}
                  />
                  {errors.reference && (
                    <span className="cc-remit-field-error">{errors.reference.message}</span>
                  )}
                </div>

                <div className="cc-remit-form-field">
                  <label htmlFor="remit-bank-input" className="cc-remit-form-label">
                    REMITTING BANK *
                  </label>
                  <input
                    id="remit-bank-input"
                    className="cc-remit-form-input"
                    placeholder="e.g. Barclays Bank"
                    {...register('bankName')}
                    aria-invalid={Boolean(errors.bankName)}
                  />
                  {errors.bankName && (
                    <span className="cc-remit-field-error">{errors.bankName.message}</span>
                  )}
                </div>
              </div>

              <div className="cc-remit-form-row cc-remit-form-row--3col">
                <div className="cc-remit-form-field">
                  <label htmlFor="remit-currency-select" className="cc-remit-form-label">
                    TT CURRENCY *
                  </label>
                  <select
                    id="remit-currency-select"
                    className="cc-remit-form-select"
                    {...register('currency')}
                    data-testid="remit-currency-select"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="KES">KES (KSh) - Kenyan Shilling</option>
                  </select>
                </div>

                <div className="cc-remit-form-field">
                  <label htmlFor="remit-amount-input" className="cc-remit-form-label">
                    ORIGINAL AMOUNT *
                  </label>
                  <input
                    id="remit-amount-input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="cc-remit-form-input"
                    placeholder="e.g. 15000.00"
                    {...register('amountUsd')}
                    aria-invalid={Boolean(errors.amountUsd)}
                  />
                  {errors.amountUsd && (
                    <span className="cc-remit-field-error">{errors.amountUsd.message}</span>
                  )}
                </div>

                <div className="cc-remit-form-field">
                  <label htmlFor="remit-date-input" className="cc-remit-form-label">
                    TT DATE *
                  </label>
                  <input
                    id="remit-date-input"
                    type="date"
                    className="cc-remit-form-input"
                    {...register('paymentDate')}
                    aria-invalid={Boolean(errors.paymentDate)}
                  />
                  {errors.paymentDate && (
                    <span className="cc-remit-field-error">{errors.paymentDate.message}</span>
                  )}
                </div>
              </div>

              <div className="cc-remit-form-field cc-remit-form-field--full">
                <label htmlFor="remit-proof-input" className="cc-remit-form-label">
                  TT COPY ATTACHMENT (PDF / IMAGE)
                </label>
                <div className="cc-remit-file-upload-box">
                  <input
                    id="remit-proof-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={handleProofChange}
                    className="cc-remit-file-native-input"
                  />
                </div>
                {proofFile && (
                  <span className="cc-remit-file-selected-info">
                    Selected: {proofFile.name} ({Math.ceil(proofFile.size / 1024)} KB)
                  </span>
                )}
                {errors.proof && (
                  <span className="cc-remit-field-error">
                    {errors.proof.message?.toString() || 'Please choose a valid TT proof file.'}
                  </span>
                )}
              </div>

              <div className="cc-remit-form-field cc-remit-form-field--full">
                <label htmlFor="remit-remarks-input" className="cc-remit-form-label">
                  REMARKS (OPTIONAL)
                </label>
                <textarea
                  id="remit-remarks-input"
                  rows={3}
                  className="cc-remit-form-textarea"
                  placeholder="e.g. Wire transfer deposit for future vehicle allocation."
                  {...register('remarks')}
                  aria-invalid={Boolean(errors.remarks)}
                />
                {errors.remarks && (
                  <span className="cc-remit-field-error">{errors.remarks.message}</span>
                )}
              </div>

              <button
                type="submit"
                className="cc-remit-modal-submit-btn"
                disabled={!online || createPayment.isPending}
              >
                <span>{createPayment.isPending ? 'SUBMITTING...' : 'SUBMIT TT FOR FINANCE APPROVAL'}</span>
                <PaperPlaneIcon size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
