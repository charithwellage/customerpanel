import React from 'react';
import { useTranslation } from './I18nContext.js';
import type { LanguageCode } from '@carchief/domain';

export interface CustomerLanguageSwitcherProps {
  className?: string;
  id?: string;
}

export const CustomerLanguageSwitcher: React.FC<CustomerLanguageSwitcherProps> = ({
  className = '',
  id = 'customer-language-switcher',
}) => {
  const { language, setLanguage, supportedLanguages, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className={`cc-cust-lang-switcher ${className}`} data-testid="customer-language-switcher-wrap">
      <span className="cc-cust-lang-switcher__icon" aria-hidden="true">🌐</span>
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
            {lang.flag} {lang.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
};
