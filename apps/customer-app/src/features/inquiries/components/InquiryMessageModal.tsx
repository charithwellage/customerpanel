import React from 'react';

export interface InquiryMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiryNumber: string;
  source: string;
  date: string;
  message: string;
  replyMessage?: string;
  repliedAt?: string;
}

export const InquiryMessageModal: React.FC<InquiryMessageModalProps> = ({
  isOpen,
  onClose,
  inquiryNumber,
  source,
  date,
  message,
  replyMessage,
  repliedAt,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="cc-inq-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inquiry-modal-title"
      data-testid="inquiry-message-modal"
    >
      <div className="cc-inq-modal-backdrop" onClick={onClose} />
      <div className="cc-inq-modal-dialog">
        <div className="cc-inq-modal-header">
          <div className="cc-inq-modal-title-wrap">
            <h3 id="inquiry-modal-title" className="cc-inq-modal-title">
              Inquiry Message ({inquiryNumber})
            </h3>
            <span className="cc-inq-modal-badge">{source}</span>
          </div>
          <button
            type="button"
            className="cc-inq-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="cc-inq-modal-body">
          <div className="cc-inq-msg-bubble cc-inq-msg-bubble--customer">
            <div className="cc-inq-msg-header">
              <span className="cc-inq-msg-sender">Your Inquiry</span>
              <span className="cc-inq-msg-date">{date}</span>
            </div>
            <p className="cc-inq-msg-text">{message || 'Inquiry requested on stock details and delivery schedules.'}</p>
          </div>

          {replyMessage ? (
            <div className="cc-inq-msg-bubble cc-inq-msg-bubble--staff">
              <div className="cc-inq-msg-header">
                <span className="cc-inq-msg-sender cc-inq-msg-sender--staff">CarChief Logistics Desk</span>
                <span className="cc-inq-msg-date">{repliedAt || 'Recently'}</span>
              </div>
              <p className="cc-inq-msg-text">{replyMessage}</p>
            </div>
          ) : (
            <div className="cc-inq-pending-note">
              <span className="cc-inq-pending-dot" aria-hidden="true" />
              <span>Pending response from CarChief Sales Representative.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
