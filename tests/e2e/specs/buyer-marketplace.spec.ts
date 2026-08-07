import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const localeFor = (projectName: string) => (projectName.includes('-ar-') ? 'ar' : 'en');

const marketplacePath = (locale: 'ar' | 'en') => `/${locale}`;

async function waitForDiscovery(page: Page) {
  await expect(page.getByTestId('listing-results')).toBeVisible();
  await expect(page.getByTestId('listing-card').first()).toBeVisible();
}

async function listingIds(page: Page, testId: string) {
  return page.getByTestId(testId).evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute('data-listing-id'))
      .filter(Boolean)
      .sort(),
  );
}

test.describe('buyer marketplace', () => {
  test('server-renders the configured locale and direction at every browser viewport', async ({
    page,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    const response = await page.goto(marketplacePath(locale));

    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('keeps governed-area discovery and list/map results in parity while filtering participation', async ({
    page,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    await page.goto(marketplacePath(locale));
    await waitForDiscovery(page);

    const areaSearch = page.getByRole('combobox', { name: /search.*area|البحث.*منطقة/i });
    await areaSearch.fill(locale === 'ar' ? 'القاهرة' : 'Cairo');
    await page.getByRole('option').first().click();
    await waitForDiscovery(page);

    const participation = page.getByRole('combobox', {
      name: /seller|البائع|participation|المشاركة/i,
    });
    await participation.selectOption('owner');
    await waitForDiscovery(page);
    expect(await page.getByTestId('listing-card').count()).toBeGreaterThan(0);
    await expect(page.getByTestId('listing-card')).toContainText(
      /verified owner|owner \(not verified\)|مالك موثق|مالك غير موثق/i,
    );
    expect(await listingIds(page, 'listing-card')).toEqual(
      await listingIds(page, 'map-listing-marker'),
    );

    await participation.selectOption('agent');
    await waitForDiscovery(page);
    await expect(page.getByTestId('listing-card')).toContainText(/declared agent|وكيل معلن/i);
    expect(await listingIds(page, 'listing-card')).toEqual(
      await listingIds(page, 'map-listing-marker'),
    );
  });

  test('persists an anonymous save across reload and allows it to be removed', async ({
    page,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    await page.goto(marketplacePath(locale));
    await waitForDiscovery(page);

    const card = page.getByTestId('listing-card').first();
    const listingId = await card.getAttribute('data-listing-id');
    expect(listingId).toBeTruthy();
    const save = card.getByRole('button', { name: /save|حفظ/i });
    await save.click();
    await expect(save).toHaveAccessibleName(/remove.*saved|إزالة.*المحفوظات/i);

    await page.reload();
    await waitForDiscovery(page);
    const reloadedSave = page.locator(`[data-listing-id="${listingId}"]`).getByRole('button', {
      name: /remove.*saved|إزالة.*المحفوظات/i,
    });
    await expect(reloadedSave).toBeVisible();
    await reloadedSave.click();
    await expect(reloadedSave).toHaveAccessibleName(/save|حفظ/i);
  });

  test('uses an opaque intentional contact handoff instead of rendering a destination', async ({
    page,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    await page.goto(marketplacePath(locale));
    await waitForDiscovery(page);

    await page
      .getByTestId('listing-card')
      .first()
      .getByRole('link', { name: /details|التفاصيل/i })
      .click();
    const contactIntent = page.waitForResponse(
      (response) =>
        /\/listings\/[^/]+\/contact-intents$/.test(new URL(response.url()).pathname) &&
        response.request().method() === 'POST',
    );
    const popup = page.waitForEvent('popup');
    await page.getByRole('button', { name: /whatsapp|واتساب/i }).click();
    expect((await contactIntent).status()).toBe(201);
    const handoff = await popup;
    await expect(handoff).toHaveURL(/\/contact-intents\/[A-Za-z0-9_-]+\/resolve/);

    await expect(page.locator('main')).not.toContainText(/(?:\+?20|tel:|wa\.me|api\.whatsapp)/i);
  });

  test('supports keyboard focus and has no basic axe violations in the marketplace', async ({
    page,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    await page.goto(marketplacePath(locale));
    await waitForDiscovery(page);

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus-visible')).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus-visible')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('uses a token-free local map and leaves list discovery usable when map loading fails', async ({
    page,
  }, testInfo) => {
    const locale = localeFor(testInfo.project.name);
    await page.route(/mapbox|tiles|map\?.*token/i, (route) => route.abort('failed'));
    await page.goto(marketplacePath(locale));
    await waitForDiscovery(page);

    await expect(page.getByTestId('local-map')).toBeVisible();
    await expect(page.getByTestId('map-fallback-status')).toContainText(
      /map.*unavailable|الخريطة.*غير متاحة/i,
    );
    await expect(page.getByTestId('listing-results')).toBeVisible();
    await expect(page.getByTestId('listing-card').first()).toBeVisible();
    await expect(page.locator('html')).not.toContainText(/access_token=|pk\.[A-Za-z0-9_-]+/i);
  });
});
