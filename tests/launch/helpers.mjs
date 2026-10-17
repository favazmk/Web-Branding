import { expect } from '@playwright/test';

export const PAGES = [
  'index', 'brand-design-services', 'digital-marketing-services', 'media-production-services',
  'web-development-services', 'web-development', 'digital-marketing', 'campaign', 'thankyou', 'work-in-progress',
];

// Ad landing pages: they must stay off the site's navigation in both directions.
export const AD_PAGES = ['web-development', 'digital-marketing'];

export const url = (name) => (name === 'index' ? '/' : `/${name}`);

// Keeps runs offline and deterministic: third-party requests (GTM, fonts,
// form API) are aborted, and the errors they cause are not counted.
export async function isolate(page) {
  const errors = [];
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort());
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location()?.url || '';
    if (/ERR_FAILED|net::/.test(m.text()) || (loc && !loc.includes('127.0.0.1'))) return;
    errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.url().includes('127.0.0.1') && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

export async function scrollThrough(page, step = 0.8) {
  await page.evaluate(async (step) => {
    document.documentElement.style.scrollBehavior = 'auto';
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * step) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  }, step);
}

export const scrollToEl = (page, selector, block = 'center') =>
  page.evaluate(([s, b]) => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector(s).scrollIntoView({ block: b });
  }, [selector, block]);

export const nextFrames = (page, n = 3) =>
  page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

export { expect };
