import React, { useEffect, useRef, useState } from 'react';

export interface CustomerInquiryModalProps {
  isOpen: boolean;
  vehicleTitle: string;
  customerName: string;
  customerEmail: string;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void> | void;
}

export const CustomerInquiryModal: React.FC<CustomerInquiryModalProps> = ({
  isOpen,
  vehicleTitle,
  customerName,
  customerEmail,
  submitting,
  error,
  onClose,
  onSubmit,
}) => {
  const [message, setMessage] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessage('');
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submitting) await onSubmit(message.trim());
  };

  return (
    <div
      className="cc-cust-inquiry-modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <section
        className="cc-cust-inquiry-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-inquiry-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cc-cust-inquiry-modal__header">
          <div>
            <span className="cc-cust-inquiry-modal__eyebrow">Vehicle enquiry</span>
            <h2 id="customer-inquiry-modal-title">Submit an Inquiry</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="cc-cust-inquiry-modal__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close inquiry form"
          >
            ×
          </button>
        </header>

        <form className="cc-cust-inquiry-modal__form" onSubmit={handleSubmit}>
          <p className="cc-cust-inquiry-modal__vehicle">Inquiry about {vehicleTitle}</p>

          <label className="cc-cust-inquiry-modal__field">
            <span>Name</span>
            <input type="text" value={customerName} disabled readOnly />
          </label>

          <label className="cc-cust-inquiry-modal__field">
            <span>Email</span>
            <input type="email" value={customerEmail} disabled readOnly />
          </label>

          <label className="cc-cust-inquiry-modal__field">
            <span>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us what you would like to know about this vehicle"
              rows={5}
              disabled={submitting}
            />
          </label>

          {error && <p className="cc-cust-inquiry-modal__error" role="alert">{error}</p>}

          <div className="cc-cust-inquiry-modal__actions">
            <button type="button" className="cc-cust-btn cc-cust-btn--secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="cc-cust-btn cc-cust-btn--primary" disabled={submitting}>
              {submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

