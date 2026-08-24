import React from 'react';
import './view-mode-toggle.css';
import { useTranslation } from '../i18n/index.js';

export type ViewMode = 'grid' | 'list';

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  label?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ value, onChange, label = 'Vehicle view' }) => (
  <ViewModeToggleContent value={value} onChange={onChange} label={label} />
);

const ViewModeToggleContent: React.FC<ViewModeToggleProps> = ({ value, onChange, label }) => {
  const { t } = useTranslation();
  return (
  <div className="cc-view-mode-toggle" role="group" aria-label={label}>
    <button
      type="button"
      className={`cc-view-mode-toggle__button ${value === 'grid' ? 'cc-view-mode-toggle__button--active' : ''}`}
      aria-pressed={value === 'grid'}
      onClick={() => onChange('grid')}
      title={t('customer.gridView', undefined, 'Grid view')}
    >
      ▦ <span>{t('customer.grid', undefined, 'Grid')}</span>
    </button>
    <button
      type="button"
      className={`cc-view-mode-toggle__button ${value === 'list' ? 'cc-view-mode-toggle__button--active' : ''}`}
      aria-pressed={value === 'list'}
      onClick={() => onChange('list')}
      title={t('customer.listView', undefined, 'List view')}
    >
      ☰ <span>{t('customer.list', undefined, 'List')}</span>
    </button>
  </div>
  );
};
