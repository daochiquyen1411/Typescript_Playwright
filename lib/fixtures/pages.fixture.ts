import { test as base } from '@playwright/test'; 
import { LoginPage } from '@pages/LoginPage'; 
import { HomePage } from '@pages/HomePage'; 

// Define the types for our fixtures 
type PageObjects = { 
  loginPage: LoginPage; 
  homePage: HomePage; 
}; 


// Extend the base test with our page object fixtures 
export const test = base.extend<PageObjects>({ 
   loginPage: async ({ page }, use) => { 
    const loginPage = new LoginPage(page); 
    await use(loginPage); 
  }, 
  
   homePage: async ({ page }, use) => { 
    const homePage = new HomePage(page); 
    await use(homePage); 
  }, 
}); 

export { expect } from '@playwright/test';