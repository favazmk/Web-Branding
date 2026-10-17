// Interactive and animated sections: each test checks that the thing still
// works, and where a scroll fix was made, that it still pauses or settles.
import { test } from '@playwright/test';
import { url, isolate, scrollToEl, nextFrames, expect } from './helpers.mjs';

const sample = (page, fn, arg) => page.evaluate(fn, arg);
// The site sets scroll-behavior: smooth, so jump explicitly.
const jump = (page, fn) => page.evaluate(`(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo({ top: (${fn})(), behavior: 'instant' }); })()`);

test.describe('header', () => {
  test('gains .scrolled past 50px and loses it at the top', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    const header = page.locator('#main-header');
    await jump(page, () => 400);
    await expect(header).toHaveClass(/\bscrolled\b/);
    await jump(page, () => 0);
    await expect(header).not.toHaveClass(/\bscrolled\b/);
  });
});

test.describe('text pressure (index hero)', () => {
  const settings = (page) => sample(page, () =>
    [...document.querySelectorAll('.hero-title .pressure-char')].map((s) => s.style.fontVariationSettings).join('|'));

  test('animates while visible and stops when scrolled away', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await expect(page.locator('.hero-title .pressure-char').first()).toBeAttached();
    const a = await settings(page);
    await page.waitForTimeout(700);
    expect(await settings(page), 'ambient wave should move the letters').not.toBe(a);

    await jump(page, () => document.documentElement.scrollHeight / 2);
    await page.waitForTimeout(400);
    const b = await settings(page);
    await page.waitForTimeout(700);
    expect(await settings(page), 'off-screen title should be paused').toBe(b);
  });

  test('keeps the title inside the screen', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await page.waitForTimeout(1500);
    const { right, vw } = await sample(page, () => ({ right: document.querySelector('.hero-title').getBoundingClientRect().right, vw: innerWidth }));
    expect(right).toBeLessThanOrEqual(vw + 1);
  });
});

test.describe('lanyard team cards (index)', () => {
  const strap = (page) => sample(page, () => document.querySelector('.lanyard-stage .lanyard-band-strap')?.getAttribute('d'));

  test('swings while visible and freezes off-screen', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'phone shows the team marquee instead of lanyards');
    await isolate(page);
    await page.goto('/');
    await scrollToEl(page, '.lanyard-stage');
    await page.waitForTimeout(600);
    const a = await strap(page);
    expect(a).toBeTruthy();
    await page.waitForTimeout(800);
    expect(await strap(page)).not.toBe(a);

    await jump(page, () => 0);
    await page.waitForTimeout(500);
    const b = await strap(page);
    await page.waitForTimeout(800);
    expect(await strap(page)).toBe(b);
  });

  test('a card can be grabbed and released', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'phone shows the team marquee instead of lanyards');
    await isolate(page);
    await page.goto('/');
    await scrollToEl(page, '.lanyard-stage');
    await page.waitForTimeout(600);
    const card = page.locator('.lanyard-stage .lanyard-card').first();
    const box = await card.boundingBox();
    test.skip(!box, 'lanyard card not rendered at this size');
    const stage = page.locator('.lanyard-stage').first();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(stage).toHaveClass(/is-held/);
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, { steps: 8 });
    await page.mouse.up();
    await expect(stage).not.toHaveClass(/is-held/);
  });

  test('stays still with reduced motion', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'phone shows the team marquee instead of lanyards');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await isolate(page);
    await page.goto('/');
    await scrollToEl(page, '.lanyard-stage');
    await page.waitForTimeout(400);
    const a = await strap(page);
    await page.waitForTimeout(700);
    expect(await strap(page)).toBe(a);
  });
});

