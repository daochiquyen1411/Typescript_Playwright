import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly searchResults: Locator;
  private readonly productLinks: Locator;

  constructor(page: Page) {
    super(page);
    // Simplified and more generic locators
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search"]').first();
    this.searchButton = page.locator('button[type="submit"], button:has-text("Search")').first();
    this.searchResults = page.locator('.products, .product-grid, .search-results, main').first();
    this.productLinks = page.locator('.product, .card, [data-test*="product"]');
  }

  async navigateTo(): Promise<void> {
    await this.page.goto('https://practicesoftwaretesting.com');
  }

  async searchForProduct(searchTerm: string): Promise<void> {
    await this.searchInput.fill(searchTerm);
    await this.searchButton.click();
  }

  async getSearchResults(): Promise<string[]> {
    // Wait for any product elements to be visible
    await this.productLinks.first().waitFor({ state: 'visible', timeout: 10000 });
    const results = await this.productLinks.allTextContents();
    return results.filter(result => result.trim().length > 0);
  }

  async clickProductByName(productName: string): Promise<void> {
    const productLink = this.page.getByRole('link', { name: productName });
    await productLink.click();
  }

  async verifySearchResultContains(searchTerm: string): Promise<boolean> {
    const results = await this.getSearchResults();
    return results.some(result => result.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  // Additional optimized methods
  async waitForSearchResults(): Promise<void> {
    await this.searchResults.waitFor({ state: 'visible', timeout: 15000 });
  }

  async getSearchResultCount(): Promise<number> {
    await this.waitForSearchResults();
    return await this.productLinks.count();
  }
}
