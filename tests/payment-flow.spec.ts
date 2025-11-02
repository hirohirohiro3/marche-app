import { test, expect } from '@playwright/test';

test.describe('Payment Flow E2E Test', () => {
  const PRODUCT_NAME = 'E2Eテスト用商品';
  const PRODUCT_PRICE = '100';

  test.beforeEach(async ({ page }) => {
    // 1. Create a unique user and log in
    await page.goto('/signup');
    const uniqueEmail = `test-user-${Date.now()}@example.com`;
    await page.getByLabel('店舗名').fill('決済テスト店舗');
    await page.getByLabel('メールアドレス').fill(uniqueEmail);
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: '登録して開始' }).click();
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 15000 });

    // 2. Set payment method to "in-app payment only"
    await page.getByRole('link', { name: '決済設定' }).click();
    await expect(page).toHaveURL('/admin/settings/payment');

    // Wait for the initial settings to load by checking if the default radio is checked
    await expect(page.getByLabel('レジでの支払いのみ')).toBeChecked();

    // Change the setting
    await page.getByLabel('アプリ内決済のみ').check();

    // Wait for the save button to become enabled, then click it
    const saveButton = page.getByRole('button', { name: '保存' });
    await expect(saveButton).toBeEnabled({ timeout: 5000 });
    await saveButton.click();

    // Wait for the success message to appear
    await expect(page.getByText('決済設定を更新しました')).toBeVisible({ timeout: 10000 });

    // 3. Create a test menu item
    await page.getByRole('link', { name: 'メニュー管理' }).click();
    await expect(page).toHaveURL('/admin/menu');

    // Wait for the "Add Menu Item" button to be visible, ensuring the page is fully loaded and interactive.
    const addMenuItemButton = page.getByTestId('add-menu-item-button');
    await expect(addMenuItemButton).toBeVisible({ timeout: 10000 });

    await addMenuItemButton.click();
    await page.getByLabel('商品名').fill(PRODUCT_NAME);
    await page.getByLabel('価格').fill(PRODUCT_PRICE);
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText(`${PRODUCT_NAME}が追加されました`)).toBeVisible();
    await expect(page.getByRole('heading', { name: PRODUCT_NAME })).toBeVisible();
  });

  test('should complete the full payment flow from customer order to admin dashboard verification', async ({ page, context }) => {
    // Part 1: Customer-side flow
    // 1. Visit the menu page
    await page.goto('/menu');

    // 2. Add the product to the cart and proceed to checkout
    await page.getByTestId(`add-to-cart-button-${PRODUCT_NAME}`).click();
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL('/checkout');

    // 3. Confirm the order
    await page.getByTestId('confirm-order-button').click();
    await expect(page).toHaveURL(/\/payment\/.+/, { timeout: 15000 });

    // 4. Complete the Stripe payment
    // Wait for the Stripe iframe to be ready
    const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');
    await expect(stripeFrame.locator('#Field-billingName')).toBeVisible({ timeout: 15000 });

    // Fill in Stripe's test payment form
    await stripeFrame.locator('#Field-billingName').fill('Test User');
    await stripeFrame.locator('#Field-email').fill('test@example.com');
    await stripeFrame.locator('#Field-cardNumber').fill('4242');
    await stripeFrame.locator('#Field-cardNumber').press('4242');
    await stripeFrame.locator('#Field-cardNumber').press('4242');
    await stripeFrame.locator('#Field-cardNumber').press('4242');
    await stripeFrame.locator('#Field-expiryDate').fill('12');
    await stripeFrame.locator('#Field-expiryDate').press('30');
    await stripeFrame.locator('#Field-cvc').fill('123');

    // The payment button is outside the iframe
    await page.getByTestId('payment-submit-button').click();

    // 5. Verify the payment complete page
    await expect(page).toHaveURL('/payment-complete', { timeout: 15000 });
    await expect(page.getByText('お支払いが完了しました')).toBeVisible();
    const orderNumberText = await page.locator('p').filter({ hasText: '注文番号:' }).textContent();
    const orderNumber = orderNumberText?.split(':')[1].trim();
    expect(orderNumber).toBeDefined();

    // Part 2: Admin-side verification
    // 1. Open a new page (tab) for the admin view
    const adminPage = await context.newPage();
    await adminPage.goto('/admin/dashboard');

    // 2. Verify the new order appears in the "Paid" column
    const paidColumn = adminPage.getByTestId('paid-orders-column');
    const newOrderCard = paidColumn.locator(`[data-testid="order-card-${orderNumber}"]`);

    await expect(newOrderCard).toBeVisible({ timeout: 10000 }); // Wait for Firestore update
    await expect(newOrderCard).toContainText(PRODUCT_NAME);
    await expect(newOrderCard).toContainText(`¥${PRODUCT_PRICE}`);
  });
});
