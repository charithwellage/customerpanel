import React from 'react';
import { CarChiefLogoMark } from './Icons.js';
import './carchief-loading-button.css';

export interface CarChiefLoadingButtonProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'card' | 'overlay';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const CarChiefLoadingButton: React.FC<CarChiefLoadingButtonProps> = ({
  label = 'CarChief Loading...',
  size = 'md',
  variant = 'primary',
  className = '',
  onClick,
  disabled = true,
}) => {
  return (
    <div className={`cc-loading-btn-wrap cc-loading-btn-wrap--${variant} ${className}`}>
      <button
        type="button"
        className={`cc-loading-btn cc-loading-btn--${size} cc-loading-btn--${variant}`}
        onClick={onClick}
        disabled={disabled}
        aria-live="polite"
        role="status"
      >
        <div className="cc-loading-btn__spinner-wrap">
          <span className="cc-loading-btn__ring" />
          <CarChiefLogoMark width={20} height={21} className="cc-loading-btn__logo" />
        </div>
        <span className="cc-loading-btn__text">{label}</span>
      </button>
    </div>
  );
};
