import { registerUser } from '@factory/data/register';
import { test, expect } from '@lib/fixtures/pages.fixture';

test('Login with newly register user', async ({ page, loginPage}) => {
    const email = `quyentesting${Date.now()}@test.com`;
    const password = `a32141765A@`;

    await registerUser(email, password);

    await loginPage.navigateTo();
    await loginPage.isLoginFormVisible();

    await loginPage.login(email, password);
    await expect(page.getByTestId('nav-menu')).toContainText('Quyen Dao');
});
