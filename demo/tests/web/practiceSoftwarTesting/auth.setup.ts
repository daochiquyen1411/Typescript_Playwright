import { test as setup, expect } from '@lib/fixtures/pages.fixture';

setup('Create customer 01 authentication', async ({ page, context, loginPage }) => {
    // Navigate to login page
    await loginPage.navigateTo();
    
    // Wait for login form to be ready
    await loginPage.isLoginFormVisible();
    
    // Perform login
    await loginPage.login('customer@practicesoftwaretesting.com', 'welcome01');
    
    // Wait for login to complete and redirect
    await expect(page.getByTestId('nav-menu')).toContainText('Jane Doe');
    
    // Save authentication state
    await context.storageState({ path: '.auth/customer01.json' });
});