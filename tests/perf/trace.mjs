// Trace a scroll and aggregate main-thread cost by event and JS source: node trace.mjs <root> <page> <desktop|phone>
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const require = createRequire(path.join(os.homedir(), '.claude/skills/launch-check/runner/package.json'));
const { chromium } = require('playwright-core');
const root = path.resolve(process.argv[2]); const name = process.argv[3]; const dev = process.argv[4] || 'desktop';
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; let f = path.join(root, p);
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html'; if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || '' }); fs.createReadStream(f).pipe(r); }).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext(dev === 'phone' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
await page.goto(base + (name === 'index' ? '' : name), { waitUntil: 'load' }); if (process.env.EXP_CSS) await page.addStyleTag({ content: process.env.EXP_CSS });
await page.waitForTimeout(2500);
const events = []; cdp.on('Tracing.dataCollected', (e) => events.push(...e.value));
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,v8.execute,disabled-by-default-devtools.timeline.invalidationTracking', transferMode: 'ReportEvents' });
await page.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; const H = document.documentElement.scrollHeight - innerHeight; let y = 0;
  await new Promise((d) => { const t = () => { y += innerHeight / 30; scrollTo(0, y); y < H ? requestAnimationFrame(t) : d(); }; requestAnimationFrame(t); }); });
await cdp.send('Tracing.end'); await done;
const agg = {}; const add = (k, d) => { agg[k] = agg[k] || { ms: 0, n: 0 }; agg[k].ms += d / 1000; agg[k].n++; };
for (const e of events) {
  if (e.ph !== 'X' || !e.dur) continue;
  if (['Layout', 'UpdateLayoutTree', 'Paint', 'PrePaint', 'Layerize', 'RasterTask', 'FunctionCall', 'EventDispatch', 'FireAnimationFrame', 'TimerFire', 'ParseHTML', 'Decode Image', 'ImageDecodeTask', 'IntersectionObserverController::computeIntersections', 'HitTest', 'ScrollLayer', 'UpdateLayer', 'CompositeLayers'].includes(e.name) || /Paint|Raster|Layer|Composit/.test(e.name)) {
    let k = e.name;
    const st = e.args?.beginData?.stackTrace?.[0] || e.args?.data?.stackTrace?.[0];
    if (st) k += ` <= ${st.functionName || '(anon)'} ${path.basename(st.url || '')}:${st.lineNumber}`;
    else if (e.name === 'FunctionCall' && e.args?.data) k += ` ${e.args.data.functionName || ''} ${path.basename(e.args.data.url || '')}:${e.args.data.lineNumber}`;
    else if (e.name === 'EventDispatch') k += ` ${e.args?.data?.type}`;
    add(k, e.dur);
  }
}
const inv = {}; for (const e of events) { if (e.name === 'LayoutInvalidationTracking' || e.name === 'StyleInvalidatorInvalidationTracking' || e.name==='ScheduleStyleInvalidationTracking') { const d = e.args.data; const k = `${e.name.replace('InvalidationTracking','')} ${d.reason||d.invalidatedSelectorId||d.changedClass||d.changedAttribute||''} ${d.nodeName||''} ${(d.stackTrace?.[0]?.functionName||'')}:${d.stackTrace?.[0]?.lineNumber||''}`; inv[k]=(inv[k]||0)+1; } }
Object.entries(inv).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v])=>console.log('INV',String(v).padStart(5),k));
const lay = events.filter(e=>e.name==='Layout'&&e.args?.beginData); console.log('layout sample', JSON.stringify(lay.slice(10,13).map(e=>({dur:e.dur, ...e.args.beginData, stackTrace:undefined}))));
Object.entries(agg).sort((a, b) => b[1].ms - a[1].ms).slice(0, 25).forEach(([k, v]) => console.log(v.ms.toFixed(0).padStart(6), 'ms', String(v.n).padStart(5), k));
await browser.close(); srv.close();
