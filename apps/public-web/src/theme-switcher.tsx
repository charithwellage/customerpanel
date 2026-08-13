'use client';

import { useEffect, useState } from 'react';
import { getThemeCssVariables, getThemeDefinition, resolveThemeId, ThemeId } from '@carchief/theme';

const STORAGE_KEY = 'carchief-theme';

export function ThemeSwitcher({ initialThemeId }: { initialThemeId: ThemeId }) {
  const [selectedThemeId, setSelectedThemeId] = useState(initialThemeId);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme) {
      const storedThemeId = resolveThemeId(storedTheme);
      setSelectedThemeId(storedThemeId);
      applyTheme(storedThemeId);
    }
  }, []);

  function applyTheme(themeId: ThemeId) {
    const root = document.documentElement;
    const surface = document.body;
    const variables = getThemeCssVariables(getThemeDefinition(themeId).tokens);
    Object.entries(variables).forEach(([name, value]) => surface.style.setProperty(name, value));
    root.dataset.theme = themeId;
    window.localStorage.setItem(STORAGE_KEY, themeId);
  }

  return <label className="theme-switcher">Theme <select aria-label="Theme" value={selectedThemeId} onChange={(event) => { const themeId = resolveThemeId(event.target.value); setSelectedThemeId(themeId); applyTheme(themeId); }}><option value="carchief">CarChief</option><option value="ocean">Ocean</option></select></label>;
}
