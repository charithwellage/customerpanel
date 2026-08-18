import React, { useState } from 'react';
import type { WishlistItem } from '@carchief/domain';
import { useCustomerShell } from '../shell/index.js';
import { useCustomerWishlist } from './useCustomerWishlist.js';
import './wishlist.css';

export const CustomerWishlistPage: React.FC = () => {
  const { setActiveRoute } = useCustomerShell();
  const { items, isLoading, isError, error, refetch, removeItem, isRemoving } = useCustomerWishlist();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-description">Vehicles you've saved for later</p>
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
      <div className="wishlist-page">
        <div className="wishlist-header">
          <h1 className="wishlist-title">My Wishlist</h1>
          <p className="wishlist-description">Vehicles you've saved for later</p>
        </div>
        <div className="error-state">
          <p className="error-message">
            {error?.message || 'Failed to load your wishlist. Please try again.'}
          </p>
          <button className="retry-button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleRemove = async (vehicleSlug: string, vehicleId: string) => {
    setRemovingIds((prev) => new Set(prev).add(vehicleId));
    try {
      await removeItem(vehicleSlug);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(vehicleId);
        return next;
      });
    }
  };

  return (
    <div className="wishlist-page" data-testid="customer-wishlist-page">
      <div className="wishlist-header">
        <h1 className="wishlist-title">My Wishlist</h1>
        <p className="wishlist-description">Vehicles you've saved for later</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <h2 className="empty-state-title">No wishlisted vehicles</h2>
          <p className="empty-state-description">Start exploring our inventory and save vehicles you'd like to return to.</p>
          <button className="empty-state-link" onClick={() => setActiveRoute('/inventory')}>
            Browse Inventory
          </button>
        </div>
      ) : (
        <div className="wishlist-container">
          {items.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              isRemoving={removingIds.has(item.vehicleId)}
              onViewDetails={() => setActiveRoute(`/inventory/${item.vehicleSlug}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (vehicleSlug: string, vehicleId: string) => Promise<void>;
  isRemoving: boolean;
  onViewDetails: () => void;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({ item, onRemove, isRemoving, onViewDetails }) => {
  // Fallback image if none is available
  const imageUrl = '/images/placeholder-vehicle.png';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="wishlist-card" role="article" data-testid={`wishlist-item-${item.id}`}>
      <img
        className="wishlist-image"
        src={imageUrl}
        alt="Vehicle"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <div className="wishlist-details">
        <div className="wishlist-meta">
          <span className="wishlist-date">Saved {formatDate(item.createdAt)}</span>
        </div>
        <button
          className="wishlist-remove-btn"
          onClick={() => onRemove(item.vehicleSlug, item.vehicleId)}
          disabled={isRemoving}
          title="Remove from wishlist"
          aria-label={`Remove from wishlist`}
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
        <button className="wishlist-details-btn" onClick={onViewDetails}>
          View Vehicle Details
        </button>
      </div>
    </div>
  );
};
