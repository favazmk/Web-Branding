// Every page, desktop and phone: loads clean, no sideways scroll, survives a
// reload mid-page, and leaves a full-page screenshot in launch-report/sheets.
import { test } from '@playwright/test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PAGES, AD_PAGES, url, isolate, scrollThrough, expect } from './helpers.mjs';

const SHEETS = fileURLToPath(new URL('../../launch-report/sheets/', import.meta.url));

for (const name of PAGES) {
  test.describe(name, () => {
    test('loads without errors and has no sideways scroll', async ({ page }, info) => {
      const errors = await isolate(page);
      await page.goto(url(name), { waitUntil: 'load' });
      await expect(page).toHaveTitle(/\S/);
      await scrollThrough(page);
      await page.waitForTimeout(500);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow, 'page is wider than the screen').toBeLessThanOrEqual(1);

      const broken = await page.evaluate(() => [...document.images]
        .filter((i) => i.complete && i.getAttribute('src') && i.naturalWidth === 0 && i.loading !== 'lazy')
        .map((i) => i.getAttribute('src')));
      expect(broken, 'images that failed to load').toEqual([]);
      expect(errors).toEqual([]);

      fs.mkdirSync(SHEETS, { recursive: true });
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHEETS}${name}-${info.project.name}.png`, fullPage: true });
    });

    test('reload halfway down keeps the page intact', async ({ page }) => {
      const errors = await isolate(page);
      await page.goto(url(name), { waitUntil: 'load' });
      await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight / 2); });
      await page.waitForTimeout(400);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(800);
      // The header must still be there and not stuck in a half-scrolled state.
      // Desktop and phone use different headers; one of them must show.
      const headers = await page.locator('#ag-custom-header, #main-header').count();
      if (headers) await expect(page.locator('#ag-custom-header:visible, #main-header:visible').first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      expect(errors).toEqual([]);
    });
  });
}

test.describe('ad landing pages stay isolated', () => {
  for (const ad of AD_PAGES) {
    test(`${ad} links to no other site page`, async ({ page }) => {
      await page.goto(url(ad));
      const internal = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
        .map((a) => new URL(a.getAttribute('href'), location.href))
        .filter((u) => u.origin === location.origin && u.pathname !== location.pathname
          && !/^\/(thankyou)(\.html)?$/.test(u.pathname))
        .map((u) => u.pathname));
      expect(internal).toEqual([]);
    });

    test(`${ad} is noindex`, async ({ page }) => {
      await page.goto(url(ad));
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    });
  }

  test('no other page links to an ad page', async ({ page }) => {
    const offenders = [];
    for (const name of PAGES.filter((p) => !AD_PAGES.includes(p))) {
      await page.goto(url(name));
      const hits = await page.evaluate((ads) => [...document.querySelectorAll('a[href]')]
        .map((a) => new URL(a.getAttribute('href'), location.href).pathname.replace(/\.html$/, '').slice(1))
        .filter((p) => ads.includes(p)), AD_PAGES);
      if (hits.length) offenders.push(`${name} -> ${[...new Set(hits)].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });
});
