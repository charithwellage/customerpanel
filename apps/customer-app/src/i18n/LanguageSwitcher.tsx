import React from 'react';
import { useTranslation } from './I18nContext.js';
import type { LanguageCode } from '@carchief/domain';

export interface CustomerLanguageSwitcherProps {
  className?: string;
  id?: string;
  compact?: boolean;
}

export const CustomerLanguageSwitcher: React.FC<CustomerLanguageSwitcherProps> = ({
  className = '',
  id = 'customer-language-switcher',
  compact = false,
}) => {
  const { language, setLanguage, supportedLanguages, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className={`cc-cust-lang-switcher ${compact ? 'cc-cust-lang-switcher--compact' : ''} ${className}`} data-testid="customer-language-switcher-wrap">
      {!compact && <span className="cc-cust-lang-switcher__icon" aria-hidden="true">🌐</span>}
      <select
        id={id}
        className="cc-cust-lang-switcher__select"
        value={language}
        onChange={handleChange}
        aria-label={t('header.languageSelect', undefined, 'Select Language')}
        data-testid="customer-language-switcher"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
};
