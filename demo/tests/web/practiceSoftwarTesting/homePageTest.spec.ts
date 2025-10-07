import { test, expect } from '@lib/fixtures/pages.fixture';

test.describe('Practice Software Testing - Thor Hammer Search', () => {

  test.use({ storageState: '.auth/customer01.json' });

  test.beforeEach(async ({ homePage }) => {
    await homePage.navigateTo();
  });

  test('Complete Thor Hammer search flow using MCP Server', async ({page, homePage}) => {
    // Step 1: Search for "Thor Hammer"
    await test.step('Search for Thor Hammer', async () => {
      await homePage.waitForPageLoad();
      await homePage.searchForProduct('Thor Hammer');
    });

    // Step 2: Verify search results contain "Thor Hammer"
    await test.step('Verify search results contain Thor Hammer', async () => {
      await homePage.waitForPageLoad();
      const containsThorHammer = await homePage.verifySearchResultContains('Thor Hammer');
      expect(containsThorHammer).toBeTruthy();
    });
  });

  test('Check customer 01 is signed in', async ({page, homePage}) => {
    // Step 1: Search for "Thor Hammer"
    await test.step('Check button sign ni not visible', async () => {
      await homePage.waitForPageLoad();
      await expect(page.getByTestId('nav-sign-in')).not.toBeVisible();
    });
  });
});

test.describe('Mocking', () => {

  test('Validate product data is visible in UI from API', async ({page, homePage}) => {
    let products: any;
    await test.step('Intercept /products', async () => {
        await page.route("https://api.practicesoftwaretesting.com/products**", async (route) => {
            const response = await route.fetch();
            products = await response.json();
            route.continue();
        });
    });

    await homePage.navigateTo();

    await expect(page.locator(".skeleton").first()).not.toBeVisible();

    const productGrid = page.locator(".col-md-9");

    for (const product of products.data) {
      await expect(productGrid).toContainText(product.name);
      await expect(productGrid).toContainText(product.price.toString());
    }
  });


  test('Validate product data is visible in UI from modified API', async ({page, homePage}) => {
    await test.step('Override /products', async () => {
        await page.route("https://api.practicesoftwaretesting.com/products**", async (route) => {
            const response = await route.fetch();
            const json = await response.json();
            json.data[0]["name"] = "Mocked product";
            json.data[0]["price"] = 98537.02;
            json.data[0]["in_stock"] = false;
            await route.fulfill({response, json});
        });
    });

    await homePage.navigateTo();

    const productGrid = page.locator(".col-md-9");

    await expect(productGrid.getByRole("link").first()).toContainText("Mocked product");
    await expect(productGrid.getByRole("link").first()).toContainText("98537.02");
    await expect(productGrid.getByRole("link").first()).toContainText("Out of stock");
  });


  test('Validate product data is loaded from har file', async ({page, homePage}) => {
    await test.step('Mock /products', async () => {
        await page.routeFromHAR(".hars/product.har", {
          url: "https://api.practicesoftwaretesting.com/products**",
          update: false,
        })
    });

    await homePage.navigateTo();

    const productGrid = page.locator(".col-md-9");

    await expect(productGrid).toContainText("Alibaba");
  });
});