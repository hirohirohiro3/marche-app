import { test, expect } from '@playwright/test';

// Helper function to create a manual order
async function createManualOrder(page: Page) {
  await page.click('button:has-text("Manual Order")');
  await page.locator('button:has-text("Espresso")').click();
  await page.click('button:has-text("Create Order & Mark as Paid")');
  // Wait for modal to disappear
  await expect(page.locator('h6:has-text("Manual POS")')).not.toBeVisible();
}

test.describe('Operational Support Features', () => {
  test.beforeEach(async ({ page }) => {
    // Before each test, log in.
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should cancel an order from the paid column', async ({ page }) => {
    // 1. Create a manual order to ensure there is an order to cancel
    await createManualOrder(page);

    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("Paid"))');
    const orderCards = paidColumn.locator('.MuiCard-root');

    // 1. Create an order and verify it exists
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);

    // 2. Click the cancel button on the order card
    await orderCards.first().locator('button:has-text("Cancel")').click();

    // 3. Verify the order card is removed from the column
    await expect(orderCards).toHaveCount(0);
  });

  test('should reset order numbers after End of Day', async ({ page }) => {
    // 1. Create a first manual order and check its number
    await createManualOrder(page);
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("Paid"))');
    const firstOrderCard = paidColumn.locator('.MuiCard-root', { hasText: '#1' });
    await expect(firstOrderCard).toBeVisible();

    // 2. Click End of Day button and confirm
    await page.click('button:has-text("End of Day")');
    await page.locator('button:has-text("はい")').click();

    // Give a moment for the transaction to complete
    await page.waitForTimeout(1000);

    // 3. Create a second manual order
    await createManualOrder(page);

    // 4. Verify the new order number is reset to 1
    const secondOrderCard = paidColumn.locator('.MuiCard-root', { hasText: '#1' });
    await expect(secondOrderCard).toBeVisible();
  });
});
