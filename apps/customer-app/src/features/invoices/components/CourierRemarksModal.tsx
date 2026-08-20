import React from 'react';

export interface CourierRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockNumber: string;
  courierCompany?: string;
  trackingNumber?: string;
  remarks?: string;
}

export const CourierRemarksModal: React.FC<CourierRemarksModalProps> = ({
  isOpen,
  onClose,
  stockNumber,
  courierCompany = 'DHL Express',
  trackingNumber = '0010019284',
  remarks = 'Customs manifest original bill of lading (B/L) dispatched via DHL Express Courier. Consignee delivery scheduled.',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="cc-courier-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="courier-remarks-modal-title"
      data-testid="courier-remarks-modal"
    >
      <div className="cc-courier-modal-backdrop" onClick={onClose} />
      <div className="cc-courier-modal-dialog">
        <div className="cc-courier-modal-header">
          <h2 id="courier-remarks-modal-title" className="cc-courier-modal-title">
            Courier Remarks ({stockNumber})
          </h2>
          <button
            type="button"
            className="cc-courier-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="cc-courier-modal-body">
          <div className="cc-courier-meta-row">
            <span className="cc-courier-meta-label">Courier Service:</span>
            <strong className="cc-courier-meta-val">{courierCompany}</strong>
          </div>
          <div className="cc-courier-meta-row">
            <span className="cc-courier-meta-label">Tracking Number:</span>
            <span className="cc-courier-meta-val cc-courier-meta-val--mono">{trackingNumber}</span>
          </div>

          <div className="cc-courier-remarks-box">
            <span className="cc-courier-remarks-label">Courier Manager Notes:</span>
            <p className="cc-courier-remarks-text">{remarks}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
