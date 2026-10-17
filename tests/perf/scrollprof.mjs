// Scroll jank profiler: node scrollprof.mjs <rootDir> [pages,comma] [label]
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const root = path.resolve(process.argv[2] || '.');
const pages = (process.argv[3] || 'index,brand-design-services,digital-marketing-services,media-production-services,web-development-services,web-development,digital-marketing').split(',');
const label = process.argv[4] || 'run';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let f = path.join(root, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  const st = fs.statSync(f); const type = TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream';
  const range = q.headers.range;
  if (range) { const [s, e] = range.replace('bytes=', '').split('-'); const start = +s, end = e ? +e : st.size - 1;
    r.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return fs.createReadStream(f, { start, end }).pipe(r); }
  r.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ headless: true, args: ['--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const DEV = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
};
const out = [];
for (const name of pages) for (const dev of (process.env.DEVS || 'desktop,phone').split(',')) {
  const ctx = await browser.newContext(DEV[dev]); const page = await ctx.newPage();
  if (process.env.EXP_JS) await page.addInitScript(process.env.EXP_JS);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  if (dev === 'phone') await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(base + (name === 'index' ? '' : name), { waitUntil: 'load', timeout: 60000 });
  if (process.env.EXP_CSS) await page.addStyleTag({ content: process.env.EXP_CSS });
  await page.waitForTimeout(2500);
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  // Scroll down whole page at ~ 1 viewport / 0.5s using rAF-driven scrollBy, collect frame deltas
  const res = await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight - innerHeight;
    const deltas = []; let last = performance.now(); let y = 0; const step = innerHeight / 30;
    const longTasks = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => longTasks.push(e.duration))).observe({ type: 'longtask' }); } catch {}
    document.documentElement.style.scrollBehavior = 'auto';
    await new Promise((done) => {
      const tick = (t) => { deltas.push(t - last); last = t; y += step; window.scrollTo(0, y); if (y < H && deltas.length < 1500) requestAnimationFrame(tick); else done(); };
      requestAnimationFrame(tick);
    });
    deltas.shift(); deltas.sort((a, b) => a - b);
    const pct = (p) => deltas[Math.floor(deltas.length * p)] || 0;
    return { frames: deltas.length, p50: pct(0.5), p95: pct(0.95), max: deltas.at(-1), slow: deltas.filter((d) => d > 34).length, longTasks: longTasks.length, height: H };
  });
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const d = (k) => Math.round((m1[k] - m0[k]) * (k.endsWith('Duration') ? 1000 : 1));
  out.push({ page: name, dev, ...Object.fromEntries(Object.entries(res).map(([k, v]) => [k, Math.round(v)])),
    jankPct: Math.round((100 * res.slow) / res.frames), layoutMs: d('LayoutDuration'), styleMs: d('RecalcStyleDuration'), scriptMs: d('ScriptDuration'), taskMs: d('TaskDuration'), layouts: d('LayoutCount'), heapMB: Math.round(m1.JSHeapUsedSize / 1e6) });
  console.log(JSON.stringify(out.at(-1)));
  await ctx.close();
}
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), `prof-${label}.json`), JSON.stringify(out, null, 1));
await browser.close(); srv.close();
