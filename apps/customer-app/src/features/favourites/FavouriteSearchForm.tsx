import React, { useState } from 'react';
import type { FavouriteSearchCriteria, FavouriteSearchFacets } from '@carchief/domain';
import type { NormalizedApiError } from '@carchief/api-client';
import './favourites.css';

export interface FavouriteSearchFormProps {
  facets: FavouriteSearchFacets | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isFull: boolean;
  error: NormalizedApiError | null;
  onSubmit: (name: string, criteria: FavouriteSearchCriteria) => Promise<void>;
  onCancel: () => void;
}

export const FavouriteSearchForm: React.FC<FavouriteSearchFormProps> = ({
  facets,
  isLoading,
  isSubmitting,
  isFull,
  error,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FavouriteSearchCriteria & { name: string }>({
    name: '',
    make: '',
    model: '',
    modelCode: '',
    yearFrom: undefined,
    yearTo: undefined,
    priceFromUsd: undefined,
    priceToUsd: undefined,
    mileageMin: undefined,
    mileageMax: undefined,
    engineCc: '',
    fuelType: '',
    color: '',
    steering: '',
    driveTrain: '',
    transmission: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
    setValidationError(null);
  };

  const validateForm = (): boolean => {
    // At least one non-empty field is required (D02-ASM-010)
    const criteriaFields: (keyof FavouriteSearchCriteria)[] = [
      'make',
      'model',
      'modelCode',
      'yearFrom',
      'yearTo',
      'priceFromUsd',
      'priceToUsd',
      'mileageMin',
      'mileageMax',
      'engineCc',
      'fuelType',
      'color',
      'steering',
      'driveTrain',
      'transmission',
    ];

    const hasAtLeastOneCriteria = criteriaFields.some((field) => {
      const value = formData[field];
      return value !== undefined && value !== '';
    });

    if (!hasAtLeastOneCriteria) {
      setValidationError('Please select at least one search criterion.');
      return false;
    }

    if (!formData.name || formData.name.trim() === '') {
      setValidationError('Please enter a name for this search.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!validateForm()) {
      return;
    }

    try {
      const { name, ...criteria } = formData;
      await onSubmit(name, criteria);
      // Reset form on success
      setFormData({
        name: '',
        make: '',
        model: '',
        modelCode: '',
        yearFrom: undefined,
        yearTo: undefined,
        priceFromUsd: undefined,
        priceToUsd: undefined,
        mileageMin: undefined,
        mileageMax: undefined,
        engineCc: '',
        fuelType: '',
        color: '',
        steering: '',
        driveTrain: '',
        transmission: '',
      });
    } catch {
      // Error is handled by the parent component's error state
    }
  };

  // Map 409 limit_exceeded errors to user-friendly message
  let errorMessage = validationError;
  if (error && error.statusCode === 409) {
    errorMessage = 'You have reached the 25-favourite limit. Delete one to save a new search.';
  } else if (error && error.message) {
    errorMessage = error.message;
  }

  if (isLoading) {
    return (
      <div className="favourite-form-container">
        <div className="form-loading">Loading form options...</div>
      </div>
    );
  }

  return (
    <div className="favourite-form-container">
      <form className="favourite-search-form" onSubmit={handleSubmit} data-testid="favourite-search-form">
        <div className="form-section">
          <h3 className="form-section-title">Search Name</h3>

          <div className="form-group">
            <label htmlFor="search-name" className="form-label">
              Name this search
              <span className="required" aria-label="required">
                *
              </span>
            </label>
            <input
              id="search-name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Affordable Compacts"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Make & Model</h3>

          <div className="form-group">
            <label htmlFor="make" className="form-label">
              Make
            </label>
            <select
              id="make"
              className="form-select"
              value={formData.make || ''}
              onChange={(e) => handleChange('make', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Any Make</option>
              {facets?.makes.map((make) => (
                <option key={make.name} value={make.name}>
                  {make.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="model" className="form-label">
              Model
            </label>
            <select
              id="model"
              className="form-select"
              value={formData.model || ''}
              onChange={(e) => handleChange('model', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Any Model</option>
              {facets?.models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="model-code" className="form-label">
              Model Code
            </label>
            <select
              id="model-code"
              className="form-select form-disabled"
              disabled
              title="Model Code data not yet available"
            >
              <option>No data yet</option>
            </select>
            <div className="field-note">Model Code data is not yet available</div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Year & Price</h3>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="year-from" className="form-label">
                Year From
              </label>
              <input
                id="year-from"
                type="number"
                className="form-input"
                value={formData.yearFrom || ''}
                onChange={(e) => handleChange('yearFrom', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Year"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="year-to" className="form-label">
                Year To
              </label>
              <input
                id="year-to"
                type="number"
                className="form-input"
                value={formData.yearTo || ''}
                onChange={(e) => handleChange('yearTo', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Year"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="price-from" className="form-label">
                Price From (USD)
              </label>
              <input
                id="price-from"
                type="number"
                className="form-input"
                value={formData.priceFromUsd || ''}
                onChange={(e) => handleChange('priceFromUsd', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Price"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="price-to" className="form-label">
                Price To (USD)
              </label>
              <input
                id="price-to"
                type="number"
                className="form-input"
                value={formData.priceToUsd || ''}
                onChange={(e) => handleChange('priceToUsd', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Price"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Mileage & Engine</h3>

          <div className="form-group-row">
            <div className="form-group">
              <label htmlFor="mileage-min" className="form-label">
                Min Mileage
              </label>
              <input
                id="mileage-min"
                type="number"
                className="form-input"
                value={formData.mileageMin || ''}
                onChange={(e) => handleChange('mileageMin', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Mileage"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mileage-max" className="form-label">
                Max Mileage
              </label>
              <input
                id="mileage-max"
                type="number"
                className="form-input"
                value={formData.mileageMax || ''}
                onChange={(e) => handleChange('mileageMax', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Mileage"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="engine-cc" className="form-label">
              Engine CC
            </label>
            <select
              id="engine-cc"
              className="form-select form-disabled"
              disabled
              title="Engine CC data not yet available"
            >
              <option>No data yet</option>
            </select>
            <div className="field-note">Engine CC data is not yet available</div>
          </div>

          <div className="form-group">
            <label htmlFor="fuel-type" className="form-label">
              Fuel Type
            </label>
            <select
              id="fuel-type"
              className="form-select"
              value={formData.fuelType || ''}
              onChange={(e) => handleChange('fuelType', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Any Fuel Type</option>
              {facets?.fuelTypes.map((fuel) => (
                <option key={fuel.name} value={fuel.name}>
                  {fuel.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3 className="form-section-title">Features</h3>

          <div className="form-group">
            <label htmlFor="color" className="form-label">
              Color
            </label>
            <select
              id="color"
              className="form-select form-disabled"
              disabled
              title="Color data not yet available"
            >
              <option>No data yet</option>
            </select>
            <div className="field-note">Color data is not yet available</div>
          </div>

          <div className="form-group">
            <label htmlFor="steering" className="form-label">
              Steering
            </label>
            <select
              id="steering"
              className="form-select form-disabled"
              disabled
              title="Steering data not yet available"
            >
              <option>No data yet</option>
            </select>
            <div className="field-note">Steering data is not yet available</div>
          </div>

          <div className="form-group">
            <label htmlFor="drivetrain" className="form-label">
              Drivetrain
            </label>
            <select
              id="drivetrain"
              className="form-select"
              value={formData.driveTrain || ''}
              onChange={(e) => handleChange('driveTrain', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Any Drivetrain</option>
              {facets?.driveTrains.map((drive) => (
                <option key={drive.name} value={drive.name}>
                  {drive.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="transmission" className="form-label">
              Transmission
            </label>
            <select
              id="transmission"
              className="form-select"
              value={formData.transmission || ''}
              onChange={(e) => handleChange('transmission', e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Any Transmission</option>
              {facets?.transmissions.map((trans) => (
                <option key={trans.name} value={trans.name}>
                  {trans.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="form-error" role="alert">
            {errorMessage}
          </div>
        )}

        {/* At-limit warning */}
        {isFull && (
          <div className="form-warning" role="alert">
            You have reached the 25-favourite limit. Delete an existing search to create a new one.
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || isFull}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Search'}
          </button>
          <button type="button" className="cancel-button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
