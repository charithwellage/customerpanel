'use client';

import React from 'react';
import { useTranslation } from './I18nContext';
import type { LanguageCode } from '@carchief/domain';

export interface LanguageSwitcherProps {
  className?: string;
  id?: string;
  variant?: 'select' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  id = 'carchief-language-switcher',
  variant = 'select',
}) => {
  const { language, setLanguage, supportedLanguages, t } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as LanguageCode);
  };

  return (
    <div className={`header-utility-select-wrap ${className}`} data-testid="language-switcher-wrap">
      <span className="header-utility-icon" aria-hidden="true">🌐</span>
      <select
        id={id}
        className="header-utility-select"
        value={language}
        onChange={handleChange}
        aria-label={t('header.languageSelect', undefined, 'Select Language')}
        data-testid="language-switcher"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};
