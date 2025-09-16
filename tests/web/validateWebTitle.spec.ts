import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://github.com/');
});

test('Has title', async ({ page }) => {
  await expect(page).toHaveTitle(/GitHub/);
});
