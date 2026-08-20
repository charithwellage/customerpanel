import React from 'react';

export interface PaymentDetailRecord {
  id: string;
  reference: string;
  createdDate: string;
  receivingBank: string;
  depositorName: string;
  customerName: string;
  currency: string;
  ttAmount: number;
  approvedDate?: string;
  documents?: Array<{ name: string; url: string }>;
}

export interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDetailRecord | null;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!isOpen || !payment) return null;

  const handleDownloadDoc = (docName: string) => {
    const element = document.createElement('a');
    const file = new Blob([`CarChief Banking Document: ${docName}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = docName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      className="cc-pay-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-detail-title"
      data-testid="payment-detail-modal"
    >
      <div className="cc-pay-modal-backdrop" onClick={onClose} />
      <div className="cc-pay-modal-dialog">
        <div className="cc-pay-modal-header">
          <h2 id="payment-detail-title" className="cc-pay-modal-title">
            Detailed View ({payment.reference})
          </h2>
          <button
            type="button"
            className="cc-pay-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="cc-pay-modal-body">
          <div className="cc-pay-detail-grid">
            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">TT Ref Nu:</span>
              <span className="cc-pay-detail-val cc-pay-detail-val--mono">{payment.reference}</span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">Created Date:</span>
              <span className="cc-pay-detail-val cc-pay-detail-val--mono">{payment.createdDate}</span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">Receiving Bank:</span>
              <span className="cc-pay-detail-val">{payment.receivingBank}</span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">Depositor Name:</span>
              <span className="cc-pay-detail-val">{payment.depositorName}</span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">Customer Name:</span>
              <span className="cc-pay-detail-val">{payment.customerName}</span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">Currency:</span>
              <span className="cc-pay-detail-val cc-pay-detail-val--mono">{payment.currency}</span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">TT Amount:</span>
              <span className="cc-pay-detail-val cc-pay-detail-val--bold cc-pay-color-green">
                ${payment.ttAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {payment.currency}
              </span>
            </div>

            <div className="cc-pay-detail-item">
              <span className="cc-pay-detail-label">Approved Date:</span>
              <span className="cc-pay-detail-val cc-pay-detail-val--mono">
                {payment.approvedDate || '2024-10-20'}
              </span>
            </div>
          </div>

          <div className="cc-pay-docs-section">
            <span className="cc-pay-detail-label">TT Documents Uploaded:</span>
            <div className="cc-pay-docs-list">
              {(payment.documents && payment.documents.length > 0 ? payment.documents : [
                { name: `${payment.reference}_Official_Swift.pdf`, url: '#' },
                { name: `${payment.reference}_Bank_Advice.pdf`, url: '#' }
              ]).map((doc, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="cc-pay-doc-download-chip"
                  onClick={() => handleDownloadDoc(doc.name)}
                  title="Click to download document"
                >
                  📄 {doc.name} 📥
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
