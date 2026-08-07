import { expect, test } from '@playwright/test';

test.describe('clean local start', () => {
  test('loads an Arabic RTL, API-backed Cairo marketplace with a list fallback at every configured viewport', async ({
    page,
    request,
  }, testInfo) => {
    const viewport = testInfo.project.use.viewport;
    expect(viewport).toBeDefined();
    expect([375, 1440]).toContain(viewport?.width);

    const health = await request.get('http://localhost:4000/api/v1/health');
    expect(health.ok()).toBeTruthy();

    const listingsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        /\/api\/v1\/listings(?:\?|$)/.test(response.url()) &&
        response.ok(),
    );
    await page.goto('/');
    await listingsResponse;

    const document = page.locator('html');
    await expect(document).toHaveAttribute('lang', 'ar');
    await expect(document).toHaveAttribute('dir', 'rtl');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toContainText(/[\u0600-\u06FF]/);
    await expect(main.getByRole('search')).toBeVisible();
    await expect(main.getByRole('list', { name: /نتائج|العقارات|القوائم/i })).toBeVisible();
  });
});

// No `/en` assertion is included yet: the current routing configuration has no Pages Router locale contract.
