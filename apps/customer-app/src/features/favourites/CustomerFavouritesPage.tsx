import React, { useState } from 'react';
import type { FavouriteSearch, FavouriteSearchCriteria } from '@carchief/domain';
import { FavouriteSearchForm } from './FavouriteSearchForm.js';
import { useCustomerFavourites } from './useCustomerFavourites.js';
import './favourites.css';

export const CustomerFavouritesPage: React.FC = () => {
  const {
    favourites,
    facets,
    isLoading,
    isLoadingFacets,
    isError,
    error,
    refetch,
    createFavourite,
    removeFavourite,
    isCreating,
    isRemoving,
    createError,
    isFavouritesFull,
    favouriteLimit,
  } = useCustomerFavourites();

  const [showForm, setShowForm] = useState(false);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="favourites-page">
        <div className="favourites-header">
          <h1 className="favourites-title">Favourites</h1>
          <p className="favourites-description">Saved search criteria for automated alerts</p>
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
      <div className="favourites-page">
        <div className="favourites-header">
          <h1 className="favourites-title">Favourites</h1>
          <p className="favourites-description">Saved search criteria for automated alerts</p>
        </div>
        <div className="error-state" role="alert">
          <p className="error-message">
            {error?.message || 'Failed to load your favourites. Please try again.'}
          </p>
          <button className="retry-button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const handleCreateFavourite = async (name: string, criteria: FavouriteSearchCriteria) => {
    try {
      await createFavourite(name, criteria);
      setShowForm(false);
    } catch {
      // Error is managed by the createError state
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
    try {
      await removeFavourite(id);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="favourites-page" data-testid="customer-favourites-page">
      <div className="favourites-header">
        <h1 className="favourites-title">Favourites</h1>
        <p className="favourites-description">Saved search criteria for automated alerts</p>
        <p className="favourites-limit">
          {favourites.length} of {favouriteLimit} saved searches
        </p>
      </div>

      {showForm ? (
        <FavouriteSearchForm
          facets={facets}
          isLoading={isLoadingFacets}
          isSubmitting={isCreating}
          isFull={isFavouritesFull}
          error={createError}
          onSubmit={handleCreateFavourite}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          {favourites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⭐</div>
              <h2 className="empty-state-title">No saved searches yet</h2>
              <p className="empty-state-description">
                Create a saved search to get automated alerts when matching vehicles arrive.
              </p>
              <button className="empty-state-link" onClick={() => setShowForm(true)}>
                Create Your First Search
              </button>
            </div>
          ) : (
            <>
              <div className="favourites-list">
                {favourites.map((favourite) => (
                  <FavouriteCard
                    key={favourite.id}
                    favourite={favourite}
                    onRemove={handleRemove}
                    isRemoving={removingIds.has(favourite.id)}
                  />
                ))}
              </div>

              {!isFavouritesFull && (
                <div className="create-button-container">
                  <button className="create-favourite-btn" onClick={() => setShowForm(true)}>
                    Create New Search
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

interface FavouriteCardProps {
  favourite: FavouriteSearch;
  onRemove: (id: string) => Promise<void>;
  isRemoving: boolean;
}

const FavouriteCard: React.FC<FavouriteCardProps> = ({ favourite, onRemove, isRemoving }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCriteriaDisplay = (criteria: FavouriteSearch['criteria']) => {
    const parts: string[] = [];
    if (criteria.make) parts.push(criteria.make);
    if (criteria.model) parts.push(criteria.model);
    if (criteria.fuelType) parts.push(criteria.fuelType);
    if (criteria.yearFrom && criteria.yearTo) {
      parts.push(`${criteria.yearFrom}–${criteria.yearTo}`);
    } else if (criteria.yearFrom) {
      parts.push(`From ${criteria.yearFrom}`);
    } else if (criteria.yearTo) {
      parts.push(`Until ${criteria.yearTo}`);
    }
    if (criteria.priceFromUsd && criteria.priceToUsd) {
      parts.push(`$${criteria.priceFromUsd.toLocaleString()}–$${criteria.priceToUsd.toLocaleString()}`);
    } else if (criteria.priceFromUsd) {
      parts.push(`From $${criteria.priceFromUsd.toLocaleString()}`);
    } else if (criteria.priceToUsd) {
      parts.push(`Up to $${criteria.priceToUsd.toLocaleString()}`);
    }
    if (criteria.transmission) parts.push(criteria.transmission);
    if (criteria.driveTrain) parts.push(criteria.driveTrain);
    return parts.join(', ') || 'Any criteria';
  };

  return (
    <div className="favourite-card" role="article" data-testid={`favourite-item-${favourite.id}`}>
      <div className="favourite-details">
        <h3 className="favourite-name">{favourite.name}</h3>
        <p className="favourite-criteria">{getCriteriaDisplay(favourite.criteria)}</p>
        <p className="favourite-date">Created {formatDate(favourite.createdAt)}</p>
      </div>
      <div className="favourite-actions">
        <button
          className="favourite-remove-btn"
          onClick={() => onRemove(favourite.id)}
          disabled={isRemoving}
          aria-label={`Delete search "${favourite.name}"`}
        >
          {isRemoving ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};
