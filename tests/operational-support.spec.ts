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

    // Reset the state before each test to ensure independence
    await page.click('button:has-text("End of Day")');
    await page.locator('button:has-text("はい")').click();
    // Wait for all paid cards to disappear, confirming the reset is complete
    await expect(page.locator('div.MuiPaper-root:has(h6:has-text("Paid"))').locator('.MuiCard-root')).toHaveCount(0);
  });

  test('should cancel an order from the paid column', async ({ page }) => {
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("Paid"))');
    const orderCards = paidColumn.locator('.MuiCard-root');

    // Pre-condition: Ensure there are no orders in the paid column
    await expect(orderCards).toHaveCount(0);

    // 1. Create a new order and wait for it to appear
    await createManualOrder(page);
    await expect(orderCards).toHaveCount(1);

    // 2. Click the cancel button on the order
    await orderCards.first().locator('button:has-text("Cancel")').click();

    // 3. Verify the order disappears and the count returns to 0
    await expect(orderCards).toHaveCount(0);
  });

  test('should reset order numbers after End of Day', async ({ page }) => {
    const paidColumn = page.locator('div.MuiPaper-root:has(h6:has-text("Paid"))');
    const orderCards = paidColumn.locator('.MuiCard-root');

    // 1. Create a first manual order and wait for it to appear with order number #1
    await createManualOrder(page);
    await expect(paidColumn.locator('.MuiCard-root', { hasText: '#1' })).toBeVisible();

    // 2. Click End of Day button and confirm. The beforeEach hook already does this,
    // but we do it again to test the reset logic within this specific test.
    await page.click('button:has-text("End of Day")');
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
