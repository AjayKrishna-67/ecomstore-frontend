export const APP_META_TITLE = "Prabha's Aari Designs - Hand Crafted by Prabha";
export const APP_META_DESCRIPTION = '';

export const DEMO_API_URL = 'https://prabhasaaridesigns.com/shop-api';

/**
 * Normalize the configured API URL. Guards against env-var typos that have
 * bitten us before — a trailing space or a doubled slash
 * (`https://host//shop-api`) would otherwise be passed verbatim to `fetch`
 * and can break routing on stricter reverse proxies. Collapses any run of
 * repeated slashes except the protocol's `://`, and strips a trailing slash.
 */
function normalizeApiUrl(url: string): string {
  return url
    .trim()
    .replace(/(?<!:)\/{2,}/g, '/')
    .replace(/\/+$/, '');
}

export const API_URL: string = normalizeApiUrl(
  process.env.VENDURE_API_URL ?? DEMO_API_URL,
);

export const CHANNEL_TOKEN: string = process.env.CHANNEL_TOKEN ?? 'prabas-aari';
