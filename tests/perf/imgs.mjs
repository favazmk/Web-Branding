import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core'); const root = path.resolve(process.argv[2]);
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; let f = path.join(root, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg':'image/svg+xml' }[path.extname(f)] || '' }); fs.createReadStream(f).pipe(r); }).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`; const browser = await chromium.launch({ headless: true });
const all = {};
for (const name of process.argv[3].split(',')) { const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + (name === 'index' ? '' : name), { waitUntil: 'load' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await page.waitForTimeout(1500);
  const rows = await page.evaluate(() => [...document.images].filter(i => i.naturalWidth).map(i => { const r = i.getBoundingClientRect(); return { src: decodeURIComponent(i.currentSrc.replace(location.origin + '/', '')), nat: i.naturalWidth + 'x' + i.naturalHeight, mp: +(i.naturalWidth * i.naturalHeight / 1e6).toFixed(1), shown: Math.round(r.width) + 'x' + Math.round(r.height), ratio: r.width ? +(i.naturalWidth / (r.width * 2)).toFixed(1) : 0, lazy: i.loading }; }));
  for (const r of rows) { const k = r.src; all[k] = all[k] || { ...r, pages: [] }; all[k].pages.push(name); }
  await page.close(); }
Object.values(all).filter(r => r.mp >= 1.5 || r.ratio > 2).sort((a, b) => b.mp - a.mp).forEach(r => console.log(String(r.mp).padStart(5), 'MP', r.nat.padEnd(10), 'shown', r.shown.padEnd(9), 'x' + r.ratio, r.lazy, r.src, '|', r.pages.join(' ')));
await browser.close(); srv.close();
