export function formatUsdAmount(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatInvoiceDate(isoString?: string): string {
  if (!isoString) return '—';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInvoiceStatusBadgeClass(status: string): string {
  switch (status) {
    case 'Paid': return 'cc-invoice-badge--paid';
    case 'PartiallyPaid': return 'cc-invoice-badge--partial';
    case 'Issued': return 'cc-invoice-badge--issued';
    case 'Expired': return 'cc-invoice-badge--expired';
    case 'Cancelled': return 'cc-invoice-badge--cancelled';
    default: return 'cc-invoice-badge--neutral';
  }
}
