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

        {/* Modal Footer with WhatsApp Sales Contact */}
        <div className="cc-inq-modal-footer">
          <a
            href={`https://wa.me/818012345678?text=${encodeURIComponent(`Hello CarChief Sales, I am following up regarding inquiry ${inquiryNumber} (${source}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-inq-whatsapp-btn"
            title="Chat with CarChief Sales Representative on WhatsApp"
            data-testid="btn-inquiry-whatsapp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.585 1.961.933 2.796.933 3.183 0 5.769-2.587 5.77-5.767.001-3.181-2.585-5.769-5.77-5.769zm10.125 5.769c0 5.602-4.557 10.16-10.156 10.16-1.748 0-3.411-.453-4.877-1.272l-5.623 1.472 1.503-5.485c-.927-1.536-1.442-3.329-1.442-5.176 0-5.603 4.557-10.16 10.156-10.16 5.602 0 10.157 4.558 10.157 10.161zm-4.328 4.225c-.244-.122-1.443-.712-1.667-.793-.224-.082-.387-.122-.55.122-.163.244-.632.793-.774.956-.143.163-.285.184-.529.061-.244-.122-1.03-.38-1.962-1.211-.725-.646-1.215-1.445-1.357-1.689-.143-.244-.015-.376.107-.498.11-.11.244-.285.366-.428.122-.143.163-.244.244-.407.082-.163.041-.305-.02-.428-.061-.122-.55-1.324-.753-1.813-.198-.476-.399-.411-.55-.419l-.469-.008c-.163 0-.428.061-.651.305-.224.244-.855.835-.855 2.037 0 1.202.876 2.363.998 2.526.122.163 1.724 2.632 4.177 3.69.583.252 1.039.403 1.394.516.586.186 1.119.16 1.541.097.471-.07 1.443-.59 1.647-1.161.204-.57.204-1.059.143-1.161-.061-.102-.224-.163-.468-.285z"/>
            </svg>
            <span>Contact Sales on WhatsApp</span>
          </a>
          <button type="button" className="cc-inq-modal-dismiss-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
