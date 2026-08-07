import { defineConfig } from '@playwright/test';

const locales = ['ar', 'en'] as const;
const browsers = ['chromium', 'firefox', 'webkit'] as const;
const viewports = {
  mobile: { width: 375, height: 667 },
  desktop: { width: 1440, height: 900 },
} as const;

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: browsers.flatMap((browserName) =>
    locales.flatMap((locale) =>
      (
        Object.entries(viewports) as Array<
          [keyof typeof viewports, (typeof viewports)[keyof typeof viewports]]
        >
      ).map(([viewportName, viewport]) => ({
        name: `${browserName}-${locale}-${viewportName}`,
        use: {
          browserName,
          locale: locale === 'ar' ? 'ar-EG' : 'en-US',
          viewport,
        },
      })),
    ),
  ),
});
