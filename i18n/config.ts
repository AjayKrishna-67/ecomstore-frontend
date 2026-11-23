export const defaultLocale = 'en';
export const locales = ['en', 'es', 'pt', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];

export const i18nConfig = {
  supportedLngs: locales,
  fallbackLng: defaultLocale,
  react: { useSuspense: false },
};
