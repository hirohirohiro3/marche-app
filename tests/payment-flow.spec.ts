import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser } from './test-utils';

test.describe('Payment Flow E2E Test', () => {
  const PRODUCT_NAME = 'E2Eテスト用商品';
  const PRODUCT_PRICE = '100';
  let storeId: string;
  let userEmail: string;
  let userPassword;

  // Use a serial execution mode to prevent race conditions with user creation/deletion
  test.describe.configure({ mode: 'serial' });

  // Create a dedicated user for the entire test suite
  test.beforeAll(async () => {
    const { uid, email, password } = await createTestUser('決済テスト店舗');
    storeId = uid;
    userEmail = email;
    userPassword = password;
  });

  // Delete the user after all tests in this suite have run
  test.afterAll(async () => {
    await deleteTestUser(storeId);
  });

  test.beforeEach(async ({ page }) => {
    // 1. Log in as the created user
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill(userEmail);
    await page.getByLabel('パスワード').fill(userPassword);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // 2. Set payment method
    await page.getByRole('link', { name: '決済設定' }).click();
    await expect(page.getByLabel('アプリ内決済のみ')).toBeVisible();
    await page.getByLabel('アプリ内決済のみ').check();
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('決済設定を更新しました')).toBeVisible();

    // 3. Create a test menu item
    await page.getByRole('link', { name: 'メニュー管理' }).click();
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

  test('should complete the full payment flow', async ({ page, context }) => {
    // 1. Customer orders item
    await page.goto(`/menu/${storeId}`);
    await page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`).click();
    await page.getByTestId('checkout-button').click();
    await page.getByTestId('confirm-order-button').click();
    await expect(page).toHaveURL(/\/payment\/.+/);

    // 2. Complete Stripe payment
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('#Field-billingName').fill('Test User');
    await stripeFrame.locator('#Field-email').fill(userEmail);
    await stripeFrame.locator('#Field-cardNumber').fill('4242424242424242');
    await stripeFrame.locator('#Field-expiryDate').fill('1230');
    await stripeFrame.locator('#Field-cvc').fill('123');
    await page.getByTestId('payment-submit-button').click();

    // 3. Verify payment completion
    await expect(page).toHaveURL('/payment-complete', { timeout: 15000 });
    const orderNumberText = await page.locator('p:has-text("注文番号:")').textContent();
    const orderNumber = orderNumberText?.split(':')[1].trim();
    expect(orderNumber).toBeDefined();

    // 4. Admin verifies the order on dashboard
    const adminPage = await context.newPage();
    await adminPage.goto('/admin/dashboard');
    const newOrderCard = adminPage.getByTestId(`order-card-${orderNumber}`);
    await expect(newOrderCard).toBeVisible({ timeout: 10000 });
    await expect(newOrderCard).toContainText(PRODUCT_NAME);
  });
});
