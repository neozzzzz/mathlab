import type { GAEventName, GAEventParams } from './events';

export { GA_EVENTS } from './events';
export type { GAEventName, GAEventParams } from './events';

export const GA_ID = 'G-L8P5B3G306';

const isProd = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function pageview(url: string) {
  if (isProd) {
    window.gtag?.('config', GA_ID, { page_path: url });
  } else if (typeof window !== 'undefined') {
    console.log(`[GA:pageview] ${url}`);
  }
}

export function trackEvent(name: GAEventName, params?: GAEventParams) {
  if (isProd) {
    window.gtag?.('event', name, params);
  } else if (typeof window !== 'undefined') {
    console.log(`[GA:event] ${name}`, params ?? '');
  }
}