test.describe('mascot', () => {
  const state = (page) => sample(page, () => {
    const m = document.querySelector('.mascot-container');
    const r = m.getBoundingClientRect();
    return { cls: m.className, left: m.style.left, top: m.style.top, x: r.left, y: r.top, vw: innerWidth, vh: innerHeight };
  });

  for (const name of ['web-development', 'web-development-services', 'brand-design-services']) {
    test(`docks in the hero on ${name} at the top`, async ({ page }) => {
      await isolate(page);
      await page.goto(url(name));
      await page.waitForTimeout(2000); // hero reveal animations
      const target = await sample(page, () => {
        const nav = document.querySelector('.ag-pill-header, #main-header, header, .navbar');
        const navBottom = nav ? nav.getBoundingClientRect().bottom : 70;
        const t = [...document.querySelectorAll('.mascot-hero-target')].find((el) => {
          const r = el.getBoundingClientRect();
          return r.top > navBottom + 25 && r.bottom > 0 && r.top < innerHeight;
        });
        if (!t) return null;
        const r = t.getBoundingClientRect();
        return { left: Math.round(r.left), top: Math.round(r.top) };
      });
      test.skip(!target, 'no hero dock visible at this viewport');
      const s = await state(page);
      expect(s.cls).toMatch(/in-hero|in-sub-hero/);
      expect(Math.abs(parseFloat(s.left) - target.left)).toBeLessThanOrEqual(1);
      // The dock is measured before the hero's reveal slide finishes, so it
      // can sit up to the slide distance (30px) below the final spot until
      // the first scroll. Re-measuring would release the mascot early.
      expect(Math.abs(parseFloat(s.top) - target.top)).toBeLessThanOrEqual(31);
    });
  }

  test('leaves the hero and stays on screen while scrolling (index)', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await scrollToEl(page, '.service-card');
    await nextFrames(page, 4);
    await page.waitForTimeout(900); // left/top transition
    const s = await state(page);
    expect(s.cls).not.toMatch(/in-hero|in-sub-hero/);
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.y).toBeGreaterThanOrEqual(0);
    expect(s.x).toBeLessThan(s.vw);
    expect(s.y).toBeLessThan(s.vh);
  });

  test('does not rewrite its position when nothing moves', async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await scrollToEl(page, '.section-title');
    await page.waitForTimeout(1500); // let reveal animations settle
    // A scroll event with nothing moved must not touch the mascot. Retried a
    // few times because reveal animations nearby can still be settling.
    await expect.poll(() => sample(page, () => new Promise((done) => {
      const m = document.querySelector('.mascot-container');
      let n = 0;
      const mo = new MutationObserver((list) => { n += list.length; });
      dispatchEvent(new Event('scroll'));
      setTimeout(() => {
        mo.observe(m, { attributes: true, attributeFilter: ['style', 'class'] });
        dispatchEvent(new Event('scroll'));
        setTimeout(() => { mo.disconnect(); done(n); }, 300);
      }, 300);
    })), { timeout: 8000 }).toBe(0);
  });
});

test.describe('marquees', () => {
  for (const name of ['index', 'brand-design-services', 'web-development-services']) {
    test(`every marquee moves on ${name}`, async ({ page }) => {
      await isolate(page);
      await page.goto(url(name));
      const tracks = await sample(page, () => {
        const out = [];
        document.querySelectorAll('body *').forEach((el, i) => {
          const cs = getComputedStyle(el);
          if (/marquee/i.test(cs.animationName) && el.getBoundingClientRect().width > 0) {
            el.dataset.lcMarquee = i;
            out.push(String(i));
          }
        });
        return out;
      });
      expect(tracks.length, 'expected at least one marquee').toBeGreaterThan(0);
      const stuck = [];
      for (const id of tracks) {
        const sel = `[data-lc-marquee="${id}"]`;
        await scrollToEl(page, sel);
        const t0 = await sample(page, (s) => getComputedStyle(document.querySelector(s)).transform, sel);
        await page.waitForTimeout(700);
        const t1 = await sample(page, (s) => getComputedStyle(document.querySelector(s)).transform, sel);
        if (t0 === t1) stuck.push(await sample(page, (s) => document.querySelector(s).className, sel));
      }
      expect(stuck).toEqual([]);
    });
  }
});

