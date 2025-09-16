import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://github.com/');
});


test('Login fail', async ({ page }) => {

  await test.step('Go to Login page', async () => {
    await page.getByRole('link', { name: 'Sign in' }).click();
  });

  await test.step('Enter incorrect username & password', async () => {
    const tbUsername = page.getByLabel('Username or email address');
    const tbPassword = page.getByRole('textbox', { name: 'Password' })

    await tbUsername.fill('testusername');
    await tbPassword.fill('testpassword');
  });

  await test.step('Click button login', async () => {
    const btnLogin = page.getByRole('button', { name: 'Sign in', exact: true });

    await btnLogin.click();
  });

  await test.step('Should show validation alert', async () => {
    const lbAlert = page.getByRole('alert');

    await expect(lbAlert).toContainText('Incorrect username or password.');
  });
});
