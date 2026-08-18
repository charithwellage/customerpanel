import React from 'react';
import type { CustomerInquirySummary } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerInquiries } from './useCustomerInquiries.js';
import './inquiries.css';

export const CustomerInquiriesPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { inquiries, isLoading, isError, error, refetch } = useCustomerInquiries();

  if (isLoading) {
    return (
      <div className="inquiries-page">
        <div className="inquiries-header">
          <h1 className="inquiries-title">My Inquiries</h1>
          <p className="inquiries-description">Your quote requests and inquiries</p>
        </div>
        <div className="loading-state">
          {[1, 2, 3].map((i) => (
            <div key={i} className="loading-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="inquiries-page">
        <div className="inquiries-header">
          <h1 className="inquiries-title">My Inquiries</h1>
          <p className="inquiries-description">Your quote requests and inquiries</p>
        </div>
        <div className="error-state" role="alert">
          <p className="error-message">
            {error?.message || 'Failed to load inquiries. Please try again.'}
          </p>
          <button className="retry-button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiries-page" data-testid="customer-inquiries-page">
      <div className="inquiries-header">
        <h1 className="inquiries-title">My Inquiries</h1>
        <p className="inquiries-description">Your quote requests and inquiries</p>
      </div>

      {inquiries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h2 className="empty-state-title">No inquiries yet</h2>
          <p className="empty-state-description">
            Start browsing our inventory and request quotes for vehicles you're interested in.
          </p>
          <button className="empty-state-link" onClick={() => setActiveRoute('/inventory')}>
            Browse Inventory
          </button>
        </div>
      ) : (
        <div className="inquiries-container">
          {inquiries.map((inquiry) => (
            <InquiryRow key={`${inquiry.vehicleId}-${inquiry.requestedAt}`} inquiry={inquiry} />
          ))}
        </div>
      )}
    </div>
  );
};

const InquiryRow: React.FC<{ inquiry: CustomerInquirySummary }> = ({ inquiry }) => {
  const { setActiveRoute } = useCustomerShell();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const inquirerLabel = inquiry.inquirerCount === 1 ? 'person is' : 'people are';

  const handleViewDetails = () => {
    setActiveRoute(`/inventory/${inquiry.vehicleSlug}`);
  };

  // Fallback image if none is available
  const imageUrl = '/images/placeholder-vehicle.png';

  return (
    <div className="inquiry-card" role="article">
      <img
        className="inquiry-image"
        src={imageUrl}
        alt={inquiry.vehicleTitle}
        onError={(e) => {
          // Fallback for missing images
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="inquiry-details">
        <h3 className="inquiry-title">{inquiry.vehicleTitle}</h3>
        <div className="inquiry-info">
          <div className="inquiry-date">
            <span>📅</span>
            <span>Requested: {formatDate(inquiry.requestedAt)}</span>
          </div>
          <div className="inquiry-inquirer-count">
            <span>👥</span>
            <span>
              <span className="inquirer-count-badge">
                {inquiry.inquirerCount} {inquirerLabel} inquiring
              </span>
            </span>
          </div>
        </div>
        <button className="inquiry-details-btn" onClick={handleViewDetails}>
          View Vehicle Details
        </button>
      </div>
    </div>
  );
};
