import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  let storeId: string;
  const PRODUCT_NAME = 'カスタマーテスト用商品';
  const PRODUCT_PRICE = '250';

  test.beforeEach(async ({ page }) => {
    // 1. Create a unique user (store owner) and log in.
    // This provides an isolated store environment for the test.
    await page.goto('/signup');
    const uniqueEmail = `test-customer-flow-${Date.now()}@example.com`;
    await page.getByLabel('店舗名').fill('カスタマーテスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: '登録して開始' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // 2. Get the user's UID, which is used as the storeId.
    storeId = await page.evaluate(() => window.firebase.auth().currentUser.uid);
    expect(storeId).toBeDefined();

    // 3. Create a menu item that the customer will order.
    await page.getByRole('link', { name: 'メニュー管理' }).click();
    await expect(page).toHaveURL('/admin/menu');
    const addMenuItemButton = page.getByTestId('add-menu-item-button');
    await expect(addMenuItemButton).toBeVisible({ timeout: 10000 });
    await addMenuItemButton.click();
    await page.getByLabel('商品名').fill(PRODUCT_NAME);
    await page.getByLabel('価格').fill(PRODUCT_PRICE);
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByRole('cell', { name: PRODUCT_NAME })).toBeVisible({ timeout: 15000 });
  });

  test.afterEach(async ({ page }) => {
    // Clean up the created menu item to ensure test isolation.
    if (!page.url().endsWith('/admin/menu')) {
      await page.goto('/admin/menu');
    }
    try {
      const deleteButton = page.getByTestId(`delete-button-${PRODUCT_NAME}`);
      await deleteButton.waitFor({ state: 'visible', timeout: 5000 });
      await deleteButton.click();
      const confirmButton = page.getByTestId('confirm-delete-button');
      await confirmButton.waitFor({ state: 'visible', timeout: 5000 });
      await confirmButton.click();
      await expect(page.getByRole('cell', { name: PRODUCT_NAME })).not.toBeVisible({ timeout: 10000 });
    } catch (error) {
      console.log(`Cleanup failed for product "${PRODUCT_NAME}":`, error);
    }
  });

  test('should allow a customer to order the created item', async ({ page }) => {
    // 1. Navigate to the customer menu page using the dynamic storeId.
    await page.goto(`/menu/${storeId}`);

    // 2. Wait for the page to be ready (loading spinner disappears).
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 15000 });

    // 3. Add the specific test item to the cart.
    const addToCartButton = page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`);
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    // 4. Verify cart summary appears and proceed to checkout.
    const cartSummary = page.getByTestId('cart-summary');
    await expect(cartSummary).toContainText('1点の商品');
    await expect(cartSummary).toBeVisible();
    await page.getByTestId('checkout-button').click();

    // 5. Confirm the order on the checkout page.
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('checkout-container')).toBeVisible();
    await page.getByTestId('confirm-order-button').click();

    // 6. Verify the final order summary page is displayed.
    await expect(page).toHaveURL(/\/order\/.+/, { timeout: 15000 });
    await expect(page.getByRole('progressbar')).not.toBeVisible();
    await expect(page.getByText(/注文番号/)).toBeVisible();
  });
});
