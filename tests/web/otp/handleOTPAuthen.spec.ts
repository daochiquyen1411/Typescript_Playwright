import { test, expect } from '@playwright/test';
import * as OTPAuth from "otpauth";
import * as dotenv from 'dotenv';
import { getEnvProps } from '../../../framework/utils/env';

dotenv.config();

const secretKey  = getEnvProps('HEROKU_SECRET_KEY');
const totp = new OTPAuth.TOTP({
  issuer: "Heroku",
  label: "Dao%20Quyen",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  secret: secretKey,    
});

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.heroku.com/');
});

test('Login successfully', async ({ page }) => {
  const username  = getEnvProps('HEROKU_USERNAME');
  const password = getEnvProps('HEROKU_PWD');

  await test.step('Go to Login page', async () => {
    await page.getByRole('button', { name: 'Login' }).click();
  });


  await test.step('Perform login with an account', async () => {
    await page.getByRole('textbox', { name: 'Email address' }).fill(username);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
  });


  await test.step('Verify OTP authentication', async () => {
    // Use device/system time for TOTP generation (like Google Authenticator)
    let utcTimestamp = Date.now();
    let otp = totp.generate({ timestamp: utcTimestamp });

    await page.getByRole('textbox', { name: 'Verification Code' }).fill(otp);
    await page.getByRole('button', { name: 'Verify' }).click();
  });


  await test.step('Verify dashboard is displayed', async () => {
    await expect(page.getByText('Welcome to Heroku')).toBeVisible({ timeout: 20000 });
  });
});