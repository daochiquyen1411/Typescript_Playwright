import { test, expect } from '@playwright/test';
import { Env } from '@env';
import { OTP } from '@security/otp';

Env.require("HEROKU_USERNAME", "HEROKU_PWD", "HEROKU_OTP_URI");

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.heroku.com/');
});

test('Login successfully', async ({ page }) => {
  const username  = Env.getString('HEROKU_USERNAME');
  const password = Env.getString('HEROKU_PWD');

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
    const otp = OTP.fromEnv("HEROKU_OTP_URI");
    const code = otp.getCode(utcTimestamp);

    if (!otp.verify(code, 1)) {
      throw new Error(`Generated OTP ${code} is not valid`);
    } 
    expect(otp.verify(code, 1)).toBeTruthy();

    await page.getByRole('textbox', { name: 'Verification Code' }).fill(code);
    await page.getByRole('button', { name: 'Verify' }).click();
  });

  await test.step('Verify dashboard is displayed', async () => {
    await expect(page.getByText('Welcome to Heroku')).toBeVisible({ timeout: 20000 });
  });
});