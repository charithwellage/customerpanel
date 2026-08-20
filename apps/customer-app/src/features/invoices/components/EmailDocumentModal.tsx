import React, { useState } from 'react';

export interface EmailDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentNumber: string;
  documentType: 'PROFORMA' | 'INVOICE';
  senderEmail?: string;
  onSendSuccess?: (recipient: string) => void;
}

export const EmailDocumentModal: React.FC<EmailDocumentModalProps> = ({
  isOpen,
  onClose,
  documentNumber,
  documentType,
  senderEmail = 'charith.wellage@carchief.com',
  onSendSuccess,
}) => {
  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState(
    `${documentType === 'PROFORMA' ? 'Proforma Invoice' : 'Commercial Invoice'} ${documentNumber} - CarChief Co., Ltd.`
  );
  const [message, setMessage] = useState(
    `Dear Partner,\n\nPlease find attached the official ${
      documentType === 'PROFORMA' ? 'Proforma Invoice' : 'Commercial Invoice'
    } (${documentNumber}) for your review and records.\n\nBest regards,\nCarChief Accounts & Logistics Department`
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail.trim()) {
      setErrorMessage("Please enter receiver's email address");
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    // Simulate transmission
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      if (onSendSuccess) onSendSuccess(toEmail);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div
      className="cc-email-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
      data-testid="email-document-modal"
    >
      <div className="cc-email-modal-backdrop" onClick={onClose} />
      <div className="cc-email-modal-dialog">
        <div className="cc-email-modal-header">
          <h2 id="email-modal-title" className="cc-email-modal-title">
            Email {documentType === 'PROFORMA' ? 'Proforma' : 'Invoice'} ({documentNumber})
          </h2>
          <button
            type="button"
            className="cc-email-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="cc-email-modal-alert cc-email-modal-alert--error" role="alert">
            {errorMessage}
          </div>
        )}

        {isSuccess && (
          <div className="cc-email-modal-alert cc-email-modal-alert--success" role="status">
            ✓ Document sent successfully to {toEmail}
          </div>
        )}

        <form onSubmit={handleSend} className="cc-email-modal-form">
          {/* Locked sender email (FRD 4.11) */}
          <div className="cc-email-form-group">
            <label htmlFor="email-from" className="cc-email-form-label">
              From
            </label>
            <input
              id="email-from"
              type="email"
              className="cc-email-form-input cc-email-form-input--locked"
              value={senderEmail}
              disabled
              readOnly
              data-testid="email-sender-input"
            />
          </div>

          {/* Mandatory receiver email (FRD 4.11) */}
          <div className="cc-email-form-group">
            <label htmlFor="email-to" className="cc-email-form-label">
              To <span className="cc-email-required">*</span>
            </label>
            <input
              id="email-to"
              type="email"
              className="cc-email-form-input"
              placeholder="recipient@example.com"
              value={toEmail}
              onChange={(e) => {
                setToEmail(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              data-testid="email-recipient-input"
            />
          </div>

          {/* Subject */}
          <div className="cc-email-form-group">
            <label htmlFor="email-subject" className="cc-email-form-label">
              Subject
            </label>
            <input
              id="email-subject"
              type="text"
              className="cc-email-form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="email-subject-input"
            />
          </div>

          {/* Message */}
          <div className="cc-email-form-group">
            <label htmlFor="email-message" className="cc-email-form-label">
              Message
            </label>
            <textarea
              id="email-message"
              className="cc-email-form-textarea"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              data-testid="email-message-input"
            />
          </div>

          <div className="cc-email-modal-footer">
            <button
              type="button"
              className="cc-email-btn cc-email-btn--cancel"
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cc-email-btn cc-email-btn--send"
              disabled={isSending}
              data-testid="email-send-button"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
