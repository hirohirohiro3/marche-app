import { test, expect } from '@playwright/test';

test.describe('Manual Order Flow', () => {
  // Before each test, log in using a robust polling strategy.
  test.beforeEach(async ({ page }) => {
    // This uses `expect.toPass` to retry the login flow until it succeeds,
    // or until the timeout is reached. This is a robust way to handle
    // potential race conditions in CI where the seeded user may not be
    // immediately available for login.
    await expect(async () => {
      await page.goto('/login');
    await page.fill('input[name="email"]', 'test@test.test');
    await page.fill('input[name="password"]', '112233');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL('/admin/dashboard', { timeout: 2000 }); // Short timeout for each attempt
    }).toPass({
      timeout: 20000, // Maximum total time for all retries
    });
  });

  test('should create a manual order and see it in the paid column', async ({ page }) => {
    // Ensure the main dashboard container is visible before proceeding.
    await expect(page.getByTestId('dashboard-container')).toBeVisible({ timeout: 15000 });

    // 1. Open the manual order modal
    await page.click('button:has-text("手動注文")');

    // Wait for the modal to be fully visible before interacting with its contents.
    const modal = page.getByTestId('manual-order-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h6:has-text("手動POS")')).toBeVisible();

    // Wait for the first menu item to be visible, ensuring the data is loaded.
    const espressoButton = modal.locator('button:has-text("Espresso")');
    await expect(espressoButton).toBeVisible({ timeout: 15000 });

    // 2. Add items to the cart
    // Note: This assumes menu items are seeded. We will select the first two.
    await espressoButton.click();
    await modal.locator('button:has-text("Latte")').click();
    await modal.locator('button:has-text("Espresso")').click(); // Add one more espresso

    // 3. Verify the total price
    // This depends on the seeded prices. Assuming Espresso=500, Latte=600. Total = 500*2 + 600 = 1600
    await expect(modal.locator('h5:has-text("Total: ¥1600")')).toBeVisible();

    // 4. Create the order
    await modal.locator('button:has-text("支払い完了 ＆ 注文作成")').click();

    // 5. Verify the order appears in the "Paid" column
    // The order number depends on the state of the database.
    // We will look for a card in the "Paid" column containing the items.
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("支払い済み"))');
    await expect(paidColumn).toBeVisible();

    const newOrderCard = paidColumn.locator('.MuiCard-root', { hasText: 'Espresso x 2' });
    await expect(newOrderCard).toBeVisible();
    await expect(newOrderCard).toContainText('Latte x 1');
    await expect(newOrderCard).toContainText('Total: ¥1600');
  });
});
