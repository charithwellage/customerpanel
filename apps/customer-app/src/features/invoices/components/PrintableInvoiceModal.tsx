import React, { useEffect } from 'react';
import type { CustomerInvoiceDocument } from '@carchief/domain';

export interface PrintableInvoiceModalProps {
  document: CustomerInvoiceDocument | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export const PrintableInvoiceModal: React.FC<PrintableInvoiceModalProps> = ({
  document,
  isOpen,
  isLoading,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="cc-invoice-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-doc-modal-title"
      data-testid="printable-invoice-modal"
    >
      <div className="cc-invoice-modal-backdrop" onClick={onClose} />
      <div className="cc-invoice-modal-dialog">
        <div className="cc-invoice-modal-header">
          <div className="cc-invoice-modal-header__info">
            <h2 id="invoice-doc-modal-title" className="cc-invoice-modal-title" data-testid="doc-modal-title">
              {document ? document.title : 'Official Document Projection'}
            </h2>
            <span className="cc-invoice-modal-subtitle">
              Official CarChief international commercial documentation
            </span>
          </div>

          <div className="cc-invoice-modal-header__actions">
            <button
              type="button"
              className="cc-invoice-modal-btn cc-invoice-modal-btn--print"
              data-testid="print-document-btn"
              onClick={handlePrint}
              disabled={isLoading || !document}
            >
              🖨️ Print / Save as PDF
            </button>
            <button
              type="button"
              className="cc-invoice-modal-btn cc-invoice-modal-btn--close"
              data-testid="close-modal-btn"
              onClick={onClose}
              aria-label="Close document modal"
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="cc-invoice-modal-body">
          {isLoading ? (
            <div className="cc-invoice-modal-loading" data-testid="doc-modal-loading">
              <div className="cc-invoice-spinner" />
              <p>Loading official printable projection...</p>
            </div>
          ) : !document ? (
            <div className="cc-invoice-modal-empty" data-testid="doc-modal-empty">
              <p>Document projection is currently unavailable for this record.</p>
            </div>
          ) : (
            <div
              className="cc-invoice-document-render"
              data-testid="invoice-document-html"
              dangerouslySetInnerHTML={{ __html: document.contentHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
