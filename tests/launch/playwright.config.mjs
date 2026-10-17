import { defineConfig } from '@playwright/test';

// Launch suite: every page on a desktop and a phone viewport.
// Run from tests/: npm run launch
export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list'], ['html', { outputFolder: '../../launch-report/html', open: 'never' }]],
  outputDir: '../../launch-report/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node serve.mjs 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    {
      name: 'phone',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
