import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import { i18nConfig, defaultLocale } from './config';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function getServerTranslation(
  lng: string = defaultLocale,
  ns: string = 'translation',
) {
  const i18nInstance = createInstance();

  // Load translations from file system
  const resources: Record<string, Record<string, any>> = {};
  const filePath = join(process.cwd(), 'public', 'locales', lng, `${ns}.json`);

  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      resources[lng] = { [ns]: JSON.parse(content) };
    } catch {
      resources[lng] = { [ns]: {} };
    }
  }

  await i18nInstance.use(initReactI18next).init({
    ...i18nConfig,
    lng,
    ns: [ns],
    resources,
  });

  return {
    t: i18nInstance.getFixedT(lng, ns),
    i18n: i18nInstance,
  };
}
