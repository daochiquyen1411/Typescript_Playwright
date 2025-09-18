import { test, expect } from '@playwright/test';
import { Env } from '../../../framework/config/env';
import { OTP } from '../../../framework/utils/otp';

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.heroku.com/');
});

test('Login successfully', async ({ page }) => {
  const username  = Env.get('HEROKU_USERNAME');
  const password = Env.get('HEROKU_PWD');

  await test.step('Go to Login page', async () => {
    await page.getByRole('button', { name: 'Login' }).click();
  });

  await test.step('Perform login with an account', async () => {
    await page.getByRole('textbox', { name: 'Email address' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
  });

  await test.step('Verify OTP authentication', async () => {
    let utcTimestamp = Date.now();
    const otp = new OTP({otp_uri : "HEROKU_OTP_URI"});

    await page.getByRole('textbox', { name: 'Verification Code' }).fill(otp.getTOTPCode(utcTimestamp));
    await page.getByRole('button', { name: 'Verify' }).click();
  });

  await test.step('Verify dashboard is displayed', async () => {
    await expect(page.getByText('Welcome to Heroku')).toBeVisible({ timeout: 20000 });
  });
});