import { test, expect, Page, Browser } from '@playwright/test';

// Extend the test timeout for this complex scenario
test.setTimeout(90000);

async function setupAdminPage(browser: Browser): Promise<Page> {
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await adminPage.goto('/login');
  await adminPage.fill('input[name="email"]', 'test@example.com');
  await adminPage.fill('input[name="password"]', 'password');
  await adminPage.click('button[type="submit"]');
  await expect(adminPage).toHaveURL('/admin/dashboard');

  // No reset needed here. The test will run in the state set by `npm run seed`.

  return adminPage;
}

async function setupCustomerPage(browser: Browser): Promise<Page> {
  const customerContext = await browser.newContext();
  const customerPage = await customerContext.newPage();
  await customerPage.goto('/menu');
  return customerPage;
}

test.describe('Real-time Order Status Coordination', () => {
  test('admin status changes should reflect on the customer order page', async ({ browser }) => {
    const adminPage = await setupAdminPage(browser);
    const customerPage = await setupCustomerPage(browser);

    // 1. Customer places an order
    await customerPage.locator('.MuiCard-root:has-text("Latte") button').click();
    await customerPage.locator('button:has-text("注文内容の確認")').click();
    await customerPage.locator('button:has-text("この内容で注文する")').click();

    // 2. Customer waits at checkout screen
    await expect(customerPage.locator('h4:has-text("お会計")')).toBeVisible();
    await expect(customerPage.locator('p:has-text("この画面をレジでスタッフに見せて")')).toBeVisible();
    const orderNumberElement = customerPage.locator('h5:has-text("注文番号")');
    const orderNumberText = await orderNumberElement.textContent();
    const orderNumber = orderNumberText?.replace('注文番号 #', '');
    expect(orderNumber).toBeTruthy();

    // 3. Admin marks the order as Paid
    const newOrderCard = adminPage.locator(`.MuiCard-root:has-text("#${orderNumber}")`);
    await expect(newOrderCard).toBeVisible({ timeout: 10000 }); // Wait longer for Firestore updates
    await newOrderCard.locator('button:has-text("Mark as Paid")').click();

    // 4. Customer's screen automatically updates to "Waiting for pickup"
    await expect(customerPage.locator('h4:has-text("商品お渡し待ち")')).toBeVisible({ timeout: 10000 });
    await expect(customerPage.locator('p:has-text("番号でお呼びします")')).toBeVisible();

    // 5. Admin marks the order as Completed
    const paidOrderCard = adminPage.locator(`.MuiCard-root:has-text("#${orderNumber}")`);
    await paidOrderCard.locator('button:has-text("Mark as Completed")').click();

    // 6. Customer's screen automatically updates to "Completed"
    await expect(customerPage.locator('h4:has-text("ありがとうございました！")')).toBeVisible({ timeout: 10000 });

    await adminPage.context().close();
    await customerPage.context().close();
  });
});
