// Largest on-screen CSS size of every <img> across pages and devices:
// node imgsizes.mjs <rootDir> <pages,comma> > sizes.json
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core'); const root = path.resolve(process.argv[2]);
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; let f = path.join(root, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' }[path.extname(f)] || '' }); fs.createReadStream(f).pipe(r); }).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`; const browser = await chromium.launch({ headless: true });
const DEV = [{ viewport: { width: 1440, height: 900 } }, { viewport: { width: 1920, height: 1080 } }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true }];
const all = {};
for (const name of process.argv[3].split(',')) for (const dev of DEV) {
  const ctx = await browser.newContext(dev); const page = await ctx.newPage();
  await page.goto(base + (name === 'index' ? '' : name), { waitUntil: 'load' });
  const rows = await page.evaluate(async () => {
    const seen = {};
    const sample = () => [...document.images].forEach((i) => { const r = i.getBoundingClientRect(); const s = decodeURIComponent(new URL(i.currentSrc || i.src, location.href).pathname.slice(1));
      const o = seen[s] || (seen[s] = { w: 0, h: 0, nw: i.naturalWidth, nh: i.naturalHeight }); o.w = Math.max(o.w, r.width); o.h = Math.max(o.h, r.height); });
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); sample(); }
    return seen;
  });
  for (const [k, v] of Object.entries(rows)) { const a = all[k] || (all[k] = { w: 0, h: 0, nw: v.nw, nh: v.nh, pages: [] }); a.w = Math.max(a.w, Math.ceil(v.w)); a.h = Math.max(a.h, Math.ceil(v.h)); a.nw ||= v.nw; a.nh ||= v.nh; if (!a.pages.includes(name)) a.pages.push(name); }
  await ctx.close();
}
console.log(JSON.stringify(all, null, 1));
await browser.close(); srv.close();
