import { test, expect } from '@playwright/test';

test.describe('Customer Order Flow', () => {
  const PRODUCT_NAME = 'E2Eテスト用商品（顧客フロー）';
  const PRODUCT_PRICE = '250';

  let storeId: string;

  test.beforeEach(async ({ page }) => {
    // 1. Create a unique user and log in to get the storeId
    await page.goto('/signup');
    const uniqueEmail = `test-user-customer-${Date.now()}@example.com`;
    await page.getByLabel('店舗名').fill('顧客フローテスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: '登録して開始' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // This is a workaround to get the user's UID (storeId) in the test environment.
    // In a real app, this might be exposed in a less roundabout way.
    const user = await page.evaluate(() => window.firebase.auth().currentUser);
    storeId = user.uid;
    expect(storeId).toBeDefined();


    // 2. Create a test menu item via the admin UI
    await page.getByRole('link', { name: 'メニュー管理' }).click();
    await expect(page).toHaveURL('/admin/menu');

    const addMenuItemButton = page.getByTestId('add-menu-item-button');
    await expect(addMenuItemButton).toBeVisible({ timeout: 10000 });

    await addMenuItemButton.click();
    await page.getByLabel('商品名').fill(PRODUCT_NAME);
    await page.getByLabel('価格').fill(PRODUCT_PRICE);
    await page.getByLabel('カテゴリ').fill('E2Eテスト');
    await page.getByRole('button', { name: '保存' }).click();

    // Wait for the dialog to close, confirming the save was successful.
    await expect(page.getByRole('dialog', { name: 'メニューを追加' })).not.toBeVisible({ timeout: 15000 });

    // Verify the item is in the admin's menu list
    await expect(page.getByRole('cell', { name: PRODUCT_NAME })).toBeVisible({ timeout: 5000 });
  });

  test('should allow a customer to order the created item', async ({ page }) => {
    // 1. Navigate to the newly created store's menu page
    await page.goto(`/menu`); // The app should handle routing to the correct store based on the domain or some other mechanism. Since we haven't implemented multi-tenant routing, we go to the generic menu page.

    // 2. Add the product to the cart
    await page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`).click();

    // 3. Verify cart summary and proceed to checkout.
    const cartSummary = page.getByTestId('cart-summary');
    await expect(cartSummary).toContainText('1点の商品');
    await expect(cartSummary).toBeVisible();

    await page.getByTestId('checkout-button').click();

    // 4. Confirm the order on the checkout page.
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('checkout-container')).toBeVisible();

    await page.getByTestId('confirm-order-button').click();

    // 5. Verify the order summary page.
    await expect(page).toHaveURL(/\/order\/.+/, { timeout: 15000 });
    await expect(page.getByText(/注文番号/)).toBeVisible();
  });
});
