import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

  test('should allow a new user to sign up and land on the dashboard', async ({ page }) => {
    // 1. Navigate to the signup page
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');

    // Generate a unique email for each test run to ensure isolation
    const uniqueEmail = `test-user-${Date.now()}@example.com`;

    // 2. Fill out the signup form
    await page.getByLabel('店舗名').fill('テスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');

    // 3. Submit the form
    await page.getByRole('button', { name: '登録して開始' }).click();

    // 4. Verify redirection to the dashboard
    // After signup, the user should be logged in and redirected.
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // 5. Verify that the dashboard is visible
    await expect(page.getByTestId('dashboard-container')).toBeVisible();
  });

  test('should show an error if email is already in use', async ({ page }) => {
    // 1. Create a user once
    await page.goto('/signup');
    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    await page.getByLabel('店舗名').fill('テスト店舗 1');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: '登録して開始' }).click();
    await expect(page).toHaveURL('/admin/dashboard');

    // Logout to try signing up again
    // For now, we can just navigate away and clear state by going to login.
    // A proper logout button would be better in the future.
    await page.goto('/login');

    // 2. Attempt to sign up with the same email
    await page.goto('/signup');
    await page.getByLabel('店舗名').fill('テスト店舗 2');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password456');
    await page.getByRole('button', { name: '登録して開始' }).click();

    // 3. Verify the error message is shown
    await expect(page.getByText('このメールアドレスは既に使用されています。')).toBeVisible();
    await expect(page).toHaveURL('/signup'); // Stay on the signup page
  });

});