test.describe('project estimator (index)', () => {
  test.beforeEach(async ({ page }) => {
    await isolate(page);
    await page.goto('/');
    await scrollToEl(page, '#project-estimator-form');
  });

  test('summary follows services, budget and currency', async ({ page }) => {
    await expect(page.locator('#summary-services')).toHaveText('Web Development, Digital Marketing');
    await page.locator('label[for="srv-web"]').click();
    await page.locator('label[for="srv-mkt"]').click();
    await expect(page.locator('#summary-services')).toHaveText('None Selected');
    await expect(page.locator('#submit-estimator-btn')).toBeDisabled();

    await page.locator('label[for="srv-bnd"]').click();
    await expect(page.locator('#submit-estimator-btn')).toBeEnabled();
    await page.selectOption('#currency-select', 'USD');
    await expect(page.locator('#display-budget-val')).toHaveText('$1,200');
    await page.locator('#budget-range').fill('20000');
    await expect(page.locator('#summary-final-budget')).toHaveText('$20,000');
    await expect(page.locator('#summary-timeline')).toHaveText('8-10 Weeks');
  });

  test('rejects a bad email without sending', async ({ page }) => {
    let sent = 0;
    await page.route('https://api.web3forms.com/**', (r) => { sent++; return r.fulfill({ status: 200, body: '{}' }); });
    await page.fill('#client-name', 'Test Lead');
    await page.fill('#client-email', 'not-an-email');
    await page.fill('#client-phone', '+971 50 123 4567');
    // Bypass native validation so the script's own check is what runs.
    await page.evaluate(() => document.getElementById('project-estimator-form').setAttribute('novalidate', ''));
    await page.click('#submit-estimator-btn');
    await expect(page.locator('#twb-toast')).toContainText(/valid email/i);
    expect(sent).toBe(0);
  });

  test('a good submission posts the lead and lands on the thank-you page', async ({ page }) => {
    let body;
    await page.route('https://api.web3forms.com/**', (r) => { body = r.request().postDataJSON(); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    await page.fill('#client-name', 'Test Lead');
    await page.fill('#client-email', 'lead@example.com');
    await page.fill('#client-phone', '+971 50 123 4567');
    await page.click('#submit-estimator-btn');
    await page.waitForURL(/thankyou/);
    expect(page.url()).toContain('form=Project+Estimator');
    expect(body.form_name).toBe('Project Estimator');
    expect(body.email).toBe('lead@example.com');
    expect(body.message).toContain('Web Development, Digital Marketing');
  });

  test('a server error shows a message and stays on the page', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }));
    await page.fill('#client-name', 'Test Lead');
    await page.fill('#client-email', 'lead@example.com');
    await page.fill('#client-phone', '+971 50 123 4567');
    await page.click('#submit-estimator-btn');
    await expect(page.locator('#twb-toast')).toContainText(/something went wrong/i);
    expect(page.url()).not.toContain('thankyou');
  });
});

test.describe('mobile menu', () => {
  for (const name of ['index', 'brand-design-services', 'web-development-services']) {
    test(`opens and closes on ${name}`, async ({ page }, info) => {
      test.skip(info.project.name !== 'phone', 'mobile menu is phone only');
      await isolate(page);
      await page.goto(url(name));
      const btn = page.locator('#ag-mobile-btn');
      const menu = page.locator('#ag-mobile-menu');
      await expect(btn).toBeVisible();
      await btn.click();
      await expect(menu).toHaveClass(/is-open/);
      await page.waitForTimeout(500);
      expect((await menu.boundingBox()).height).toBeGreaterThan(50);
      await expect(menu.locator('a').first()).toBeVisible();

      await page.mouse.click(200, 700); // outside the header
      await expect(menu).not.toHaveClass(/is-open/);
    });
  }
});

test.describe('pinned hero scroll sections', () => {
  test('brand design: egg opens across the hero and the CTA unlocks', async ({ page }) => {
    await isolate(page);
    await page.goto(url('brand-design-services'));
    const v = (n) => sample(page, (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), n);
    expect(+(await v('--egg-open'))).toBe(0);
    await expect(page.locator('#home')).not.toHaveClass(/is-open/);

    await jump(page, () => { const s = document.getElementById('home'); return s.offsetTop + s.offsetHeight; });
    await nextFrames(page, 3);
    expect(+(await v('--egg-open'))).toBe(1);
    await expect(page.locator('#home')).toHaveClass(/is-open/);

    await jump(page, () => 0);
    await nextFrames(page, 3);
    expect(+(await v('--egg-open'))).toBe(0);
  });

  test('web development: words settle and BUILD rises', async ({ page }) => {
    await isolate(page);
    await page.goto(url('web-development-services'));
    const layer = () => sample(page, () => document.querySelector('#home .bh-title').style.transform);
    const start = await layer();
    await jump(page, () => { const s = document.getElementById('home'); return s.offsetTop + s.offsetHeight / 2; });
    await nextFrames(page, 3);
    const mid = await layer();
    expect(mid).not.toBe(start);
    await jump(page, () => 0);
    await nextFrames(page, 3);
    expect(await layer()).toBe(start);
  });
});
