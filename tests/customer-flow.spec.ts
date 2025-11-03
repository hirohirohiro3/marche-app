import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser } from './test-utils';

test.describe('Customer Order Flow', () => {
  let storeId: string;
  let userEmail: string;
  let userPassword;
  const PRODUCT_NAME = 'カスタマーテスト用商品';
  const PRODUCT_PRICE = '250';

  // Use a serial execution mode to prevent race conditions with user creation/deletion
  test.describe.configure({ mode: 'serial' });

  // Create a dedicated user for the entire test suite
  test.beforeAll(async () => {
    const { uid, email, password } = await createTestUser('カスタマーテスト店舗');
    storeId = uid;
    userEmail = email;
    userPassword = password;
  });

  // Delete the user after all tests in this suite have run
  test.afterAll(async () => {
    await deleteTestUser(storeId);
  });

  test.beforeEach(async ({ page }) => {
    // Log in as the created user
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(userEmail);
    await page.getByLabel('パスワード').fill(userPassword);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // Create a menu item for the test
    await page.getByRole('link', { name: 'メニュー管理' }).click();
    await expect(page).toHaveURL('/admin/menu');
    await page.getByTestId('add-menu-item-button').click();
    await page.getByLabel('商品名').fill(PRODUCT_NAME);
    await page.getByLabel('価格').fill(PRODUCT_PRICE);
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByRole('cell', { name: PRODUCT_NAME })).toBeVisible({ timeout: 15000 });
  });

  test.afterEach(async ({ page }) => {
    // Clean up the created menu item
    if (!page.url().endsWith('/admin/menu')) {
      await page.goto('/admin/menu');
    }
    const deleteButton = page.getByTestId(`delete-button-${PRODUCT_NAME}`);
    await deleteButton.click();
    await page.getByTestId('confirm-delete-button').click();
    await expect(page.getByRole('cell', { name: PRODUCT_NAME })).not.toBeVisible({ timeout: 10000 });
  });

  test('should allow a customer to order the created item', async ({ page }) => {
    // 1. Navigate to the customer menu page
    await page.goto(`/menu/${storeId}`);
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 15000 });

    // 2. Add item to cart
    await page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`).click();
    const cartSummary = page.getByTestId('cart-summary');
    await expect(cartSummary).toContainText('1点の商品');

    // 3. Checkout
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL('/checkout');
    await page.getByTestId('confirm-order-button').click();

    // 4. Verify order summary
    await expect(page).toHaveURL(/\/order\/.+/, { timeout: 15000 });
    await expect(page.getByText(/注文番号/)).toBeVisible();
  });
});
