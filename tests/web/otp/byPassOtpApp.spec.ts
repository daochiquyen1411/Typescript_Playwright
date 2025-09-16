import { test, expect } from '@playwright/test';
import * as OTPAuth from "otpauth";
import * as dotenv from 'dotenv';

dotenv.config();

test.beforeEach(async ({ page }) => {
  await page.goto('https://www.heroku.com/');
});

test('Login successfully', async ({ page }) => {

  const secretKey  = process.env.HEROKU_SECRET_KEY as string;

  const totp = new OTPAuth.TOTP({
    issuer: "Heroku",
    label: "Heroku:Dao%20Quyen",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secretKey,
  });

  const username  = process.env.HEROKU_USERNAME as string;
  const password = process.env.HEROKU_PWD as string;

  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(username);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  const otp = totp.generate();
  await page.getByRole('textbox', { name: 'Verification Code' }).fill(otp);
  await page.getByRole('button', { name: 'Verify' }).click();
});