import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { i18nConfig } from './config';

// Import translations directly so they're available synchronously
import en from '../public/locales/en.json';
import es from '../public/locales/es.json';
import pt from '../public/locales/pt.json';
import ptBR from '../public/locales/pt-BR.json';

// Initialize i18next synchronously at module evaluation time.
// This ensures translations are available during both SSR and client rendering,
// preventing hydration mismatches.
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    ...i18nConfig,
    resources: {
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
      'pt-BR': { translation: ptBR },
    },
    lng: 'en',
    interpolation: { escapeValue: false },
    initImmediate: false, // Synchronous init
  });
}

export { useTranslation };
