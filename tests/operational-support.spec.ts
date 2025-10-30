import { test, expect } from '@playwright/test';

// Helper function to create a manual order
async function createManualOrder(page: Page) {
  await page.click('button:has-text("手動注文")');

  const modal = page.getByTestId('manual-order-modal');
  await expect(modal).toBeVisible();

  // Wait for the first menu item to be visible, ensuring the data is loaded.
  const espressoButton = modal.locator('button:has-text("Espresso")');
  await expect(espressoButton).toBeVisible({ timeout: 15000 });

  await espressoButton.click();
  await modal.locator('button:has-text("支払い完了 ＆ 注文作成")').click();

  // Wait for modal to disappear
  await expect(modal).not.toBeVisible();
}

test.describe('Operational Support Features', () => {
  test.beforeEach(async ({ page }) => {
    // Use a robust polling strategy for login to handle CI race conditions.
    await expect(async () => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'test@test.test');
      await page.fill('input[name="password"]', '112233');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/admin/dashboard', { timeout: 2000 });
    }).toPass({
      timeout: 20000,
    });

    // Ensure the main dashboard container is visible before proceeding.
    await expect(page.getByTestId('dashboard-container')).toBeVisible({ timeout: 15000 });

    // Reset the state before each test to ensure independence
    await page.click('button:has-text("営業終了")');
    await page.locator('button:has-text("はい")').click();
    // Wait for all paid cards to disappear, confirming the reset is complete
    await expect(page.locator('div.MuiPaper-root:has(h6:has-text("支払い済み"))').locator('.MuiCard-root')).toHaveCount(0, { timeout: 10000 });
  });

  test('should cancel an order from the paid column', async ({ page }) => {
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("支払い済み"))');
    const orderCards = paidColumn.locator('.MuiCard-root');

    // Pre-condition: Ensure there are no orders in the paid column
    await expect(orderCards).toHaveCount(0);

    // 1. Create a new order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);

    // 2. Click the cancel button on the order
    await orderCards.first().locator('button:has-text("キャンセル")').click();

    // 3. Verify the order disappears and the count returns to 0
    await expect(orderCards).toHaveCount(0);
  });

  test('should reset order numbers after End of Day', async ({ page }) => {
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("支払い済み"))');
    const orderCards = paidColumn.locator('.MuiCard-root');

    // 1. Create a first manual order and wait for it to appear with order number #1
    await createManualOrder(page);
    await expect(paidColumn.locator('.MuiCard-root', { hasText: '#1' })).toBeVisible();

    // 2. Click End of Day button and confirm. The beforeEach hook already does this,
    // but we do it again to test the reset logic within this specific test.
    await page.click('button:has-text("営業終了")');
    await page.locator('button:has-text("はい")').click();

    // Wait for the card to move to the "Completed" column (or disappear from "Paid")
    await expect(orderCards).toHaveCount(0);

    // 3. Create a second manual order
    await createManualOrder(page);

    // 4. Verify the new order number is also #1, confirming the reset
    await expect(paidColumn.locator('.MuiCard-root', { hasText: '#1' })).toBeVisible();
    await expect(orderCards).toHaveCount(1);
  });
});
