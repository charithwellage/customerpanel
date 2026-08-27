import en from './locales/en/common.json' with { type: 'json' };
import ja from './locales/ja/common.json' with { type: 'json' };
import es from './locales/es/common.json' with { type: 'json' };
import fr from './locales/fr/common.json' with { type: 'json' };
import sw from './locales/sw/common.json' with { type: 'json' };
import pt from './locales/pt/common.json' with { type: 'json' };
import ru from './locales/ru/common.json' with { type: 'json' };
import ar from './locales/ar/common.json' with { type: 'json' };

/**
 * Locale resources are bundled with both applications. Additional locale files
 * are deliberately loaded here rather than over the network.
 */
export const resources = {
  en: { common: en },
  ja: { common: ja },
  es: { common: es },
  fr: { common: fr },
  sw: { common: sw },
  pt: { common: pt },
  ru: { common: ru },
  ar: { common: ar },
} as const;

export type ResourceLanguage = keyof typeof resources;
