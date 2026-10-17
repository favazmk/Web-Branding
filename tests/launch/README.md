# Launch suite

Playwright checks for every page on a desktop (1440x900) and a phone (390x844) screen.

1. `cd tests && npm install` (first time only)
2. `npm run launch` to run everything
3. Open `launch-report/html/index.html` for results, and `launch-report/sheets/` for a full-page screenshot of each page

- `pages.spec.mjs`: every page loads with no errors, broken images or sideways scroll, survives a reload halfway down, and the ad landing pages stay off the site's navigation.
- `behaviour.spec.mjs`: header, text pressure, lanyards, mascot, marquees, estimator form (the form API is stubbed, so nothing is really sent), mobile menu, and the pinned hero scroll sections.

Scroll profiling lives in `tests/perf/`: `node perf/scrollprof.mjs .. <pages> <label>` writes `perf/prof-<label>.json`.
