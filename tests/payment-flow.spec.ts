import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E Test', () => {
  const PRODUCT_NAME = 'E2Eテスト用商品';
  const PRODUCT_PRICE = '100';
  let storeId: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    await page.getByLabel('店舗名').fill('決済テスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: '登録して開始' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // **[FIX]** Wait for Firebase auth to be ready before getting UID.
    storeId = await page.evaluate(async () => {
      const firebase = window.firebase;
      return new Promise((resolve) => {
        const checkAuth = () => {
          const user = firebase.auth().currentUser;
          if (user) {
            resolve(user.uid);
          } else {
            setTimeout(checkAuth, 100);
          }
        };
        checkAuth();
      });
    });
    expect(storeId).toBeDefined();

    await page.getByRole('link', { name: '決済設定' }).click();
    await expect(page).toHaveURL('/admin/settings/payment');
    await expect(page.getByLabel('レジでの支払いのみ')).toBeChecked();
    await page.getByLabel('アプリ内決済のみ').check();
    const saveButton = page.getByRole('button', { name: '保存' });
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
    await saveButton.click();
    await expect(page.getByText('決済設定を更新しました')).toBeVisible({ timeout: 10000 });

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

  test('should complete the full payment flow from customer order to admin dashboard verification', async ({ page, context }) => {
    await page.goto(`/menu/${storeId}`);

    await page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`).click();
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL('/checkout');

    await page.getByTestId('confirm-order-button').click();
    await expect(page).toHaveURL(/\/payment\/.+/, { timeout: 15000 });

    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await expect(stripeFrame.locator('#Field-billingName')).toBeVisible({ timeout: 15000 });

    await stripeFrame.locator('#Field-billingName').fill('Test User');
    await stripeFrame.locator('#Field-email').fill('test@example.com');
    await stripeFrame.locator('#Field-cardNumber').fill('4242');
    await stripeFrame.locator('#Field-cardNumber').press('4242');
    await stripeFrame.locator('#Field-cardNumber').press('4242');
    await stripeFrame.locator('#Field-cardNumber').press('4242');
    await stripeFrame.locator('#Field-expiryDate').fill('12');
    await stripeFrame.locator('#Field-expiryDate').press('30');
    await stripeFrame.locator('#Field-cvc').fill('123');

    await page.getByTestId('payment-submit-button').click();

    await expect(page).toHaveURL('/payment-complete', { timeout: 15000 });
    await expect(page.getByText('お支払いが完了しました')).toBeVisible();
    const orderNumberText = await page.locator('p').filter({ hasText: '注文番号:' }).textContent();
    const orderNumber = orderNumberText?.split(':')[1].trim();
    expect(orderNumber).toBeDefined();

    const adminPage = await context.newPage();
    await adminPage.goto('/admin/dashboard');

    const paidColumn = adminPage.getByTestId('paid-orders-column');
    const newOrderCard = paidColumn.locator(`[data-testid="order-card-${orderNumber}"]`);

    await expect(newOrderCard).toBeVisible({ timeout: 10000 });
    await expect(newOrderCard).toContainText(PRODUCT_NAME);
    await expect(newOrderCard).toContainText(`¥${PRODUCT_PRICE}`);
  });
});
