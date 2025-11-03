import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  let storeId: string;
  const PRODUCT_NAME = 'カスタマーテスト用商品';
  const PRODUCT_PRICE = '250';

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    const uniqueEmail = `test-customer-flow-${Date.now()}@example.com`;
    await page.getByLabel('店舗名').fill('カスタマーテスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: '登録して開始' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // **[FIX]** Wait for Firebase auth to be ready before getting UID.
    // This polls the browser until `window.firebase.auth().currentUser` is available.
    storeId = await page.evaluate(async () => {
      const firebase = window.firebase;
      return new Promise((resolve) => {
        const checkAuth = () => {
          const user = firebase.auth().currentUser;
          if (user) {
            resolve(user.uid);
          } else {
            setTimeout(checkAuth, 100); // Poll every 100ms
          }
        };
        checkAuth();
      });
    });
    expect(storeId).toBeDefined();

    await page.getByRole('link', { name: 'メニュー管理' }).click();
    await expect(page).toHaveURL('/admin/menu');

    const addMenuItemButton = page.getByTestId('add-menu-item-button');
    await expect(addMenuItemButton).toBeVisible({ timeout: 10000 });
    await addMenuItemButton.click();

    // **[FIX]** Wait for the dialog to be visible before interacting with it.
    await expect(page.getByTestId('menu-form-dialog')).toBeVisible();

    await page.getByLabel('商品名').fill(PRODUCT_NAME);
    await page.getByLabel('価格').fill(PRODUCT_PRICE);
    await page.getByRole('button', { name: '保存' }).click();

    // **[FIX]** Wait for the dialog to disappear, then verify the item appears.
    await expect(page.getByTestId('menu-form-dialog')).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('cell', { name: PRODUCT_NAME })).toBeVisible({ timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
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
    await page.goto(`/menu/${storeId}`);
    await expect(page.getByRole('progressbar')).not.toBeVisible({ timeout: 15000 });

    const addToCartButton = page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`);
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    const cartSummary = page.getByTestId('cart-summary');
    await expect(cartSummary).toContainText('1点の商品');
    await expect(cartSummary).toBeVisible();
    await page.getByTestId('checkout-button').click();

    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('checkout-container')).toBeVisible();
    await page.getByTestId('confirm-order-button').click();

    await expect(page).toHaveURL(/\/order\/.+/, { timeout: 15000 });
    await expect(page.getByRole('progressbar')).not.toBeVisible();
    await expect(page.getByText(/注文番号/)).toBeVisible();
  });
});
