import React from 'react';

export interface InvoiceAllocationItem {
  id: string;
  stockNumber: string;
  lastAllocationDate: string;
  ttNumber: string;
  allocationAmountUsd: number;
  fileName?: string;
}

export interface InvoicePaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  allocations?: InvoiceAllocationItem[];
  onSelectTT?: (ttNumber: string) => void;
}

const DEFAULT_ALLOCATIONS: InvoiceAllocationItem[] = [
  {
    id: 'alloc-1',
    stockNumber: 'J24012345',
    lastAllocationDate: '2024-10-20',
    ttNumber: 'TT10001',
    allocationAmountUsd: 2300,
    fileName: 'TT10001_Swift_Receipt.pdf',
  },
  {
    id: 'alloc-2',
    stockNumber: 'J24012345',
    lastAllocationDate: '2024-10-20',
    ttNumber: 'TT10002',
    allocationAmountUsd: 2200,
    fileName: 'TT10002_Remittance_Receipt.pdf',
  },
  {
    id: 'alloc-3',
    stockNumber: 'J24012348',
    lastAllocationDate: '2024-10-20',
    ttNumber: 'TT10002',
    allocationAmountUsd: 2700,
    fileName: 'TT10002_Remittance_Receipt.pdf',
  },
];

export const InvoicePaymentDetailsModal: React.FC<InvoicePaymentDetailsModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  allocations = DEFAULT_ALLOCATIONS,
  onSelectTT,
}) => {
  if (!isOpen) return null;

  const handleDownloadFile = (fileName: string) => {
    const element = document.createElement('a');
    const file = new Blob([`CarChief Wire Transfer Record: ${fileName}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      className="cc-inv-pay-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-details-modal-title"
      data-testid="invoice-payment-details-modal"
    >
      <div className="cc-inv-pay-modal-backdrop" onClick={onClose} />
      <div className="cc-inv-pay-modal-dialog">
        <div className="cc-inv-pay-modal-header">
          <h2 id="pay-details-modal-title" className="cc-inv-pay-modal-title">
            Payment Details ({invoiceNumber})
          </h2>
          <button
            type="button"
            className="cc-inv-pay-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="cc-inv-pay-modal-body">
          <div className="cc-inv-pay-table-wrap">
            <table className="cc-inv-pay-table">
              <thead>
                <tr>
                  <th scope="col">Stock Nu.</th>
                  <th scope="col">Last Allocation Date</th>
                  <th scope="col">TT Number</th>
                  <th scope="col" className="cc-inv-pay-th--right">Allocation</th>
                  <th scope="col" className="cc-inv-pay-th--center">TT File</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="cc-inv-pay-tr">
                    <td className="cc-inv-pay-td-mono cc-inv-pay-td-bold">{alloc.stockNumber}</td>
                    <td className="cc-inv-pay-td-mono">{alloc.lastAllocationDate}</td>
                    <td className="cc-inv-pay-td-mono">
                      <button
                        type="button"
                        className="cc-inv-pay-tt-link"
                        onClick={() => {
                          if (onSelectTT) onSelectTT(alloc.ttNumber);
                        }}
                        title="Filter payments list by this TT"
                        data-testid={`link-tt-${alloc.ttNumber}`}
                      >
                        {alloc.ttNumber}
                      </button>
                    </td>
                    <td className="cc-inv-pay-td--right cc-inv-pay-td-mono cc-inv-pay-td-bold">
                      ${alloc.allocationAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </td>
                    <td className="cc-inv-pay-td--center">
                      <button
                        type="button"
                        className="cc-inv-pay-download-btn"
                        onClick={() => handleDownloadFile(alloc.fileName || `${alloc.ttNumber}_Proof.pdf`)}
                        title="Download proof document"
                      >
                        Click to download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
